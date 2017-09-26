import config from '../config/config';
import channels from './channels';
import SockJSClient from 'sockjs-client';
import Stomp from 'stompjs';
import clientWS from './clientWS';
import address from '../utils/address';
import jsonUtil from '../utils/jsonUtil';

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
 * get new block info from websocket
 */
let block = () => {
	subscribe(channels.blocks, data => {
		if(!data)
			return;
		let block = jsonUtil.parse(data);
		clientWS.emitBlock(block);
	});
};

module.exports = {
	subscribe,
	block
};
