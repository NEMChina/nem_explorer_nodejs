import mongoose from 'mongoose';
import nis from '../utils/nisRequest';
import addressUtil from '../utils/address';
import messageUtil from '../utils/message';
import jsonUtil from '../utils/jsonUtil';
import timeUtil from '../utils/timeUtil';
import { BroadcastedPoll, NEMVoting } from "nem-voting";
import { NEMLibrary, Address, NetworkTypes } from "nem-library";

const LISTSIZE = 100 //pageSize

module.exports = {

	/**
     * get poll list
     */
	pollList: (req, res, next) => {
		try {
			let page = 1;
			if(req.body.page)
				page = parseInt(req.body.page);
			let PollIndex = mongoose.model('PollIndex');
			PollIndex.find().sort({_id: -1}).skip(LISTSIZE*(page-1)).limit(LISTSIZE).exec((err, doc) => {
				if(err) {
					console.info(err);
					return res.json([]);
				}
				let r_pollArray = [];
				let r_poll = null;	
				doc.forEach(item => {
					r_poll = {};
					r_poll.id = item._id;
					r_poll.address = item.address;
					r_poll.title = item.title;
					r_poll.type = item.type;
					r_poll.doe = item.doe;
					r_poll.creator = item.creator;
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
			let PollIndex = mongoose.model('PollIndex');
			let sid = mongoose.Types.ObjectId(id);
			PollIndex.findOne({_id: sid}).exec((err, doc) => {
				if(err) {
					res.json({});
					return;
				}
				const pollAddress = new Address(doc.address);
				BroadcastedPoll.fromAddress(pollAddress)
				    .map((poll) => {
				        return poll;
				    })
				    .subscribe((data) => {
				    	if(!data){
				    		res.json({});
				    		return;
				    	}
				    	let poll = {};
				    	data = data.data;
				    	poll._id = doc._id;
				    	poll.title = data.formData.title;
				    	poll.type = data.formData.type;
				    	poll.doe = data.formData.doe;
				    	poll.creator = doc.creator;
				    	poll.address = doc.address;
				    	poll.description = data.description;
				    	poll.strings = data.options;
				    	poll.creator = doc.creator;
				    	if(data.whitelist){
				    		let whitelistArr = [];
				    		for(let i in data.whitelist)
				    			whitelistArr.push(data.whitelist[i].value);
				    		poll.whitelist = whitelistArr
				    	}
				    	if(data.formData.multiple==true)
				    		poll.multiple = 1;
				    	else
				    		poll.multiple = 0;
				    	res.json(poll);
				    });
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
			let PollIndex = mongoose.model('PollIndex');
			let sid = mongoose.Types.ObjectId(id);
			PollIndex.findOne({_id: sid}).exec((err, doc) => {
				if(err) {
					res.json([]);
					return;
				}
				const pollAddress = new Address(doc.address);
				BroadcastedPoll.fromAddress(pollAddress)
				    .switchMap((poll) => {
				        return poll.getResults();
				    })
				    .subscribe((results) => {
				    	res.json(results);
				    });
			});
		} catch (e) {
			console.error(e);
		}
	},

	/**
     * return the poi poll voters 
     */
	pollResultVoters: (req, res, next) => {
		try {
			let address = req.body.address;
			let strings = req.body.strings;
			if(!address || !strings){
				res.json([]);
				return;
			}
			let labels = strings;
			let indexMap = new Map();
			for(let i in labels)
				indexMap.set(labels[i], i);
			const pollAddress = new Address(address);
			BroadcastedPoll.fromAddress(pollAddress)
			    .switchMap((poll) => {
			        return poll.getVoters();
			    })
			    .subscribe((voters) => {
			    	let voterArr = [];
			    	// init arrary
			    	for(let i in labels)
						voterArr[i] = [];
					// push voters into arrary
			    	for(let i in voters){
			    		let vote = voters[i];
			    		if(!indexMap.has(vote.option))
			    			continue;
			    		let index = indexMap.get(vote.option);
			    		let length = voterArr[index].length;
			    		voterArr[index][length] = {};
			    		voterArr[index][length].addr = vote.address;
			    		voterArr[index][length].poi = vote.importance;
			    		voterArr[index][length].block = vote.block;
			    		voterArr[index][length].fmtPOI = (vote.importance*100).toFixed(5)+"%";
			    	}
			    	res.json(voterArr);
			    });
		} catch (e) {
			console.error(e);
		}
	}
}

