Note: current version is 1.2.2, please reload the db again (delete db and init again) due to some new features if you're going to update the explorer. 

## NEM Blockchain Explorer (Node.js) ##

The project is a blockchian explorer project which is built on NEM (https://www.nem.io). 

### What components are required ###

AngularJS, Bootstrap, MongoDB, Node.js

### How to deploy the project ###

#### The following must be done before you build the project: ####

1) install the Node.js on your machine.

2) NIS is started and blocks loading is finished.

3) install MongoDB and start it (it's better to set an account and password).

#### Let's build the project: ####

1) install bebel (for the ES6)

<pre>npm install babel-cli -g</pre>

2) locate at the project folder and install the needed dependencies

<pre>npm install</pre>

3) you can make some modifications in the config file (app/config/config.js)

port: 8081, //app port

mongodb: 'mongodb://localhost/explorer', //MongoDB uri

nisInitStartBlock: 0 //default 0

4) start the application

<pre>npm start</pre>

5) then visit http://127.0.0.1:8081, you should wait for the block loading when the first time run the application. 

