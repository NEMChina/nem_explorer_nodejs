const NEM_EPOCH = Date.UTC(2015, 2, 29, 0, 6, 25, 0);

let getTimeInNem = () => {
	let nowTime = new Date().getTime();
	return Math.round((nowTime - NEM_EPOCH)/1000);
}

let getTimeBeforeOneDayInNem = () => {
	let nowTime = new Date().getTime();
	return Math.round((nowTime - NEM_EPOCH)/1000) - 24*60*60;
}

let getTimeBeforeOneMonthInNem = () => {
	let nowTime = new Date().getTime();
	return Math.round((nowTime - NEM_EPOCH)/1000) - 30*24*60*60;
}

module.exports = {
	getTimeInNem,
	getTimeBeforeOneDayInNem,
	getTimeBeforeOneMonthInNem
}