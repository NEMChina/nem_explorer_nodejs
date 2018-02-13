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

let getTimeInReal = (timeStamp) => {
	return timeStamp*1000 + NEM_EPOCH;
}

let convertToNemTime = (time) => {
	return Math.round((time - NEM_EPOCH)/1000);
}

let getYearAddOneTimeInNem = (timeStamp) => {
	let time = new Date(timeStamp*1000 + NEM_EPOCH);
	time.setFullYear(time.getFullYear()+1);
	return (time.getTime()-NEM_EPOCH)/1000;
}

module.exports = {
	getTimeInNem,
	getTimeBeforeOneDayInNem,
	getTimeBeforeOneMonthInNem,
	getTimeInReal,
	convertToNemTime,
	getYearAddOneTimeInNem
}