var winston = require('winston'),
	fs = require( 'fs' ),
	logDir = "log",
	logger;

winston.setLevels( winston.config.npm.levels );
winston.addColors( winston.config.npm.colors );

if ( !fs.existsSync( logDir ) ) {
	// Create the directory if it does not exist
	fs.mkdirSync( logDir );
}

logger = new (winston.Logger)({
	transports: [
    	new (winston.transports.Console)({
    		timestamp: true,
    		level: 'warn', // Only write logs of warn level or higher
			colorize: true
    	}),
      	new (winston.transports.File)({ 
      		level: 'info',
      		timestamp: true,
      		filename: logDir + '/app.log',
			maxsize: 1024 * 1024 * 10, // 10MB
			exitOnError: false
      	})
    ],
	exceptionHandlers: [
		new winston.transports.File( {
			timestamp: true,
			filename: logDir + '/exceptions.log',
			maxsize: 1024 * 1024 * 10, // 10MB
			exitOnError: false
		} )
    ]
});

module.exports = logger;