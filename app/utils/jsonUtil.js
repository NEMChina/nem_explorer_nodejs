let parse = (data) => {
	let result;
	try {
		result = JSON.parse(data);
	} catch (e) {}
	return result;
};

module.exports = {
	parse
}