import http from 'http';
import express from 'express';
import bodyParser from 'body-parser';
import config from './config';
import initData from '../utils/initData';
import pollIndexSchedule from '../schedule/pollIndexSchedule';
import supernodeSchedule from '../schedule/supernodeSchedule';
import nodeScheduleSchedule from '../schedule/nodeSchedule';
import coinmarketcapSchedule from '../schedule/coinmarketcapSchedule';
import clientWS from '../websocket/clientWS';
import { NEMLibrary, NetworkTypes } from "nem-library";

module.exports = () => {
	console.log('init express...');
	let app = express();
	app.use(bodyParser.json());
	app.use(express.static('./public'))
	//include the route
	require('../routes/block.server.route')(app);
	require('../routes/tx.server.route')(app);
	require('../routes/account.server.route')(app);
	require('../routes/node.server.route')(app);
	require('../routes/mosaic.server.route')(app);
	require('../routes/namespace.server.route')(app);
	require('../routes/supernode.server.route')(app);
	require('../routes/market.server.route')(app);
	require('../routes/sys.server.route')(app);
	require('../routes/poll.server.route')(app);

	app.get('/', (req, res) => {
		res.redirect('/blocklist.html');
	});

	app.use((req, res, next) => {
		res.status(404);
		try {
			return res.json('Not Found');
		} catch (e) {
			console.error('404 set header after sent');
		}
	});
	app.use((err, req, res, next) => {
		if(err) {
			return next();
		}
		res.status(500);
		try {
			return res.json(err.message || 'server error');
		} catch (e) {
			console.error('500 set header after sent');
		}
	});

	let server = http.createServer(app);
	// init NEMLibrary 
	if(config.network==68)
		NEMLibrary.bootstrap(NetworkTypes.MAIN_NET);
	else
		NEMLibrary.bootstrap(NetworkTypes.TEST_NET);
	// init data
	initData.init();
	// schedule fetch data
	supernodeSchedule.scheduleFetchSupernode();
	// schedule fetch node
	nodeScheduleSchedule.scheduleFetchNode();
	// schedule fetch price from coinmarketcap
	coinmarketcapSchedule.scheduleFetchPrice();
	// schedule fetch poll index
	pollIndexSchedule.schedulePollIndex();

	// websocket
	clientWS.initUnconfirmedTransactionWS(server);
	clientWS.initTransactionWS(server);
	clientWS.initBlockWS(server);
	clientWS.initMosaicWS(server);
	
	process.on('uncaughtException', function(e) {
	　　console.log(e);
	});
	
	server.listen(config.port, function(){
		console.log('app started, listening on port:', config.port);
	});

	return app;
};