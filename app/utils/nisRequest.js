import http from 'http';
import config from '../config/config';
import errorMessageDB from '../db/errorMessageDB';

const transferMosaicQueryCount = 25;

let blockHeight = function(callback) {
	get('/chain/height', callback);
};

let blockHeightByHostAndPort = function(host, port, callback) {
	getByHostAndPortNoError(host, port, '/chain/height', callback);
};

let blockList = function(reqData, callback) {
	post('/local/chain/blocks-after', reqData, callback);
};

let publicKeyToAddress = function(publicKeyArr, callback) {
	let addressArr = [];
	publicKeyArr.forEach(publicKey => {
		get('/account/get/from-public-key?publicKey='+publicKey, function(data){
			addressArr.push(data.account.address);
			if(addressArr.length==publicKeyArr.length){
				callback(addressArr);
				return;
			}
		});
	});
};

let accountByAddress = (address, callback) => {
	get('/account/get?address='+address, callback);
};

let accountByAddressBatch = (reqData, callback) => {
	post('/account/get/batch', reqData, callback);
};

let blockAtPublic = (reqData, callback) => {
	post('/block/at/public', reqData, callback);
};

let harvestByAddress = (address, id, preData, callback) => {
	let url = '';
	if(id)
		url = '/account/harvests?address='+address+'&id='+id;
	else
		url = '/account/harvests?address='+address;
	get(url, data => {
		if(data && data.data && data.data.length!=0){
			let lastID = 0;
			data.data.forEach(item => {
				preData.push(item);
				lastID = item.id;
			});
			//recurse to query all the harvest data
			harvestByAddress(address, lastID, preData, callback);
		} else {
			callback(preData);
		}
	});
};

let harvestByAddressInTime = (address, id, preData, time, callback) => {
	let url = '';
	if(id)
		url = '/account/harvests?address='+address+'&id='+id;
	else
		url = '/account/harvests?address='+address;
	get(url, data => {
		if(data && data.data && data.data.length!=0){
			let lastID = 0;
			data.data.forEach(item => {
				let timeStamp = item.timeStamp;
				if(timeStamp<time)
					callback(preData);
				preData.push(item);
				lastID = item.id;
			});
			//recurse to query all the harvest data
			harvestByAddress(address, lastID, preData, callback);
		} else {
			callback(preData);
		}
	});
};

let accountTransferRecord = (address, callback) => {
	get('/account/transfers/all?address='+address, callback);
};

let accountTransferRecordAndID = (address, id, callback) => {
	if(id==0)
		get('/account/transfers/all?address='+address, callback);
	else
		get('/account/transfers/all?address='+address+'&id='+id, callback);
};

let accountTransferIncoming = (address, callback) => {
	get('/account/transfers/incoming?address='+address, callback);
};

let accountTransferIncomingAndID = (address, id, preData, callback) => {
	let url = '';
	if(id)
		url = '/account/transfers/incoming?address='+address+'&id='+id;
	else
		url = '/account/transfers/incoming?address='+address;
	get(url, data => {
		if(data && data.data && data.data.length!=0){
			let lastID = 0;
			data.data.forEach(item => {
				preData.push(item);
				lastID = item.meta.id;
			});
			//recurse to query all the incoming data
			accountTransferIncomingAndID(address, lastID, preData, callback);
		} else {
			callback(preData);
		}
	});
};

let accountTransferMosaicAndID = (address, id, preData, callback) => {
	let url = '';
	if(id)
		url = '/account/transfers/all?address='+address+'&id='+id;
	else
		url = '/account/transfers/all?address='+address;
	get(url, data => {
		if(data || data.data || data.data.length==0)
			callback(preData);
		let lastID = 0;
		for(let i in data.data){
			let item = data.data[i];
			if(!item || !item.transaction)
				continue;
			if(item.transaction.mosaics && item.transaction.mosaics>0){
				preData.push(item);
				lastID = item.meta.id;
			} else if(item.transaction.type==4100 && item.transaction.otherTrans 
				&& !item.transaction.otherTrans.modifications){
				let otherTrans = item.transaction.otherTrans;
				if(otherTrans.mosaics && otherTrans.mosaics>0){
					preData.push(item);
					lastID = item.meta.id;
				}
			}
			if(preData.length>=transferMosaicQueryCount)
				callback(preData);
		}
		//recurse to query all the incoming data
		accountTransferMosaicAndID(address, lastID, preData, callback);
	});
};

