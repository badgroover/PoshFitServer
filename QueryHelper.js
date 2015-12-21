	var mysql         = require('mysql');

	module.exports.pool      =    mysql.createPool({
    	connectionLimit : 100, //important
    	host     : '127.0.0.1',
    	user     : 'ec2-user',
    	password : '',
    	database : 'PoshfitDb',
    	debug    :  false
	});

	module.exports.runQuery = function(queryString, onError, onSuccess) {
		module.exports.pool.getConnection(function(err,connection){
        	if (err) {
            	connection.release();
            	onError(err);
        	} else {
            	connection.query(queryString,function(err,rows){
                connection.release();
                if(!err) {
                    onSuccess(rows);
                } else {
                    onError(err);
                }           
            });
        }   
      });
	};

	module.exports.esc = function(string) {
		return mysql.escape(string);
	};	
