console.log("Start Battery State Checker")

const stopDischarge = () => {
    console.log('Stop discharge');
    setState('modbus.0.holdingRegisters.1.40350_MinRsvPct' /*Setpoint for minimum reserve for storage as a percentage of the nominal maximum storage*/,
        getState('modbus.0.holdingRegisters.1.40351_ChaState').val); /*Currently available energy as a percent of the capacity rating*/
};

const discharge = () => {
    console.log('Start discharge');
    setState('modbus.0.holdingRegisters.1.40350_MinRsvPct' /*Setpoint for minimum reserve for storage as a percentage of the nominal maximum storage*/,
        1000);
};


const charge = () => {
    console.log('Start charge');
    setState('modbus.0.holdingRegisters.1.40350_MinRsvPct' /*Setpoint for minimum reserve for storage as a percentage of the nominal maximum storage*/,
        9000);
}

let carCharging = false;

/*Leistung go-e Charger gesamt in kW (nrg[11])*/
on({ id: 'go-e.0.energy.power', change: 'ne' },
    (obj) => {
        console.log("EV Power: " + getState('go-e.0.energy.power').val);
        if (getState('go-e.0.energy.power').val > 0) {
            carCharging = true;
            stopDischarge();
        }
        if (getState('go-e.0.energy.power').val == 0) {
            carCharging = false;
            discharge();
        }
    }
);
/*Currently available energy as a percent of the capacity rating*/
schedule('{"time":{"start":"00:00","end":"23:59","mode":"minutes","interval":1},"period":{"days":1}}',
    // on({ id: 'modbus.0.holdingRegisters.1.40351_ChaState', change: 'ne' },

    (obj) => {
        const soc = getState('modbus.0.holdingRegisters.1.40351_ChaState').val;
        const awattarRaw = JSON.parse(getState('awattar.0.Rawdata').val).data;

        const awattar = awattarRaw.filter((p) => p.end_timestamp > Date.now());

        const priceNow = awattar.filter((p) => p.start_timestamp < Date.now() && p.end_timestamp > Date.now())[0].marketprice;

        const maxPrice = awattar.reduce(function (prev, current) {
            return (prev && prev.marketprice > current.marketprice) ? prev : current
        });
        const minPrice = awattar.reduce(function (prev, current) {
            return (prev && prev.marketprice < current.marketprice) ? prev : current
        });

        // Mittelwert des Preises
        const avgPrice = Math.round(awattar.reduce((acc, curr) => acc + curr.marketprice, 0) / awattar.length);

        // Quadratishe Abweidungen
        const squaredDeviations = awattar.map(x => {
            return Math.pow(x.marketprice - avgPrice, 2);
        });

        const stdDevPrice = Math.round(Math.sqrt(squaredDeviations.reduce((a, b) => a + b, 0) / awattar.length));




        // Preis bis zu dem geladen wird
        const lowPriceRange = avgPrice - stdDevPrice * 0.5;
        // Preis ab dem entladen wird
        const midPriceRange = avgPrice + stdDevPrice * 0.5;

        var stunde = new Date().getHours();

        // const awattar = JSON.parse(getState('awattar.0.Rawdata').val).data;

        // const priceNow = awattar.filter((p) => p.start_timestamp < Date.now() && p.end_timestamp > Date.now())[0].marketprice;
        /*Geschätzte Energie (morgen)*/
        const kwhTomorrow = getState('pvforecast.0.summary.energy.tomorrow').val;
        /*Geschätzte Energie (heute)*/
        const kwhToday = getState('pvforecast.0.summary.energy.today').val;

        const limitkWhBadWeather = 10;
        const startEveningHour = 19;

        

        console.log('SOC: ' + soc + ' Wh Tomorrow: ' + kwhTomorrow + ' kWh Today: ' + kwhToday + ' kWh Price Now: ' + priceNow + ' € Car Charging: ' + carCharging);
        console.log('AvgPrice: ' + avgPrice + ' StdDev: ' + stdDevPrice + ' MaxPrice: ' + maxPrice.marketprice + ' MinPrice: ' + minPrice.marketprice + ' aktuelle Stunde: ' + stunde + ' LowPriceRange: ' + lowPriceRange + ' MidPriceRange: ' + midPriceRange);

        // nur bei schlechtem Wetter
        // bis zum Abend das Wetter von heute verwenden, danach das Wetter von morgen
        if (((stunde < startEveningHour) && (kwhToday < limitkWhBadWeather)) ||
            ((stunde >= startEveningHour) && (kwhTomorrow < limitkWhBadWeather))) {
            if (priceNow < lowPriceRange) {
                charge();
            } else if (priceNow < midPriceRange) {
                stopDischarge();
            } else if (!carCharging) {
                discharge();
            }
        } else if (!carCharging) {
            discharge();
        }
    }
);

