angular.module('webapp').service('PollService', ["$http", PollService]);

function PollService($http){
	return {
		pollList: function(callback) {
			$http.post("/poll/list").success(function(data){
				callback(data);
			});
		},
		pollAnswers: function(params, callback) {
			$http.post("/poll/answers", params).success(function(data){
				callback(data);
			});
		}
	}
}