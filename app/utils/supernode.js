import https from 'https';
import config from '../config/config';
import schedule from 'node-schedule';
import mongoose from 'mongoose';

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
	httpsGet(config.supernodeHost, html => {
		if(!html) 
			return;
		html = html.replace(new RegExp(/(\r\n)/g),''); //clean the blank lines
		html = html.replace(new RegExp(/(>(\s)+<)/g),'><'); //clean  the blank between '>' and '<'
		let req = /<tr><td scope=\"row\"><a href=\"details\/(\d+)\" style=\"color:#337AB7\">(\d+)<\/a><\/td><td>(.{1,50})<\/td><td><a href=\"details\/(\d+)\" style=\"color:#DD4814\">(.{1,50})<\/a><\/td><td style=\"color:(green|red)\">(Active|Deactivated)<\/td><\/tr>/;
		let match = html.match(req);
		let Supernode = mongoose.model('Supernode');
		if(!match || match.length!=8){
			return;
		}
		//remove all supernode data
		Supernode.remove({}, (err, doc) => {
			if(err)
				console.error(err);
			let nowDate = format(new Date(), "yyyy-MM-dd hh:mm:ss");
			while(match && match.length==8) {
				let id = match[1];
				let host = match[3];
				let name = match[5];
				//save the new supernode data
				new Supernode({id: id, host: host, name: name, time: nowDate}).save(err => {
					if(err) 
						console.error(err);
				});
				html = html.replace(match[0], '');
				match = html.match(req);
			}
		});
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
