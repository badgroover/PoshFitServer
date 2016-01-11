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

app.use(function(req, res, next) {
  res.locals.session = req.session;
  res.locals.startDate = envConfig.startDate;
  res.locals.dayBeforeStartDate = envConfig.dayBeforeStartDate;
  next();
});

// our custom "verbose errors" setting
// which we can use in the templates
// via settings['verbose errors']
app.enable('verbose errors');
// disable them in production
//if(argv.e != "dev") app.disable('verbose errors');

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

var getTotalPointsForTeam = function(req, cb) {
    var queryString = 'SELECT SUM(points) as total_points FROM activityLog WHERE team_id = ' + req.session.team_id;
    queryHelper.runQuery(queryString, 
        function success(rows) {
            if(rows.length == 1 && rows[0]["SUM(points)"] !== null) {
                console.log("Team Total");
                console.log(rows[0]["SUM(points)"]);
                return cb.success("" + rows[0]["SUM(points)"]);         
            } else {
                //This team has no points
                return cb.success("0");         
            }
        },
        function error(error) {
            return cb.error();
    });
}

var getTotalPointsForByTeamMembers = function(req, cb) {
    var queryString = 'SELECT SUM(points) as total_points,  team_name, email FROM activityLog LEFT JOIN teamMetadata ON activityLog.team_id=teamMetadata.id LEFT JOIN userInfo ON activityLog.user_id=userInfo.id WHERE activityLog.team_id = ' + req.session.team_id + " GROUP BY user_id";
    queryHelper.runQuery(queryString, 
        function success(rows) {
            if(rows.length !== 0) {
                console.log("Team Total By individuals");
				console.log(rows);
                return cb.success(rows);         
            } else {
                //This team has no points
				var emptyRowsArray = [];
                return cb.success("0");         
            }
        },
        function error(error) {
            return cb.error();
    });
}

var getTotalPointsForAllTeam = function(req, cb) {
    var queryString = 'SELECT SUM(points) as total_points, team_name FROM activityLog LEFT JOIN teamMetadata ON activityLog.team_id=teamMetadata.id GROUP BY team_id';
    queryHelper.runQuery(queryString, 
        function success(rows) {
            if(rows.length !== 0) {
                console.log("Team Total");
                console.log(rows[0]);
                console.log(rows[0].team_name);
                return cb.success(rows);            
            } else {
                //This team has no points..return error?
                return cb.success("0");         
            }
        },
        function error(error) {
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

var getUserActivityFor = function(id, activityDate, successCb, errorCb) {
    /*
    get all rows from the activityLog table where,
    the user_id = userName.id AND
    the date is today.
    */
    
    var getUserId = 'SELECT * FROM activityLog where user_id = ' + id  + " and date = " + queryHelper.esc(activityDate);
    queryHelper.runQuery(getUserId, 
        function success(rows) {
            successCb(rows);
        },
        function error(error) {
            console.log(error);
            return errorCb();
    });
}
var updateActivityLog = function(sql, rowData, successCb, errorCb) {
    queryHelper.runQuery(sql,
        function success (rows) {
            var sql;
            
            //Duration is undefined for Wellbeing and Consumption activities
            //Hack to give it a ruration. Maybe client sents 60?
            console.log(rowData);
			if (typeof rowData.duration === 'undefined') {
                rowData.duration = 0;
            }
                
            if(rowData.deleted === true) {
                //clear out this row
            } else {
                if(rows.length == 1) {
                    //found a prev entry...update..
                    sql = ['update activityLog set date = ' + queryHelper.esc(rowData.date),
                                 ' ,duration = ' + rowData.duration,
                                 ' ,points = ' + rowData.points,
                                 ' where user_id = ' + rowData.userId ,
                                 ' and activity_id = ' + rowData.activityId,
                                 ' and date = ' + queryHelper.esc(rowData.date)].join(' ');
                    console.log("UPDATE for :");
                    console.log(rowData);
                } else if(rows.length == 0) {
                    //new row...insert..
                    sql = [
                            'insert into activityLog (user_id, team_id, activity_id, duration, points, date) values (',
                            rowData.userId + ',',
                            rowData.teamId + ',',
                            rowData.activityId + ',',
                            rowData.duration + ',',
                            rowData.points + ',',
                            queryHelper.esc(rowData.date) + ')'].join(' ');
                    console.log("INSERT SQL :");
                    console.log(sql);
                }
            }
            queryHelper.runQuery(sql, 
                function success() {
                    rowData.isOK = true;
                    successCb();
                },
                function error() {
                    rowData.isOK = false;
                    errorCb();
                })
            
        },
        function error(error) {
            errorCb();
        }
    );
}
var setUserActivityFor = function(userId, teamId, data, successCb, errorCb) {
    var getSpecificActivityEntry = 'SELECT * FROM activityLog where user_id = ' + userId + " and ";

    var numItems = data.length;

    for(var i=0; (i< numItems); i++) {
        var rowData = data[i];
        rowData.userId = userId;
        rowData.teamId = teamId;
        rowData.isOK = false;
        var sql = getSpecificActivityEntry + ' activity_id = ' + rowData.activityId + ' and date = ' + queryHelper.esc(rowData.date);
        console.log("Current Row ");
        console.log(rowData);
        
        updateActivityLog(sql, rowData, 
            function success() {
                //check if all the updates are done...
                var allComplete = true;
                for( var j=0; j < numItems; j++) {
                    console.log("CHECK:");
                    console.log(data[j]);
                    if(data[j].isOK === false) {
                        allComplete = false;
                    }
                }
                
                if(allComplete === true) {
                    console.log("ALL DONE!")
                    successCb();
                } else {
                    console.log("WAITING!!")
                }
            },
            function error() {
                errorCb();
            }
        );
    }
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
        error: ""
    });
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
            res.redirect('/dashboard');
        },
        error: function error(error) {
            res.render('login', {
                error: error
            })
        }
    }
    findUser(req.body.username, req.body.password, callback); 
});

