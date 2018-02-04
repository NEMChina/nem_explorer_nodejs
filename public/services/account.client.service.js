angular.module('webapp').service('AccountService', ["$http", AccountService]);

function AccountService($http){
	return {
		accountList: function(params, callback) {
			$http.post("/account/accountList", params).success(function(data){
				callback(data);
			});
		},
		harvesterList: function(params, callback) {
			$http.post("/account/harvesterList", params).success(function(data){
				callback(data);
			});
		},
		detail: function(params, callback) {
			$http.post("/account/detail", params).success(function(data){
				callback(data);
			});
		},
		detailTXList: function(params, callback) {
			$http.post("/account/detailTXList", params).success(function(data){
				callback(data);
			});
		},
		detailMosaicTXList: function(params, callback) {
			$http.post("/account/detailMosaicTXList", params).success(function(data){
				callback(data);
			});
		},
		loadHarvestBlocks: function(params, callback) {
			$http.post("/account/loadHarvestBlocks", params).success(function(data){
				callback(data);
			});
		}
	}
}