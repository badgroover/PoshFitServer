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
app.use(express.static('public'));

var server = app.listen(envConfig.port, function () {
  var host = server.address().address,
      port = server.address().port;

  console.log('Example app listening at http://%s:%s', host, port);
});

app.use(function(req, res, next) {
  res.locals.session = req.session;
  next();
});

//Find user
var findUser = function(username, password, callback) {

  var queryString = 'SELECT * FROM userInfo WHERE email = ' + queryHelper.esc(username);
  
	queryHelper.runQuery(queryString, 
		function success(rows) {
    		if(rows.length == 1) {
        		if(rows[0].email == username && rows[0].password == password) {
          		callback.success(username, rows[0].id, rows[0].team_id);
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
  if (req.session && req.session.email) {
    next();
  } else {
    res.redirect('/login');
  }
};

var getUserActivityFor = function(id, startDate, successCb, errorCb) {
	/*
	get all rows from the activityLog table where,
	the user_id = userName.id AND
	the date is today.
	*/
	
	var getUserId = 'SELECT * FROM activityLog where user_id = ' + id  + " and date = " + queryHelper.esc(startDate);
	queryHelper.runQuery(getUserId, 
		function success(rows) {
			console.log("UserInfo data");
			console.log(rows);
			successCb(rows);
		},
		function error(error) {
			console.log(error);
	     	return errorCb();
	});
}

var setUserActivityFor = function(userId, teamId, data, successCb, errorCb) {
	var getSpecificActivityEntry = 'SELECT * FROM activityLog where user_id = ' + userId  + ' team_id = ' + team_id;

	var numItems = data.length;
	for(var i=0; i< numItems; i++) {
		var rowData = data[i];
		var sql = getSpecificActivityEntry + ' activity_id = ' + rowData.activity_id + ' and date = ' + queryHelper.esc(rowData.date);
		console.log(sql);
		queryHelper.runQuery(sql,
			function success (rows) {
				if(rows.length == 1) {
					//found a prev entry...update..
				} else if(rows.length == 0) {
					//isert a new entry
				}
			},
			function error(error) {
				
			}
		);
		
	}
	var getUserId = 'SELECT * FROM activityLog where user_id = ' + id  + " and date = " + queryHelper.esc(startDate);
	queryHelper.runQuery(getUserId, 
		function success(rows) {
			console.log("UserInfo data");
			console.log(rows);
			successCb(rows);
		},
		function error(error) {
			console.log(error);
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
	res.render('login');
});

//Post login info
app.post('/login',function(req, res){
  console.log('User name = '+req.body.username+', password is '+req.body.password);
  	var callback = {
		success: function success(username, user_id, team_id) {
      		var re = /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
      		req.session.email = username
      		req.session.username = re.exec(username)[1];
      		console.log("USER NAME IS - " + req.session.username)
      		req.session.user_id = user_id;
			req.session.team_id = team_id;
      		req.session.password = req.body.password;
      		res.redirect('/activities');
    	},
    	error: function error(error) {
      		// TODO: Preethi
      		// Update login page to handle errors and make it pretty 
      		res.render('login', {
        		error: error
      		})
    	}
	}
  	findUser(req.body.username, req.body.password, callback); 
});

// TODO: Preethi
//Dashboard page (team homepage and data for other teams)
app.post('/dashboard', requireLogin, function(req, res){
  res.end("yes");
});

//User activity page (you should be able to list all activities for a user and prompt to enter activities for that user)
app.get('/:username/activities', requireLogin, function(req, res){
  //Check user id against the session and make sure user logged in is the user we are checking against
  if(req.session.username == req.params.username){

    var callback = {
      success : function success(result) { 	
        var activities = result,
          today = new Date(),
          yesterday = new Date(),
          dayBeforeYesterday = new Date(),
          displayDate;

        yesterday.setDate(today.getDate() - 1);
        dayBeforeYesterday.setDate(yesterday.getDate() -1);
        // TODO: Preethi set the time correctly here based on query params i.e 'today' or 'yesterday'
        if(req.query.for == "today"){
          startDate = yesterday.toISOString();
          endDate = today.toISOString();
          displayDate = today;
        } else {
          startDate = dayBeforeYesterday.toISOString();
          endDate = yesterday.toISOString();
          displayDate = yesterday;
        }

        // Remove this hardcoded value after testing
		startDate = '2015-12-27T08:0:00.000Z';
        getUserActivityFor(req.session.user_id, startDate,  
        function success(result) {
            userActivities = result;
            _.each(activities, function(activity){
              matchedActivity = _.find(userActivities, function(userActivity){
                return userActivity.activity_id == activity.id
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

            res.render('user/activities', {
              activitiesByCategory: activitiesByCategory,
              displayDate: displayDate
            });
		},
		function error(err) {
			//return error
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
    res.end("yes");
    console.log("IN HERE");
    console.log(req.body);
    console.log(req.body.params);
  	if(req.session.username == req.params.username){
	
	}
	setUserActivityFor(req.session.user_id, req.session.team_id, activityData, 
		function success(result) {
			  res.end("yes");
      	},
      	function error(err) {
			  res.end("no");
      	}
	);
});

// Logout
app.get('/logout', requireLogin, function(req, res){
  // clear session variables here
  req.session.destroy();
  res.redirect('/login');
});

// TODO: Preethi
// TODO: add a route for 404 
