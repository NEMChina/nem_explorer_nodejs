import mongoose from 'mongoose';
import nis from '../utils/nisRequest';
import addressUtil from '../utils/address';
import messageUtil from '../utils/message';
import jsonUtil from '../utils/jsonUtil';
import timeUtil from '../utils/timeUtil';

module.exports = {

	/**
     * collection poll info and save into DB
     */
	savePoll: (creator, timeStamp, message) => {
		if(message.indexOf("poll:{")!=0)
			return;
		message = message.replace("poll:", "");
		let poll = jsonUtil.parse(message);
		let reg = /^[0-9]$/;
		if(!poll || !poll.title || !poll.doe || !poll.address || !reg.test(poll.type))
			return;
		nis.accountTransferRecord(poll.address, data => {
			if(!data.data)
				return;
			data = data.data;
			for(let i in data){
				if(!data[i].transaction)
					continue;
				let tx = data[i].transaction;
				if(!tx.type || tx.type!=257)
					continue;
				if(!tx.signer || !tx.recipient)
					continue;
				if(!tx.message || !tx.message.type || tx.message.type!=1)
					continue;
				let sender = addressUtil.publicKeyToAddress(tx.signer);
				if(sender!=creator || tx.recipient!=poll.address)
					continue;
				let m = messageUtil.hexToUtf8(tx.message.payload);
				if(m.indexOf("description:")==0){
					poll.description = m.replace("description:", "");
				} else if(m.indexOf("formData:{")==0){
					m = m.replace("formData:", "");
					let formData = jsonUtil.parse(m);
					if(!formData)
						continue;
					if(formData.multiple==false)
						poll.multiple = 0;
					if(formData.multiple==true)
						poll.multiple = 1;
				} else if(m.indexOf("options:{")==0){
					m = m.replace("options:", "");
					let options = jsonUtil.parse(m);
					if(!options || !options.strings)
						continue;
					if(options.addresses){ // version 1
						poll.strings = JSON.stringify(options.strings);
						poll.addresses = options.addresses;
						poll.addresses.sort();
						poll.addresses = JSON.stringify(poll.addresses);
					} else if(options.link){ // version 2
						poll.addresses = options.strings.map(optionStr => {
							return options.link[optionStr];
						});
						poll.strings = JSON.stringify(options.strings);
						poll.addresses = JSON.stringify(poll.addresses);
					}
				} else if(m.indexOf("whitelist:[")==0 && poll.type==1){
					m = m.replace("whitelist:", "");
					let whitelist = jsonUtil.parse(m);
					if(!whitelist)
						continue;
					poll.whitelist = JSON.stringify(whitelist);
				}
			}
			if(!reg.test(poll.multiple) || !poll.strings || !poll.addresses)
				return;
			// save poll
			poll.creator = creator;
			poll.timeStamp = timeStamp;
			let Poll = mongoose.model('Poll');
			new Poll(poll).save((err) => {
				if(err) 
					console.error('<error> saving poll [' + creator + ']');
			});
		});
	},

	/**
     * get poll list
     */
	pollList: (req, res, next) => {
		try {
			let page = 1;
			if(req.body.page)
				page = parseInt(req.body.page);
			let Poll = mongoose.model('Poll');
			Poll.find().sort({timeStamp: -1}).exec((err, doc) => {
				if(err) {
					console.info(err);
					return res.json([]);
				}
				let r_pollArray = [];
				let r_poll = null;	
				doc.forEach(item => {
					r_poll = {};
					r_poll.id = item._id;
					r_poll.timeStamp = item.timeStamp;
					r_poll.creator = item.creator;
					r_poll.address = item.address;
					r_poll.title = item.title;
					r_poll.description = item.description;
					r_poll.type = item.type;
					r_poll.multiple = item.multiple;
					r_poll.doe = item.doe;
					r_poll.strings = item.strings;
					r_poll.addresses = item.addresses;
					r_poll.whitelist = item.whitelist;
					r_pollArray.push(r_poll);
				});
				res.json(r_pollArray);
			});
		} catch (e) {
			console.error(e);
		}
	},

	/**
     * get poll detail from poll id
     */
	poll: (req, res, next) => {
		try {
			let id = req.body.id;
			if(!id){
				res.json([]);
				return;
			}
			let Poll = mongoose.model('Poll');
			let sid = mongoose.Types.ObjectId(id);
			Poll.findOne({_id: sid}).exec((err, doc) => {
				if(err) {
					res.json({});
					return;
				}
				res.json(doc);
			});
		} catch (e) {
			console.error(e);
		}
	},

	/**
     * query result
     */
	pollResult: (req, res, next) => {
		try {
			let id = req.body.id;
			if(!id){
				res.json([]);
				return;
			}
			let Poll = mongoose.model('Poll');
			let sid = mongoose.Types.ObjectId(id); 
			Poll.findOne({_id: sid}).exec((err, doc) => {
				if(err) {
					res.json([]);
					return;
				}
				let addresses = doc.addresses;
				let type = doc.type;
				if(!addresses && !type){
					res.json([]);
					return;
				}
				// validate type
				let reg = /^[0-9]$/;
				if(!reg.test(type)){
					res.json([]);
					return;
				}
				// validate addresses
				addresses = jsonUtil.parse(addresses);
				if(!addresses){
					res.json([]);
					return;
				}
				if(type=="0")
					pollResultWithPOI(res, doc);
				else if(type=="1")
					pollResultWithWhitelist(res, doc);
				else
					res.json([]);
			});
		} catch (e) {
			console.error(e);
		}
	}
}

