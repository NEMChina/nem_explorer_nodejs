import config from '../config/config';
import pollDB from '../db/pollDB';
import schedule from 'node-schedule';
import { BroadcastedPoll, PollIndex, PollConstants } from "nem-voting";
import { NEMLibrary, Address, NetworkTypes, AccountHttp } from "nem-library";

const pollPoolAddress = new Address(config.pollAccount);

let schedulePollIndex = () => {
	pollIndex();
	let rule = new schedule.RecurrenceRule();
	// rule.minute = [1, 6, 11, 16, 21, 26, 31, 36, 41, 46, 51]; //fetch pollIndex every 5 mins
	rule.second = [1];
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
	    	pollDB.findAllPollAddress(docs => {
	    		let savePollIndexArr = [];
	    		let addressSet = new Set();
	    		for(let i in docs)
	    			addressSet.add(docs[i].address);
	    		for(let i in results.headers){
	    			let header = results.headers[i];
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

module.exports = {
	schedulePollIndex
}
