var express  = require('express');
var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var Datastore = require('nedb');
var path = require('path');
var _ = require('underscore');
var fs = require('fs');

var sensors = [
  {
    'id': '28-000006a3684e',
    'type': 'soil',
    'name': 'Soil sensor',
  },  
  {
    'id': '28-000006a36dbe',
    'type': 'air',
    'name': 'Air sensor',
  }  
]

// Current temperature
var currentTemp;

var hostname = require("os").hostname();

db = {}
db.temperature = new Datastore('temperature.db');
db.temperature.loadDatabase();

app.use(express.static('data'));
app.use(express.static('ui'));
app.use(express.static('bower_components'));



app.get('/', function(req, res){
  res.sendFile(__dirname + '/ui/index.html');
});

app.get('/data/charts.json', function(req, res){
  res.sendFile(__dirname + '/data/charts.json');
});

console.log('Hostname: '+hostname)

/**
  If on the Pi, read the sensors and save to DB.
**/

function addTempToDb(sensor, temp) {
  var tempData = { 'sensorId': sensor, 'date': Date.now(), 'temperature': temp  };
  db.temperature.insert(tempData, function (err, newDocs) {
    console.log(tempData);
  });
};

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
              // @sensor, @temp)
              addTempToDb(item, value);
              //console.log('Current temperature is', value);
        // newDocs is an array with these documents, augmented with their _id
            });
        });
    }, 5000);
  });
}

else {
    setInterval(function(){
              // @sensor, @date, @temp)
              addTempToDb(sensors[_.random(0, 1)].id, _.random(10, 30));
              //console.log('Current temperature is', value);
        // newDocs is an array with these documents, augmented with their _id
        
    }, 5000);  
}


function prepareData(item) {
      var tempDate = new Date(item.date);
      sensor = _.findWhere(sensors, {'id': item.sensorId})

      data = {
        'date': tempDate,
        'temperature': Number((item.temperature).toFixed(1)),
        'name': sensor.name,
        'type': sensor.type,
      };
      return data;  
}


var allData = function dumpData() {
  var chartData = []

  db.temperature.find({}).sort({date: 1}).exec(function (err, docs) {
    
    docs.forEach(function(item) {      
      data = prepareData(item);
      chartData.push(data);
    });
    var str = JSON.stringify(chartData);

    fs.writeFile("data/charts.json", str, function(err) {
        if(err) {
            return console.log(err);
        }

        console.log("The file was saved!");
    });     
  });  
  
}

allData();

setInterval(function(){
  var query = {};
  var r = _.random(0, 20);
  
  //db.temperature.find({sensorId: { $in: _.pluck(sensors, 'id')}}).sort({date: -1}).limit(2).exec(function (err, docs) {
  db.temperature.find(query).limit(1).skip(r).exec(function (err, docs) {
    docs.forEach(function(item) {

      data = prepareData(item);

      console.log('#################################');
      console.log("Sensor: " + data.name);
      console.log("Type: " + data.type);
      console.log("Temperature: " + data.temperature);
      console.log("Date: "+ data.date);      
      currentTemp = data;
    });      
  });    

}, 5000);
  
io.on('connection', function(socket){
  console.log('a user connected');
  setInterval(function(){
    io.emit('temperature', currentTemp);
  }, 1000);

  socket.on('disconnect', function(){
    console.log('user disconnected');
  });

});

http.listen(3000, function(){
  console.log('listening on 0:3000');
});
