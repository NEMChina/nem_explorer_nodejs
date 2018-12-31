import config from '../config/config';
import channels from './channels';
import SockJSClient from 'sockjs-client';
import Stomp from '@stomp/stompjs';
import clientWS from './clientWS';
import address from '../utils/address';
import jsonUtil from '../utils/jsonUtil';
import mosaicDB from '../db/mosaicDB';
import nis from '../utils/nisRequest';

const WS_URL = 'http://' + config.nisHost + ':' + config.wsPort + config.wsPath;

let client;
const reconnectDelay = 30 * 1000;

let connect = () => {
	client = Stomp.over(() => {
		return new SockJSClient(WS_URL);
	});
	client.connect({}, successCallback, failureCallback);
	client.reconnect_delay = reconnectDelay;
};

let successCallback = frame => {
	console.info("[success] Mosaic websocket connect!");
	client.subscribe(channels.blocks, function(data){
		if(!data || !data.body)
			return;
		let block = jsonUtil.parse(data.body);
		if(!block || !block.height || !block.signature)
			return;
		let params = JSON.stringify({"height": block.height-1});
		nis.blockList(params, data => {
			if(!data || !data.data || data.data.length==0)
				return;
			data.data.forEach(item => {
				if(!item.block || !item.txes)
					return;
				// query given height block
				if(item.block.height!=block.height)
					return;
				let r_mosaicArr = [];
				let mosaicQueryParams = [];
				// collect mosaics
				item.txes.forEach((itemTx, index) => {
					if(!itemTx || !itemTx.tx || !itemTx.hash)
						return;
					let tx = itemTx.tx;
					tx.height = block.height;
					tx.hash = itemTx.hash;
					tx.index = index;
					let mosaicFromTX = getMosaicFromTX(tx);
					let mosaicQueryParamsFromTX = getMosaicQueryParamsFromTX(tx);
					if(mosaicFromTX.length!=0)
						r_mosaicArr = r_mosaicArr.concat(mosaicFromTX);
					if(mosaicQueryParamsFromTX.length!=0)
						mosaicQueryParams = mosaicQueryParams.concat(mosaicQueryParamsFromTX);
				});
				if(r_mosaicArr.length==0)
					return;
				if(r_mosaicArr.length!=0 && mosaicQueryParams.length==0)
					clientWS.emitBlock(r_mosaicArr);
				// query mosaics info and format the quantity
				mosaicDB.findMosaics(mosaicQueryParams, docs => {
					let mosaicMap = new Map();
					docs.forEach(doc => {
						let mosaicID = doc.namespace + ":" + doc.mosaicName; 
						mosaicMap.set(mosaicID, doc.divisibility);
					});
					r_mosaicArr.forEach((m, i) => {
						if(!mosaicMap.has(m.mosaicID))
							return;
						r_mosaicArr[i].div = mosaicMap.get(m.mosaicID);
					});
					clientWS.emitMosaic(r_mosaicArr);
				});
			});
		});
    });
};

let failureCallback = error => {
	console.info("[error] Mosaic websocket disconnect...");
};

let getMosaicFromTX = (tx) => {
	let r_mosaics = [];
	let mosaics = [];
	if(tx.mosaics)
		mosaics = mosaics.concat(tx.mosaics);
	if(tx.otherTrans && tx.otherTrans.mosaics)
		mosaics = mosaics.concat(tx.otherTrans.mosaics);
	mosaics.forEach((m, i) => {
		if(!m.mosaicId || !m.mosaicId.namespaceId || !m.mosaicId.name)
			return;
		let mosaic = {};
		mosaic.sender = address.publicKeyToAddress(tx.signer);
		if(tx.recipient)
			mosaic.recipient = tx.recipient;
		mosaic.hash = tx.hash;
		mosaic.timeStamp = tx.timeStamp;
		mosaic.mosaicID = m.mosaicId.namespaceId + ":" + m.mosaicId.name;
		mosaic.mosaicName = m.mosaicId.name;
		mosaic.namespace = m.mosaicId.namespaceId;
		mosaic.quantity = m.quantity;
		// calculate the number, no = block height + tx index + mosaic index
		mosaic.no = tx.height;
		mosaic.no = mosaic.no * 1000 + (tx.index+1);
		mosaic.no = mosaic.no * 100 + (i+1);
		r_mosaics.push(mosaic);
	});
	return r_mosaics;
};

let getMosaicQueryParamsFromTX = (tx) => {
	let mosaicQueryParams = [];
	let mosaics = [];
	if(tx.mosaics)
		mosaics = mosaics.concat(tx.mosaics);
	if(tx.otherTrans && tx.otherTrans.mosaics)
		mosaics = mosaics.concat(tx.otherTrans.mosaics);
	mosaics.forEach(m => {
		if(!m.mosaicId || !m.mosaicId.namespaceId || !m.mosaicId.name)
			return;
		mosaicQueryParams.push({mosaicName: m.mosaicId.name, namespace: m.mosaicId.namespaceId});
	});
	return mosaicQueryParams;
};

module.exports = {
	connect
};
