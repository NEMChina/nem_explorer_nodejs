import AccountController from '../controllers/account.server.controller';

module.exports = function(app){
	app.route('/account/accountList').post(AccountController.accountList);
	app.route('/account/harvesterList').post(AccountController.harvesterList);
	app.route('/account/detail').post(AccountController.detail);
	app.route('/account/detailTXList').post(AccountController.detailTXList);
	app.route('/account/detailMosaicTXList').post(AccountController.detailMosaicTXList);
	app.route('/account/reloadAccountInfo').get(AccountController.reloadAccountInfo);
	app.route('/account/loadHarvestBlocks').post(AccountController.loadHarvestBlocks);
};