angular.module("webapp").controller("TXController", ["$scope", "TXService", TXController]);
angular.module("webapp").controller("SearchTXController", ["$scope", "$location", "TXService", SearchTXController]);

function TXController($scope, TXService){
	$scope.page = 1;
	$scope.loadTXList = function(){
		TXService.txList({"page": $scope.page}, function(r_txList){
			$scope.txList = r_txList;
			for(let i in $scope.txList){
				let tx = $scope.txList[i];
				tx.timeStamp = fmtDate(tx.timeStamp);
				tx.amount = fmtXEM(tx.amount);
				tx.fee = fmtXEM(tx.fee);
			}
		});
	}
	$scope.nextPage = function(){
		$scope.page++;
		$scope.loadTXList();
	};
	$scope.previousPage = function(){
		if($scope.page>1){
			$scope.page--;
			$scope.loadTXList();
		}
	};
	//load transaction detail
	$scope.showTx = function(index, $event){;
		//just skip the action when click from <a>
		if($event!=null && $event.target!=null && $event.target.className.indexOf("noDetail")!=-1){
			return;
		}
		$("#txDetail").modal("show");
		let hash = $scope.txList[index].hash;
		let height = $scope.txList[index].height;
		return showTransaction(height, hash, $scope, TXService);
	};
	$scope.loadTXList();
}

function SearchTXController($scope, $location, TXService){
	var absUrl = $location.absUrl();
	if(absUrl==null){
		return;
	}
	var reg = /hash=(\w{64})/;
	if(absUrl.match(reg).length==2){
		var hash = absUrl.match(reg)[1];
		showTransaction(null, hash, $scope, TXService);
	}
}