angular.module('webapp').service('TXService', ["$http", TXService]);

function TXService($http){
	return {
		txList: function(params, callback) {
			$http.post("/tx/list", params).success(function(data){
				callback(data);
			});
		},
		tx: function(params, callback) {
			$http.post("/tx/tx", params).success(function(data){
				callback(data);
			});
		}
	}
}