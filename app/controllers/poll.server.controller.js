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
					if(!options || !options.strings || !options.addresses)
						continue;
					poll.strings = JSON.stringify(options.strings);
					poll.addresses = options.addresses;
					poll.addresses.sort();
					poll.addresses = JSON.stringify(poll.addresses);
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
     * query answers
     */
	pollAnswers: (req, res, next) => {
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
				let whitelist = doc.whitelist;
				let multiple = doc.multiple;
				let type = doc.type;
				let doe = doc.doe;
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
					let result = [];
					let recordSet = new Set();
					let count = 0;
					for(let i in addresses){
						result[i] = [];
						let address = addresses[i];
						nis.accountTransferIncomingAndID(address, null, [], data => {
							let resultByAddress = [];
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
								if(multiple==0 && recordSet.has(sender)){
									continue;
								}
								if(multiple==1 && recordSet.has(""+i+"_"+sender)){
									continue;
								}
								if(type=="1" && !whitelistSet.has(sender)){ // white list
									continue;
								}
								if(multiple==1)
									recordSet.add(""+i+"_"+sender);
								else
									recordSet.add(sender);
								resultByAddress.push(sender);
							}
							result[i] = resultByAddress;
							count++;
							if(count==addresses.length){
								if(type=="0")
									handlePollAsPOI(res, expiredHeight, result);
								else if(type=="1")
									handlePollAsWhitelist(res, result);
								else
									res.json([]);
							}
						});
					}
				});
			});
		} catch (e) {
			console.error(e);
		}
	},
}

let flag = 0;

let handlePollAsPOI = (res, height, result) => {
	try {
		let r = [];
		let addresses = [];
		for(let i in result){
			for(let j in result[i]){
				addresses.push({'account':result[i][j]});
			}
		}
		let params = {};
		params.accounts = addresses;
		params.startHeight = height;
		params.endHeight = height;
		params.incrementBy = 1;
		params = JSON.stringify(params);
		// query all address importance
		nis.accountHistoricalBatch(params, height, height, data => {
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
			for(let i in result){
				r.push({votes:result[i].length, score: 0});
				for(let j in result[i]){
					let address = result[i][j];
					if(map.has(address))
						r[i].score += map.get(address);
				}
			}
			res.json(r);
		});
	} catch (e) {
		console.info(e);
	}
};

let handlePollAsWhitelist = (res, result) => {
	try {
		let r = [];
		let count = 0;
		for(let i in result)
			count += result[i].length;
		for(let i in result)
			r.push({votes:result[i].length, score: result[i].length});
		res.json(r);
	} catch (e) {
		console.error(e);
	}
};