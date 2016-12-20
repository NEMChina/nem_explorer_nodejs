angular.module("webapp").controller("BlockController", ["$scope", "BlockService", "TXService", BlockController]);
angular.module("webapp").controller("SearchBlockController", ["$scope", "$location", "BlockService", "TXService", SearchBlockController]);

function BlockController($scope, BlockService, TXService){
	$scope.page = 1;
	$scope.blockList = [];
	$scope.loadBlockList = function(){
		BlockService.blockList({"page": $scope.page}, function(r_blockList){
			$scope.blockList = r_blockList;
			$scope.blockList.forEach(function(block, index) {
				block.timeStamp = fmtDate(block.timeStamp);
				block.txFee = fmtXEM(block.txFee);
			});
		});
	};
	$scope.nextPage = function(){
		$scope.page++;
		$scope.loadBlockList();
	};
	$scope.previousPage = function(){
		if($scope.page>1){
			$scope.page--;
			$scope.loadBlockList();
		}
	};
	$scope.showBlockTxesFlag = false;
	$scope.showBlockTxes = function(txes, index, $event){
		$scope.currentBlock = $scope.blockList[index];
		//just skip the action when click from <a>
		if($event!=null && $event.target!=null && $event.target.className.indexOf("noDetail")!=-1){
			return;
		}
		let txArr = [];
		let tx = {};
		txes.forEach(function(item){
			tx = {};
			tx.hash = item.hash;
			tx.time = fmtDate(item.tx.timeStamp);
			tx.amount = tx.amount?fmtXEM(item.tx.amount):0;
			tx.fee = fmtXEM(item.tx.fee);
			tx.sender = item.tx.signerAccount;
			tx.recipient = item.tx.recipient;
			tx.height = item.tx.height;
			tx.signature = item.tx.signature;
			txArr.push(tx);
		});
		if(txArr.length>0){
			$scope.showBlockTxesFlag = true;
		} else {
			$scope.showBlockTxesFlag = false;
		}
		$scope.txList = txArr;
	}
	//load transaction detail
	$scope.showTx = function(height, hash, $event){
		//just skip the action when click from <a>
		if($event!=null && $event.target!=null && $event.target.className.indexOf("noDetail")!=-1){
			return;
		}
		$("#txDetail").modal("show");
		return showTransaction(height, hash, $scope, TXService);
		
	}
	$scope.loadBlockList();
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
			    {label: "Hash", content: r_block.hash}
			];
			$scope.blockItems = list;
			//load tx list
			if(r_block.txes==null){
				return;
			}
			let txArrray = [];
			let tx = null;
			r_block.txes.forEach(item => {
				tx = {};
				if(parseInt(height)==1){
					tx.hash = "#";
					tx.time = fmtDate(item.timeStamp);
					tx.amount = item.amount?fmtXEM(item.amount):0;
					tx.fee = fmtXEM(item.fee);
					tx.sender = item.signerAccount;
					tx.recipient = item.recipient;
					tx.height = item.height;
					tx.signature = item.signature;
				} else {
					tx.hash = item.hash;
					tx.time = fmtDate(item.tx.timeStamp);
					tx.amount = item.tx.amount?fmtXEM(item.tx.amount):0;
					tx.fee = fmtXEM(item.tx.fee);
					tx.sender = item.tx.signerAccount;
					tx.recipient = item.tx.recipient;
					tx.height = item.tx.height;
					tx.signature = item.tx.signature;
				}
				txArrray.push(tx);
			});
			if(r_block.txes.length>0){
				$scope.showBlockTransactionsFlag = true;
			} else {
				$scope.showBlockTransactionsFlag = false;
			}
			$scope.txList = txArrray;
		});
	}
	//load transaction detail
	//load transaction detail
	$scope.showTx = function(height, hash, $event){
		//just skip the action when click from <a>
		if($event!=null && $event.target!=null && $event.target.className.indexOf("noDetail")!=-1){
			return;
		}
		$("#txDetail").modal("show");
		return showTransaction(height, hash, $scope, TXService);
	}
}