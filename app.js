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
var ds18b20 = require('ds18b20');
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
      console.log('From: '+req.query.from);
      console.log('To: '+req.query.from);
      
      //from = moment().startOf('hour').toDate().getTime();
      //to = moment().startOf('minute').toDate().getTime();
      from = moment(req.query.from).toDate().getTime();
      to = moment(req.query.to).toDate().getTime();

      var query = {date : {
        $gt: from,
        $lt: to, 
      }}
      console.log('Query: ' + query);
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

var sensors = []

var sensorTypes = [
  {
    'id': '28-000006a3684e',
    'type': 'soil',    
  },  
  {
    'id': '28-000006a36dbe',
    'type': 'air',
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

function addTempToDb(sensorsArr, callback) {
  var tempData = { 'sensors': sensorsArr, 'date': Date.now()};
  db.temperature.insert(tempData, function (err, newDocs) {
    if (err) {
      console.log('Could not save sensors to DB');  
      return;
    }    
    console.log('Successfully added temps to DB :-)');
    return;
  });
};

function getSensors(sensorIds, callback) {
  
  if (sensorIds < 0) {    
    var mySensors = ds18b20.sensors(function(err, ids) {
      if (err) {
        console.log('No sensors found :-(');
        return;
      }
      console.log('Found sensors with id: '+ ids);
      callback(ids);
    });      
  }

  else {
    console.log(callback);
    callback(sensorIds, addTempToDb);
  }

};
    
function getTemperature(sensorIds, callback) {
  sensorsArr = []    
  sensorIds.forEach(function(sensor) {
    if (hostname === 'raspberrypi') {
      ds18b20.temperature(sensor, function(err, value) {
        if (err) {
            console.log('Couldn ´t get temperature from sensors :-(');
            return;
        }
        sensorType = _.findWhere(sensorTypes, {'id': sensor});
        
        
        sensorsArr.push({
          'id': sensor, 
          'type': sensorType.type,
          'currentTemp': value,
        });
        console.log('Sensor id:' + sensor);
      });          
    }

    else {
      sensorType = _.findWhere(sensorTypes, {'id': sensor});
      
      sensorsArr.push({
        'id': sensor, 
        'type': sensorType.type,
        'currentTemp': _.random(10, 30), 
      });      
      console.log('Sensor id:' + sensor);
    }
  }); // Get temperature

      
  // Global variable
  sensors = sensorsArr;
  console.log('sensorsArr' + sensorsArr);      
  callback(sensorsArr);
}

setInterval(function(){
  getSensors(_.pluck(sensorTypes, 'id'), getTemperature);
}, 5000);
 
/*
else {
    setInterval(function(){
      sensorsArr = [];
              // @sensor, @date, @temp)
      ['28-000006a36dbe', '28-000006a3684e'].forEach(function(sensor) {    
        sensorTypes.forEach(function(item) {
          if (sensor === item.id) {
            console.log('Sensor ID found: '+item.id);

            sensorType = _.findWhere(sensorTypes, {'id': sensor});
            console.log(sensorType);
            sensorsArr.push({
              'id': sensor, 
              'type': sensorType.type,
              'currentTemp': _.random(10, 30),          
            });
          }
        });
      });
      sensors = sensorsArr;
      console.log(sensorsArr);
      addTempToDb(sensorsArr);
    }, 5000);  
}
*/
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
  io.emit('temperature', sensors);
  setInterval(function(){
    sensors.forEach(function(item) {
      console.log('IO => '+ item.type+': ' + item.currentTemp)
    });
    io.emit('temperature', sensors);
  }, 10000);

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
