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

var sensors = []
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
    
    .get(function(req, res) {
      //console.log('From: '+req.query.from);
      //console.log('To: '+req.query.from);
      
      //from = moment().startOf('hour').toDate().getTime();
      //to = moment().startOf('minute').toDate().getTime();
      from = moment(req.query.from).toDate().getTime();
      to = moment(req.query.to).toDate().getTime();

      var query = {date : {
        $gt: from,
        $lt: to, 
      }}
      //console.log('Query: ' + query);
      var chartData = [];
      
      var d = new Date; 
      d.setHours( d.getHours() - 10 );      
      
      //console.log(d);            
      db.temperature.find(query).sort({date: 1}).exec(function (err, chart) {
            if (err)
                res.send(err);              
            res.json(chart);
      });
    });



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

function getLatestTemp(cb) {
  db.temperature.find({}).sort({date: -1}).limit(1).exec(function (err, item) {
        if (err) {
          console.log(err)
          return          
        }
        // Set the global variable
        sensors = item
        cb(item)
  });  
}
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

// Get the newest temperature record on boot


//console.log('Hostname: '+hostname)

/**
  If on the Pi, read the sensors and save to DB.
**/

function addTempToDb(sensorsArr, callback) {
  var tempData = { 'sensors': sensorsArr, 'date': Date.now()};
  //console.log('tempData: %j', tempData)  
  db.temperature.insert(tempData, function (err, newDocs) {
    if (err) {
      console.log('Could not save sensors to DB');  
      return;
    }    
    console.log('Successfully added temps to DB :-)');
    return;
  });
};

function getTemperature(sensor, cb) {
  ds18b20.temperature(sensor, function(err, value) {        
    if (err) {
        console.log('Couldn ´t get temperature from sensors :-(')
        return
    }       
    
    //console.log('Inside getTemperature: '+ value) 


    cb(value)
    
  })    
};     

function createSensorObj(sensorId, sensorType, temperature, cb ) {
  var sensorObj = {
    'id': sensorId, 
    'type': sensorType,
    'currentTemp': temperature,
  };
  //console.log('inside createSensorObj: %j', sensorObj)
  return sensorObj;

}

function getSensors(cb) {
    ds18b20.sensors(function(err, ids) {
      if (err) {
        console.log('No sensors found :-(')
        return
      }
      console.log('Found sensors with id: %j', ids)
      
      cb(ids)
    })
}


setInterval(function(){
  
  var sensorArr = []
  if (hostname === 'raspberrypi') {
    getSensors(function(ids){
      //console.log("Sensors: %j", ids) 

      ids.forEach(function(sensor, index, array){
        
        getTemperature(sensor, function(temperature) {
          
          sensorType = _.findWhere(sensorTypes, {'id': sensor})
          sensorObj = createSensorObj(sensorType.id, sensorType.type, temperature)
          //console.log('SensorObj inside: %j', sensorObj)
          sensorArr.push(sensorObj)//pushTemp(sensorObj)
          /*
          console.log('sensor: %j', sensor)
          console.log('index: %j', index)
          console.log('array length: %j', array.length)
          console.log('array: %j', array) 
          */    
          console.log('sensorArray: %j', sensorArr)
            if (index === (array.length -1)) {
              //console.log('Match!')
              addTempToDb(sensorArr)
            }

        }) 
      })      
    })
  } 

  else {

    sensorTypes.forEach(function(sensor, index, array){
      sensorObj = sensor
      sensorObj['currentTemp'] = _.random(10, 30)
      sensorArr.push(sensorObj)
      //console.log(sensorArr)
      // If last item in array
      if (index === (array.length -1)) {
        addTempToDb(sensorArr)
      }

    })

  }
  getLatestTemp(function(result){
    //console.log('Result: %j', result)
    io.emit('temperature', result); 
    sensors = result
  }) 
   
}, 60000);
 


io.on('connection', function(socket){
  console.log('a user connected');

    //Send the global variable instead of reading from DB
    io.emit('temperature', sensors);
  

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
