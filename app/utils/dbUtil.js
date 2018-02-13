import mongoose from 'mongoose';

// init mongodb models
const Block = mongoose.model('Block');
const Account = mongoose.model('Account');
const Namespace = mongoose.model('Namespace');
const Transaction = mongoose.model('Transaction');
const AccountRemark = mongoose.model('AccountRemark');
const SupernodePayout = mongoose.model('SupernodePayout');
const MosaicTransaction = mongoose.model('MosaicTransaction');

/**
 * save block into DB
 */
let saveBlock = () => {
	let nowTime = new Date().getTime();
	new Block(saveBlock).save(err => {
		if(err)
			log('<error> Block [' + saveBlock.height + '] save block : ' + err);
	});
}

/**
 * save transaction into DB
 */
let saveTransaction = (saveTx, index) => {
	//insert the transaction into DB
	new Transaction(saveTx).save(err => {
		if(err)
			log('<error> Block ['+saveTx.height+'] save TX [' + index + '] : ' + err);
		else
			log('<success> Block ['+saveTx.height+'] save TX [' + index + ']');
	});
}

/**
 * save transaction into DB by batch (Nemesis Block)
 */
let saveTransactionByBatchNemesis = (saveTxArr) => {
	Transaction.insertMany(saveTxArr, err => {
		if(err)
			log('<error> Block [1] create TXs all [' + saveTxArr.length + '] : ' + err);
		else
			log('<success> Block [1] create TXs all [' + saveTxArr.length + ']');
	});
}

/**
 * query max block height from DB
 */
let findOneTransactionSortHeight = (callback) => {
	Transaction.findOne().sort('-height').exec((err, doc) => {
		if(err || !doc){
			callback(null);
			return log('<error> query max height from DB: ' + err);
		} else {
			callback(doc);
		}
	});
}

/**
 * query one account info from DB
 */
let findOneAccount = (address, callback) => {
	Account.findOne({address: address}, (err, doc) => {
		if(err || !doc)
			return callback(null);
		else
			return callback(doc);
	});
}

/**
 * save account into DB
 */
let saveAccount = (account) => {
	new Account(account).save((err, doc) => {
		if(err)
			log('<error> Block [' + account.height + '] save ['+account.address+']: ' + err);
		else
			log('<success> Block [' + account.height + '] save ['+account.address+']');
	});
}

/**
 * update account info
 */
let updateAccount = (account) => {
	Account.update({address: account.address}, account, (err, doc) => {
		if(err)
			log('<error> Block [' + account.height + '] update ['+account.address+']: ' + err);
		else
			log('<success> Block [' + account.height + '] update ['+account.address+']');
	});
}

/**
 * query one account remark info from DB
 */
let findOneAccountRemark = (account, callback) => {
	AccountRemark.findOne({address: account.address}).exec((err, doc) => {
		if(err || !doc)
			return callback(null);
		else
			return callback(doc);
	});
}

/**
 * save mosaic transaction into DB by batch
 */
let saveMosaicTransactionByBatch = (mosaicTxArr, height) => {
	MosaicTransaction.insertMany(mosaicTxArr, err => {
		if(err)
			log('<error> Block [' + height + '] found TX(M) count [' + mosaicTxArr.length + '] : ' + err);
		else
			log('<success> Block [' + height + '] found TX(M) count [' + mosaicTxArr.length + ']');
	});
}

/**
 * query one namespace info from DB
 */
let findOneNamespace = (namespace, callback) => {
	Namespace.findOne({namespace: namespace.namespace}).exec((err, doc) => {
		if(err || !doc)
			return callback(null);
		else 
			return callback(doc);
	});
}

/**
 * query one namespace info by Name from DB
 */
let findOneNamespaceByName = (name, callback) => {
	Namespace.findOne({namespace: name}).exec((err, doc) => {
		if(err || !doc)
			return callback(null);
		else 
			return callback(doc);
	});
}

/**
 * save namespace into DB
 */
let saveNamespace = (namespace) => {
	new Namespace(namespace).save(err => {
		if(err)
			log('<error> Block [' + namespace.height + '] save NS [' + namespace.namespace + '] : ' + err);
		else
			log('<success> Block [' + namespace.height + '] save NS [' + namespace.namespace + ']');
	});
}

/**
 * update namespace expired field
 */
let updateNamespaceExpiredTime = (namespace, expiredTime) => {
	Namespace.update({namespace: namespace.namespace}, {expiredTime: expiredTime}, (err, doc) => {
		if(err) 
			log('<error> Block [' + namespace.height + '] renew NS ['+namespace.namespace+'] : ' + err);
	});
}

/**
 * update namespace mosaics field
 */
let updateNamespaceMosaics = (namespace, expiredTime) => {
	Namespace.update({name: namespace}, {$inc: {mosaics: 1}}, (err, doc) => {
		if(err) 
			log('<error> Block [' + saveTx.height + '] update NS ['+namespace+'] mosaic : ' + err);
	});
}

/**
 * update parent namespace (update the 'subNamespaces' field)
 */
let updateParentNamespace = (namespace, parent) => {
	findOneNamespaceByName(parent, doc => {
		if(!doc)
			return;
		let subNamespaces = doc.subNamespaces + namespace.namespace + ";";
		Namespace.update({namespace: namespace.namespace}, {subNamespaces: subNamespaces}, (err, doc) => {
			if(err) 
				log('<error> Block [' + namespace.height + '] renew NS ['+namespace.namespace+'] : ' + err);
		});
	});
}

/**
 * save supernode payout into DB
 */
let saveSupernodePayout = (payout) => {
	new SupernodePayout(payout).save(err => { });
}



module.exports = {
	saveBlock,
	saveTransaction,
	saveTransactionByBatch,
	findOneTransactionSortHeight,
	findOneAccount,
	saveAccount,
	updateAccount,
	findOneAccountRemark,
	saveMosaicTransactionByBatch,
	findOneNamespace,
	findOneNamespaceByName,
	saveNamespace,
	updateNamespaceExpiredTime,
	updateNamespaceMosaics,
	updateParentNamespace,
	saveSupernodePayout
}