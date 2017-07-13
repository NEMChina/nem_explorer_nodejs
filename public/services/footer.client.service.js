angular.module('webapp').service('FooterService', ["$http", FooterService]);

function FooterService($http){
	return {
		market: function(callback) {
			$http.post("/market/market").success(function(data){
				callback(data);
			});
		},
		version: function(callback) {
			$http.post("/sys/version").success(function(data){
				callback(data);
			});
		}
	}
}