/**
 * get all vote transactions
 */
let getAllVoteTransactions = (optionAddresses, callback) => {
	try {
		let count = 0;
		let allVoteTransactions = {};
		optionAddresses.forEach(optionAddress => {
			nis.accountTransferIncomingAndID(optionAddress, null, [], data => {
				let voteTransactions = [];
				if(data){
					data.forEach(item => {
						if(item && item.transaction && item.meta)
							voteTransactions.push(item);
					});
				}
				count++;
				allVoteTransactions[optionAddress] = voteTransactions;
				if(count==optionAddresses.length)
					callback(allVoteTransactions);
			});
		});
	} catch (e) {
		console.error(e);
	}
};

/**
 * query account history info
 */
let queryAccountHistory = (allVote, doc, callback) => {
	let poiResultMap = new Map();
	let nowTime = new Date().getTime();
	// collect all accounts
	let paramAddressArr = [];
	allVote.forEach(itemArr => {
		itemArr.forEach(item => {
			paramAddressArr.push({'account':item.addr});
		});
	});
	if(nowTime>=doc){ //expired (history)
		// query all address importance by batch
		let params = {};
		params.accounts = paramAddressArr;
		params.startHeight = expiredHeight;
		params.endHeight = expiredHeight;
		params = JSON.stringify(params);
		nis.accountHistoricalBatch(params, expiredHeight, expiredHeight, data => {
			if(!data || !data.data){
				callback(poiResultMap);
				return;
			}
			data.data.forEach(item => {
				if(!item || !item.data|| !item.data.length>0 || !item.data[0])
					return;
				if(!item.data[0].address || !item.data[0].importance)
					return;
				poiResultMap.set(item.data[0].address, item.data[0].importance);
			});
			callback(poiResultMap);
		});
	} else { // not expired
		let params = {};
		params.data = paramAddressArr;
		params = JSON.stringify(params);
		nis.accountByAddressBatch(params, data => {
			if(!data || !data.data){
				callback(poiResultMap);
				return;
			}
			data.data.forEach(item => {
				if(!item || !item.account|| !item.account.importance)
					return;
				poiResultMap.set(item.account.address, item.account.importance);
			});
			callback(poiResultMap);
		});
	}
};

/**
 * handle the poi poll
 */
