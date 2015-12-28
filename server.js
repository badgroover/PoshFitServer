var express       = require('express');
var session       = require('express-session');
var cookieParser  = require('cookie-parser')
var mysql         = require('mysql');
var path          = require("path");
var bodyParser    = require("body-parser");
var queryHelper   = require("./QueryHelper.js")
var _             = require("underscore");

var app = express();

//Set up environment
var envConfig;
var argv = require('minimist')(process.argv.slice(2));
console.log(argv);
if(argv.e == "dev") {
	envConfig = require('./config/development.json');  
} else {
	envConfig = require('./config/production.json');  
}

app.use(cookieParser());
app.use(session({secret: '$#$##@#!'}));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));
app.set('view engine', 'ejs');
app.set('views', __dirname + '/views');



var server = app.listen(envConfig.port, function () {
  var host = server.address().address;
  var port = server.address().port;

  console.log('Example app listening at http://%s:%s', host, port);
});

//Validate user
var validateUser = function(request, response) {

	console.log(request.body.constructor);  
  console.log("------------");  

  var queryString = 'SELECT * FROM userInfo WHERE email = ' + queryHelper.esc(request.body.user);
  
	queryHelper.runQuery(queryString, 
		function success(rows) {
    		if(rows.length == 1) {
        		console.log('User Name: ', rows[0].email);
        		console.log('Password: ', rows[0].password);
        		if(rows[0].email == request.body.user && rows[0].password == request.body.password) {
                	request.session.username = request.body.user;
                	request.session.password = request.body.password;
					request.session.user_id = rows[0].id;
          			response.end("yes");
                	console.log("Post login session information");
                	console.log(request.session);
        		} else {
          			response.end("no");
        		}	
	 		} else {
      			response.end("no");
			}
		},
		function error(error) {
			console.log("Failed Here!");
        	response.end("no");
	});
}

//test to confirm json results from db query
var getAllActivitiesInfo = function(cb) {
	var queryString = 'SELECT * FROM activityMetadata';
	queryHelper.runQuery(queryString, 
		function success(rows) {
	      	console.log("Step 2\n\n");  
	      	console.log(cb);  
	      	return cb.success(rows);
		},
		function error(error) {
	      	console.log("Step 3\n\n");  
	      	return cb.error();
	});
}

var getUserActivityFor = function(id, startDate, endDate, successCb, errorCb) {
	/*
	get all rows from the activityLog table where,
	the user_id = userName.id AND
	the date is today.
	*/
	
	var getUserId = 'SELECT * FROM activityLog where user_id = ' + id ;
	queryHelper.runQuery(getUserId, 
		function success(rows) {
			console.log("UserInfo data");
			console.log(rows);
			successCb(rows);
		},
		function error(error) {
	      	return errorCb();
	});
}

//authenticate
var isUserAuthenticated = function(session, userName) {
	if(session.userName == userName) {
		return true;
	} else {
		return false;
	}
}

//---------------------------------Routes-----------------------------
//Home Page
app.get('/', function (req, res) {
  console.log(req.session);
  console.log('session name = '+req.session.username+', session password is '+req.session.password);
  if(req.session.username) {
    res.redirect('/dashboard');
  }
  else{
    res.redirect('/login');
  }
});

//Activities Page - should show a static list of activities
// TODO: Preethi
app.get('/activities', function (req, res) {
  console.log('2. Session = '+req.session);
	var callback = {
    success : function success(result) {
      console.log("Step 3\n\n");  
      res.json(result);
    },
    error : function error(err) {
      res.send(err);
    }
  };
  console.log("Step1\n\n");  
  getAllActivitiesInfo( callback);
});

//Get login page
app.get('/login',function(req, res){
  	var now = new Date();
	res.render('login', {
    	envConfig: envConfig
  	});
});

// TODO: Preethi
// Add a method to check if all routes are authentication i.e logged in pages 
// Redirect to login if you are not logged in

//Post login info
app.post('/login',function(req, res){
  validateUser(req, res); 
});

//Dashboard page (team homepage and data for other teams)
app.post('/dashboard',function(req, res){
  res.end("yes");
});

//User activity page (you should be able to list all activities for a user and prompt to enter activities for that user)
app.get('/:username/activities', function(req, res){
  //Check user id against the session and make sure user logged in is the user we are checking against
  console.log("Session user");
  console.log(req.session.username);
  console.log("Username param");
  console.log(req.params.username);

  if(req.session.username == (req.params.username + "@poshmark.com")){

    var callback = {
      success : function success(result) { 	
        activities = result;
		startDate = '2015-12-27T08:0:00.000Z';
		endDate = '2015-12-28T08:0:00.000Z'
        userActivity = getUserActivityFor(req.session.user_id, startDate, endDate,  
		function success(result) {
			userActivities = result;
	        _.each(activities, function(activity){
	          matchedActivity = _.find(userActivities, function(userActivity){
	            return userActivity.user_id == activity.id
	          })
	          if(matchedActivity) {
	            _.extend(activity, {'userActivity': matchedActivity})
	          }
	        });

	        activitiesByCategory = _.groupBy(activities, function(activity){
	          return activity.Category;
	        });

	        // Send response of activities here
	        // TODO: Preethi 
	        // Show the date time stamp on the top of the page
			console.log(activitiesByCategory);

	        res.render('user/activities', {
	          activitiesByCategory: activitiesByCategory
	        });
		},
		function error(err) {
			//return error
		});
        
        // userActivities = [
        //   {
        //     "id": 1,
        //     "Duration": 0
        //   },
        //   {
        //     "id": 24,
        //     "Duration": 45
        //   }
        // ]

      },
      error : function error(err) {
			//return error
      }
    };
	getAllActivitiesInfo(callback);
  } else {
    res.send('Username doesn\'t match the user logged in');
  }
});

// post for the user activity
app.post('/:username/activities', function(req, res){
    // set user activity
    // on submission we should gather data per day
    // userActivity = setUserActivityFor(username, "today", [{"id": 1, "Duration": 20}, {"id": 2 , "Duration": 40}]);
});
