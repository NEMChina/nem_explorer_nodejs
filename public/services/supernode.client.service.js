angular.module('webapp').service('SupernodeService', ["$http", SupernodeService]);

function SupernodeService($http){
	return {
		payoutList: function(params, callback) {
			$http.post("/supernode/payoutlist", params).success(function(data){
				callback(data);
			});
		},
		payoutRoundList: function(callback) {
			$http.post("/supernode/payoutRoundlist").success(function(data){
				callback(data);
			});
		},
		supernodeList: function(callback) {
			$http.post("/supernode/supernodeList").success(function(data){
				callback(data);
			});
		}
	}
}