//Dashboard page (team homepage and data for other teams)
app.get('/dashboard', requireLogin, function(req, res){
    var callback = {
        success : function success(result) {
            console.log("Team result");
            console.log(result);
            var userTeamData = result, 
                userTeamName;

            var allTeamPointsCallback = {
                success: function success(result){
                    teamData = result;
                    console.log("All Teams result");
                    console.log(teamData);

                    if(teamData) {
                        _.sortBy(teamData, 'total_points'); 
                    }

                    res.render('dashboard', {
                        userTeamName: userTeamName,
                        teamData: teamData,
                        userTeamData: userTeamData
                    });
                },
                error: function error(result){
                    //return error
                    res.end("no");
                }
            }

            getTotalPointsForAllTeam(req, allTeamPointsCallback);
        },
        error : function error(err) {
            // res.send(err);
            res.end("no");
        }
        };
	getTotalPointsForByTeamMembers(req, callback);
});

//About page
app.get("/about", requireLogin, function(req, res){
    res.render('about');
});

//User activity page (you should be able to list all activities for a user and prompt to enter activities for that user)
app.get('/:username/activities', requireLogin, function(req, res){
  //Check user id against the session and make sure user logged in is the user we are checking against
  if(req.session.username == req.params.username){

    var callback = {
      success : function success(result) {  
        var activities = result,
          today;

        if(req.query.for) {
          activityDate = req.query.for;  
        } else {
          today = new Date();
          activityDate = today.getFullYear() + "-" + (today.getMonth() + 1) + "-" + today.getDate();
        }

        getUserActivityFor(req.session.user_id, activityDate, 
          function success(result) {

            userActivities = result;
            console.log("USER ACTIVITIES");
            console.log(userActivities);
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

            res.render('user/activities', {
              activitiesByCategory: activitiesByCategory,
              displayDate: activityDate
            });
        },
        function error(err) {
          //return error
          res.end("no");
        });
      },
      error : function error(err) {
        //return error
        res.end("no");
      }
    };
    getAllActivitiesInfo(callback);
  } else {
    // TODO: Display this error message to the user 
    res.send('Username doesn\'t match the user logged in');
  }
});

