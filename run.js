var http = require('http');

var ds18b20 = require('ds18b20');


var util = require('util'),
    exec = require('child_process').exec,
    child;

child = exec('sudo modprobe wire & sudo modprobe w1-gpio & sudo modprobe w1-therm', // command line argument directly in string
  function (error, stdout, stderr) {      // one easy function to capture data/errors
    console.log('stdout: ' + stdout);
    console.log('stderr: ' + stderr);
    if (error !== null) {
      console.log('exec error: ' + error);
    }
});
 
ds18b20.sensors(function(err, ids) {
    console.log(ids);
});


ds18b20.temperature('28-000006a3684e', function(err, value) {
  console.log('Current temperature is', value);
});
 
//var stream = button.pipe(led);
 
http.createServer(function (req, res) {
  res.setHeader('Content-Type', 'text/html');
  res.write('<pre>logging button presses:\n');
}).listen(8080);
