import https from 'https';
import cache from '../cache/appCache';
import schedule from 'node-schedule';

const URL = "https://api.coinmarketcap.com/v1/ticker/nem/";

let scheduleFetchPrice = () => {
	fetchPrice();
	let rule = new schedule.RecurrenceRule();
	rule.second = [1, 11, 21, 31, 41, 51];
	schedule.scheduleJob(rule, () => {
		fetchPrice();
	});
}

/**
 * fetch price from coinmarketcap.com
 */
let fetchPrice = () => {
	httpsGet(URL, html => {
		if(!html)
			return;
		let result = JSON.parse(html);
		if(!result || result.length==0)
			return;
		let market = result[0];
		if(!market || !market.price_usd || !market.price_btc)
			return;
		let saveObj = {};
		saveObj.usd = market.price_usd;
		saveObj.btc = market.price_btc;
		saveObj.cap = market.market_cap_usd;
		cache.appCache.set(cache.marketPrefix, saveObj);
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
	    callback(null);
	});
}

module.exports = {
	scheduleFetchPrice
}
