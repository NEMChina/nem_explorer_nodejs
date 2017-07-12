angular.module("webapp").controller("TXController", ["$scope", "$location", "TXService", TXController]);
angular.module("webapp").controller("SearchTXController", ["$scope", "$location", "TXService", SearchTXController]);

function TXController($scope, $location, TXService){
	let type = "";
	let absUrl = $location.absUrl();
	let reg = /type=([a-z]+)/;
	if(absUrl && absUrl.match(reg) && absUrl.match(reg).length==2){
		type = absUrl.match(reg)[1];
	}
	$scope.page = 1;
	$scope.loadTXList = function(){
		TXService.txList({"page": $scope.page, "type": type}, function(r_txList){
			$scope.txList = r_txList;
			for(let i in $scope.txList){
				let tx = $scope.txList[i];
				tx.timeStamp = fmtDate(tx.timeStamp);
				tx.amount = fmtXEM(tx.amount);
				tx.fee = fmtXEM(tx.fee);
				tx.TypeName = "";
				if(tx.type==257)
					tx.typeName = "transfer";
				if(tx.type==2049)
					tx.typeName = "importance";
				if(tx.type==4097 || tx.type==4098 || tx.type==4099 || tx.type==4100)
					tx.typeName = "multisig";
				if(tx.type==8193)
					tx.typeName = "namespace";
				if(tx.type==16385 || tx.type==16386)
					tx.typeName = "mosaic";
				if(tx.type==10001)
					tx.typeName = "apostille";
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