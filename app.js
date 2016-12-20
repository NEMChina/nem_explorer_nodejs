import express from './app/config/express';
import mongodb from './app/config/mongoose';
import config from './app/config/config';

var db = mongodb();
var app = express();

app.listen(config.port, function(){
	console.log('app started, listening on port:', config.port);
});