let heartbeat = (callback) => {
	get('/heartbeat', callback);
};

let nodePeerListReachable = (callback) => {
	get('/node/peer-list/reachable', callback);
};

let mosaicListByNamespace = (namespace, callback) => {
	get('/namespace/mosaic/definition/page?namespace='+namespace, callback);
};

let namespaceListByAddress = (address, callback) => {
	get('/account/namespace/page?pageSize=100&address='+address, callback);
};

let mosaicListByAddress = (address, callback) => {
	get('/account/mosaic/owned?address='+address, callback);
};

let mosaicDefinitionListByNamespace = (namespace, callback) => {
	get('/namespace/mosaic/definition/page?namespace='+namespace, callback);
};

let allMosaicDefinitionListByNamespace = (namespace, id, preData, callback) => {
	let url = '';
	if(id)
		url = '/namespace/mosaic/definition/page?namespace='+namespace+'&id='+id;
	else
		url = '/namespace/mosaic/definition/page?namespace='+namespace;
	get(url, data => {
		if(data && data.data && data.data.length!=0){
			let lastID = 0;
			for(let i in data.data){
				let item = data.data[i];
				preData.push(item);
				lastID = item.meta.id;
			}
			allMosaicDefinitionListByNamespace(namespace, lastID, preData, callback);
		} else {
			callback(preData);
		}
	});
};

let accountUnconfirmedTransactions = (address, callback) => {
	get('/account/unconfirmedTransactions?address='+address, callback);
};

let checkUncomfirmedTransactionStatus = (address, id, timeStamp, signature, callback) => {
	let url = '';
	if(id)
		url = '/account/transfers/all?address='+address+'&id='+id;
	else
		url = '/account/transfers/all?address='+address;
	get(url, data => {
		if(data && data.data && data.data.length!=0){
			let lastID = 0;
			for(let i in data.data){
				let item = data.data[i];
				if(item.transaction && item.transaction.signature && item.transaction.signature==signature){
					callback(true);
					return;
				}
				lastID = item.meta.id;
			}
			checkUncomfirmedTransactionStatus(address, lastID, timeStamp, signature, callback);
		} else {
			callback(false);
		}
	});
};

let accountImportances = (callback) => {
	get('/account/importances', callback);
};

let accountHistorical = (address, startHeight, endHeight, callback) => {
	let url = '/account/historical/get?address=' + address + 
		"&startHeight=" + startHeight + 
		"&endHeight=" + endHeight + 
		"&increment=1";
	hugeAliceGet(url, callback);
};

let accountHistoricalBatch = (params, startHeight, endHeight, callback) => {
	let url = '/account/historical/get/batch';
	hugeAlicePost(url, params, callback);
};


module.exports = {
	blockHeight,
	blockHeightByHostAndPort,
	blockList,
	publicKeyToAddress,
	blockAtPublic,
	accountByAddress,
	accountByAddressBatch,
	harvestByAddress,
	harvestByAddressInTime,
	accountTransferRecord,
	accountTransferRecordAndID,
	accountTransferIncoming,
	accountTransferIncomingAndID,
	accountTransferMosaicAndID,
	heartbeat,
	nodePeerListReachable,
	mosaicListByNamespace,
	namespaceListByAddress,
	mosaicListByAddress,
	mosaicDefinitionListByNamespace,
	allMosaicDefinitionListByNamespace,
	accountUnconfirmedTransactions,
	checkUncomfirmedTransactionStatus,
	accountImportances,
	accountHistorical,
	accountHistoricalBatch
}

