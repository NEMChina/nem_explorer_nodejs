angular.module("webapp").controller("PollListController", ["$scope", "$timeout", "PollService", PollListController]);
angular.module("webapp").controller("PollController", ["$scope", "$timeout", "$location", "PollService", PollController]);

function PollListController($scope, $timeout, PollService){
	PollService.pollList(function(r_pollList){
		let nowDate = new Date();
		$scope.pollList = r_pollList;
		for(let i in $scope.pollList){
			let item = $scope.pollList[i];
			item.timeStamp = fmtDate(item.timeStamp);
			item.expiredTime = fmtSysDate(item.doe);
			item.typeName = "";
			if(item.type==0)
				item.typeName = "POI";
			else if(item.type==1)
				item.typeName = "White List";
			if(nowDate.getTime()>item.doe)
				item.status = 0;
			else
				item.status = 1;
		}
		// load dataTable
		$timeout(function() {
			$('#pollTable').DataTable({
		    	"paging": false,
		        "ordering": false,
		        "searching": true,
		        "columnDefs": [
					{"searchable": false, "targets": 0},
					{"searchable": false, "targets": 2},
					{"searchable": false, "targets": 3}
				]
	    	});
		}, 1000);
	});
}


function PollController($scope, $timeout, $location, PollService){
	$scope.hideMore = false;
	let absUrl = $location.absUrl();
	if(absUrl==null){
		return;
	}
	let reg = /id=(\w{24})/;
	if(absUrl.match(reg) && absUrl.match(reg).length>=2){
		let id = absUrl.match(reg)[1];
		PollService.poll({"id": id}, function(item){
			$scope.poll = {};
			$scope.poll.title = item.title;
			$scope.poll.description = item.description;
			$scope.poll.timeStamp = fmtDate(item.timeStamp);
			$scope.poll.expired = fmtSysDate(item.doe);
			$scope.poll.status = 1
			$scope.poll.type = item.type;
			$scope.poll.multiple = "";
			let whitelistString = ""
			let whitelist = jsonParse(item.whitelist); // utils.js
			if(whitelist){
				for(let i in whitelist)
					whitelistString += whitelist[i] + "<br/>";
				if(whitelistString)
					whitelistString = whitelistString.substring(0, whitelistString.length-5);
			}
			$scope.poll.whitelist = whitelistString;
			// check expired
			if(new Date().getTime()>item.doe)
				$scope.poll.status = 0;
			// type
			if(item.type==0)
				$scope.poll.typeName = "POI";
			else if(item.type==1)
				$scope.poll.typeName = "White List";
			// multiple
			if(item.multiple==0)
				$scope.poll.multiple = "No";
			else if(item.multiple==1)
				$scope.poll.multiple = "Yes";
			$scope.loadPollResult(item);
		});
	}
	//load poll detail
	$scope.loadPollResult = function(item){
		$scope.showLoadingFlag = true;
		$scope.results = [];
		$scope.showScoreFlag = false;
		PollService.pollResult({"id": item._id}, function(r){
			// load poll graph
			let optionLabels = JSON.parse(item.strings);
			if(item.type==0){ // poi
				let allScore = 0;
				let optionScoreArr = [];
				for(let i in r){
					let optionScore = 0;
					for(let j in r[i]){
						r[i][j].time = fmtDate(r[i][j].time);
						r[i][j].fmtPOI = (r[i][j].poi*100).toFixed(5) + "%";
						optionScore += r[i][j].poi;
					}
					allScore += optionScore;
					optionScoreArr.push(optionScore);
				}
				for(let i in optionLabels){
					let graph = {};
					graph.label = optionLabels[i];
					graph.percentage = 0;
					graph.votes = 0;
					if(r[i].length>0){
						if(allScore!=0)
							graph.percentage = (optionScoreArr[i]*100/allScore).toFixed(2);
						graph.votes = r[i].length;
					}
					if(item.type==0){
						$scope.showScoreFlag = true;
						graph.score = (optionScoreArr[i]*100).toFixed(5);
					}
					$scope.results.push(graph);
				}
			} else { //white list
				let amount = 0;
				for(let i in r){
					for(let j in r[i]){
						r[i][j].time = fmtDate(r[i][j].time);
						amount++;
					}
				}
				
				for(let i in optionLabels){
					let graph = {};
					graph.label = optionLabels[i];
					graph.percentage = 0;
					graph.votes = 0;
					if(r[i].length>0){
						graph.percentage = (r[i].length*100/amount).toFixed(2);
						graph.votes = r[i].length;
					}
					$scope.results.push(graph);
				}
			}
			// load tab labels
			$scope.optionLabels = optionLabels;
			// load tab votes
			$scope.optionVotes = r;
			$scope.showLoadingFlag = false;
			// init tabs
			$timeout(function() {
				$('#optionVotesTab a').click(function (e) {
			    	e.preventDefault();
			    	$(this).tab('show');
			  	})
			}, 100);
		});
	};
}