import mongoose from 'mongoose';

/**
 * query one account info from DB
 */
let findOneAccount = (address, callback) => {
	let Account = mongoose.model('Account');
	Account.findOne({address: address}, (err, doc) => {
		if(err || !doc)
			callback(null);
		else
			callback(doc);
	});
};

/**
 * save account into DB
 */
let saveAccount = (account) => {
	let Account = mongoose.model('Account');
	new Account(account).save((err, doc) => {
		if(err)
			log('<error> Block [' + account.height + '] save ['+account.address+']: ' + err);
		else
			log('<success> Block [' + account.height + '] save ['+account.address+']');
	});
};

/**
 * update account info
 */
let updateAccount = (account) => {
	let Account = mongoose.model('Account');
	Account.update({address: account.address}, account, (err, doc) => {
		if(err)
			log('<error> Block [' + account.height + '] update ['+account.address+']: ' + err);
		else
			log('<success> Block [' + account.height + '] update ['+account.address+']');
	});
};

/**
 * query one account remark info from DB
 */
let findOneAccountRemark = (account, callback) => {
	let AccountRemark = mongoose.model('AccountRemark');
	AccountRemark.findOne({address: account.address}).exec((err, doc) => {
		if(err || !doc)
			callback(null);
		else
			callback(doc);
	});
};

/**
 * save or update account into DB
 */
let saveOrUpdateAccount = (account, callback) => {
	let Account = mongoose.model('Account');
	Account.update({address: account.address}, account, {upsert : true}, err => {
		if(err)
			log('<error> Block [' + account.height + '] save ['+account.address+']: ' + err);
		else
			log('<success> Block [' + account.height + '] save ['+account.address+']');
		callback();
	});
};

let log = (message) => {
	console.info(message);
};

module.exports = {
	findOneAccount,
	saveAccount,
	updateAccount,
	findOneAccountRemark,
	saveOrUpdateAccount
}