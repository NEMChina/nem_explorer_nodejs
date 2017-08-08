angular.module("webapp").controller("SupernodeController", ["$scope", "$timeout", "$cookieStore", "SupernodeService", SupernodeController]);

function SupernodeController($scope, $timeout, $cookieStore, SupernodeService){
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
			$scope.refreshPayoutListFromCookies();
		});
	}
	$scope.refreshPayoutListFromCookies = function(refreshFlag){
		// load selected supernodes from cookie
    	let mySupernodes = $cookieStore.get('mySupernodes');
    	console.info(mySupernodes);
    	if(!mySupernodes)
    		return;
    	let payoutList_new = [];
    	mySupernodes = "," + mySupernodes + ",";
    	for(let i in $scope.allPayoutList){
    		let payout = $scope.allPayoutList[i];
    		if(mySupernodes.indexOf(","+payout.supernodeID+",")!=-1){
    			payoutList_new.push(payout);
    		}
    	}
    	$scope.payoutList = payoutList_new;
    	if(refreshFlag)
    		$scope.$apply();
	};
	$scope.cleanMySupernodes = function(){
		// $scope.selectedSupernodeNamesText = "";
		// console.info($scope.datatable.rows().length);
	};
	SupernodeService.payoutRoundList(function(r_payoutRoundList){
		if(!r_payoutRoundList)
			return;
		$scope.selectOptions = r_payoutRoundList;
		$scope.select = $scope.selectOptions[0];
		$scope.changeSelectOption();
	});
	SupernodeService.supernodeList(function(data){
		if(!data || data.length==0){
			$scope.items = [{label: "Supernodes data Not Found", content: ""}];
			return;
		}
		$scope.supernodeList = data;
		$scope.selectedSupernodeNames = [];
		$scope.selectedSupernodeNamesText = "";

		// test (clear cookies) 
		// $cookieStore.remove('mySupernodes');

	});
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
	    	let mySupernodes = $cookieStore.get('mySupernodes');
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
	$scope.addMySupernodes = function(item, refreshFlag){
		$scope.selectedSupernodeNames.push(item.name);
		let text = "";
		for(let i in $scope.selectedSupernodeNames)
			text += $scope.selectedSupernodeNames[i] + ", ";
		if(text)
			text = text.substring(0, text.length-2);
		$scope.selectedSupernodeNamesText = text;
		if(refreshFlag)
			$scope.$apply();
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
			$scope.$apply();
	};
	$scope.addMySupernodesCookies = function(item){
		let mySupernodes = $cookieStore.get("mySupernodes");
		let expireDate = new Date();
		expireDate.setDate(expireDate.getDate() + 365);
		if(!mySupernodes)
			mySupernodes = item.id;
		else
			mySupernodes += "," + item.id;
		$cookieStore.put("mySupernodes", mySupernodes, {"expires": expireDate.toUTCString()});
		$scope.refreshPayoutListFromCookies(true);
	};
	$scope.removeMySupernodesCookies = function(item){
		let mySupernodes = $cookieStore.get("mySupernodes");
		let expireDate = new Date();
		expireDate.setDate(expireDate.getDate() + 365);
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
		$cookieStore.put("mySupernodes", mySupernodes, {"expires": expireDate.toUTCString()});
		$scope.refreshPayoutListFromCookies(true);
	};
}