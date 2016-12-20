import express from 'express';
import bodyParser from 'body-parser';
import initData from '../utils/initData';
import supernode from '../utils/supernode'

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
	require('../routes/namespace.server.route')(app);
	require('../routes/supernode.server.route')(app);

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

	//init data
	initData.init();
	//schedule fetch data
	supernode.scheduleFetchSupernode();

	return app;
};