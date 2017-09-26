import config from '../config/config';
import channels from './channels';
import SockJSClient from 'sockjs-client';
import Stomp from 'stompjs';
import nis from '../utils/nisRequest';
import clientWS from './clientWS';
import timeUtil from '../utils/timeUtil';
import mongoose from 'mongoose';
import address from '../utils/address';
import jsonUtil from '../utils/jsonUtil';

const WS_URL = 'http://' + config.nisHost + ':' + config.wsPort + config.wsPath;

/**
 * common subscribe
 */
let subscribe = (channel, callback) => {
	let NIS_SOCKET = new SockJSClient(WS_URL);
	let stompClient = Stomp.over(NIS_SOCKET);
	stompClient.connect({}, function(){
		stompClient.subscribe(channel, function(data){
			callback(data.body);
	    });
	});
};

/**
 * update transaction from websocket
 */
let transaction = (callback) => {
	subscribe(channels.blocks, data => {
		if(!data)
			return;
		let block = jsonUtil.parse(data);
		if(!block || !block.height || !block.signature)
			return;
		// save new transaction into DB
		callback(block.height-1, data => {
			// remove unconfirmed transaction from DB
			let params = JSON.stringify({"height": block.height});
			nis.blockAtPublic(params, data => {
				if(!data || !data.transactions)
					return;
				let transactions = data.transactions;
				let UnconfirmedTransaction = mongoose.model('UnconfirmedTransaction');
				for(let i in transactions){
					if(transactions[i].signature) {
						UnconfirmedTransaction.remove({signature: transactions[i].signature}, (err, doc) => {
							if(err || !doc)
								return;
							doc = jsonUtil.parse(doc);
							if(!doc.n || doc.n==0)
								return;
							// emit to client
							emit("remove", {signature: transactions[i].signature});
						});
					}
				}
				// emit to client
				if(transactions.length>0)
					clientWS.emitTransaction(1);
			});
			removeExpiredUnconfirmedTransactionFromDB();
		});
	});
};

/**
 * update unconfirmed transaction from websocket
 */
