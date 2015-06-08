var express  = require('express');
var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var Datastore = require('nedb');
var path = require('path');
var _ = require('underscore');

var sensors = [
  {
    'id': '28-000006a3684e',
    'name': 'Soil sensor',
  },  
  {
    'id': '28-000006a36dbe',
    'name': 'Air sensor',
  }  
]

// Current temperature
var currentTemp;

var hostname = require("os").hostname();

db = {}
db.temperature = new Datastore('temperature.db');
db.temperature.loadDatabase();

app.use(express.static(path.join(__dirname, 'ui')));
app.get('/', function(req, res){
  res.sendFile(__dirname + '/ui/index.html');
});

console.log('Hostname: '+hostname)

/**
  Read the sensors and save to DB if running on the Pi.
**/

if (hostname === 'raspberrypi') { 
  var ds18b20 = require('ds18b20');
  var mySensors = ds18b20.sensors(function(err, ids) {
    if (err) {
      console.log('Oops, something bad happened!');
      return;
    }

    console.log(ids);
    /**
      Read the sensors every 5 seconds and save to DB.
    **/
    setInterval(function(){
        ids.forEach(function(item) {
            ds18b20.temperature(item, function(err, value) {
              if (err) {
                  console.log('Oops, something bad happened!');
                  return;
              }
              //console.log('Current temperature is', value);
                var tempData = { 'sensorId': item, 'date': Date.now(), 'temperature': value  };
                db.temperature.insert(tempData, function (err, newDocs) {
                console.log(tempData);
        // newDocs is an array with these documents, augmented with their _id
        });
        
           });
        });
    }, 5000);
  });
}


setInterval(function(){

  db.temperature.find({sensorId: { $in: _.pluck(sensors, 'id')}}).sort({date: -1}).limit(2).exec(function (err, docs) {
    docs.forEach(function(item) {
      
      var tempDate = new Date(0);
      tempDate.setUTCSeconds(item.date);

      sensor = _.findWhere(sensors, {'id': item.sensorId})

      console.log('#################################');
      console.log("Sensor: " + sensor.name);
      console.log("Temperature: "+item.temperature);
      console.log("Date: "+ tempDate);
      currentTemp = item;
    });      
  });    

}, 1000);
  
io.on('connection', function(socket){
  console.log('a user connected');

  setInterval(function(){
    io.emit('temperature', currentTemp);
  }, 1000);

  socket.on('disconnect', function(){
    console.log('user disconnected');
  });

});


http.listen(8000, function(){
  console.log('listening on 0:8000');
});