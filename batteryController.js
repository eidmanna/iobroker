const fetch = require('node-fetch');

async function fetchAWattarPrices() {
    const apiUrl = 'https://api.awattar.at/v1/marketdata';


    // Konstruiere die URL für die Anfrage
    const fullUrl = `${apiUrl}`;

    const response = await fetch(fullUrl);
    if (!response.ok) {
        throw new Error(`Fehler bei der Anfrage: ${response.status} - ${response.statusText}`);
    }

    const data = await response.json();
    // Handle die Antwort hier
    return data.data;

}


const limitkWhBadWeather = 20;

// Lade- und Entladezeiten festlegen
const chargeHours = 2; // Anzahl der Stunden zum Laden
const dischargeHours = 3; // Anzahl der Stunden zum Entladen

let previousBatteryMode = null; // Speichert den vorherigen Modus der Batterie

let currentBatteryMode = null;

let carChargingStatus = null;

const charge = "CHARGE";
const discharge = "DISCHARGE";
const deactivated = "DEACTIVATED";

let goodWeatherState = true;

// Funktion zur Filterung der Preisdaten bis zum nächsten Zeitplan
function filterPricesUntilNextSchedule(prices, currentTime) {
    const nextTime = getNextScheduleTime(currentTime);
    return prices.filter(hour => {
        const hourTime = new Date(hour.start_timestamp).getTime();
        return hourTime >= currentTime.getTime() && hourTime < nextTime.getTime();
    });
}

// Funktion, um die nächste geplante Zeit zu berechnen (14:30 oder 24:00 Uhr)
function getNextScheduleTime(currentTime) {
    const nextTime = new Date(currentTime);

    // Wenn wir vor 14:30 sind, ist der nächste Zeitplan 14:30 am selben Tag
    if (currentTime.getHours() < 9 || (currentTime.getHours() === 9 && currentTime.getMinutes() < 30)) {
        nextTime.setHours(9, 30, 0, 0); // Setze auf 9:30 Uhr
    } else if (currentTime.getHours() >= 20 ) { 
        nextTime.setDate(nextTime.getDate() + 1); 
        nextTime.setHours(9, 30, 0, 0)// 9:30 Nächster Tag
    } 
    else {
        // Wenn wir nach 14:30 sind, ist der nächste Zeitplan 24:00 Uhr
        // nextTime.setDate(nextTime.getDate() + 1); // Nächster Tag
        nextTime.setHours(20, 0, 0, 0); // Setze auf 24:00 Uhr (Mitternacht)
    }
    return nextTime;
}

// Funktion zum Laden der Batterie
function chargeBattery() {
    if (currentBatteryMode == charge)
        return;
    console.log("Batterie wird geladen.");
    setState('modbus.0.holdingRegisters.1.40348_StorCtl_Mod', 2);

    setState('modbus.0.holdingRegisters.1.40355_OutWRte', -10000);

    currentBatteryMode = charge;

    // Batterie nach einer Stunde deaktivieren
    setTimeout(deactivateBattery, 59 * 60 * 1000); // 59 Minuten = 1 Stunde
}

// Funktion zum Entladen der Batterie
function dischargeBattery() {
    if (currentBatteryMode == discharge)
        return;
    console.log("Batterie wird entladen.");
    setState('modbus.0.holdingRegisters.1.40348_StorCtl_Mod', 2);
    setState('modbus.0.holdingRegisters.1.40355_OutWRte', 10000);

    // Batterie nach einer Stunde deaktivieren
    currentBatteryMode = discharge;
    if (!goodWeather())
        setTimeout(deactivateBattery, 59 * 60 * 1000); // 59 Minuten = 1 Stunde
}

// Funktion zum Deaktivieren der Batterie (weder Laden noch Entladen)
function deactivateBattery() {
    if (currentBatteryMode == deactivated)
        return;
    console.log("Batterie wird deaktiviert.");
    setState('modbus.0.holdingRegisters.1.40348_StorCtl_Mod', 2);
    setState('modbus.0.holdingRegisters.1.40355_OutWRte', 0);
    currentBatteryMode = deactivated;
}

// Periodische Prüfung, ob das Auto geladen wird
function checkCarChargingStatus() {
    if (getState('go-e.0.energy.power').val > 0) {
        if (carChargingStatus == charge)
            return;
        console.log("Das Auto wird geladen. Entladen der Batterie wird gestoppt.");
        carChargingStatus = charge;
        //if (previousBatteryMode === discharge) {
        deactivateBattery(); // Batterie deaktivieren, falls sie entladen oder geladen wurde
        //}
    } else {
        if (carChargingStatus == deactivated)
            return;
        console.log("Das Auto wird nicht geladen.");
        carChargingStatus = deactivated;
        // Setze die Batterie in den vorherigen Zustand zurück
        if (previousBatteryMode === charge) {
            chargeBattery();
        } else if (previousBatteryMode === discharge) {
            dischargeBattery();
        } else {
            deactivateBattery();
        }
    }

}

