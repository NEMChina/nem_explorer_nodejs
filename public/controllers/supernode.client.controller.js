angular.module("webapp").controller("SupernodeController", ["$scope", "SupernodeService", SupernodeController]);
angular.module("webapp").controller("SupernodeCustomController", ["$scope", "$timeout", "$cookies", "SupernodeService", SupernodeCustomController]);

function SupernodeController($scope, SupernodeService){
	$scope.changeSelectOption = function(){
		if(!$scope.select.value)
			return;
		SupernodeService.payoutList({"round": $scope.select.value}, function(r_payoutList) {
			if(!r_payoutList){
				$scope.payoutList = [];
				return;
			}
			for(let i in r_payoutList) {
				let payout = r_payoutList[i];
				payout.round = (payout.round-3) + "-" + payout.round;
				payout.recipient = "<a href='#s_account?account="+payout.recipient+"' target='_blank'>"+payout.recipient+"</a>";
				payout.amount = fmtXEM(payout.amount);
				payout.fee = fmtXEM(payout.fee);
				payout.timeStamp = fmtDate(payout.timeStamp);
				if(payout.supernodeName){
					payout.supernodeName = XBBCODE.process({
						text: payout.supernodeName,
						removeMisalignedTags: true,
						addInLineBreaks: false
					}).html;
				}
				if(i==0)
					$scope.payoutAddress = "<a href='#s_account?account="+payout.sender+"' target='_blank'>"+payout.sender+"</a>";
			}
			$scope.allPayoutList = r_payoutList;
			$scope.payoutList = r_payoutList;
		});
	};
	SupernodeService.payoutRoundList(function(r_payoutRoundList){
		if(!r_payoutRoundList)
			return;
		$scope.selectOptions = r_payoutRoundList;
		$scope.select = $scope.selectOptions[0];
		$scope.changeSelectOption();
	});
}

