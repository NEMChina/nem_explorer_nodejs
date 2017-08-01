import SockJS from 'sockjs';
import Stomp from 'stompjs';
import schedule from 'node-schedule';

let unconfirmedConns = new Set();

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

let emitUnconfirmedTransaction = (data) => {
	for(let conn of unconfirmedConns)
		conn.write(JSON.stringify(data));
};

module.exports = {
	initUnconfirmedTransactionWS,
	emitUnconfirmedTransaction
};
