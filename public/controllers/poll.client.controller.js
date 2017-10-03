angular.module("webapp").controller("PollController", ["$scope", "$timeout", "PollService", PollController]);

function PollController($scope, $timeout, PollService){
	PollService.pollList(function(r_pollList){
		let nowDate = new Date();
		$scope.pollList = r_pollList;
		for(let i in $scope.pollList){
			let item = $scope.pollList[i];
			item.timeStamp = fmtDate(item.timeStamp);
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
	//load poll detail
	$scope.showPoll = function(index){
		$scope.showLoadingFlag = true;
		$scope.selectedPollIndex = index;
		let item = $scope.pollList[index];
		$("#pollDetail").modal("show");
		$scope.items = {};
		let nowTime = new Date().getTime();
		let items = new Array();
		items.push({label: "Create time", content: item.timeStamp});
		if(nowTime>item.doe){
			let expired = "&nbsp;&nbsp;<span style='color:red'> ( EXPIRED ) </span>";
			items.push({label: "Expired time", content: fmtSysDate(item.doe) + expired});
		} else {
			items.push({label: "Expired time", content: fmtSysDate(item.doe)});
		}
		items.push({label: "Title", content: item.title});
		items.push({label: "Description", content: item.description});
		// type
		if(item.type==0)
			items.push({label: "Type", content: "POI"});
		else if(item.type==1)
			items.push({label: "Type", content: "White List"});
		else
			items.push({label: "Type", content: ""});
		// multiple
		if(item.multiple==0)
			items.push({label: "Multiple", content: "No"});
		else if(item.multiple==1)
			items.push({label: "Multiple", content: "Yes"});
		else
			items.push({label: "Multiple", content: ""});
		// items.push({label: "Strings", content: item.strings});
		// query answers
		items.push({label: "", content: ""});
		items.push({label: "Result:", content: ""});
		items.push({label: "", content: ""});
		$scope.items = items;
		$scope.results = [];
		$scope.showScoreFlag = false;
		PollService.pollAnswers({"id": item.id}, function(r){
			let options = JSON.parse(item.strings);
			let amount = 0;
			for(let i in r)
				amount += r[i].score;
			for(let i in options){
				let answer = {};
				answer.label = options[i];
				answer.value = "";
				answer.percentage = 0;
				answer.votes = 0;
				if(r[i].votes>0){
					answer.percentage = (r[i].score*100/amount).toFixed(2);
					answer.votes = r[i].votes;
				}
				if(item.type==0){
					$scope.showScoreFlag = true;
					answer.score = (r[i].score*100).toFixed(5);
				}
				$scope.results.push(answer);
			}
			$scope.showLoadingFlag = false;
		});
	};
}