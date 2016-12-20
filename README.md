## NEM Blockchain Explorer (Node.js) ##

The project is a blockchian explorer project which is built on NEM (https://www.nem.io). 

### What components are required ###

AngularJS, Bootstrap, MongoDB, Node.js

### How to deploy the project ###

#### The following must be done before you build the project: ####

1) install the Node.js on your machine.

2) NIS is started and blocks loading is finished.

3) MongoDB is started.

4) install the GIT (bower will use GIT)

#### Let's build the project: ####

1) install bebel (for the ES6)

<pre>npm install babel-cli -g</pre>

2) install bower

<pre>npm install bower -g</pre>

3) locate at the project folder and install the needed dependencies

<pre>npm install</pre>

4) install AngularJS and Bootstrap

<pre>bower install</pre>

5) you can make some modifications in the config file (app/config/config.js)

port: 7101, //app port

mongodb: 'mongodb://localhost/explorer', //MongoDB uri

nisInitStartBlock: 0 //default 0

6) start the application

<pre>npm start</pre>
