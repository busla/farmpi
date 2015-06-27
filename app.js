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
  sensors = tempData;

  db.temperature.insert(tempData, function (err, newDocs) {
    if (err) {
      console.log('Could not save sensors to DB');  
      return;
    }    
    console.log('Successfully added temps to DB :-)');
    return;
  });
};

function getTemperature(sensor) {
  ds18b20.temperature(sensor, function(err, value) {        
    if (err) {
        console.log('Couldn ´t get temperature from sensors :-(')
        return
    }       
    sensorType = _.findWhere(sensorTypes, {'id': sensor})
    console.log('Inside getTemperature: '+ value)   
    return createSensorObj(sensorType.id, sensorType.type, value)
    
  })    
};     

function createSensorObj(sensorId, sensorType, temperature ) {
  var sensorObj = {
    'id': sensorId, 
    'type': sensorType,
    'currentTemp': temperature,
  };
  console.log('inside createSensorObj: '+ sensorObj)
  return sensorObj;

}


function getSensors() {
    ds18b20.sensors(function(err, ids) {
      if (err) {
        console.log('No sensors found :-(')
        return
      }
      console.log('Found sensors with id: '+ ids)
      var sensorArr = []
      ids.forEach(function(sensor) {
          // Find the user defined sensor type
          
          
          sensorArr.push(getTemperature(sensor))
          console.log('forEach sensorArr: '+sensorArr)
          // Create temperature object from values and push to array          
          /*
          sensorArr.push(getTemperature(sensor, function(value) {
              console.log('Sensor: '+sensor);
              console.log('Value: '+value);
              sensorArr.push(createSensorObj(sensorType.id, sensorType.type, value));
              console.log('After push to createSensorObj: '+sensorArr)
            })
          ) 
          */

      }) // forEach ends

      console.log('Outside: '+sensorArr)
      return sensorArr
      

    })
}

setInterval(function(){
  var items = getSensors()
  console.log(items)
  addTempToDb(items)
  
}, 5000);
 

io.on('connection', function(socket){
  console.log('a user connected');
  if (sensors.length > 0) {
  setInterval(function(){    
    sensors.forEach(function(item) {
      console.log('IO => '+ item.type+': ' + item.currentTemp)
    });
    io.emit('temperature', sensors);
  }, 1000);
  }

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
