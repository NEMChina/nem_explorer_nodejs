angular.module('webapp').service('AccountService', ["$http", AccountService]);

function AccountService($http){
	return {
		accountList: function(callback) {
			$http.post("/account/accountList").success(function(data){
				callback(data);
			});
		},
		harvesterList: function(callback) {
			$http.post("/account/harvesterList").success(function(data){
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
		}
	}
}