let pollResultWithPOI = (res, doc) => {
	try {
		let optionAddresses = doc.addresses;
		let multiple = doc.multiple;
		let type = doc.type;
		let doe = doc.doe;
		// query the expired block height (if the poll is ended)
		let Block = mongoose.model('Block');
		let expiredTime = timeUtil.convertToNemTime(doe);
		Block.findOne({timeStamp: {$lte: expiredTime}}).sort({height: -1}).exec((err, block) => {
			if(err || !block || !block.height){
				res.json([]);
				return;
			}
			optionAddresses = jsonUtil.parse(optionAddresses);
			let expiredHeight = block.height;
			// get all voted txs
			getAllVoteTransactions(optionAddresses, allVoteTXs => {
				// validate tx
				let allVote = [];
				let allVoteAddrMap = new Map();
				optionAddresses.forEach((oa, index) => {
					let voteAddrSet = new Set();
					allVote[index] = [];
					allVoteTXs[oa].forEach(voteTX => {
						let tx = voteTX.transaction;
						// check expired block
						if(voteTX.meta.height>expiredHeight)
							return;
						// check amount
						if(tx.amount && tx.amount!=0)
							return;
						// check timeStamp
						if(timeUtil.getTimeInReal(tx.timeStamp)>doe)
							return;
						let sender = "";
						// check multisig transaction
						if(tx.otherTrans && tx.otherTrans.type==257 && tx.otherTrans.amount==0)
							sender = addressUtil.publicKeyToAddress(tx.otherTrans.signer);
						else if (tx.type==257)
							sender = addressUtil.publicKeyToAddress(tx.signer);
						else
							return;
						// only allow 1 vote every option
						if(voteAddrSet.has(sender))
							return;
						else
							voteAddrSet.add(sender);
						// multiple vote
						if(multiple==0){
							if(allVoteAddrMap.has(sender))
								allVoteAddrMap.set(sender, allVoteAddrMap.get(sender)+1);
							else
								allVoteAddrMap.set(sender, 1);
						}
						let voteItem = {};
						voteItem.addr = sender;
						voteItem.poi = 0;
						voteItem.time = tx.timeStamp;
						allVote[index].push(voteItem);
					});
				});
				// only allow 1 vote all the options (not multiple)
				if(multiple==0) {
					allVote.forEach((itemArr, index) => {
						allVote[index] = itemArr.filter(item => {
							return allVoteAddrMap.get(item.addr)==1;
						});
					});
				}
				// query all address importance by batch
				queryAccountHistory(allVote, doe, poiResultMap => {
					// set poi
					allVote.forEach((itemArr, i) => {
						itemArr.forEach((item, j) => {
							if(poiResultMap.get(allVote[i][j].addr))
								allVote[i][j].poi = poiResultMap.get(allVote[i][j].addr);
						});
					});
					res.json(allVote);
				});
			});
		});
	} catch (e) {
		console.error(e);
	}
};

/**
 * handle the white list poll
 */
let pollResultWithWhitelist = (res, doc) => {
	try {
		let optionAddresses = doc.addresses;
		let whitelist = doc.whitelist;
		let multiple = doc.multiple;
		let type = doc.type;
		let doe = doc.doe;
		// collect white list
		let whitelistSet = new Set();
		if(type=="1"){
			// validate whitelist
			whitelist = jsonUtil.parse(whitelist);
			if(!whitelist){
				res.json([]);
				return;
			}
			for(let i in whitelist)
				whitelistSet.add(whitelist[i]);
		}
		// query the expired block height (if the poll is ended)
		let Block = mongoose.model('Block');
		let expiredTime = timeUtil.convertToNemTime(doe);
		Block.findOne({timeStamp: {$lte: expiredTime}}).sort({height: -1}).exec((err, block) => {
			if(err || !block || !block.height){
				res.json([]);
				return;
			}
			let expiredHeight = block.height;
			let allVoteAddressChechSet = new Set();
			let voteArr = [];
			let count = 0;
			optionAddresses = jsonUtil.parse(optionAddresses);
			for(let i in optionAddresses){
				let voteItemArr = [];
				let optionAddress = optionAddresses[i];
				nis.accountTransferIncomingAndID(optionAddress, null, [], data => {
					if(!data)
						return;
					for(let i in data){
						if(!data[i].transaction){
							continue;
						}
						let meta = data[i].meta;
						let tx = data[i].transaction;
						// check expired block
						if(meta.height>expiredHeight)
							continue;
						// check amount
						if(tx.amount && tx.amount!=0)
							continue;
						// check timeStamp
						if(timeUtil.getTimeInReal(tx.timeStamp)>doe)
							continue;
						let sender = "";
						if(tx.otherTrans && tx.otherTrans.signer)
							sender = addressUtil.publicKeyToAddress(tx.otherTrans.signer);
						else 
							sender = addressUtil.publicKeyToAddress(tx.signer);
						if(multiple==0 && allVoteAddressChechSet.has(sender))
							continue;
						if(multiple==1 && allVoteAddressChechSet.has(""+i+"_"+sender))
							continue;
						if(!whitelistSet.has(sender)) // white list
							continue;
						if(multiple==1)
							allVoteAddressChechSet.add(""+i+"_"+sender);
						else
							allVoteAddressChechSet.add(sender);
						let voteItem = {};
						voteItem.addr = sender;
						voteItem.time = tx.timeStamp;
						voteItemArr.push(voteItem);
					}
					voteArr[i] = voteItemArr;
					count++;
					if(count==optionAddresses.length)
						res.json(voteArr);
				});
			}
		});
	} catch (e) {
		console.error(e);
	}
};