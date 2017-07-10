angular.module('webapp').service('FooterService', ["$http", FooterService]);

function FooterService($http){
	return {
		market: function(callback) {
			$http.post("/market/market").success(function(data){
				callback(data);
			});
		}
	}
}