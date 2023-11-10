console.log('Start Battery Heat');
console.log('Battery Heat off');
setState('shelly.0.SHPLG-S#163937#1.Relay0.Switch', false);

/*Battery Temperature*/
const handleHeater = () => {
    const tempBatt = getState('fronius.0.storage.0.Temperature_Cell').val;
    console.log('Temp Battery: ' + tempBatt);
    if (tempBatt > 6) {
        console.log('Battery Heat off');
        setState('shelly.0.SHPLG-S#163937#1.Relay0.Switch', false);
    }
    if (tempBatt < 4) {
        console.log('Battery Heat on');
        setState('shelly.0.SHPLG-S#163937#1.Relay0.Switch', true);
    }
};

schedule(
    '{"time":{"start":"00:00","end":"23:59","mode":"minutes","interval":10},"period":{"days":1}}',
    () => {
        console.log('start heater check');
        handleHeater();
    }
);

handleHeater();
