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
			console.info('111111111111111111111111111111111111111111111');
			console.info('111111111111111111111111111111111111111111111');
			console.info('111111111111111111111111111111111111111111111');
			console.info(poll.multiple);
			console.info(poll.strings);
			console.info(poll.addresses);
			console.info('111111111111111111111111111111111111111111111');
			console.info('111111111111111111111111111111111111111111111');
			console.info('111111111111111111111111111111111111111111111');
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
						if(tx.otherTrans && tx.otherTrans.signer){
							sender = addressUtil.publicKeyToAddress(tx.otherTrans.signer);
						} else {
							sender = addressUtil.publicKeyToAddress(tx.signer);
						}
						if(multiple==0 && allVoteAddressChechSet.has(sender)){
							continue;
						}
						if(multiple==1 && allVoteAddressChechSet.has(""+i+"_"+sender)){
							continue;
						}
						if(multiple==1)
							allVoteAddressChechSet.add(""+i+"_"+sender);
						else
							allVoteAddressChechSet.add(sender);
						let voteItem = {};
						voteItem.addr = sender;
						voteItem.poi = 0;
						voteItem.time = tx.timeStamp;
						voteItemArr.push(voteItem);
					}
					voteArr[i] = voteItemArr;
					count++;
					if(count==optionAddresses.length){
						let r = [];
						let voteAddresses = [];
						for(let i in voteArr){
							for(let j in voteArr[i]){
								voteAddresses.push({'account':voteArr[i][j].addr});
							}
						}
						let params = {};
						params.accounts = voteAddresses;
						params.startHeight = expiredHeight;
						params.endHeight = expiredHeight;
						params.incrementBy = 1;
						params = JSON.stringify(params);
						// query all address importance by batch
						nis.accountHistoricalBatch(params, expiredHeight, expiredHeight, data => {
							if(!data || !data.data){
								res.json(r);
								return;
							}
							let map = new Map();
							for(let i in data.data){
								if(!data.data[i] || !data.data[i].data|| !data.data[i].data.length>0)
									continue;
								let item = data.data[i].data[0];
								if(item && item.address && item.importance)
									map.set(item.address, item.importance);
							}
							for(let i in voteArr){
								for(let j in voteArr[i]){
									if(map.has(voteArr[i][j].addr))
										voteArr[i][j].poi = map.get(voteArr[i][j].addr);
								}
							}
							res.json(voteArr);
						});
					}
				});
			}
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