//http GET method util
let get = function(path, callback) {
	let options = {
    	host: config.nisHost,
    	port: config.nisPort,
	    path: path,
	    method: 'GET'
	};
	let request = http.request(options, (res) => {
		let body = "";
		res.setEncoding('utf8');
    	res.on('data', function (data) {
    		if(data)
    			body += data;
    	});
    	res.on('end', function (data) {
    		let result = {};
    		try{
    			result = JSON.parse(body);
    		} catch (e){
    			
    		}
    		callback(result);
    	});
  	});
  	request.on('error', function(e) { 
  		errorMessageDB.saveError(path + ", " + e);
	 	console.log("error: " + path + ", " + e);
	 	callback({});
	});
	// post the data
	request.write('');
	request.end();
}

//http GET method util
let hugeAliceGet = function(path, callback) {
	let options = {
    	host: config.hugeAliceNisHost,
    	port: config.nisPort,
	    path: path,
	    method: 'GET'
	};
	let request = http.request(options, (res) => {
		let body = "";
		res.setEncoding('utf8');
    	res.on('data', function (data) {
    		if(data)
    			body += data;
    	});
    	res.on('end', function (data) {
    		let result = {};
    		try{
    			result = JSON.parse(body);
    		} catch (e){
    			
    		}
    		callback(result);
    	});
  	});
  	request.on('error', function(e) { 
  		errorMessageDB.saveError(path + ", " + e);
	 	console.log("error: " + path + ", " + e);
	 	callback({});
	});
	// post the data
	request.write('');
	request.end();
}

//http GET method util
let getByHostAndPortNoError = function(host, port, path, callback) {
	let options = {
    	host: host,
    	port: port,
	    path: path,
	    method: 'GET'
	};
	let request = http.request(options, (res) => {
		let body = "";
		res.setEncoding('utf8');
    	res.on('data', function (data) {
    		if(data)
    			body += data;
    	});
    	res.on('end', function (data) {
    		let result = {};
    		try{
    			result = JSON.parse(body);
    		} catch (e){
    			
    		}
    		callback(result);
    	});
  	});
  	request.on('error', function(e) { 
	 	//console.log("error: " + e.message);
	 	callback({});
	});
	// post the data
	request.write('');
	request.end();
}

//http POST method util
let post = function(path, reqData, callback) {
	let options = {
    	host: config.nisHost,
    	port: config.nisPort,
	    path: path,
	    method: 'POST',
	    headers: {   
     		'Content-Type':'application/json',
     		'Content-Length': Buffer.byteLength(reqData)
   		}
	};
	let request = http.request(options, (res) => {
		let body = "";
		res.setEncoding('utf8');
    	res.on('data', function (data) {
    		if(data)
    			body += data;
    	});
    	res.on('end', function () {
    		let result = {};
    		try{
    			result = JSON.parse(body);
    		} catch (e){
    			
    		}
    		callback(result);
    	});
  	});
  	request.on('error', function(e) {
  		errorMessageDB.saveError(path + ", " + e);
	 	console.log("error: " + path + ", " + e);
	 	callback({});
	});
	// post the data
	request.write(reqData);
	request.end();
}

//http POST method util
let hugeAlicePost = function(path, reqData, callback) {
	let options = {
    	host: config.hugeAliceNisHost,
    	port: config.nisPort,
	    path: path,
	    method: 'POST',
	    headers: {   
     		'Content-Type':'application/json',
     		'Content-Length': Buffer.byteLength(reqData)
   		}
	};
	let request = http.request(options, (res) => {
		let body = "";
		res.setEncoding('utf8');
    	res.on('data', function (data) {
    		if(data)
    			body += data;
    	});
    	res.on('end', function () {
    		let result = {};
    		try{
    			result = JSON.parse(body);
    		} catch (e){
    			
    		}
    		callback(result);
    	});
  	});
  	request.on('error', function(e) {
  		errorMessageDB.saveError(path + ", " + e);
	 	console.log("error: " + path + ", " + e);
	 	callback({});
	});
	// post the data
	request.write(reqData);
	request.end();
}