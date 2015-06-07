

var ds18b20 = require('ds18b20');

var mySensors = ds18b20.sensors(function(err, ids) {
  if (err) {
      console.log('Oops, something bad happened!');
      return;
  }
    setInterval(function(){
        ids.forEach(function(item) {
            ds18b20.temperature(item, function(err, value) {
              if (err) {
                  console.log('Oops, something bad happened!');
                  return;    
              }
              console.log('Current temperature is', value);
            });
        });



    }, 1000);
});

