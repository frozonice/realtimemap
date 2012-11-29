var express = require('express')
  , http = require('http')
  , path = require('path');

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

app.get('/', function(req, res){
  // Displays our index page

});

app.post('/receiver', function(req, res){
  // Receives events from the webhook on SendGrid
  // grabs the address and pushes it to the map
});

http.createServer(app).listen(app.get('port'), function(){
  console.log("S-Express is proper dancing on port " + app.get('port'));
});
