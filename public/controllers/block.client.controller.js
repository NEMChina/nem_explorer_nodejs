angular.module("webapp").controller("BlockController", ["$scope", "$timeout", "$interval", "BlockService", "TXService", BlockController]);
angular.module("webapp").controller("SearchBlockController", ["$scope", "$location", "BlockService", "TXService", SearchBlockController]);

function BlockController($scope, $timeout, $interval, BlockService, TXService){
	$scope.page = 1;
	$scope.blockList = [];
	$scope.fadeFlag = false;
	$scope.loadBlockList = function(){
		BlockService.blockList({"page": $scope.page}, function(r_blockList){
			$scope.blockList = r_blockList;
			for(let index in r_blockList){
				let block = $scope.blockList[index];
				block.time = block.timeStamp;
				block.timeStamp = fmtDate(block.timeStamp);
				block.txFee = fmtXEM(block.txFee);
			}
			$scope.updateAge();
			$timeout(function(){
				$scope.fadeFlag = true;
			});	
		});
	};
	$scope.addBlock = function(){
		BlockService.blockList({"page": $scope.page}, function(r_blockList){
			if(!r_blockList || r_blockList.length==0)
				return;
			r_blockList.reverse();
			r_blockList.forEach(block => {
				let lastHeight = 0;
				if($scope.blockList && $scope.blockList.length>0)
					lastHeight = $scope.blockList[0].height;
				if(block.height<=lastHeight)
					return;
				block.time = block.timeStamp;
				block.timeStamp = fmtDate(block.timeStamp);
				block.txFee = fmtXEM(block.txFee);
				$scope.blockList.splice(9, 1);
				$scope.blockList.unshift(block);
				$scope.updateAge();
			});
		});
	};
	// block age
	$interval(function() {
		$scope.updateAge();
	}, 1000);
	$scope.updateAge = function(){
		let nowTime = new Date().getTime();
		for(let index in $scope.blockList){
			let block = $scope.blockList[index];
			if(!block)
				continue;
			block.age = compareTime(nowTime, block.time);
		}
	};
	$scope.nextPage = function(){
		$scope.page++;
		$scope.fadeFlag = false;
		$scope.loadBlockList();
	};
	$scope.previousPage = function(){
		if($scope.page>1){
			$scope.page--;
			$scope.fadeFlag = false;
			$scope.loadBlockList();
		}
	};
	$scope.showBlockTxesFlag = false;
	$scope.showBlockTxes = function(txes, index, $event){
		$scope.currentBlock = $scope.blockList[index];
		$scope.selectedBlockHeight = $scope.currentBlock.height;
		//just skip the action when click from <a>
		if($event!=null && $event.target!=null && $event.target.className.indexOf("noDetail")!=-1){
			return;
		}
		let txArr = [];
		let tx = {};
		for(let i in txes){
			let item = txes[i];
			tx = {};
			tx.hash = item.hash;
			if(item.tx.type==4100 && item.tx.otherTrans && !item.tx.otherTrans.modifications){ //multisig transaction
				tx.time = fmtDate(item.tx.otherTrans.timeStamp);
				tx.amount = fmtXEM(item.tx.otherTrans.amount);
				tx.fee = fmtXEM(item.tx.otherTrans.fee);
				tx.sender = item.tx.otherTrans.sender;
				tx.recipient = item.tx.otherTrans.recipient;
			} else {
				tx.time = fmtDate(item.tx.timeStamp);
				tx.amount = item.tx.amount?fmtXEM(item.tx.amount):0;
				tx.fee = fmtXEM(item.tx.fee);
				tx.sender = item.tx.signerAccount;
				if(item.tx.remote)
					tx.recipient = item.tx.remote;
				else
					tx.recipient = item.tx.recipient;
			}
			tx.amount = fixAmountWhenMosaicTransfer(item.tx);
			tx.height = item.tx.height;
			tx.signature = item.tx.signature;
			txArr.push(tx);
		}
		if(txArr.length>0){
			$scope.showBlockTxesFlag = true;
		} else {
			$scope.showBlockTxesFlag = false;
		}
		$scope.txList = txArr;
	}
	//load transaction detail
	$scope.showTx = function(height, hash, $event){
		$scope.selectedTXHash = hash;
		//just skip the action when click from <a>
		if($event!=null && $event.target!=null && $event.target.className.indexOf("noDetail")!=-1){
			return;
		}
		$("#txDetail").modal("show");
		return showTransaction(height, hash, $scope, TXService);
	}
	$scope.loadBlockList();
	// websocket - new block
	let sock = new SockJS('/ws/block');
	sock.onmessage = function(e) {
		if(!e || !e.data)
			return;
		let block = JSON.parse(e.data);
		if(!block.height)
			return;
		$scope.addBlock();
    };
}

function SearchBlockController($scope, $location, BlockService, TXService){
	let absUrl = $location.absUrl();
	if(absUrl==null){
		return;
	}
	let reg = /height=([0-9]+)/;
	if(absUrl.match(reg).length==2){
		let height = absUrl.match(reg)[1];
		BlockService.blockAtBySearch({"height": parseInt(height)}, function(r_block){
			$scope.currentBlock = r_block;
			if(!r_block || !r_block.height) {
				$scope.blockItems = [{label: "Not Found", content: ""}];
				return;
			}
			//load block detail
			let list = [
			    {label: "Height", content: r_block.height},
			    {label: "Timestamp", content: fmtDate(r_block.timeStamp)},
			    {label: "Difficulty", content: r_block.difficulty=="#"?"#":fmtDiff(r_block.difficulty)},
			    {label: "Txes", content: r_block.txAmount},
			    {label: "Fees", content: fmtXEM(r_block.txFee)},
			    {label: "Harvester", content: r_block.signer},
			    {label: "Block Hash", content: r_block.hash}
			];
			$scope.blockItems = list;
			//load tx list
			if(r_block.txes==null){
				return;
			}
			let txArrray = [];
			let tx = null;
			r_block.txes.forEach(tx => {
				tx.time = fmtDate(tx.timeStamp);
				tx.amount = tx.amount?fmtXEM(tx.amount):0;
				tx.fee = fmtXEM(tx.fee);
				txArrray.push(tx);
			});
			if(r_block.txes.length>0)
				$scope.showBlockTransactionsFlag = true;
			else
				$scope.showBlockTransactionsFlag = false;
			$scope.txList = txArrray;
		});
	}
	//load transaction detail
	$scope.showTx = function(tx, $event){
		$scope.selectedTXHash = tx.hash;
		//just skip the action when click from <a>
		if($event!=null && $event.target!=null && $event.target.className.indexOf("noDetail")!=-1){
			return;
		}
		$("#txDetail").modal("show");
		return showTransaction(tx.height, tx.hash, $scope, TXService, tx.signature);
	}
}