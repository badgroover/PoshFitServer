var express       = require('express'),
    session       = require('express-session'),
    cookieParser  = require('cookie-parser'),
    mysql         = require('mysql'),
    path          = require("path"),
    bodyParser    = require("body-parser"),
    queryHelper   = require("./QueryHelper.js"),
    _             = require("underscore"),
    logger        = require('./logger.js'),
    app           = express();

//Set up environment
var envConfig,
    argv = require('minimist')(process.argv.slice(2));

//logger.info(argv);
//logger.info(argv.e);

if(argv.e == "dev") {
    envConfig = require('./config/development.json');  
} else {
    envConfig = require('./config/production.json');  
    envConfig.start_date = new Date(envConfig.startYear, envConfig.startMonth, envConfig.startDay);
    console.log(envConfig.start_date);
}

app.use(cookieParser());
app.use(session({
    secret: '$#$##@#!',
    cookieName: 'pmfit',
    duration: 24 * 60 * 60 * 1000, 
    activeDuration: 5 * 60 * 1000,
    resave: true,
    saveUninitialized: true
}));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));
app.set('view engine', 'ejs');
app.set('views', __dirname + '/views');
app.use(express.static('public'));

app.use(function(req, res, next) {
  res.locals.session = req.session;
  res.locals.startDate = envConfig.start_date.toISOString();
  prevDay = new Date(envConfig.start_date.getDate() - 1);
  console.log(prevDay);
  res.locals.dayBeforeStartDate = prevDay.toISOString();
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

  logger.info('Example app listening at http://%s:%s', host, port);
});

//Find user
var findUser = function(username, password, callback) {
    var queryString = 'SELECT * FROM userInfo WHERE email = ' + queryHelper.esc(username);
    logger.info("In findUser");
    queryHelper.runQuery(queryString, 
        function success(rows) {
            if(rows.length == 1) {
                if(rows[0].password == password) {
                    callback.success(username, rows[0].id, rows[0].team_id, rows[0].resetFlag);
                } else {
                    callback.error("Username or Password incorrect");
                }   
            } else {
                callback.error("Username or Password incorrect");
            }
        },
        function error(error) {
            logger.error("Failed in findUser");
            callback.error("Something went wrong. Please try logging in later");
    });
}

//Reset password
var resetPassword = function(user_id, username, password, callback) {
    logger.info("In resetPassword");
    var sql = ['update userInfo set password = ' + queryHelper.esc(password),
                 ', resetFlag = 0',
                ' where id = ' + user_id
                ].join(' ');
 
    queryHelper.runQuery(sql, 
        function success(rows) {
            //Password reset succeeded.
            logger.info("Pswd reset OK!")
            callback.success();
        },
        function error(error) {
            logger.info("Pswd reset Fail!")     
            logger.error("Something went wrong will resetting password. Please try later");
    });
}

var getDashboardMessage = function(cb) {
    logger.info("In getDashboardMessage");
    var sql = "SELECT * from dashboardMessage";
    queryHelper.runQuery(sql, 
        function success(rows) {
            logger.info("Got dashboard message");  
            if(rows.length == 1) {
                return cb.success(rows[0].message);
            } else {
                return cb.success("");
            }
        },
        function error(error) {
            return cb.error("");
    });
}


//test to confirm json results from db query
var getAllActivitiesInfo = function(cb) {
    logger.info("In getAllActivitiesInfo");
    var queryString = 'SELECT * FROM activityMetadata order by Activity';
    queryHelper.runQuery(queryString, 
        function success(rows) { 
            return cb.success(rows);
        },
        function error(error) {
            return cb.error();
    });
}

var getConsolidatedDataDump = function(cb) {
    logger.info("In getAllActivitiesInfo");
    var queryString = 'select * from activityLog right join userInfo on activityLog.user_id=userInfo.id left join activityMetadata on activityLog.activity_id=activityMetadata.id left join teamMetadata on userInfo.team_id=teamMetadata.id';
    queryHelper.runQuery(queryString, 
        function success(rows) { 
            return cb.success(rows);
        },
        function error(error) {
            return cb.error();
    });
}


var getTotalPointsForTeam = function(req, cb) {
    logger.info("In getTotalPointsForTeam");
    var queryString = 'SELECT SUM(points) as total_points FROM activityLog WHERE team_id = ' + req.session.team_id;
    queryHelper.runQuery(queryString, 
        function success(rows) {
            if(rows.length == 1 && rows[0]["SUM(points)"] !== null) {
                logger.info("Team Total");
                logger.info(rows[0]["SUM(points)"]);
                return cb.success("" + rows[0]["SUM(points)"]);         
            } else {
                logger.info("This team has no points!");
                var emptyRowsArray = [];
                return cb.success(emptyRowsArray);         
            }
        },
        function error(error) {
            return cb.error();
    });
}

