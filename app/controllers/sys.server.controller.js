import pack from '../../package.json';

module.exports = {

	/**
     * get version info
     */
	version: (req, res, next) => {
		try {
			let version = {};
			if(pack)
				version.version = pack.version;
			res.json(version);
		} catch (e) {
			console.error(e);
		}
	},

	/**
     * get heartbeat
     */
	heartbeat: (req, res, next) => {
		try {
			let r = {"code": 1};
			res.json(r);
		} catch (e) {
			console.error(e);
		}
	}
}