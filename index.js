var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var ds18b20 = require('ds18b20');


app.get('/', function(req, res){
  res.sendFile(__dirname + '/index.html');
});

io.on('connection', function(socket){
  console.log('a user connected');

  socket.on('temperature', function(temperature){
    console.log('temperature: ' + temperature);
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
		socket.emit('temperature', {'temperature': value});
           });
        });



    }, 1000);
});

  socket.on('disconnect', function(){
    console.log('user disconnected');
  });
});

http.listen(3000, function(){
  console.log('listening on *:3000');
});
