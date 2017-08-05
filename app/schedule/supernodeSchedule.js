import https from 'https';
import config from '../config/config';
import schedule from 'node-schedule';
import mongoose from 'mongoose';
import jsonUtil from '../utils/jsonUtil';

let scheduleFetchSupernode = () => {
	fetchSupernode();
	let rule = new schedule.RecurrenceRule();
	rule.minute = [1, 11, 21, 31, 41, 51]; //fetch supernodes every 10 mins
	schedule.scheduleJob(rule, () => {
		fetchSupernode();
	});
}

/**
 * fetch data from supernodes.nem.io
 */
let fetchSupernode = () => {
	httpsGet(config.supernodeDataUrl, data => {
		if(!data) 
			return;
		data = jsonUtil.parse(data);
		if(!data || !data.nodes)
			return;
		let nowDate = format(new Date(), "yyyy-MM-dd hh:mm:ss");
		let saveNodeArr = [];
		let SupernodePayout = mongoose.model('SupernodePayout');
		for(let i in data.nodes){
			let node = data.nodes[i];
			if(!node.id || !node.alias || !node.ip)
				continue;
			let saveNode = {};
			saveNode.id = node.id;
			saveNode.name = node.alias;
			saveNode.host = node.ip;
			saveNode.time = nowDate;
			saveNode.payoutAddress = node.payoutAddress;
			saveNodeArr.push(saveNode);
		}
		if(saveNodeArr.length>0){
			let Supernode = mongoose.model('Supernode');
			Supernode.remove({}, (err, doc) => {
				Supernode.insertMany(saveNodeArr, err => {
					if(err)  console.error(err);
				});
			});
		}
	});
}

let httpsGet = function(url, callback) {
	https.get(url, function(res) {
	    let html = '';
	    res.on('data', function(data) {
	        html += data;
	    });
	    res.on('end',function() {
	        callback(html);
	    });
	}).on('error', function() {
	    console.log('error');
	    callback(null);
	});
}

let format = function(date, fmt) {
	let o = {
		"M+" : date.getMonth()+1,
		"d+" : date.getDate(),
		"h+" : date.getHours(),
		"m+" : date.getMinutes(),
		"s+" : date.getSeconds(),
		"q+" : Math.floor((date.getMonth()+3)/3)
	}; 
	if(/(y+)/.test(fmt))
		fmt = fmt.replace(RegExp.$1, (date.getFullYear()+"").substr(4 - RegExp.$1.length)); 
	for(let k in o) 
		if(new RegExp("("+ k +")").test(fmt)) 
	fmt = fmt.replace(RegExp.$1, (RegExp.$1.length==1) ? (o[k]) : (("00"+ o[k]).substr((""+ o[k]).length))); 
	return fmt; 
}

module.exports = {
	scheduleFetchSupernode
}
