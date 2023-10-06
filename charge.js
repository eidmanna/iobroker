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
on({ id: 'modbus.0.holdingRegisters.1.40351_ChaState', change: 'lt' },

    (obj) => {
        const soc = getState('modbus.0.holdingRegisters.1.40351_ChaState').val;
        const awattar = JSON.parse(getState('awattar.0.Rawdata').val).data;

        const priceNow = awattar.filter((p) => p.start_timestamp < Date.now() && p.end_timestamp > Date.now())[0].marketprice;
        /*Geschätzte Energie (morgen)*/
        const kwhTomorrow = getState('pvforecast.0.summary.energy.tomorrow').val;
        /*Geschätzte Energie (heute)*/
        const kwhToday = getState('pvforecast.0.summary.energy.today').val;
        console.log('Awattar');
        console.log('kWh Tomorrow: ' + kwhTomorrow);
        console.log('Price Now: ' + priceNow);
        console.log('SOC: ' + soc);
        console.log('Car Charging: ' + carCharging);
        if (soc < 5000 && priceNow < 100 && kwhToday < 10 ) {
            charge();
        } else if(!carCharging){
            discharge();
        }
    }
);

