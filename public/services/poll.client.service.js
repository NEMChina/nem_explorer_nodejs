angular.module('webapp').service('PollService', ["$http", PollService]);

function PollService($http){
	return {
		poll: function(params, callback) {
			$http.post("/poll/poll", params).success(function(data){
				callback(data);
			});
		},
		pollList: function(params,callback) {
			$http.post("/poll/list",params).success(function(data){
				callback(data);
			});
		},
		pollResult: function(params, callback) {
			$http.post("/poll/pollResult", params).success(function(data){
				callback(data);
			});
		},
		pollResultVoters: function(params, callback) {
			$http.post("/poll/pollResultVoters", params).success(function(data){
				callback(data);
			});
		}
	}
}