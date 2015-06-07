var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var ds18b20 = require('ds18b20');
var Datastore = require('nedb');

db = {}
db.temperature = new Datastore('temperature.db');
db.temperature.loadDatabase();

app.get('/', function(req, res){
  res.sendFile(__dirname + '/index.html');
});

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
            //console.log('Current temperature is', value);
              var tempData = { 'sensorId': item, 'date': Date.now(), 'temperature': value  };
              db.temperature.insert(tempData, function (err, newDocs) {
              console.log(tempData);
      // newDocs is an array with these documents, augmented with their _id
      });
      
         });
      });
  }, 1000);
});

io.on('connection', function(socket){
  console.log('a user connected');
  
  setInterval(function(){
    latestTemp = db.temperature.find().limit(1).sort({$natural:-1});
    console.log(latestTemp);
    socket.emit('temperature', latestTemp);
  }, 1000);

  socket.on('disconnect', function(){
    console.log('user disconnected');
  });

});

http.listen(3000, function(){
  console.log('listening on *:3000');
});
