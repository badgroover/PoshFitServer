var express       = require('express'),
    session       = require('express-session'),
    cookieParser  = require('cookie-parser'),
    mysql         = require('mysql'),
    path          = require("path"),
    bodyParser    = require("body-parser"),
    queryHelper   = require("./QueryHelper.js"),
    _             = require("underscore"),
    app           = express();

//Set up environment
var envConfig,
    argv = require('minimist')(process.argv.slice(2));

console.log(argv);

if(argv.e == "dev") {
	envConfig = require('./config/development.json');  
} else {
	envConfig = require('./config/production.json');  
}

app.use(cookieParser());
app.use(session({
  secret: '$#$##@#!',
  cookieName: 'pmfit',
  duration: 24 * 60 * 60 * 1000, 
  activeDuration: 5 * 60 * 1000
}));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));
app.set('view engine', 'ejs');
app.set('views', __dirname + '/views');

var server = app.listen(envConfig.port, function () {
  var host = server.address().address,
      port = server.address().port;

  console.log('Example app listening at http://%s:%s', host, port);
});

//Find user
var findUser = function(username, password, callback) {

  var queryString = 'SELECT * FROM userInfo WHERE email = ' + queryHelper.esc(username);
  
	queryHelper.runQuery(queryString, 
		function success(rows) {
    		if(rows.length == 1) {
        		if(rows[0].email == username && rows[0].password == password) {
          		callback.success(username);
        		} else {
          	   callback.error("Username or Password incorrect");
        		}	
	 		} else {
      			callback.error("Username or Password incorrect");
			}
		},
		function error(error) {
			console.log("Failed Here!");
      callback.error("Something went wrong. Please try logging in later");
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

// Redirect to login if you are not logged in
function requireLogin(req, res, next) {
  if (!req.session && !req.session.username) {
    res.redirect('/login');
  } else {
    next();
  }
};

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

//---------------------------------Routes-----------------------------
//Home Page
app.get('/', requireLogin, function (req, res) {
  console.log(req.session);
  console.log('session name = '+req.session.username+', session password is '+req.session.password);
  res.redirect('/dashboard');
});

//Activities Page - shows static list of activities
app.get('/activities', function (req, res) {
  console.log('2. Session = '+req.session);
	var callback = {
    success : function success(result) {
      activities = result;
      activitiesByCategory = _.groupBy(activities, function(activity){
        return activity.Category;
      });
      res.render('activities', {
        activitiesByCategory: activitiesByCategory
      });
    },
    error : function error(err) {
      res.send(err);
    }
  };
  getAllActivitiesInfo(callback);
});

//Get login page
app.get('/login',function(req, res){
  var now = new Date();
	res.render('login', {
    	envConfig: envConfig
  	});
});

//Post login info
app.post('/login',function(req, res){
  console.log('User name = '+req.body.username+', password is '+req.body.password);
  var callback = {
    success: function success(username) {
      req.session.username = username;
      req.session.password = req.body.password;
      res.redirect('/activities');
    },
    error: function error(error) {
      // TODO: Preethi
      // Update login page to handle errors and make it pretty 
      res.render('login', {
        envConfig: envConfig,
        error: error
      })
    }
  }
  findUser(req.body.username, req.body.password, callback); 
});

//Dashboard page (team homepage and data for other teams)
app.post('/dashboard', requireLogin, function(req, res){
  res.end("yes");
});

//User activity page (you should be able to list all activities for a user and prompt to enter activities for that user)
app.get('/:username/activities', requireLogin, function(req, res){
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
        userActivities = getUserActivityFor(req.session.user_id, startDate, endDate,  
          function success(result) {
			       userActivities = result;
		      },
		      function error(err) {
			       //return error
		      });

        console.log("User Activity!");
        console.log(userActivities);
        
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
app.post('/:username/activities', requireLogin, function(req, res){
    // set user activity
    // on submission we should gather data per day
    // userActivity = setUserActivityFor(username, "today", [{"id": 1, "Duration": 20}, {"id": 2 , "Duration": 40}]);
});

// TODO: add a path for logout
