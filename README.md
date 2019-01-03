# PoshFitServer
Node application for poshfit server
Step 1: Install Node.
Step 2: run "npm install" from the PoshFitServer root  directory.
Step 3: "node server.js" will start the server.

Note:
Change the ip/port number in development.json to suit your needs. Use "node server.js dev" to run using the development config.
Importing the PoshfitDb database into mysql:
run "mysql -u ec2-user  -h localhost PoshfitDb < PoshfitDb_backup.sql"