function goodWeather() {
    /*Geschätzte Energie (morgen)*/
    const kwhTomorrow = getState('pvforecast.0.summary.energy.tomorrow').val;
    /*Geschätzte Energie (heute)*/
    const kwhToday = getState('pvforecast.0.summary.energy.today').val;

    console.log("Weather kWh today: " + kwhToday);
    console.log("Weather kWh tomorrow: " + kwhTomorrow);

    goodWeatherState = kwhToday > limitkWhBadWeather; 
    return goodWeatherState;
}

// Hauptfunktion: Bestimmen der billigsten und teuersten Stunden
async function controlBattery() {
    try {



        if (goodWeather()) {
            console.log("Schönes Wetter");
            previousBatteryMode = discharge;
            dischargeBattery(); // Entladebefehl zu geplanter Stunde
            return;
        }


        const currentTime = new Date(); // Aktuelle Zeit
        const prices = await fetchAWattarPrices();

        console.log(prices);

        // Nur die Preisdaten bis zum nächsten Zeitplan berücksichtigen
        const validPrices = filterPricesUntilNextSchedule(prices, currentTime);

        validPrices.forEach(hour => {
            const startTime = new Date(hour.start_timestamp).toLocaleString();
            console.log(`Preis in der Stunde ab ${startTime} für ${hour.marketprice / 10} ct/kWh.`);

        });

        // Sortieren nach Preis, aufsteigend und absteigend
        const sortedByPriceAsc = [...validPrices].sort((a, b) => a.marketprice - b.marketprice);
        const sortedByPriceDesc = [...validPrices].sort((a, b) => b.marketprice - a.marketprice);

        // Billigste Stunden zum Laden auswählen
        const cheapestHours = sortedByPriceAsc.slice(0, chargeHours); // Billigste Stunden zum Laden

        // Billigste und teuerste Stunden

        const mostExpensiveHours = sortedByPriceDesc.slice(0, dischargeHours); // Teuerste Stunden zum Entladen

        const diffPrice = ((mostExpensiveHours[0].marketprice - cheapestHours[0].marketprice)/10);
        console.log("Differenz Preis Teuer - Billig: " + diffPrice);

        // Laden Entladen erst ab Preisdiff > 5 Cent
        if(diffPrice < 5)
            return;


        // Batterie-Steuerung: Zuerst Laden
        let lastChargeTime = null;
        cheapestHours.forEach(hour => {
            const startTime = new Date(hour.start_timestamp).toLocaleString();
            lastChargeTime = new Date(hour.start_timestamp).getTime();
            console.log(`Batterie wird geladen in der Stunde ab ${startTime} für ${hour.marketprice / 10} ct/kWh.`);
            schedule(hour.start_timestamp, function () {
                previousBatteryMode = charge;
                chargeBattery(); // Ladebefehl zu geplanter Stunde
            });
        });

        // Entladen: Nachdem die Ladezeiten festgelegt wurden
        mostExpensiveHours.forEach(hour => {
            const startTime = new Date(hour.start_timestamp).toLocaleString();
            const dischargeStart = new Date(hour.start_timestamp).getTime();

            // Entladezeiten nur dann ansetzen, wenn sie nach den Ladezeiten liegen
            //if (dischargeStart > lastChargeTime) {
            console.log(`Batterie wird entladen in der Stunde ab ${startTime} für ${hour.marketprice / 10} ct/kWh.`);
            schedule(hour.start_timestamp, function () {
                previousBatteryMode = discharge;
                dischargeBattery(); // Entladebefehl zu geplanter Stunde
            });
            // }
        });

    } catch (error) {
        console.error(error);
    }
}

previousBatteryMode = deactivated;
deactivateBattery();

controlBattery();

// Zeitplan für die Ausführung um 9:30 und 20:00 Uhr

// Täglich um 9:30 Uhr
schedule("30 09 * * *", controlBattery);

// Täglich um 20:30 Uhr (Mitternacht)
schedule("30 20 * * *", controlBattery);

// Periodische Überprüfung des Auto-Ladestatus alle 30 Sekunden
schedule("*/10 * * * * *", checkCarChargingStatus);

// previousBatteryMode = discharge;
// dischargeBattery();

// previousBatteryMode = charge;
//chargeBattery();

// deactivateBattery();

