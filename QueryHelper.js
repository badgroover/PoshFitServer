    var mysql         = require('mysql');
	var logger        = require('./logger.js');
    
    var envConfig;
    var argv = require('minimist')(process.argv.slice(2));
    console.log(argv);
    if(argv.e == "dev") {
        console.log("Init Dev env.");
        envConfig = require('./config/development.json');  
    } else {
        console.log("Init Prod env.");
        envConfig = require('./config/production.json');  
    }
    
    module.exports.pool      =    mysql.createPool({
        connectionLimit : 100, //important
        host     : envConfig.sql.host,
        user     : envConfig.sql.user,
        password : envConfig.sql.password,
        database : envConfig.sql.db,
        debug    :  false
    });

    module.exports.runQuery = function(queryString, onSuccess, onError) {
        logger.info("Query :")
        logger.info(queryString);
        module.exports.pool.getConnection(function(err,connection){
            if (err) {
                logger.info("getConnection Error:");
                logger.info(err);
                onError(err);
            } else {
                connection.query(queryString,function(err,rows){
                connection.release();
                if(!err) {
                    logger.info("Query Success");
                    onSuccess(rows);
                } else {
                    logger.info("Query Error");
                    logger.info(err);
                    onError(err);
                }           
            });
        }   
      });
    };

    module.exports.esc = function(string) {
        return mysql.escape(string);
    };  