function SupernodeCustomController($scope, $timeout, $cookies, SupernodeService){
	$scope.tableList = [];
	$scope.payoutMap = new Map();
	$scope.roundSet = new Set();
	$scope.supernodeMap = new Map();
	$scope.selectedSupernodeNames = [];
	$scope.selectedSupernodeNamesText = "";
	$scope.showLoadingFlag = true;
	$scope.showButtonFlag = false;
	$scope.showWarningFlag = false;
	$scope.page = 1;
	$scope.loadingFlag = false; //load more use
	$scope.endFlag = false;
	
	SupernodeService.supernodeList(function (data) {
		if (!data || data.length == 0) {
			$scope.items = [{ label: "Supernodes data Not Found", content: "" }];
			return;
		}
		$scope.supernodeList = data;
		for(let i in data){
			$scope.supernodeMap.set(""+data[i].id, data[i].name);
		}
		//check cookies
		let mySupernodes = $cookies.get("mySupernodes")?$cookies.get("mySupernodes"):"";
		if(mySupernodes){
			$scope.showLoadingFlag = true;
			mySupernodes = validateNumberCookies(mySupernodes, $scope.supernodeMap);
			let mySupernodesArr = mySupernodes.split(",");
			for(let i in mySupernodesArr) $scope.selectedSupernodeNamesText += $scope.supernodeMap.get(""+mySupernodesArr[i])+","
			$scope.selectedPayoutList10Rounds()
		}else{
			$scope.showLoadingFlag = false;
			$scope.showWarningFlag = true;
		}

		$scope.showButtonFlag = true;

		$scope.loadMore = function(){
			if($scope.loadingFlag==true) return;
			$scope.loadingFlag = true;
			$scope.selectedPayoutList10Rounds()
		};
	});
	$scope.loadPayoutList = function(refreshFlag){
		// clean table list
		$scope.tableList = [];
		
		// load my supernodes from cookies
		let mySupernodes = $cookies.get("mySupernodes")?$cookies.get("mySupernodes"):"";
		mySupernodes = validateNumberCookies(mySupernodes, $scope.supernodeMap);
		let mySupernodesArr = mySupernodes.split(",");
		if(mySupernodesArr.length==1 && mySupernodesArr[0]==""){
			$scope.showWarningFlag = true;
		} else {
			$scope.roundSet.forEach(function(round){
				let table = {};
				let payoutList = [];
				let realPayoutCount = 0;
				for(let i in mySupernodesArr){
					if(!$scope.supernodeMap.get(mySupernodesArr[i]))
						continue;
					let index = round + "_" + mySupernodesArr[i];
					let payout = $scope.payoutMap.get(index);
					let failFlag = "x";
					if(!payout){
						payout = {};
						payout.recipient = failFlag;
						payout.amount = failFlag;
						payout.fee = failFlag;
						payout.recipient = failFlag;
						payout.timeStamp = failFlag;
						payout.supernodeName = $scope.supernodeMap.get(mySupernodesArr[i]);
					} else {
						realPayoutCount++;
					}
					payoutList.push(payout);
				}
				table.round = (round-3) + "-" + round + " (" + realPayoutCount + "/" + payoutList.length + ")";
				table.payoutList = payoutList;
				$scope.tableList.push(table);
			});
			$scope.loadingFlag = false;
			$scope.showWarningFlag = false;
			$scope.showLoadingFlag = false;
		}
		if(refreshFlag)
			$scope.$applyAsync();
	}

	$scope.showManageMySupernodes = function(){
		$("#manageMySupernodes").modal("show");
		if(!$scope.initTableFlag){
			$scope.initTableFlag = true;
			$scope.datatable = $('#supernodeTable').DataTable({
				"select": {style: true},
		    	"paging": false,
		        "ordering": false,
		        "searching": true,
		        "columnDefs": [
					{"searchable": false, "targets": 0}
				]
	    	});
	    	// load selected supernodes from cookie
	    	let mySupernodes = validateNumberCookies($cookies.get('mySupernodes'));
	    	if(mySupernodes){
	    		mySupernodes = "," + mySupernodes + ",";
	    		for(let i in $scope.supernodeList){
	    			if(mySupernodes.indexOf("," + $scope.supernodeList[i].id + ",")!=-1){
	    				let item = {};
	    				item.id = $scope.supernodeList[i].id;
	    				item.name = $scope.supernodeList[i].name;
	    				$scope.addMySupernodes(item);
	    				$scope.datatable.rows(i).select();
	    			}
	    		}
	    	}
	    	$scope.datatable.on('select', function(e, dt, type, indexes){
	    		if(!indexes || indexes.length==0)
	    			return;
	    		// add supernode
	    		$scope.addMySupernodes($scope.supernodeList[indexes[0]], true);
	    		// add value into cookies
				$scope.addMySupernodesCookies($scope.supernodeList[indexes[0]]);
	    	});
	    	$scope.datatable.on('deselect', function(e, dt, type, indexes){
	    		if(!indexes || indexes.length==0)
	    			return;
	    		// remove supernode from UI
	    		$scope.removeMySupernodes($scope.supernodeList[indexes[0]], true);
	    		// remove value from cookies
				$scope.removeMySupernodesCookies($scope.supernodeList[indexes[0]]);
	    	});
		}
	};

	//get data after modal closed
	$('#manageMySupernodes').on('hidden.bs.modal', function(){
		// clean table list
		$scope.tableList = [];
		//clean roundSet
		$scope.roundSet.clear()
		$scope.$apply();
		$scope.endFlag = false;
		//reset page
		$scope.page = 1
		if($scope.selectedSupernodeNamesText){
			$scope.loadingFlag = true;
			$scope.showWarningFlag = false;
			$scope.selectedPayoutList10Rounds()
		}else{
			$scope.showLoadingFlag = false;
			$scope.showWarningFlag = true;
			$scope.$apply();
		}
	})

	//get selected supernodes 10 rounds data
	$scope.selectedPayoutList10Rounds = function(){
		SupernodeService.selectedPayoutList10Rounds({"supernodeName": $scope.selectedSupernodeNamesText, "page": $scope.page},function(r_payoutList){
			if(r_payoutList.length == 0 || r_payoutList.length == "" || r_payoutList.length == null || r_payoutList.length == undefined){
				$scope.endFlag = true;
				return;
			}
			// load pay out data list
			for(let i in r_payoutList){
				let payout = r_payoutList[i];
				if(payout.round && !$scope.roundSet.has(payout.round))
					$scope.roundSet.add(payout.round);
				payout.recipient = "<a href='#s_account?account="+payout.recipient+"' target='_blank'>"+payout.recipient+"</a>";
				payout.amount = fmtXEM(payout.amount);
				payout.fee = fmtXEM(payout.fee);
				payout.timeStamp = fmtDate(payout.timeStamp);
				if(payout.supernodeName){
					payout.supernodeName = XBBCODE.process({
						text: payout.supernodeName,
						removeMisalignedTags: true,
						addInLineBreaks: false
					}).html;
				}
				$scope.payoutMap.set(payout.round+"_"+payout.supernodeID,payout);
			}
			$scope.page++
			$scope.loadPayoutList(true);
		});
	}
	$scope.addMySupernodes = function(item, refreshFlag){
		$scope.selectedSupernodeNames.push(item.name);
		let text = "";
		for(let i in $scope.selectedSupernodeNames)
			text += $scope.selectedSupernodeNames[i] + ",";
		if(text)
			text = text.substring(0, text.length-1);
		$scope.selectedSupernodeNamesText = text;
		if(refreshFlag)
			$scope.$applyAsync();
	};
	$scope.removeMySupernodes = function(item, refreshFlag){
		// remove name
		let selectedSupernodeNames_new = [];
		for(let i in $scope.selectedSupernodeNames){
			if(item.name!=$scope.selectedSupernodeNames[i])
				selectedSupernodeNames_new.push($scope.selectedSupernodeNames[i]);
		}
		$scope.selectedSupernodeNames = selectedSupernodeNames_new;
		let text = "";
		for(let i in $scope.selectedSupernodeNames)
			text += $scope.selectedSupernodeNames[i] + ", ";
		if(text)
			text = text.substring(0, text.length-2);
		$scope.selectedSupernodeNamesText = text;
		if(refreshFlag)
			$scope.$applyAsync();
	};
	$scope.addMySupernodesCookies = function(item){
		let mySupernodes = validateNumberCookies($cookies.get("mySupernodes"));
		let expireDate = new Date();
		expireDate.setFullYear(expireDate.getFullYear() + 1);
		if(!mySupernodes)
			mySupernodes = item.id;
		else
			mySupernodes += "," + item.id;
		mySupernodes = sortMySupernodes(mySupernodes);
		$cookies.put("mySupernodes", mySupernodes, {expires: expireDate});
	};
	$scope.removeMySupernodesCookies = function(item){
		let mySupernodes = validateNumberCookies($cookies.get("mySupernodes"));
		let expireDate = new Date();
		expireDate.setFullYear(expireDate.getFullYear() + 1);
		if(!mySupernodes)
			return;
		let mySupernodesArr = mySupernodes.split(",");
		mySupernodes = "";
		for(let i in mySupernodesArr){
			if(mySupernodesArr[i]!=item.id)
				mySupernodes += mySupernodesArr[i] + ",";
		}
		if(mySupernodes.length>0)
			mySupernodes = mySupernodes.substring(0, mySupernodes.length-1);
		mySupernodes = sortMySupernodes(mySupernodes);
		$cookies.put("mySupernodes", mySupernodes, {expires: expireDate});
	};

}

function sortMySupernodes(mySupernodes){
	if(!mySupernodes)
		return;
	mySupernodes = "" + mySupernodes;
	let mySupernodesArr = mySupernodes.split(",");
	mySupernodesArr.sort(sortNumber);
	let r_mySupernodes = "";
	for(let i in mySupernodesArr)
		r_mySupernodes += mySupernodesArr[i] + ",";
	if(r_mySupernodes!="")
		r_mySupernodes = r_mySupernodes.substring(0, r_mySupernodes.length-1);
	return r_mySupernodes;
}

function validateNumberCookies(value, supernodesMap){
	if(!value){
		return "";
	}
	let arr = value.split(",");
	let r_value = "";
	for(let i in arr){
		if(isNaN(Number(arr[i])))
			continue;
		if(supernodesMap && !supernodesMap.get(""+arr[i]))
			continue;
		r_value += arr[i] + ",";
	}
	if(r_value.length>0)
		r_value = r_value.substring(0, r_value.length-1);
	return r_value;
}

function sortNumber(a, b) {
	return a - b;
}