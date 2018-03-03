angular.module("webapp").controller("NavController", ["$scope", "$location", "$rootScope", NavController]);

function NavController($scope, $location, $rootScope){

	$rootScope.$on('$routeChangeSuccess', function () {
		let path = $location.path();
		let absUrl = $location.absUrl();
		$rootScope.navClass1 = (path == "/blocklist" || path == "/s_block" || path == "/" || path == "") ? "active" : "";
		$rootScope.navClass2 = (path == "/txlist" || path == "/s_tx" || path == "/unconfirmedtxlist") ? "active" : "";
		$rootScope.navClass21 = path == "/txlist" ? "active" : "";
		$rootScope.navClass22 = path == "/unconfirmedtxlist" ? "active" : "";
		$rootScope.navClass23 = absUrl.indexOf("type=transfer") != -1 ? "active" : "";
		$rootScope.navClass24 = absUrl.indexOf("type=importance") != -1 ? "active" : "";
		$rootScope.navClass25 = absUrl.indexOf("type=aggregate") != -1 ? "active" : "";
		$rootScope.navClass26 = absUrl.indexOf("type=multisig") != -1 ? "active" : "";
		$rootScope.navClass27 = absUrl.indexOf("type=namespace") != -1 ? "active" : "";
		$rootScope.navClass28 = absUrl.indexOf("type=mosaic") != -1 ? "active" : "";
		$rootScope.navClass29 = absUrl.indexOf("type=apostille") != -1 ? "active" : "";
		$rootScope.navClass3 = (path == "/accountlist" || path == "/harvesterlist" || path == "/harvestingCalculator" || path == "/s_account") ? "active" : "";
		$rootScope.navClass31 = path == "/accountlist" ? "active" : "";
		$rootScope.navClass32 = path == "/harvesterlist" ? "active" : "";
		$rootScope.navClass33 = path == "/harvestingCalculator" ? "active" : "";
		$rootScope.navClass4 = (path == "/nodelist" || path == "/supernodepayout" || path == "/supernodepayout_custom") ? "active" : "";
		$rootScope.navClass41 = path == "/nodelist" ? "active" : "";
		$rootScope.navClass42 = path == "/supernodepayout" ? "active" : "";
		$rootScope.navClass43 = path == "/supernodepayout_custom" ? "active" : "";
		$rootScope.navClass5 = (path == "/mosaictransfer" || path == "/mosaiclist" || path == "/namespacelist" || path == "/namespace") ? "active" : "";
		$rootScope.navClass51 = path == ("/namespacelist" || path == "/namespace") ? "active" : "";
		$rootScope.navClass52 = path == "/mosaiclist" ? "active" : "";
		$rootScope.navClass53 = path == "/mosaictransfer" ? "active" : "";
		$rootScope.navClass6 = (path == "/polllist" || path == "/poll") ? "active" : "";
	});

	$scope.go = function(module) {
		location.href = module;
	}

	$scope.search = function(){
		var searchContent = $.trim($("#searchInput").val());
		var reg_block = /^\d+$/;
		var reg_tx= /^\w{64}$/;
		var reg_account= /^\w{40}$/;
		var reg_account2= /^\w{6}-\w{6}-\w{6}-\w{6}-\w{6}-\w{6}-\w{4}$/;
		if(searchContent==null || searchContent==""){
			$("#warningContent").html("Please enter corrent block height, tx id, account address");
			$("#warning").attr("class", "alert alert-warning");
			$("#warning").show();
		} else if(!reg_block.test(searchContent) 
				&& !reg_tx.test(searchContent) 
				&& !reg_account.test(searchContent) 
				&& !reg_account2.test(searchContent)){
			$("#warningContent").html("Please enter corrent block height, tx id, account address");
			$("#warning").attr("class", "alert alert-warning");
			$("#warning").show();
		} else {
			if(reg_block.test(searchContent)){
				window.open("#s_block?height="+searchContent);
			} else if(reg_tx.test(searchContent)){
				window.open("#s_tx?hash="+searchContent);
			} else if(reg_account.test(searchContent) || reg_account2.test(searchContent)){
				window.open("#s_account?account="+searchContent);
			} 
		}
	};
}