let unconfirmedTransaction = () => {
	subscribe(channels.unconfirmed, data => {
		if(!data)
			return;
		let unconfirmed = jsonUtil.parse(data);
		if(!unconfirmed || !unconfirmed.signature || !unconfirmed.type || !unconfirmed.signer)
			return;
		let signer = address.publicKeyToAddress(unconfirmed.signer);
		unconfirmed.sender = signer;
		let UnconfirmedTransaction = mongoose.model('UnconfirmedTransaction');
		if(unconfirmed.type==4100 && unconfirmed.otherTrans && unconfirmed.signatures){// initialize multisig transaction
			// update inner transaction hash
			nis.accountUnconfirmedTransactions(signer, data => {
				if(!data || !data.data)
					return;
				data = data.data;
				for(let i in data){
					let tx = data[i];
					if(tx.meta && tx.meta.data && tx.transaction && tx.transaction.signature==unconfirmed.signature){
						unconfirmed.otherHash = tx.meta.data;
						break;
					}
				}
				if(!unconfirmed.otherHash || !unconfirmed.otherTrans.signer)
					return;
				// update cosignatories infomation
				let otherTransSigner = address.publicKeyToAddress(unconfirmed.otherTrans.signer);
				unconfirmed.otherTrans.sender = otherTransSigner;
				nis.accountByAddress(otherTransSigner, data => {
					if(!data || !data.meta || !data.account)
						return;
					unconfirmed.minSigned = 0;
					if(data.account && data.account.multisigInfo && data.account.multisigInfo.minCosignatories)
						unconfirmed.minSigned = data.account.multisigInfo.minCosignatories;
					unconfirmed.signed = [signer];
					unconfirmed.signedDate = [unconfirmed.timeStamp];
					unconfirmed.unSigned = [];
					for(let i in data.meta.cosignatories){
						if(data.meta.cosignatories[i].address!=signer)
							unconfirmed.unSigned.push(data.meta.cosignatories[i].address);
					}
					// handle aggregate modification transaction
					if(unconfirmed.otherTrans.modifications){
						let modifications = unconfirmed.otherTrans.modifications;
						for(let i in modifications){
							if(!modifications[i].cosignatoryAccount)
								continue;
							unconfirmed.otherTrans.modifications[i].cosignatoryAccount = address.publicKeyToAddress(modifications[i].cosignatoryAccount);
						}
					}
					// save into DB
					let saveItem = {};
					saveItem.signature = unconfirmed.signature;
					saveItem.timeStamp = unconfirmed.timeStamp;
					saveItem.deadline = unconfirmed.deadline;
					saveItem.otherHash = unconfirmed.otherHash;
					saveItem.detail = JSON.stringify(unconfirmed);
					new UnconfirmedTransaction(saveItem).save(err => {
						if(err)
							return;
						emit("add", unconfirmed);
					});
				});
			});
		} else if(unconfirmed.type==4098 && unconfirmed.otherHash && unconfirmed.otherHash.data && unconfirmed.signer){// cosign multisig transaction
			UnconfirmedTransaction.find({otherHash: unconfirmed.otherHash.data}, (err, docs) => {
				if(err || !docs)
					return;
				let cosignDate = unconfirmed.timeStamp;
				for(let i in docs){
					let item = docs[i];
					let unconfirmed = jsonUtil.parse(item.detail);
					if(!unconfirmed)
						return;
					unconfirmed.signed.push(signer);
					unconfirmed.signedDate.push(cosignDate);
					let newUnSigned = [];
					for(let j in unconfirmed.unSigned)
						if(unconfirmed.unSigned[j]!=signer)
							newUnSigned.push(unconfirmed.unSigned[j]);
					unconfirmed.unSigned = newUnSigned;
					UnconfirmedTransaction.update({signature: item.signature}, {detail: JSON.stringify(unconfirmed)}, err => {});
					emit("update", unconfirmed);
				}
			});
		} else if(unconfirmed.type==4097) { //convert to be multisig account (aggregate modification transaction)
			if(unconfirmed.modifications){
				for(let i in unconfirmed.modifications){
					if(!unconfirmed.modifications[i].cosignatoryAccount)
						continue;
					unconfirmed.modifications[i].cosignatoryAccount = address.publicKeyToAddress(unconfirmed.modifications[i].cosignatoryAccount);
				}
			}
			// save into DB
			let saveItem = {};
			saveItem.signature = unconfirmed.signature;
			saveItem.timeStamp = unconfirmed.timeStamp;
			saveItem.deadline = unconfirmed.deadline;
			saveItem.detail = JSON.stringify(unconfirmed);
			new UnconfirmedTransaction(saveItem).save(err => { 
				emit("add", unconfirmed);
			});
		} else if(unconfirmed.type==2049) { //importance transaction
			unconfirmed.remoteAccount = address.publicKeyToAddress(unconfirmed.remoteAccount);
			// save into DB
			let saveItem = {};
			saveItem.signature = unconfirmed.signature;
			saveItem.timeStamp = unconfirmed.timeStamp;
			saveItem.deadline = unconfirmed.deadline;
			saveItem.detail = JSON.stringify(unconfirmed);
			new UnconfirmedTransaction(saveItem).save(err => { 
				emit("add", unconfirmed);
			});

		} else { // other unconfirmed transaction
			// save into DB
			let saveItem = {};
			saveItem.signature = unconfirmed.signature;
			saveItem.timeStamp = unconfirmed.timeStamp;
			saveItem.deadline = unconfirmed.deadline;
			saveItem.detail = JSON.stringify(unconfirmed);
			new UnconfirmedTransaction(saveItem).save(err => { 
				emit("add", unconfirmed);
			});
		}
		removeExpiredUnconfirmedTransactionFromDB();
	});
};

/**
 * remove expired unconfirmed transaction from DB
 */
let removeExpiredUnconfirmedTransactionFromDB = () => {
	// remove
	let nowTime = timeUtil.getTimeInNem();
	let UnconfirmedTransaction = mongoose.model('UnconfirmedTransaction');
	UnconfirmedTransaction.remove({deadline: {$lt: nowTime}}, (err, doc) => {
		if(err || !doc)
			return;
		doc = jsonUtil.parse(doc);
		if(!doc.n || doc.n==0)
			return;
		// emit to client
		emit("expired", null);
	});
};

let cleanHistoryUnconfirmedWhenInit = () => {
	let UnconfirmedTransaction = mongoose.model('UnconfirmedTransaction');
	UnconfirmedTransaction.find({}, (err, docs) => {
		if(err || !docs)
			return;
		for(let i in docs){
			let item = docs[i];
			if(!item.detail)
				return;
			let detail = jsonUtil.parse(item.detail);
			if(!detail.sender || !item.signature || !item.timeStamp)
				return;
			nis.checkUncomfirmedTransactionStatus(detail.sender, null, item.timeStamp, item.signature, (flag) => {
				if(!flag)
					return;
				UnconfirmedTransaction.remove({signature: item.signature}, (err, doc) => { });
			});
		}
	});
};

let emit = (action, item) => {
	let o = {};
	o.action = action;
	if(item)
		o.content = item;
	clientWS.emitUnconfirmedTransaction(o);
}; 

module.exports = {
	subscribe,
	transaction,
	unconfirmedTransaction,
	cleanHistoryUnconfirmedWhenInit
};
