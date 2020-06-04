import config from '../config/config';
import pollDB from '../db/pollDB';
import schedule from 'node-schedule';
import { BroadcastedPoll, PollIndex, PollConstants } from "nem-voting";
import { NEMLibrary, Address, NetworkTypes, AccountHttp } from "nem-library";

var domain = require('domain')

const pollPoolAddress = new Address(config.pollAccount);
var lastId = undefined //the pollindeAll use
var lastIdNow = 0 //the lastest lastId , pollindex use

let schedulePollIndex = () => {
	var d = domain.create()
	d.on('error',err => {
		d.run(pollIndexAll)
	})

	d.run(pollIndexAll)
	
	let rule = new schedule.RecurrenceRule();
	// rule.minute = [1, 6, 11, 16, 21, 26, 31, 36, 41, 46, 51, 56]; //fetch pollIndex every 5 mins
	rule.second = [1];//fetch pollIndex every 1 mins
	schedule.scheduleJob(rule, () => {
		pollIndex();
	});

}

/**
 * fetch poll index from blockchain
 */
let pollIndex = () => {
	PollIndex.fromAddress(pollPoolAddress)
	    .subscribe((results) => {
	    	if(!results && !results.headers)
				return;
			var lastId = Number(results.lastId)
			if(lastIdNow == lastId) return
			//update the lastIdNow
			lastIdNow = lastId
			let headers = [];
			let headerAddSet = new Set();
			for(let i in results.headers){
				if(headerAddSet.has(results.headers[i].address.value))
						continue;
				headerAddSet.add(results.headers[i].address.value)
				headers.push(results.headers[i]);
			}
	    	pollDB.findAllPollAddress(docs => {
	    		let savePollIndexArr = [];
	    		let addressSet = new Set();
	    		for(let i in docs)
	    			addressSet.add(docs[i].address);
	    		for(let i in headers){
					let header = headers[i]
	    			if(addressSet.has(header.address.value))
	    				continue;
	    			let savePollIndex = {};
	    			savePollIndex.creator = header.creator.value;
	    			savePollIndex.address = header.address.value;
	    			savePollIndex.title = header.title;
	    			savePollIndex.type = header.type;
	    			savePollIndex.doe = header.doe;
	    			savePollIndexArr.push(savePollIndex);
	    		}
	    		if(savePollIndexArr.length==0)
	    			return;
	    		savePollIndexArr.reverse();
	    		// save poll index into DB
	    		pollDB.savePollIndexArray(savePollIndexArr, err => { });
	    	});
	    });
}

/**
 * fetch all poll index from blockchain
 */
function pollIndexAll() {
			PollIndex.fromAddress(pollPoolAddress,lastId)
			.subscribe((results) => {
				if(!results && !results.headers){
					return;
				}
				lastId = Number(results.lastId)
				let headers = [];
				let headerAddSet = new Set();
				for(let i in results.headers){
					if(headerAddSet.has(results.headers[i].address.value))
							continue;
					headerAddSet.add(results.headers[i].address.value)
					headers.push(results.headers[i]);
				}
				pollDB.findAllPollAddress(docs => {
					let savePollIndexArr = [];
					let addressSet = new Set();
					for(let i in docs)
						addressSet.add(docs[i].address);
					for(let i in headers){
						let header = headers[i]
						if(addressSet.has(header.address.value))
							continue;
						let savePollIndex = {};
						savePollIndex.creator = header.creator.value;
						savePollIndex.address = header.address.value;
						savePollIndex.title = header.title;
						savePollIndex.type = header.type;
						savePollIndex.doe = header.doe;
						savePollIndexArr.push(savePollIndex);
					}
					if(savePollIndexArr.length==0)
						return;
					savePollIndexArr.reverse();
					// save poll index into DB
					pollDB.savePollIndexArray(savePollIndexArr, err => { });
				});
				//the last poll id is 924993
				if(lastId > 924993)	
					pollIndexAll()
			})
}

module.exports = {
	schedulePollIndex
}
