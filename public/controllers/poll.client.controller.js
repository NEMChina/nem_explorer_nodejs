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
			if(item.title && item.title.length>60)
				item.title = item.title.substring(0, 59) + "..";
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
	$scope.showLoadingPollFlag = true;
	$scope.showLoadingPollGraphFlag = true;
	$scope.showLoadingPollVotersFlag = true;
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
			let whitelist = item.whitelist;
			if(item.whitelist){
				let whitelistSet = new Set();
				for(let i in whitelist){
					if(whitelistSet.has(whitelist[i]))
						continue;
					whitelistSet.add(whitelist[i]);
					whitelistString += whitelist[i] + "<br/>";
				}
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
			$scope.showLoadingPollFlag = false;
			$scope.loadPollResult(item);
			if(item.type==0) //show voters whe the poll type is poi
				$scope.loadPollVoters(item);
		});
	}
	//load poll detail
	$scope.loadPollResult = function(item){
		$scope.results = [];
		PollService.pollResult({"id": item._id}, function(r){
			if(!r || !r.options)
				return;
			let options = r.options;
			for(let i in options){
				let graph = {};
				let o = options[i];
				graph.label = o.text;
				graph.percentage = Number(o.percentage).toFixed(2);
				graph.votes = o.votes;
				if(item.type==0)
					graph.score = Number(o.weighted*100).toFixed(5) + "%";
				else if(item.type==1)
					graph.score = o.votes;
				$scope.results.push(graph);
			}
			$scope.showLoadingPollGraphFlag = false;
		});
	};

	//load poll detail
	$scope.loadPollVoters = function(item){
		// option label
		$scope.optionLabels = item.strings;
		// voters
		PollService.pollResultVoters({"address": item.address, "strings": item.strings}, function(r){
			$scope.optionVotes = r;
			$scope.showLoadingPollVotersFlag = false;
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