//Post for the user activity
app.post('/:username/activities', requireLogin, function(req, res){
    if(req.session.username == req.params.username){

      var activityIdsToBeUpdated,
          activityDuration = _.filter(req.body.activityDuration, function(value){
              return value !== "";
          }),
          activityDate = req.body.activityDate,
          activityPoints = _.filter(req.body.activityTotalPoints, function(value){
              return value !== "";
          }),
          activityIdsDeleted,
          activityData = [];


     console.log("Request ");
     console.log(req.body);

     if(req.body.activitySelected){
        console.log("In selected");
        if(req.body.activitySelected instanceof Array) {
            activityIdsToBeUpdated = req.body.activitySelected;
        } else {
            activityIdsToBeUpdated = [req.body.activitySelected];
        }
     }

     if(req.body.activityIdDeleted){
        console.log("In deleted");
        if(req.body.activityIdDeleted instanceof Array) {
            activityIdsDeleted = req.body.activityIdDeleted;
        } else {
            activityIdsDeleted = [req.body.activityIdDeleted];
        }
     }

      if(activityIdsToBeUpdated && activityIdsToBeUpdated.length > 0) {
          _.each(activityIdsToBeUpdated, function(activityId, i) {
            activityData.push({
              "activityId": activityId,
              "duration": activityDuration[i],
              "points": activityPoints[i],
              "date": activityDate
            });
          });
      }

      if(activityIdsDeleted && activityIdsDeleted.length > 0) {
        _.each(activityIdsDeleted, function(activityId, i){
            activityData.push({
              "activityId": activityId,
              "duration": 0,
              "points": 0.0,
              "date": activityDate,
              "deleted": true
            });
          })
      }

      console.log("Activity Data  " + activityData);
      _.each(activityData, function(data) {
        console.log(data);
      });

      if(activityData.length > 0) {
        setUserActivityFor(req.session.user_id, req.session.team_id, activityData, 
          function success(result) {
            console.log("FINISHED!!!");
            res.end("yes");
          },
          function error(err) {
            // TODO: Preethi handle error
            res.end("no");
          });
      } else {
        console.log("DID NOT UPDATE ANYTHING!!!");
        res.end("yes");
      }


    } else {
      // TODO: Display this error message to the user 
      res.send('Username doesn\'t match the user logged in');
    }

});

// Logout
app.get('/logout', requireLogin, function(req, res){
  // clear session variables here
  req.session.destroy();
  res.redirect('/login');
});

// Error handlers

// Since this is the last non-error-handling
// middleware use()d, we assume 404, as nothing else
// responded.

// $ curl http://localhost:3000/notfound
// $ curl http://localhost:3000/notfound -H "Accept: application/json"
// $ curl http://localhost:3000/notfound -H "Accept: text/plain"

app.use(function(req, res, next){
  res.status(404);

  // respond with html page
  if (req.accepts('html')) {
    res.render('404', { url: req.url });
    return;
  }

  // respond with json
  if (req.accepts('json')) {
    res.send({ error: 'Not found' });
    return;
  }

  // default to plain-text. send()
  res.type('txt').send('Not found');
});

// error-handling middleware, take the same form
// as regular middleware, however they require an
// arity of 4, aka the signature (err, req, res, next).
// when connect has an error, it will invoke ONLY error-handling
// middleware.

// If we were to next() here any remaining non-error-handling
// middleware would then be executed, or if we next(err) to
// continue passing the error, only error-handling middleware
// would remain being executed, however here
// we simply respond with an error page.

app.use(function(err, req, res, next){
  // we may use properties of the error object
  // here and next(err) appropriately, or if
  // we possibly recovered from the error, simply next().
  res.status(err.status || 500);
  res.render('500', { error: err });
});
