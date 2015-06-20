var express  = require('express');
var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var Datastore = require('nedb');
var path = require('path');
var _ = require('underscore');
var fs = require('fs');
var router = express.Router();
var moment = require('moment');
moment().format(); 
 

router.get('/', function(req, res) {
    res.json({ message: 'hooray! welcome to our api!' });   
});


// middleware to use for all requests
router.use(function(req, res, next) {
    // do logging
    console.log('Something is happening.');
    next(); // make sure we go to the next routes and don't stop here
});

router.route('/chart')
    
    // get all the bears (accessed at GET http://localhost:8080/api/bears)
    .get(function(req, res) {
      var query = {date : {$gt: moment().startOf("hour").toDate().getTime()}}
      var chartData = [];
      
      var d = new Date; 
      d.setHours( d.getHours() - 10 );      
      
      console.log(d);            
      db.temperature.find(query).sort({date: 1}).exec(function (err, chart) {
            if (err)
                res.send(err);              
            res.json(chart);
      });
    });

var sensors = [
  {
    'id': '28-000006a3684e',
    'type': 'soil',
    'currentTemp': ''
  },  
  {
    'id': '28-000006a36dbe',
    'type': 'air',
    'currentTemp': ''
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
app.use(express.static('node_modules'));


console.log('Hostname: '+hostname)

/**
  If on the Pi, read the sensors and save to DB.
**/

function addTempToDb(sensorsArr) {
  var tempData = { 'sensors': sensorsArr, 'date': Date.now()};
  db.temperature.insert(tempData, function (err, newDocs) {
    console.log('Successfully added temps to DB :-)');
  });
};

if (hostname === 'raspberrypi') { 
  var ds18b20 = require('ds18b20');
  var mySensors = ds18b20.sensors(function(err, ids) {
    if (err) {
      console.log('No sensors found :-(');
      return;
    }

    console.log(ids);
    /**
      Read the sensors every 5 seconds and save to DB.
    **/
    
    //_.findWhere(sensors, {'id': item.sensorId})
    setInterval(function(){    
        sensorsArr = []    
        ids.forEach(function(sensor) {
            ds18b20.temperature(sensor, function(err, value) {
              if (err) {
                  console.log('Couldn ´t get temperature from sensors :-(');
                  return;
              }

              
              sensorObj = _.findWhere(sensors, {'id': sensor})
              sensorObj.currentTemp = value
              sensorsArr.push(sensorObj);
            });
        }); 
        sensors = sensorsArr;
        console.log(sensorsArr);      
        //addTempToDb(item, value);
    }, 5000);
  });
}

else {
    setInterval(function(){
      sensorsArr = [];
              // @sensor, @date, @temp)
      sensors.forEach(function(sensor) {
              //sensor = _.findWhere(sensors, {'id': item})
              
              sensor.currentTemp = _.random(10, 30);
              sensorsArr.push(sensor);

              //addTempToDb(sensors[_.random(0, 1)].id, _.random(10, 30));
              //console.log('Current temperature is', value);
        // newDocs is an array with these documents, augmented with their _id
        });
      console.log(sensorsArr);
      addTempToDb(sensorsArr);
    }, 5000);  
}

/*
function prepareData(item) {
      var tempDate = new Date(item.date);
      sensor = _.findWhere(sensors, {'id': item.sensorId})

      data = {
        'date': tempDate,
        'temperature': Number((item.temperature).toFixed(1)),        
        'type': sensor.type,
      };
      return data;  
}
*/

/*
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
      console.log("Date: "+ (data.date));      
      currentTemp = data;
    });      
  });    

}, 5000);
 */ 
io.on('connection', function(socket){
  console.log('a user connected');
  setInterval(function(){
    io.emit('temperature', sensors);
  }, 1000);

  socket.on('disconnect', function(){
    console.log('user disconnected');
  });

});

app.use('/api', router);
app.use('/api/chart', router);



app.get('/', function(req, res){
  res.sendFile(__dirname + '/ui/index.html');
});



http.listen(3000, function(){
  console.log('listening on 0:3000');
});
