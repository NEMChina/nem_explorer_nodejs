angular.module("webapp").controller("AccountController", ["$scope", "AccountService", AccountController]);
angular.module("webapp").controller("SearchAccountController", ["$scope", "$location", "AccountService", "TXService", SearchAccountController]);

function AccountController($scope, AccountService){
	$scope.selectOptions = [
        {"key": "Top100 - Rich List", "value": 1},
        {"key": "Top100 - Harvested List", "value": 2}
	];
	$scope.select = $scope.selectOptions[0];
	$scope.changeSelectOption = function(){
		if($scope.select.value==1){ //rich list
			AccountService.accountList(function(r_accountList){
				$scope.accountList = r_accountList;
				$scope.accountList.forEach(function(account) {
					account.timeStamp = fmtDate(account.timeStamp);
					account.balance = fmtXEM(account.balance);
					account.importance = fmtPOI(account.importance);
				});
			});
		} else if($scope.select.value==2) { //harvester list
			AccountService.harvesterList(function(r_harvesterList){
				$scope.harvesterList = r_harvesterList;
				$scope.harvesterList.forEach(function(account) {
					account.fees = fmtXEM(account.fees);
					account.importance = fmtPOI(account.importance);
				});
			});
		}
	}
	$scope.changeSelectOption();
}

function SearchAccountController($scope, $location, AccountService, TXService){
	$scope.hideMore = false;
	var absUrl = $location.absUrl();
	if(absUrl==null){
		return;
	}
	var reg = /account=(\w{40}|(\w{6}-\w{6}-\w{6}-\w{6}-\w{6}-\w{6}-\w{4}))/;
	if(absUrl.match(reg) && absUrl.match(reg).length>=2){
		var account = absUrl.match(reg)[1];
		account = account.replace(new RegExp(/(-)/g), '').toUpperCase();
		$scope.searchAccount = account;
		let params = {address: account};
		AccountService.detail(params, function(data) {
			if(!data || !data.address){
				$scope.accountItems = [{label: "Not Found", content: ""}];
				$scope.hideMore = true;
				return;
			}
			//load account detail
			var list = [];
			list.push({label: "Address", content: data.address});
			list.push({label: "Public Key", content: data.publicKey});
			list.push({label: "Balance", content: ""+fmtXEM(data.balance)});
			list.push({label: "Importance", content: fmtPOI(data.importance)});
			if(data.timeStamp!=null){
				list.push({label: "Last timeStamp", content: fmtDate(data.timeStamp)});
			}
			if(data.remoteStatus!=null && data.remoteStatus=="ACTIVE"){
				list.push({label: "Harvest status", content: "enable"});
			} else {
				list.push({label: "Harvest status", content: "disabled"});
			}
			if(data.blocks!=null){
				list.push({label: "Harvested blocks", content: "" + data.blocks});
			}
			if(data.blocks!=null){
				list.push({label: "Harvested fees", content: "" + data.fees});
			}
			if(data.cosignatories!=null && data.cosignatories!=""){
				list.push({label: "Multisig account", content: "Yes"});
				list.push({label: "cosignatories", content: data.cosignatories});
			}
			$scope.accountItems = list;
			//load tx list
			if(!data.txes){
				return;
			}
			for(i in data.txes){
				let tx = data.txes[i];
				tx.timeStamp = fmtDate(tx.timeStamp);
				tx.amount = fmtXEM(tx.amount);
				tx.fee = fmtXEM(tx.fee);
				$scope.lastID = tx.id;
			}
			if(data.txes.length<25){
				$scope.hideMore = true;
			}
			$scope.txList = data.txes;
		});
	}
	//load transaction detail
	$scope.showTx = function(height, hash, $event){
		//just skip the action when click from <a>
		if($event!=null && $event.target!=null && $event.target.className.indexOf("noDetail")!=-1){
			return;
		}
		$("#txDetail").modal("show");
		return showTransaction(height, hash, $scope, TXService);
	};
	//load more transaction
	$scope.loadMore = function(){
		$scope.loadingMore = true;
		let params = {address: $scope.searchAccount, id: $scope.lastID};
		AccountService.detailTXList(params, function(data) {
			if(!data){
				$scope.hideMore = true;
				return;
			}
			for(i in data) {
				let tx = data[i];
				tx.timeStamp = fmtDate(tx.timeStamp);
				tx.amount = fmtXEM(tx.amount);
				tx.fee = fmtXEM(tx.fee);
				$scope.lastID = tx.id;
			}
			if($scope.txList){
				$scope.txList = $scope.txList.concat(data);
			} else {
				$scope.txList = data;
			}
			if(data.length==0 || data.length<25){
				$scope.hideMore = true;
			}
			$scope.loadingMore = false;
		});
	};	
}