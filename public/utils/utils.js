var NEM_EPOCH = Date.UTC(2015, 2, 29, 0, 6, 25, 0);

function fmtDate(input) {
	return new Date(input*1000 + NEM_EPOCH).format("yyyy-MM-dd hh:mm:ss");
}

function fmtXEM(input) {
	return parseInt((input/1000000));
}

function fmtPOI(input) {
	return (input*100).toFixed(5) + "%";
}

function fmtDiff(input) {
	return (input/Math.pow(10, 14)*100).toFixed(2) + "%";
}

//date format
Date.prototype.format = function(fmt) {
	var o = {
		"M+" : this.getMonth()+1,
		"d+" : this.getDate(),
		"h+" : this.getHours(),
		"m+" : this.getMinutes(),
		"s+" : this.getSeconds(),
		"q+" : Math.floor((this.getMonth()+3)/3)
	}; 
	if(/(y+)/.test(fmt))
		fmt = fmt.replace(RegExp.$1, (this.getFullYear()+"").substr(4 - RegExp.$1.length)); 
	for(var k in o) 
		if(new RegExp("("+ k +")").test(fmt)) 
	fmt = fmt.replace(RegExp.$1, (RegExp.$1.length==1) ? (o[k]) : (("00"+ o[k]).substr((""+ o[k]).length))); 
	return fmt; 
}

function showTransaction(height, hash, $scope, TXService) {
	TXService.tx({"height": height, "hash": hash}, function(data){
		if(!data || !data.tx){
			$scope.items = [{label: "Not Found", content: ""}];
			return;
		}
		var tx = data.tx;
		var items = new Array();
		var content = "";
		items.push({label: "Hash", content: hash});
		if(tx.type==257){ //Initiating a transfer transaction
			items.push({label: "Timestamp", content: fmtDate(tx.timeStamp)});
			items.push({label: "Type", content: "transfer"});
			items.push({label: "Sender", content: tx.signerAccount});
			items.push({label: "Recipient", content: tx.recipient});
			items.push({label: "Amount", content: fmtXEM(tx.amount)});
			items.push({label: "Fee", content: fmtXEM(tx.fee)});
			items.push({label: "Block", content: data.height});
			if(tx.message.type==2){
				items.push({label: "Message(encrypted)", content: tx.message.payload});
			} else {
				items.push({label: "Message", content: tx.message.payload});
			}
		} else if(tx.type==2049){ //Initiating a importance transfer transaction
			items.push({label: "Timestamp", content: fmtDate(tx.timeStamp)});
			items.push({label: "Type", content: "importance Transfer"});
			items.push({label: "Sender", content: tx.signerAccount});
			items.push({label: "Remote", content: tx.remoteAccount});
			items.push({label: "Fee", content: fmtXEM(tx.fee)});
		} else if(tx.type==4097){ //Converting an account to a multisig account
			console.info(tx);
			items.push({label: "Timestamp", content: fmtDate(tx.timeStamp)});
			items.push({label: "Type", content: "converting to be a multisig account"});
			items.push({label: "Sender", content: tx.signerAccount});
			items.push({label: "Fee", content: fmtXEM(tx.fee)});
			if(tx.modifications!=null){
				items.push({label: "Cosignatory list：", content: ""});
				for(i in tx.modifications){
					var cosignatory = tx.modifications[i];
					items.push({label: "", content: cosignatory.cosignatoryAccount});
				}
			}
		} else if(tx.type==4098){ //Cosigning multisig transaction
			
		} else if(tx.type==4100){ //Initiating a multisig transaction; Adding and removing cosignatories
			items.push({label: "Timestamp", content: fmtDate(tx.timeStamp)});
			if(tx.otherTrans!=null && tx.otherTrans.modifications!=null){
				items.push({label: "Type", content: "adding and removing cosignatories"});
			} else {
				items.push({label: "Type", content: "initiating a multisig transaction"});
			}
			items.push({label: "Sender", content: tx.signerAccount});
			items.push({label: "Fee", content: fmtXEM(tx.fee)});
			if(tx.otherTrans!=null){
				items.push({label: "Inner Message", content: ""});
				items.push({label: "", content: "Timestamp：" + fmtDate(tx.otherTrans.timeStamp)});
				items.push({label: "", content: "Sender：" + tx.otherTrans.sender});
				items.push({label: "", content: "Recipient：" + tx.otherTrans.recipient});
				items.push({label: "", content: "Fee：" + fmtXEM(tx.otherTrans.fee)});
				if(tx.otherTrans.modifications!=null){
					var modifications = tx.otherTrans.modifications;
					for(x in modifications){
						if(modifications[x].modificationType==1){ //add cosignatory
							items.push({label: "   add cosignatory - ", content: modifications[x].cosignatoryAccount});
						} else if(modifications[x].modificationType==1){ //delete cosignatory
							items.push({label: "   remove cosignatory - ", content: modifications[x].cosignatoryAccount});
						}
					}
				}
			}
			if(tx.signatures!=null && tx.signatures.length>0){
				items.push({label: "Cosignatures", content: ""});
				var signatures = tx.signatures;
				for(x in signatures){
					var tDate = fmtDate(signatures[x].timeStamp);
					items.push({label: "   ", content: "(" + tDate + ") " + signatures[x].sender});
				}
			}
		} else if(tx.type==8193){ //Provisioning a namespace
			items.push({label: "Timestamp", content: fmtDate(tx.timeStamp)});
			items.push({label: "Type", content: "create namespace"});
			items.push({label: "Sender", content: tx.signerAccount});
			let namespace = "";
			if(tx.parent && tx.newPart){
				namespace = tx.parent + "." + tx.newPart;
			} else if (tx.newPart) {
				namespace = tx.newPart;
			}
			items.push({label: "Namespace", content: namespace});
			items.push({label: "Fee", content: fmtXEM(tx.fee)});
			items.push({label: "Rental fee", content: fmtXEM(tx.rentalFee)});
			items.push({label: "Block", content: data.height});
		} else if(tx.type==16385){ //Creating a mosaic definition
			items.push({label: "Timestamp", content: fmtDate(tx.timeStamp)});
			items.push({label: "Type", content: "create mosaic"});
			items.push({label: "Sender", content: tx.signerAccount});
			let mosaic = "";
			let namespace = "";
			if(tx.mosaicDefinition && tx.mosaicDefinition.id){
				mosaic = tx.mosaicDefinition.id.name;
				namespace = tx.mosaicDefinition.id.namespaceId;
			}
			items.push({label: "Mosaic", content: mosaic});
			items.push({label: "Namespace", content: namespace});
			items.push({label: "Description", content: tx.mosaicDefinition.description?tx.mosaicDefinition.description:""});
			items.push({label: "Fee", content: fmtXEM(tx.fee)});
			items.push({label: "Creation fee", content: fmtXEM(tx.creationFee)});
			if(tx.mosaicDefinition && tx.mosaicDefinition.properties){
				tx.mosaicDefinition.properties.forEach(property => {
					if(property.name == "initialSupply")
						items.push({label: "", content: "Initial supply - " + property.value});
					if(property.name == "divisibility")
						items.push({label: "", content: "Divisibility - " + property.value});
					if(property.name == "supplyMutable")
						items.push({label: "", content: "Supply mutable - " + property.value});
					if(property.name == "transferable")
						items.push({label: "", content: "Transferable - " + property.value});
				});
			}
			items.push({label: "Block", content: data.height});
		} else if(tx.type==16386){ //Changing the mosaic supply
			
		}
		$scope.items = items;
	});
}
