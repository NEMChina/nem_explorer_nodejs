angular.module("webapp").controller("NavController", ["$scope", NavController]);

function NavController($scope){
	$scope.go = function(page){
		window.location.href = page;
	};
	$scope.search = function(){
		var searchContent = $.trim($("#searchInput").val());
		var reg_block = /^\d+$/;
		var reg_tx= /^\w{64}$/;
		var reg_account= /^\w{40}$/;
		var reg_account2= /^\w{6}-\w{6}-\w{6}-\w{6}-\w{6}-\w{6}-\w{4}$/;
		if(searchContent==null || searchContent==""){
			$("#warningContent").html("Please enter corrent block height, tx id, account");
			$("#warning").attr("class", "alert alert-warning");
			$("#warning").show();
		} else if(!reg_block.test(searchContent) 
				&& !reg_tx.test(searchContent) 
				&& !reg_account.test(searchContent) 
				&& !reg_account2.test(searchContent)){
			$("#warningContent").html("Please enter corrent block height, tx id, account");
			$("#warning").attr("class", "alert alert-warning");
			$("#warning").show();
		} else {
			if(reg_block.test(searchContent)){
				window.open("s_block.html?height="+searchContent);
			} else if(reg_tx.test(searchContent)){
				window.open("s_tx.html?hash="+searchContent);
			} else if(reg_account.test(searchContent) || reg_account2.test(searchContent)){
				window.open("s_account.html?account="+searchContent);
			} 
		}
	};
}