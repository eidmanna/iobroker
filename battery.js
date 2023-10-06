console.log('Start Battery Heat');
console.log('Battery Heat off');  
      setState('shelly.0.SHPLG-S#163937#1.Relay0.Switch', false); 
/*Battery Temperature*/
on({id: 'bydhvs.0.State.TempBatt', change: 'ne'}, (obj) => {
    const tempBatt = getState('bydhvs.0.State.TempBatt').val;
    console.log('Temp Battery: ' +tempBatt);
    if(tempBatt > 7) {
      console.log('Battery Heat off');  
      setState('shelly.0.SHPLG-S#163937#1.Relay0.Switch', false);  
    }
    if(tempBatt < 5 ) {
      console.log('Battery Heat on');    
      setState('shelly.0.SHPLG-S#163937#1.Relay0.Switch', true);  
    }
});