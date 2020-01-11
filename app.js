import express from './app/config/express';
import express_dev from './app/config/express_dev';
import mongodb from './app/config/mongoose';
import config from './app/config/config';

let db = mongodb();
let app = null;
// switch mode (product or development)
if(config.mode==0)
	app = express();
else
	app = express_dev();