var getTotalPointsForTeamMembers = function(req, cb) {
    logger.info("In getTotalPointsForTeamMembers");
    var queryString = 'SELECT SUM(points) as total_points,  team_name, email FROM activityLog LEFT JOIN teamMetadata ON activityLog.team_id=teamMetadata.id LEFT JOIN userInfo ON activityLog.user_id=userInfo.id WHERE activityLog.team_id = ' + req.session.team_id + " GROUP BY user_id";
    queryHelper.runQuery(queryString, 
        function success(rows) {
            if(rows.length !== 0) {
                logger.info("Team Total By individuals");
                logger.info(rows);
                return cb.success(rows);         
            } else {
                //This team has no points
                logger.info("This team has no points!");
                var emptyArray = [];
                return cb.success(emptyArray);         
            }
        },
        function error(error) {
            return cb.error();
    });
}

var getTotalPointsForAllTeams = function(req, cb) {
    logger.info("In getTotalPointsForAllTeams");
    var queryString = 'SELECT SUM(points) as total_points, team_name FROM activityLog LEFT JOIN teamMetadata ON activityLog.team_id=teamMetadata.id GROUP BY team_id';
    queryHelper.runQuery(queryString, 
        function success(rows) {
            if(rows.length !== 0) {
                logger.info("Team Total");
                logger.info(rows[0]);
                logger.info(rows[0].team_name);
                return cb.success(rows);            
            } else {
                logger.info("This team has no points!");
        var emptyArray = [];
                return cb.success(emptyArray);         
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
    logger.info("In getTotalPointsForAllTeams");
    var getUserId = 'SELECT * FROM activityLog where user_id = ' + id  + " and date = " + queryHelper.esc(activityDate);
    queryHelper.runQuery(getUserId, 
        function success(rows) {
            successCb(rows);
        },
        function error(error) {
            logger.error(error);
            return errorCb();
    });
}
var updateActivityLog = function(sql, rowData, successCb, errorCb) {
    if(rowData.deleted === true) {
        var sql = [ 'delete from activityLog where ',
                    ' user_id = ' + rowData.userId ,
                    ' and activity_id = ' + rowData.activityId,
                    ' and date = ' + queryHelper.esc(rowData.date)
                    ].join(' ');
        //Delete the row..
        logger.info("Delete Row");
        logger.info(sql);   
        queryHelper.runQuery(sql, 
            function success (rows) {
                logger.info("Delete OK");
                logger.info(rows);  
                rowData.isOK = true;
                successCb();            
            },
            function error (error) {
                rowData.isOK = false;
                errorCb();          
            }
        );          
    } else {
        queryHelper.runQuery(sql,
            function success (rows) {
                var sql;
            
                //Duration is undefined for Wellbeing and Consumption activities
                //Hack to give it a ruration. Maybe client sents 60?
                logger.info(rowData);
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
                        logger.info("UPDATE for :");
                        logger.info(rowData);
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
                        logger.info("INSERT SQL :");
                        logger.info(sql);
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
}
var setUserActivityFor = function(userId, teamId, data, successCb, errorCb) {
    var getSpecificActivityEntry = 'SELECT * FROM activityLog where user_id = ' + userId + " and ";

    var numItems = data.length;
    var hasErroredOut = false;

    for(var i=0; (i< numItems); i++) {
        var rowData = data[i];
        rowData.userId = userId;
        rowData.teamId = teamId;
        rowData.isOK = false;
        var sql = getSpecificActivityEntry + ' activity_id = ' + rowData.activityId + ' and date = ' + queryHelper.esc(rowData.date);
        logger.info("Current Row ");
        logger.info(rowData);
        
        updateActivityLog(sql, rowData, 
            function success() {
                //check if all the updates are done...
                var allComplete = true;
                for( var j=0; j < numItems; j++) {
                    logger.info("CHECK:");
                    logger.info(data[j]);
                    if(data[j].isOK === false) {
                        allComplete = false;
                    }
                }
                
                if(allComplete === true) {
                    logger.info("ALL DONE!")
                    successCb();
                } else {
                    logger.info("WAITING!!")
                }
            },
            function error() {
                if(hasErroredOut === false) {
                    logger.info(" Errored Out!")
                    console.log("Errored out");
                    hasErroredOut = true;
                    errorCb();
                } 
            }
        );
    }
}

//---------------------------------Routes-----------------------------
//Home Page
app.get('/', requireLogin, function (req, res) {
  logger.info(req.session);
  logger.info('session name = '+req.session.username+', session password is '+req.session.password);
  res.redirect('/dashboard');
});

//Activities Page - shows static list of activities
app.get('/activities', function (req, res) {
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
        //return error
        logger.error("Error in activities getAllActivitiesInfo: ");
        logger.error(err);
        error = 'Sorry something went wrong when trying to retrieve data. Please try again later';
        res.render('error', {
            error: error
        });
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
    logger.info('User name = '+req.body.username+', password is '+req.body.password);
    var callback = {
        success: function success(username, user_id, team_id, resetPassword) {
            var re = /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
            req.session.email = username
            req.session.username = re.exec(username)[1];
            req.session.user_id = user_id;
            req.session.team_id = team_id;
            logger.info("Reset password flag");
            logger.info(resetPassword);

            if(resetPassword == 1) {
                console.log("Reset password");
                res.render('resetPassword', {
                    error: ""
                });
            } else {
                req.session.password = req.body.password;
                res.redirect('/dashboard');
            }
            
        },
        error: function error(error) {
            res.render('login', {
                error: error
            });
        }
    }
    findUser(req.body.username, req.body.password, callback); 
});

//Enter new password
app.get('/user/change-password', requireLogin, function(req, res){
    res.render('resetPassword', {
        error: ""
    });
});

//Update new password
app.post('/user/change-password', requireLogin, function(req, res){
    var callback = {
        success: function success() {
            logger.info("USER NAME IS - " + req.session.username);
            req.session.password = req.body.password;
            res.redirect('/dashboard');
        },
        error: function error(error) {
            res.render('resetPassword', {
                error: error
            });
        }
    }
    resetPassword(req.session.user_id, req.session.username, req.body.password, callback); 
});

//Dashboard page (team homepage and data for other teams)
app.get('/dashboard', requireLogin, function(req, res){
    var callback = {
        success : function success(result) {
            logger.info("Team result");
            logger.info(result);
            var userTeamData = result;

            var allTeamPointsCallback = {
                success: function success(result){
                    teamData = result;
                    logger.info("All Teams result");
                    logger.info(teamData);

                    if(teamData) {
                        teamData.sort(function(team1, team2) {
                            return team1.total_points - team2.total_points;
                        });
                    }

                    var dashboardMessageCallback = {
                        success: function success(message) {
                            res.render('dashboard', {
                                userTeamData: userTeamData,
                                teamData: teamData,
                                dashboardMessage: message
                            });
                        },
                        error: function error(result) {
                            //return error
                            logger.error("Error in dashboard getDashboardMessage: ");
                            logger.error(result);
                            error = 'Sorry something went wrong when trying to retrieve data. Please try again later';
                            res.render('error', {
                                error: error
                            });
                        }
                    }
                    getDashboardMessage(dashboardMessageCallback);
                },
                error: function error(result){
                    //return error
                    logger.error("Error in dashboard getTotalPointsForAllTeam: ");
                    logger.error(result);
                    error = 'Sorry something went wrong when trying to retrieve data. Please try again later';
                    res.render('error', {
                        error: error
                    });
                }
            }

            getTotalPointsForAllTeams(req, allTeamPointsCallback);
        },
        error : function error(err) {
            //return error
            logger.error("Error in dashboard getTotalPointsForByTeamMembers: ");
            logger.error(err);
            error = 'Sorry something went wrong when trying to retrieve data. Please try again later';
            res.render('error', {
                error: error
            });
        }
        };
    getTotalPointsForTeamMembers(req, callback);
});

//About page
app.get("/about", requireLogin, function(req, res){
    res.render('about');
});

//User activity page (you should be able to list all activities for a user and prompt to enter activities for that user)
app.get('/:username/activities', requireLogin, function(req, res){
  //Check user id against the session and make sure user logged in is the user we are checking against
  if(req.session.username == req.params.username){

    //adding a redirect to the dashboard for the end of the competition
    res.redirect('/dashboard');

     var callback = {
       success : function success(result) {  
         var activities = result,
	 today;    
         today = new Date();
	 if(req.query.utc) {
	     var timestamp=Date.parse(req.query.utc)
	     if (isNaN(timestamp)==true)
             {
		 console.log("Invalid date from client!")
		 console.log("req.query.utc");    
                 clientDate = new Date();
             } else {
                 clientDate = new Date(req.query.utc);		 
	     }
// 	     if(req.query.yesterday == "true") {
// 		console.log("Yesterday!");     
// 	     	clientDate = new Date(clientDate.getDate() - 1);
// 	     }
	     if(req.query.for) {
	         activityDate = req.query.for;
		 console.log("Activity Date");
		 console.log(activityDate);    
		     
	     } else {
                 activityDate = clientDate.getFullYear() + "-" + (clientDate.getMonth() + 1) + "-" + clientDate.getDate();
	     }
         } else {
           clientDate = new Date();
           activityDate = clientDate.getFullYear() + "-" + (clientDate.getMonth() + 1) + "-" + clientDate.getDate();
         }
	 
	 console.log("Server UTC: ");
	 console.log(today.toISOString());      
	 console.log("Client UTC: ");
	 console.log(clientDate.toISOString());  
	 console.log("Client TimeZone: ");
	 console.log(req.query.timezone);
	 console.log("Server TimeZone: ");
	 console.log(today.timezone);
	 diffInMinutes = Math.abs(((clientDate - today)/1000)/60);
	 console.log("Time Diff: ");
	 console.log(diffInMinutes);
	       
	 if(diffInMinutes > 60) {
	     error = 'Date Mismatch!! Please check your system clock!';
                 res.render('error', {
                     error: error
         	 });
	 } else {
         getUserActivityFor(req.session.user_id, activityDate, 
           function success(result) {

             userActivities = result;
             logger.info("USER ACTIVITIES");
             logger.info(userActivities);
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

             var dateToDisplay;
	     if(req.query.yesterday == "true") {
	        yesterday = new Date();
		yesterday.setDate(clientDate.getDate() - 1); 
		console.log("Yesterday's Date");
		console.log(yesterday);     
		dateToDisplay = yesterday.toISOString();
	     } else {
	         dateToDisplay = clientDate.toISOString();
	     }
             res.render('user/activities', {
               activitiesByCategory: activitiesByCategory,
               displayDate: dateToDisplay
             });
         },
         function error(err) {
             //return error
             logger.error("Error in user activities getUserActivityFor:");
             logger.error(err);
             error = 'Sorry something went wrong when trying to retrieve data. Please try again later';
             res.render('error', {
                 error: error
             });
         });
	 }
       },
       error : function error(err) {
         //return error
         logger.error("Error in user activities getAllActivitiesInfo:");
         logger.error(err);
         error = 'Sorry something went wrong when trying to retrieve data. Please try again later';
         res.render('error', {
             error: error
         });
       }
     };
     getAllActivitiesInfo(callback);
  } else {
    error = 'Username doesn\'t match the user logged in';
    res.render('error', {
        error: error
    });
  }
});

//Post for the user activity
app.post('/:username/activities', requireLogin, function(req, res){
    if(req.session.username == req.params.username){

      // adding a redirect to the dashboard for the end of the competition
      res.redirect('/dashboard');

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


      logger.info("Request ");
      logger.info(req.body);

      if(req.body.activitySelected){
         logger.info("In selected");
         if(req.body.activitySelected instanceof Array) {
             activityIdsToBeUpdated = req.body.activitySelected;
         } else {
             activityIdsToBeUpdated = [req.body.activitySelected];
         }
      }

      if(req.body.activityIdDeleted){
         logger.info("In deleted");
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

       logger.info("Activity Data  " + activityData);
       _.each(activityData, function(data) {
         logger.info(data);
       });

       if(activityData.length > 0) {
         setUserActivityFor(req.session.user_id, req.session.team_id, activityData, 
           function success(result) {
             logger.info("FINISHED UPDATING ACTIVITIES!!!");
             res.redirect('/dashboard');
           },
           function error(err) {
             logger.error("Error in set user activities setUserActivityFor:");
             logger.error(err);
             error = 'Sorry something went wrong when trying to update data. Please try again later';
             res.render('error', {
                 error: error
             });
           });
       } else {
         logger.info("DID NOT UPDATE ANYTHING!!!");
         res.end("yes");
       }


    } else {
        //return error
        error = 'Username doesn\'t match the user logged in';
        res.render('error', {
            error: error
        });
    }

});

// Logout
app.get('/logout', requireLogin, function(req, res){
  // clear session variables here
  req.session.destroy();
  res.redirect('/login');
});

// End point to return raw data for Tableau Web Data Connection
//ToDO: check for credentials
app.get('/TDC', function(req, res){
  console.log("From Tableau!!");
    var callback = {
    success : function success(result) {
		var data = {};
		data.stuff = result;
		res.send(data);
    },
    error : function error(err) {
        //return error
        logger.error("Error in activities getAllActivitiesInfo: ");
        logger.error(err);
        error = 'Sorry something went wrong when trying to retrieve data. Please try again later';
    }
  };
  getConsolidatedDataDump(callback);
  //getAllActivitiesInfo(callback);
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
