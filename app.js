var express  = require('express');
var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var ds18b20 = require('ds18b20');
var Datastore = require('nedb');
var path = require('path');

db = {}
db.temperature = new Datastore('temperature.db');
db.temperature.loadDatabase();

app.use(express.static(path.join(__dirname, 'ui')));
app.get('/', function(req, res){
  res.sendFile(__dirname + '/ui/index.html');
});

http.listen(3000, function(){
  console.log('listening on *:8000');
});

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


io.on('connection', function(socket){
  console.log('a user connected');
  
  setInterval(function(){
    db.temperature.find({}).sort({date: -1}).limit(1).exec(function (err, docs) {
      console.log('Docs: '+docs[0].temperature);
      console.log('Date: '+ new Date(docs[0].date * 1000).toLocaleString());
      //socket.emit('temperature', docs[0]);
    });
  }, 1000);

  socket.on('disconnect', function(){
    console.log('user disconnected');
  });

});

