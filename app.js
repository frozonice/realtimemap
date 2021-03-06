var express = require('express'),
    http = require('http'),
    path = require('path'),
    Pusher = require('node-pusher'),
    request = require('request'),
    util = require('util'),
    md5 = require('MD5'),
    SendGrid = require('sendgrid').SendGrid,
    count = 0,
    target = 25,
    isAcceptingMessages = process.env.isAcceptingMessages;

var pusher = new Pusher({
  appId: process.env['PUSHER_APP_ID'],
  key: process.env['PUSHER_APP_KEY'],
  secret: process.env['PUSHER_APP_SECRET']
});

var channel = 'map';

// Define the SendGrid stuff
var sendgrid = new SendGrid(process.env['SENDGRID_USERNAME'], process.env['SENDGRID_PASSWORD']);

// Define the app stuff
var app = express();

app.configure(function(){
  app.set('port', process.env.PORT || 3000);
  app.set('views', __dirname + '/views');
  app.set('view engine', 'jade');
  app.use(express.favicon());
  app.use(express.logger('dev'));
  app.use(express.bodyParser());
  app.use(express.methodOverride());
  app.use(express.static(path.join(__dirname, 'public')));
});

app.configure('development', function(){
  app.use(express.errorHandler());
});

// Helper function for email
function emailWinner(emailAddress, name){

  sendgrid.send({
    to: emailAddress,
    from: 'martyn@sendgrid.com',
    subject: 'Boom! You are the winner!',
    text: 'Hey '+name+', you were the 4th email received! Congratulations, you win! See Martyn and he will give you your prize.'
  }, function(success, message) {
      if (!success) {
      console.log(message);
    }
  });
};

// Geocoder function
function geocodeCity(cityName, callback) {
  var map_url = 'http://maps.googleapis.com/maps/api/geocode/json?address='+cityName+'&sensor=false';
  var whenReqComplete = function(error, response, data) {
    if (!error && response.statusCode == 200) {
      var lat = data.results[0].geometry.location.lat;
      var lng = data.results[0].geometry.location.lng;
      var combinedLatLon = lat+','+lng;
    }
    callback(lat, lng, combinedLatLon);
  };

  request({url:map_url, json:true}, whenReqComplete);
};


// Get the index (takes a query string /?city=Amsterdam)
app.get('/', function(req, res){
  var initialCity = req.query.city;
  if (!initialCity || initialCity === null){ initialCity = 'Paris'; }
  geocodeCity(initialCity, function(lat, lng, combinedLatLon){
    res.render('index', {title: 'SendGrid Parse API Demo', latlon: combinedLatLon});
  });
});


// Receive events
app.post('/receiver', function(req, res){
  if (isAcceptingMessages === false){
    count = 0;
  } else {
    count++;
  }
  // Hash the email address
  var email_address = req.body.from.replace(/</g,'').replace(/>/g,'').split(' ');
  var sender_name = email_address[0]+' '+email_address[1];
  console.log('Email address: '+email_address[2]);
  var hashed_email_address = md5(email_address[2]);

  geocodeCity(req.body.subject, function(lat, lng, combinedLatLon){
    var event = 'new_user';
    var socket_id = null;
    var data = {
      name: sender_name,
      email: hashed_email_address,
      lat: lat,
      lng: lng,
      messagesOn: isAcceptingMessages
    };

    // push to the browser!
    pusher.trigger(channel, event, data, socket_id, function(err, req, res) {
      if (err) {
        console.log(err);
      } else {
        console.log('Sending '+ data.email +' at location '+ data.lat+','+data.lng);
      }
    });

    if (count === target) {
      emailWinner(email_address[2], sender_name);
    }  
  });

  res.send(200);
});

http.createServer(app).listen(app.get('port'), function(){
  console.log('S-Express is proper dancing on port ' + app.get('port'));
});
