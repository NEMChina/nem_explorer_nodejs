import SupernodeController from '../controllers/supernode.server.controller';

module.exports = function(app){
	app.route('/supernode/payoutList').post(SupernodeController.payoutList);
	app.route('/supernode/payoutRoundList').post(SupernodeController.payoutRoundList);
	app.route('/supernode/supernodeList').post(SupernodeController.supernodeList);
};