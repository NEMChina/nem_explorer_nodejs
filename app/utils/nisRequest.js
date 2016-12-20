import http from 'http';
import config from '../config/config';

let blockHeight = function(callback) {
	get('/chain/height', callback);
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

let accountTransferRecord = (address, callback) => {
	get('/account/transfers/all?address='+address, callback);
};

let accountTransferRecordAndID = (address, id, callback) => {
	get('/account/transfers/all?address='+address+'&id='+id, callback);
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

module.exports = {
	blockHeight,
	blockList,
	publicKeyToAddress,
	blockAtPublic,
	accountByAddress,
	harvestByAddress,
	accountTransferRecord,
	accountTransferRecordAndID,
	heartbeat,
	nodePeerListReachable,
	mosaicListByNamespace
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
    		body += data;
    	});
    	res.on('end', function (data) {
    		callback(JSON.parse(body));
    	});
  	});
  	request.on('error', function(e) { 
	 	console.log("error: " + e.message);
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
     		'Content-Length': reqData.length
   		}
	};
	let request = http.request(options, (res) => {
		let body = "";
		res.setEncoding('utf8');
    	res.on('data', function (data) {
    		body += data;
    	});
    	res.on('end', function () {
    		callback(JSON.parse(body));
    	});
  	});
  	request.on('error', function(e) { 
	 	console.log("error: " + e.message);
	 	callback({});
	});
	// post the data
	request.write(reqData);
	request.end();
}