INSTRUCTIONS FOR SETTING-UP THE APPLICATION


Requirements:

OS: Ubuntu 16.04 (Recommented)
1) angular-cli version 6.1.0 or grater
2) nodejs version 8.0 stable
   npm latest
3) nginx server
4) docker
   docker-composer

steps:

1) There are two clients in this application
	* Uploader-client
	* voter-client

navigate into each clients directories and do the commands 'npm install' and 'ng build' one 	after the other for each clients seperately.

2) In each client folders, after giving the above commands we can see a new client folder 	respective to the client inside the dist

3) copy the path from each clent and paste it in the nginx.conf file in the repository in 	port 4200 paste the path of uploader-client and for port 4201 paste the path of voter-	client respectively.

4) replace the nginx.conf file in /etc/nginx/nginx.conf with the one in previous step
(`sudo cp nginx.conf /etc/nginx/nginx.conf`)

5)Restart nginx using `/etc/init.d/nginx restart`
( if the port is still in use:
 get PID using `sudo netstat -tulpn`
 Do `sudo kill -2 <PID>` and then do the restart
 )
6)`sudo docker-compose up` for deploying the validator

The application should be available at `http://localhost:4200 - uploader client and http://localhost:4201 -voter client
   
