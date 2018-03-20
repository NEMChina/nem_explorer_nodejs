angular.module("webapp").controller("HarvesterController", ["$scope", "AccountService", HarvesterController]);
angular.module("webapp").controller("HarvestingCalculatorController", ["$scope", HarvestingCalculatorController]);

function HarvesterController($scope, AccountService){
	$scope.page = 1;
	$scope.loadingFlag = false;
	$scope.endFlag = false;
	$scope.getHarvesterList = function(){
		$scope.loadingFlag = true;
		AccountService.harvesterList({"page": $scope.page}, function(r_harvesterList){
			for(let i in r_harvesterList){
				let account = r_harvesterList[i];
				account.fees = fmtXEM(account.fees);
				account.importance = fmtPOI(account.importance);
				if(account.remark && account.remark.length>60)
					account.remark = account.remark.substring(0, 59) + "..";
			}
			if($scope.harvesterList)
				$scope.harvesterList = $scope.harvesterList.concat(r_harvesterList);
			else
				$scope.harvesterList = r_harvesterList;
			if(r_harvesterList.length==0 || r_harvesterList.length<100)
				$scope.endFlag = true;
			$scope.loadingFlag = false;
		});
	}
	$scope.loadMore = function(){
		if($scope.loadingFlag==true)
			return;
		$scope.page++;
		$scope.getHarvesterList();
	};
	$scope.getHarvesterList();
}

function HarvestingCalculatorController($scope){
	// init chart
	let ctx = $('#myChart');
	$scope.chart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: [],
            datasets: [{
                label: "Vested Balance",
                fill: true,
                lineTension: 0.1,
                borderCapStyle: 'butt',
                borderDash: [],
                borderDashOffset: 0.0,
                borderJoinStyle: 'miter',
                pointBorderWidth: 1,
                pointHoverRadius: 3,
                pointHoverBorderWidth: 2,
                pointRadius: 0,
                pointHitRadius: 10,
                data: []
            }]
        },
        options: {
            animation: false,
            responsive: false
        }
    });
	$scope.balance = "10001";
	$scope.currentVestedBalance = "0";
	$scope.targetVestedBalance = "10000";
	$scope.updateChart = function(vestedBalanceArr){
		// get labels
		let labels = [];
		for(let i in vestedBalanceArr){
			labels.push("Day " + (parseInt(i)+1));
		}
		$scope.chart.data.labels = labels;
        $scope.chart.data.datasets[0].data = vestedBalanceArr;
        $scope.chart.update();
	};
	$scope.handle = function(){
		let balanceTxt = $scope.balance.replace(/\s+/, "").replace(/,/g, "");
		let currentVestedBalanceTxt = $scope.currentVestedBalance.replace(/\s+/, "").replace(/,/g, "");
		let targetVestedBalanceTxt = $scope.targetVestedBalance.replace(/\s+/, "").replace(/,/g, "");
		let balance = new Number(balanceTxt);
		let currentVestedBalance = new Number(currentVestedBalanceTxt);
		let targetVestedBalance = new Number(targetVestedBalanceTxt);
		if(balanceTxt=="" || isNaN(balance)){
			$scope.message = "Invalid balance.";
			return;
		}
		if(currentVestedBalanceTxt=="" || isNaN(currentVestedBalance)){
			$scope.message = "Invalid current vested balance.";
			return;
		}
		if(targetVestedBalanceTxt=="" || isNaN(targetVestedBalance)){
			$scope.message = "Invalid target vested balance.";
			return;
		}
		if(currentVestedBalance>=targetVestedBalance){
			$scope.message = "You are already past the target vested balance.";
			return;
		}
		if(balance<=targetVestedBalance){
			$scope.message = "You would never be able to reach the target vested balance.";
			return;
		}
		let maxDays = 365;
		let days = 0;
		let tempVestedBalance = currentVestedBalance;
		let vestedBalanceArr = [];
		while(days<=maxDays && tempVestedBalance<targetVestedBalance){
			days++;
			tempVestedBalance += (balance - tempVestedBalance) * 0.1;
			vestedBalanceArr.push(tempVestedBalance);
		}
		$scope.days = days;
		if(days>maxDays){
			$scope.message = "You won't be able to reach the target vested balance.";
			return;
		}
		$scope.message = "It would take " + days + " days to reach the target vested balance.";
		$scope.updateChart(vestedBalanceArr);
	};
	$scope.handle();
}