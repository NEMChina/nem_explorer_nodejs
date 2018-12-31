import config from '../config/config';
import channels from './channels';
import SockJSClient from 'sockjs-client';
import Stomp from '@stomp/stompjs';
import clientWS from './clientWS';
import address from '../utils/address';
import jsonUtil from '../utils/jsonUtil';

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
	console.info("[success] Block websocket connect!");
	client.subscribe(channels.blocks, function(data){
		if(!data || !data.body)
			return;
		let block = jsonUtil.parse(data.body);
		clientWS.emitBlock(block);
    });
};

let failureCallback = error => {
	console.info("[error] Block websocket disconnect...");
};

module.exports = {
	connect
};
