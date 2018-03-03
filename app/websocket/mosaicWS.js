import config from '../config/config';
import channels from './channels';
import SockJSClient from 'sockjs-client';
import Stomp from 'stompjs';
import clientWS from './clientWS';
import address from '../utils/address';
import jsonUtil from '../utils/jsonUtil';
import dbUtil from '../utils/dbUtil';

const WS_URL = 'http://' + config.nisHost + ':' + config.wsPort + config.wsPath;

/**
 * common subscribe
 */
let subscribe = (channel, callback) => {
	let NIS_SOCKET = new SockJSClient(WS_URL);
	let stompClient = Stomp.over(NIS_SOCKET);
	stompClient.connect({}, function(){
		stompClient.subscribe(channel, function(data){
			callback(data.body);
	    });
	});
};

/**
 * get new mosaic info from websocket
 */
let mosaic = () => {
	subscribe(channels.blocks, data => {
		if(!data)
			return;
		let block = jsonUtil.parse(data);
		if(!block.transactions || block.transactions.length==0)
			return;

		let r_mosaicArr = [];
		let mosaicQueryParams = [];
		block.transactions.forEach(tx => {
			let mosaicFromTX = getMosaicFromTX(tx);
			let mosaicQueryParamsFromTX = getMosaicQueryParamsFromTX(tx);
			if(mosaicFromTX.length!=0)
				r_mosaicArr = r_mosaicArr.concat(mosaicFromTX);
			if(mosaicQueryParamsFromTX)
				mosaicQueryParams = mosaicQueryParams.concat(mosaicQueryParamsFromTX);
		});
		if(r_mosaicArr==0)
			return;
		if(r_mosaicArr!=0 && mosaicQueryParams.length==0)
			clientWS.emitBlock(r_mosaicArr);
		dbUtil.findMosaics(mosaicQueryParams, docs => {
			let mosaicMap = new Map();
			docs.forEach(doc => {
				let mosaicID = doc.namespace + ":" + doc.mosaicname; 
				mosaicMap.set(mosaicID, doc.divisibility);
			});
			r_mosaicArr.forEach(m => {
				if(!mosaicMap.has(m.mosaicID))
					return;
				let div = 1;
				if(mosaicMap.get(m.mosaicID) && mosaicMap.get(m.mosaicID)>0)
					div = Math.pow(10, mosaicMap.get(m.mosaicID))
				m.quantity = m.quantity / div;
			});
			clientWS.emitMosaic(r_mosaicArr);
		});
	});
};

let getMosaicFromTX = (tx) => {
	let r_mosaics = [];
	let mosaics = [];
	if(tx.mosaics)
		mosaics = mosaics.concat(tx.mosaics);
	if(tx.otherTrans && tx.otherTrans.mosaics)
		mosaics = mosaics.concat(tx.otherTrans.mosaics);
	mosaics.forEach(m => {
		if(!m.mosaicId || !m.mosaicId.namespaceId || !m.mosaicId.name)
			return;
		let mosaic = {};
		mosaic.sender = address.publicKeyToAddress(tx.signer);
		if(tx.recipient)
			mosaic.recipient = tx.recipient;
		mosaic.timeStamp = tx.timeStamp;
		mosaic.mosaicID = m.mosaicId.namespaceId + ":" + m.mosaicId.name;
		mosaic.mosaicName = m.mosaicId.name;
		mosaic.namespace = m.mosaicId.namespaceId;
		mosaic.quantity = m.quantity;
		r_mosaics.push(mosaic);
	});
	return r_mosaics;
};

let getMosaicQueryParamsFromTX = (tx) => {
	let mosaicQueryParams = [];
	let mosaics = [];
	if(tx.mosaics)
		mosaics.push(tx.mosaics);
	if(tx.otherTrans && tx.otherTrans.mosaics)
		mosaics.push(tx.otherTrans.mosaics);
	mosaics.forEach(m => {
		if(!m.mosaicId || !m.mosaicId.namespaceId || m.mosaicId.name)
			return;
		mosaicQueryParams.push({mosaicName: m.mosaicId.name, namespace: m.mosaicId.namespaceId});
	});
	return mosaicQueryParams;
};

module.exports = {
	mosaic
};
