var express  = require('express');
var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);
//var ds18b20 = require('ds18b20');
var Datastore = require('nedb');
var path = require('path');

var soilSensor = '28-000006a3684e'
var airSensor = '28-000006a36dbe'

var os = require("os");

db = {}
db.temperature = new Datastore('temperature.db');
db.temperature.loadDatabase();

app.use(express.static(path.join(__dirname, 'ui')));
app.get('/', function(req, res){
  res.sendFile(__dirname + '/ui/index.html');
});


if (os.hostname() === 'raspberrypi') {
  var mySensors = ds18b20.sensors(function(err, ids) {
    if (err) {
      console.log('Oops, something bad happened!');
      return;
    }

    console.log(ids);

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

io.on('connection', function(socket){
  console.log('a user connected');
  
  setInterval(function(){
    db.temperature.find({sensorId: { $in: [soilSensor, airSensor]}}).sort({date: -1}).limit(2).exec(function (err, docs) {
      console.log(docs[0].sensorId+': '+docs[0].temperature);
      console.log(docs[1].sensorId+': '+docs[1].temperature);
      console.log('Date: '+ new Date(docs[0].date * 1000).toLocaleString());
      socket.emit('temperature', docs);
    });
  }, 5000);

  socket.on('disconnect', function(){
    console.log('user disconnected');
  });

});


http.listen(8000, function(){
  console.log('listening on 0:8000');
});