/*global require, __dirname, console*/
var express = require('express'),
net = require('net'),
N = require('./nuve'),
fs = require("fs"),
https = require("https"),
path= require('path'),
config = require('./../../licode_config');
var mongoose = require('mongoose');
var models = require ('./models.js');
var User = mongoose.model('User');
var Room = mongoose.model('Room');
//var mongoStore=require('connect-mongodb');
mongoose.connect('mongodb://localhost/Users');

var Db = require('mongodb').Db
  , Server = require('mongodb').Server
  , server_config = new Server('localhost', 27017, {auto_reconnect: true, native_parser: true})
  , db = new Db('test', server_config, {})
//, db='Users'
  , mongoStore = require('connect-mongodb');
 
 

var options = {
    key: fs.readFileSync('cert/key.pem').toString(),
    cert: fs.readFileSync('cert/cert.pem').toString()
};

var app = express();



app.configure(function () {
   // "use strict";
    app.set('views', __dirname + '/views');
    app.set('view engine', 'jade');
    app.use(express.errorHandler({ dumpExceptions: true, showStack: true }));
    app.use(express.logger());
    app.use(express.bodyParser());
    app.use(express.cookieParser());
    app.use(express.session({
	secret:'foo',
	store: new mongoStore({db: db})
    }));
   app.use(express.static(path.join(__dirname + '/public')));
 
   //app.set('views', __dirname + '/../views/');
    //disable layout
    //app.set("view options", {layout: false});
});


app.User = User;

function loadUser(req, res, next) {
  if (req.session.user_id) {
    User.findById(req.session.user_id, function(user) {
      if (user) {
        req.currentUser = user;
        next();
      } else {
        res.redirect('index');
      }
    });
  } else {
    res.redirect('index');
  }
}


app.use(function (req, res, next) {
    "use strict";
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'POST, GET, OPTIONS, DELETE');
    res.header('Access-Control-Allow-Headers', 'origin, content-type');
    if (req.method == 'OPTIONS') {
        res.send(200);
    }
    else {
        next();
    }
});

N.API.init(config.nuve.superserviceID, config.nuve.superserviceKey, 'http://localhost:3000/');

var myRoom;

N.API.getRooms(function (roomlist) {
    "use strict";
    var rooms = JSON.parse(roomlist);
    console.log(rooms.length);
    if (rooms.length === 0) {
        N.API.createRoom('myRoom', function (roomID) {
            myRoom = roomID._id;
            console.log('Created room ', myRoom);
        });
    } else {
        var myRoom1 = rooms[0];
	console.log (myRoom1);
	myRoom =rooms[0]._id;
        console.log('Using room ', myRoom);
    }
});

app.post('/createToken/', function (req, res) {
    "use strict";
    var room,
        username = req.body.username,
        role = req.body.role;
   // console.log("organization" + req.body.organizatio);
    User.findById(req.session.user_id,function(err,user){
	console.log('userfound' + user);
	if (user && !err){
	    Room.findOne({organization: user.organization}, function(err,room1){
		console.log('roomfound ' + room1); 
		if(room1 && !err){
		    room = room1.Room_id;
		   // username = user.email,
		    role = req.body.role;
		    N.API.createToken(room, username, role, function (token) {
			console.log(token);
			res.send(token);
			});
		    }
		});
	    }
	});
});



app.get('/', loadUser, function(req, res) {
  res.render('welcome',{})
});
app.get('/welcome', function(req, res) {
      res.render('welcome', {})
});

app.get('/register', function(req, res) {
      res.render('register', {})
});

app.get('/index', function(req, res) {
    if (req.session.user_id) {
	console.log (req.session.user_id);
	
    User.findById(req.session.user_id, function(err,user) {
      if (user) {
	  console.log(user);
        req.currentUser = user;
        res.render('welcome', {
	User: user});
	  
      } else {
	  console.log("not User");
        res.render('index');
      }
    });
  } else {
    res.render('index');}
});

app.get('/login', function(req, res) {
      res.render('login', {});
});

app.get('/logout', function(req, res) {

    req.session.destroy(function(){});
    res.redirect('/');
});


app.post('/login', function(req,res){
console.log("login Posted");
User.findOne({email: req.body.email},function(err,user){
if (!err && user && user.authenticate(req.body.password))

{
      req.session.user_id = user.id;
      res.render('welcome',{
      User: user});
    } else {
	console.log("sdfsdfsfsfsa");
      // TODO: Show error
      res.render('login',{
		foo: '1'
      });
    }
});
});    
  


app.post('/register.:format?', function(req, res) {
  var user = new User();
    var myRoom1;
    user.email=req.body.email;
    user.password=req.body.password;
    user.organization=req.body.organization;
    User.findOne({organization: req.body.organization},function(err,user1){
	if (!err && !user1){
	    N.API.createRoom('myRoom1', function (roomID) {
		console.log('Created room ', myRoom);
		var room=new Room();
		room.organization= user.organization;
		room.Room_id=roomID._id;
		room.save();
            });
	    }
	if (!err && user1)
	    console.log("organization exists no new room created"); 

    });
    
    user.savee(userSaved,userSaveFailed);
	

  function userSaved(err) {
     // console.log("Saved");
     // console.log(req.params.format);
      if (!err){
      switch (req.params.format) {
      case 'json':
        res.send(user.__doc);
      break;

      default:
        req.session.user_id = user.id;
        res.render('welcome', {
	User: user});
    }
}
else{
    console.log(err);
    console.log("Duplicate email address");
   
    res.render('register', {
	foo: '1'
    });

}
}
 
function userSaveFailed() {
   res.render('register', {
    locals: { user: user }
   });
 }

});

//app.get('/getRooms/', function (req, res) {
  //  "use strict";
    //N.API.getRooms(function (rooms) {
      //  res.send(rooms);
   // });
//});

//app.get('/getUsers/:room', function (req, res) {
 //   "use strict";
   // var room = req.params.room;
    //N.API.getUsers(room, function (users) {
     //   res.send(users);
   // });
//});



app.listen(3001);

/*var server = https.createServer(options, app);
server.listen(3004);
*/
