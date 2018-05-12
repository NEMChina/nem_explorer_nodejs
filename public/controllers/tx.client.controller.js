angular.module("webapp").controller("TXController", ["$scope", "$timeout", "$interval", "$location", "TXService", TXController]);
angular.module("webapp").controller("SearchTXController", ["$scope", "$location", "TXService", SearchTXController]);
angular.module("webapp").controller("UnconfirmedTXController", ["$scope", "$timeout", "$interval", "$location", "TXService", UnconfirmedTXController]);

function TXController($scope, $timeout, $interval, $location, TXService){
	let type = "";
	let absUrl = $location.absUrl();
	let reg = /type=([a-z]+)/;
	if(absUrl && absUrl.match(reg) && absUrl.match(reg).length==2){
		type = absUrl.match(reg)[1];
	}
	$scope.page = 1;
	$scope.txList = [];
	$scope.txHashes = ",";
	$scope.fadeFlag = false;
	$scope.loadTXList = function(){
		TXService.txList({"page": $scope.page, "type": type}, function(r_txList){
			$scope.txHashes = ",";
			$scope.txList = r_txList;
			for(let i in $scope.txList){
				$scope.txHashes += $scope.txList[i].hash + ",";
				$scope.txList[i] = $scope.handleTX($scope.txList[i]);
			}
			$scope.updateAge();
			$timeout(function(){
				$scope.fadeFlag = true;
			});	
		});
	}
	$scope.addTX = function(){
		TXService.txList({"page": $scope.page, "type": type}, function(r_txList){
			for(let i=r_txList.length-1;i>=0;i--){
				let tx = r_txList[i];
				let searchHash = ","+tx.hash+",";
				if($scope.txHashes.indexOf(searchHash)!=-1)
					continue;
				tx = $scope.handleTX(r_txList[i]);
				let removeTX = $scope.txList[9];
				let removeHash = "," + removeTX.hash + ",";
				let addHash = "," + tx.hash + ",";
				$scope.txHashes = $scope.txHashes.replace(removeHash, addHash);
				$scope.txList.splice(9, 1);
				$scope.txList.unshift(tx);
			}
			$scope.updateAge();
			$timeout(function(){
				$scope.fadeFlag = true;
			});	
		});
	}
	// tx age
	$interval(function() {
		$scope.updateAge();
	}, 1000);
	$scope.updateAge = function(){
		let nowTime = new Date().getTime();
		for(let index in $scope.txList){
			let tx = $scope.txList[index];
			tx.age = compareTime(nowTime, tx.time);
		}
	};
	$scope.nextPage = function(){
		$scope.page++;
		$scope.fadeFlag = false;
		$scope.loadTXList();
	};
	$scope.previousPage = function(){
		if($scope.page>1){
			$scope.page--;
			$scope.fadeFlag = false;
			$scope.loadTXList();
		}
	};
	//load transaction detail
	$scope.showTx = function(index, $event){;
		$scope.selectedTXHash = $scope.txList[index].hash;
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
	// websocket - new block
	let sock = new SockJS('/ws/transaction');
	sock.onmessage = function(e) {
		if(!e || !e.data)
			return;
		$scope.addTX();
    };
    $scope.handleTX = function(tx) {
		if(!tx)
			return;
		tx.time = tx.timeStamp;
		tx.timeStamp = fmtDate(tx.timeStamp);
		tx.amount = fmtXEM(tx.amount);
		tx.fee = fmtXEM(tx.fee);
		tx.typeName = "";
		if(tx.type==257)
			tx.typeName += "transfer | ";
		if(tx.type==2049)
			tx.typeName += "importance | ";
		if(tx.type==4097)
			tx.typeName += "aggregate | ";
		if(tx.type==4100){
			tx.typeName += "multisig | ";
			if(tx.aggregateFlag==1)
				tx.typeName += "aggregate | ";
		}
		if(tx.type==8193)
			tx.typeName += "namespace | ";
		if(tx.type==16385 || tx.type==16386 || tx.mosaicTransferFlag==1)
			tx.typeName += "mosaic | ";
		if(tx.apostilleFlag==1)
			tx.typeName += "apostille | ";
		if(tx.typeName!="" && tx.typeName.length>=2)
			tx.typeName = tx.typeName.substring(0, tx.typeName.length-3);
		return tx;
	};
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

function UnconfirmedTXController($scope, $timeout, $interval, $location, TXService){
	$scope.txList = [];
	$scope.fadeFlag = false;
	$scope.loadUnconfirmedTXList = function(){
		TXService.unconfirmedTXList(function(r_txList){
			$scope.txList = r_txList;
			for(let i in $scope.txList)
				$scope.txList[i] = $scope.handleTX($scope.txList[i]);
			$scope.updateAge();
			$timeout(function(){
				$scope.fadeFlag = true;
			});
		});
	}
	// tx age
	$interval(function() {
		$scope.updateAge();
	}, 1000);
	$scope.updateAge = function(){
		let nowTime = new Date().getTime();
		for(let index in $scope.txList){
			let tx = $scope.txList[index];
			tx.age = compareTime(nowTime, tx.time);
		}
	};
	//load unconfirmed transaction detail
	$scope.showUnconfirmedTx = function(index, $event){
		$scope.selectedTXSign = $scope.txList[index].signature;
		//just skip the action when click from <a>
		if($event!=null && $event.target!=null && $event.target.className.indexOf("noDetail")!=-1){
			return;
		}
		$("#txDetail").modal("show");
		return showUnconfirmedTransaction($scope.txList[index], $scope);
	};
	$scope.loadUnconfirmedTXList();
	// websocket - unconfirmed transactions
	let sock = new SockJS('/ws/unconfirmed');
	sock.onmessage = function(e) {
		if(!e || !e.data)
			return;
		let data = JSON.parse(e.data);
		if(!data || !data.action)
			return;
		if(data.action == "add"){ //add new unconfirmed transaction
			let tx = $scope.handleTX(data.content);
			$scope.txList.unshift(tx);
		} else if(data.action == "remove"){
			let signature = data.content.signature;
			let newTxList = [];
			for(let i in $scope.txList){
				let item = $scope.txList[i];
				if(item && item.signature && item.signature!=signature)
					newTxList.push(item);
			}
			$scope.txList = newTxList;
		} else if(data.action == "update"){
			let tx = data.content;
			for(let i in $scope.txList){
				let item = $scope.txList[i];
				if(item && item.signature && item.signature==tx.signature){
					let tx = $scope.handleTX(data.content);
					$scope.txList[i] = tx;
				}
			}
		} else if(data.action == "expired"){
			let newTxList = [];
			let nowTime = new Data().getTime();
			for(let i in $scope.txList){
				let item = $scope.txList[i];
				if(!item)
					continue;
				let deadline = item.deadline * 1000 + Date.UTC(2015, 2, 29, 0, 6, 25, 0);
				if(nowTime <= deadline)
					newTxList.push(item);
			}
			$scope.txList = newTxList;
		}
		$scope.$apply();
    };
    $scope.handleTX = function(tx) {
		if(!tx)
			return;
		tx.time = tx.timeStamp;
		tx.timeStamp = fmtDate(tx.timeStamp);
		tx.deadline = fmtDate(tx.deadline);
		tx.amount = isNaN(tx.amount)?0:fmtXEM(tx.amount);
		tx.fee = fmtXEM(tx.fee);
		tx.typeName = "";
		if(tx.type==257)
			tx.typeName += "transfer | ";
		if(tx.type==2049)
			tx.typeName += "importance | ";
		if(tx.type==4097)
			tx.typeName += "aggregate | ";
		if(tx.type==8193)
			tx.typeName += "namespace | ";
		if(tx.type==16385 || tx.type==16386 || tx.mosaicTransferFlag==1)
			tx.typeName += "mosaic | ";
		if(tx.apostilleFlag==1)
			tx.typeName += "apostille | ";
		if(tx.aggregateFlag==1)
			tx.typeName += "aggregate | ";
		if(tx.type==4100){
			tx.typeName += "multisig | ";
			if(tx.otherTrans.type==4097)
				tx.typeName += "aggregate | ";
			tx.amount = tx.otherTrans.amount?fmtXEM(tx.otherTrans.amount):0;
			tx.fee = tx.otherTrans.fee?fmtXEM(tx.otherTrans.fee):0;
			tx.sender = tx.otherTrans.sender;
			tx.recipient = tx.otherTrans.recipient;
			tx.typeName = tx.typeName.replace("multisig", "multisig (" + tx.signed.length + "/" + tx.minSigned + ")");
		}
		if(tx.typeName!="" && tx.typeName.length>=2)
			tx.typeName = tx.typeName.substring(0, tx.typeName.length-3);
		return tx;
	};
}