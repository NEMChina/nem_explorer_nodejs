import mongoose from 'mongoose';
import config from './config';

module.exports = () => {
	let db;
	if(config.network==98)
		db = mongoose.connect(config.mongodb + '_testnet');
	else
		db = mongoose.connect(config.mongodb);
	//include the model files
	require('../models/account.server.model');
	require('../models/namespace.server.model');
	require('../models/supernodePayout.server.model');
	require('../models/transaction.server.model');
	require('../models/supernode.server.model');
	require('../models/accountRemark.server.model');
	require('../models/unconfirmedTransaction.server.model');
	require('../models/poll.server.model');
	require('../models/block.server.model');
	require('../models/mosaicTransaction.server.model');
	require('../models/mosaic.server.model');
	return db;
}