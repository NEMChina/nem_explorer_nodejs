import SockJS from 'sockjs';
import Stomp from 'stompjs';
import schedule from 'node-schedule';

let unconfirmedConns = new Set();
let transactionConns = new Set();
let blockConns = new Set();
let mosaicConns = new Set();

let initUnconfirmedTransactionWS = (server, callback) => {
	let socket = SockJS.createServer();
	socket.on('connection', function(conn) {
		if(!conn)
			return;
		unconfirmedConns.add(conn);
		conn.on('close', function() {
			unconfirmedConns.delete(conn);
		});
	});
	socket.installHandlers(server, {prefix:'/ws/unconfirmed'});
};

let initTransactionWS = (server, callback) => {
	let socket = SockJS.createServer();
	socket.on('connection', function(conn) {
		if(!conn)
			return;
		transactionConns.add(conn);
		conn.on('close', function() {
			transactionConns.delete(conn);
		});
	});
	socket.installHandlers(server, {prefix:'/ws/transaction'});
};

let initBlockWS = (server, callback) => {
	let socket = SockJS.createServer();
	socket.on('connection', function(conn) {
		if(!conn)
			return;
		blockConns.add(conn);
		conn.on('close', function() {
			blockConns.delete(conn);
		});
	});
	socket.installHandlers(server, {prefix:'/ws/block'});
};

let initMosaicWS = (server, callback) => {
	let socket = SockJS.createServer();
	socket.on('connection', function(conn) {
		if(!conn)
			return;
		mosaicConns.add(conn);
		conn.on('close', function() {
			mosaicConns.delete(conn);
		});
	});
	socket.installHandlers(server, {prefix:'/ws/mosaic'});
};

let emitUnconfirmedTransaction = (data) => {
	for(let conn of unconfirmedConns)
		conn.write(JSON.stringify(data));
};

let emitTransaction = (data) => {
	for(let conn of transactionConns)
		conn.write(JSON.stringify(data));
};

let emitBlock = (data) => {
	for(let conn of blockConns)
		conn.write(JSON.stringify(data));
};

let emitMosaic = (data) => {
	for(let conn of mosaicConns)
		conn.write(JSON.stringify(data));
};

module.exports = {
	initUnconfirmedTransactionWS,
	emitUnconfirmedTransaction,
	initTransactionWS,
	emitTransaction,
	initBlockWS,
	emitBlock,
	initMosaicWS,
	emitMosaic,
};
