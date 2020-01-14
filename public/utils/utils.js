let NEM_EPOCH = Date.UTC(2015, 2, 29, 0, 6, 25, 0);

function fmtDate(input) {
	return new Date(input*1000 + NEM_EPOCH).format("yyyy-MM-dd hh:mm:ss");
}

function fmtSysDate(input) {
	return new Date(input).format("yyyy-MM-dd hh:mm:ss");
}

function fmtXEM(input) {
	if(isNaN(input))
		return 0;
	else
		return fmtSplit(input/1000000);
}

function fmtPOI(input) {
	return (input*100).toFixed(5) + "%";
}

function fmtDiff(input) {
	return (input/Math.pow(10, 14)*100).toFixed(2) + "%";
}

function fmtSplit(input) {
	let text = "" + input;
	let decimal = "";
	if(text.indexOf(".")!=-1){
		decimal = text.substring(text.indexOf("."));
		text = text.substring(0, text.indexOf("."));
	}
	let result = "";
	while(true){
		if(text.length>3){
			result = "," + text.substring(text.length-3, text.length) + result;
			text = text.substring(0, text.length-3);
		} else {
			result = text + result;
			break;
		}
	}
	return result + decimal;
}

function fmtMosaic(input, div) {
	let divisor = 1;
	if(div && div>0)
		divisor = Math.pow(10, div);
	let result = (input / divisor).toFixed(div);
	if(result==0)
		return "" + 0;
	else
		return fmtSplit(result);
}

function fmtMosaicWhenMosaicList(input, div) {
	let divisor = 1;
	let result = (input).toFixed(div);
	if(result==0)
		return "" + 0;
	else
		return fmtSplit(result);
}

function fixNumber(input) {
	let reg = /^([0-9,])+(\.)[0-9]{2}[0-9]+$/;
	if(reg.test(input))
		return input.substring(0, input.indexOf(".")+3) + "..";
	else
		return input;
}

function getDateFromNemTime(input) {
	return new Date(input*1000 + NEM_EPOCH);
}

function compareTime(nowTime, time) {
	let second = Math.floor((nowTime - NEM_EPOCH - time*1000)/1000);
	if(second<60)
		return second + " s";
	let minute = Math.floor(second / 60);
	second = second % 60;
	if(minute<60)
		return minute + "m, " + second + "s";
	let hour = Math.floor(minute / 60);
	minute = minute % 60;
	if(hour<24)
		return hour + "h, " + minute + "m, " + second + "s";
	let day = Math.floor(hour / 24);
	hour = hour % 24;
	return day + "d, " + hour + "h, " + minute + "m, " + second + "s";
}

function jsonParse(o) {
	let result;
	try {
		result = JSON.parse(o);
	} catch (e) {}
	return result;
}

//date format
Date.prototype.format = function(fmt) {
	let o = {
		"M+" : this.getMonth()+1,
		"d+" : this.getDate(),
		"h+" : this.getHours(),
		"m+" : this.getMinutes(),
		"s+" : this.getSeconds(),
		"q+" : Math.floor((this.getMonth()+3)/3)
	}; 
	if(/(y+)/.test(fmt))
		fmt = fmt.replace(RegExp.$1, (this.getFullYear()+"").substr(4 - RegExp.$1.length)); 
	for(let k in o) 
		if(new RegExp("("+ k +")").test(fmt)) 
	fmt = fmt.replace(RegExp.$1, (RegExp.$1.length==1) ? (o[k]) : (("00"+ o[k]).substr((""+ o[k]).length))); 
	return fmt; 
}

function showTransaction(height, hash, $scope, TXService, signature) {
	$scope.items = {};
	$scope.txHash = hash;
	TXService.tx({"height": height, "hash": hash, "signature": signature}, function(data){
		if(!data || !data.tx){
			$scope.items = [{label: "Not Found", content: ""}];
			return;
		}
		let tx = data.tx;
		let items = new Array();
		let content = "";
		if(tx.type==257){ //Initiating a transfer transaction
			items.push({label: "Block", content: data.height});
			items.push({label: "Timestamp", content: fmtDate(tx.timeStamp)});
			let typeName = "transfer";
			if(tx.mosaicTransferFlag==1)
				typeName += " | mosaic";
			if(tx.apostilleFlag==1)
				typeName += " | apostille";
			items.push({label: "Type", content: typeName});
			items.push({label: "Sender", content: tx.signerAccount});
			items.push({label: "Recipient", content: tx.recipient});
			if(tx.mosaics && tx.mosaics.length>0){
				// check if 'nem:xem'
				let amount = 0;
				tx.mosaics.forEach(m => {
					if(m.mosaicId.namespaceId=="nem" && m.mosaicId.name=="xem")
						amount = fmtMosaic(tx.amount/1000000 * m.quantity, m.divisibility);
				});
				items.push({label: "Amount", content: amount});
				items.push({label: "Fee", content: fmtXEM(tx.fee)});
				// output mosaic info
				let multiplier = 0;
				if(tx.amount)
					multiplier = tx.amount/1000000;
				tx.mosaics.forEach((m, i) => {
					let mosaicID = m.mosaicId.namespaceId+":"+m.mosaicId.name;
					let quantity = fmtMosaic(m.quantity * multiplier, m.divisibility);
					let quantityRemark = "";
					if(multiplier!=1)
						quantityRemark = " (" + fmtMosaic(m.quantity, m.divisibility) + " * " + multiplier + ")";
					if(i==0)
						items.push({label: "Mosaic transfer", content: mosaicID + " - " + quantity + quantityRemark});
					else
						items.push({label: "", content: mosaicID + " - " + quantity + quantityRemark});
				});
			} else {
				items.push({label: "Amount", content: fmtXEM(tx.amount)});
				items.push({label: "Fee", content: fmtXEM(tx.fee)});
			}
			if(tx.message){
				if(tx.message.type==2)
					items.push({label: "Message(encrypted)", content: tx.message.payload});
				else
					items.push({label: "Message", content: tx.message.payload});
			}
		} else if(tx.type==2049){ //Initiating a importance transfer transaction
			items.push({label: "Timestamp", content: fmtDate(tx.timeStamp)});
			items.push({label: "Type", content: "importance"});
			items.push({label: "Sender", content: tx.signerAccount});
			items.push({label: "Remote", content: tx.remoteAccount});
			items.push({label: "Fee", content: fmtXEM(tx.fee)});
		} else if(tx.type==4097){ //Converting an account to a multisig account
			items.push({label: "Timestamp", content: fmtDate(tx.timeStamp)});
			items.push({label: "Type", content: "aggregate modification transaction (convert to be multisig account)"});
			items.push({label: "Sender", content: tx.signerAccount});
			items.push({label: "Fee", content: fmtXEM(tx.fee)});
			if(tx.modifications!=null){
				if(tx.minCosignatories && tx.minCosignatories.relativeChange)
					items.push({label: "Min signatures", content: tx.minCosignatories.relativeChange});
				else
					items.push({label: "Min signatures", content: tx.modifications.length});
				for(let i in tx.modifications){
					if(i==0)
						items.push({label: "Cosignatories", content: tx.modifications[i].cosignatoryAccount});
					else
						items.push({label: "	", content: tx.modifications[i].cosignatoryAccount});
				}
			}
		} else if(tx.type==4098){ //Cosigning multisig transaction
			
		} else if(tx.type==4100){ //Initiating a multisig transaction; Adding and removing cosignatories
			items.push({label: "Block", content: data.height});
			items.push({label: "Timestamp", content: fmtDate(tx.timeStamp)});
			items.push({label: "Deadline", content: fmtDate(tx.deadline)});
			if(tx.otherTrans && tx.otherTrans.type==4097)
				items.push({label: "Type", content: "multisig | aggregate modification transaction (cosignatory modification)"});
			else{
				let typeName = "multisig";
				if(tx.otherTrans.mosaics && tx.otherTrans.mosaics.length>0)
					typeName += " | mosaic";
				items.push({label: "Type", content: typeName});
			}
			items.push({label: "Sender", content: tx.otherTrans.sender});
			if(tx.otherTrans.recipient)
				items.push({label: "Recipient", content: tx.otherTrans.recipient});
			if(tx.otherTrans.mosaics && tx.otherTrans.mosaics.length>0){
				// check if 'nem:xem'
				let amount = 0;
				tx.otherTrans.mosaics.forEach(m => {
					if(m.mosaicId.namespaceId=="nem" && m.mosaicId.name=="xem")
						amount = fmtMosaic(tx.otherTrans.amount/1000000 * m.quantity, m.divisibility);
				});
				items.push({label: "Amount", content: amount});
				items.push({label: "Fee", content: fmtXEM(tx.otherTrans.fee)});
				// output mosaic info
				let multiplier = 0;
				if(tx.otherTrans.amount && !isNaN(tx.otherTrans.amount))
					multiplier = tx.otherTrans.amount/1000000;
				tx.otherTrans.mosaics.forEach((m, i) => {
					let mosaicID = m.mosaicId.namespaceId+":"+m.mosaicId.name;
					let quantity = fmtMosaic(m.quantity * multiplier, m.divisibility);
					let quantityRemark = "";
					if(multiplier!=1)
						quantityRemark = " (" + fmtMosaic(m.quantity, m.divisibility) + " * " + multiplier + ")";
					if(i==0)
						items.push({label: "Mosaic transfer", content: mosaicID + " - " + quantity + quantityRemark});
					else
						items.push({label: "", content: mosaicID + " - " + quantity + quantityRemark});
				});
			} else {
				if(tx.otherTrans.amount && !isNaN(tx.otherTrans.amount))
					items.push({label: "Amount", content: fmtXEM(tx.otherTrans.amount)});
				items.push({label: "Fee", content: fmtXEM(tx.otherTrans.fee)});
			}
			if(tx.otherTrans && tx.otherTrans.message){
				if(tx.otherTrans.message.type==2)
					items.push({label: "Message(encrypted)", content: tx.otherTrans.message.payload});
				else
					items.push({label: "Message", content: tx.otherTrans.message.payload});
			}
			items.push({label: "Cosignatures", content: tx.signerAccount + " (" + fmtDate(tx.timeStamp) + ") (Initiator)"});
			for(let i in tx.signatures)
				items.push({label: "	", content: tx.signatures[i].sender + " (" + fmtDate(tx.signatures[i].timeStamp) + ")"});
			if(tx.otherTrans && tx.otherTrans.type==4097){
				items.push({label: "", content: ""});
				items.push({label: "Modifications", content: ""});
				if(tx.otherTrans.minCosignatories && tx.otherTrans.minCosignatories.relativeChange){
					let minSigned = tx.signatures.length+1;
					let minSignedChange = minSigned + tx.otherTrans.minCosignatories.relativeChange;
					if(minSignedChange==0)
						minSignedChange += " (convert to be normal account from multisig account)";
					items.push({label: "Min signatures", content: minSigned + " -> " + minSignedChange});
				}
				let modifications = tx.otherTrans.modifications;
				for(let i in modifications){
					let changeStatus = modifications[i].modificationType==2?"REMOVE":"ADD";
					if(i==0)
						items.push({label: "Cosignatures", content: modifications[i].cosignatoryAccount + " (" + changeStatus + ")"});
					else
						items.push({label: "	", content: modifications[i].cosignatoryAccount + " (" + changeStatus + ")"});
				}
			}
		} else if(tx.type==8193){ //Provisioning a namespace
			items.push({label: "Timestamp", content: fmtDate(tx.timeStamp)});
			items.push({label: "Type", content: "create namespace"});
			items.push({label: "Account", content: tx.signerAccount});
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
			items.push({label: "Account", content: tx.signerAccount});
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
				items.push({label: "properties", content: ""});
				for(i in tx.mosaicDefinition.properties){
					let property = tx.mosaicDefinition.properties[i];
					if(property.name == "initialSupply")
						items.push({label: "", content: "Initial supply - " + fmtSplit(property.value)});
					if(property.name == "divisibility")
						items.push({label: "", content: "Divisibility - " + property.value});
					if(property.name == "supplyMutable")
						items.push({label: "", content: "Supply mutable - " + property.value});
					if(property.name == "transferable")
						items.push({label: "", content: "Transferable - " + property.value});
				}
			}
			items.push({label: "Block", content: data.height});
		} else if(tx.type==16386){ //Changing the mosaic supply
			items.push({label: "Timestamp", content: fmtDate(tx.timeStamp)});
			items.push({label: "Type", content: "change mosaic supply"});
			items.push({label: "Account", content: tx.signerAccount});
			let mosaic = "";
			let namespace = "";
			if(tx.mosaicId){
				mosaic = tx.mosaicId.name;
				namespace = tx.mosaicId.namespaceId;
			}
			items.push({label: "Mosaic", content: mosaic});
			items.push({label: "Namespace", content: namespace});
			items.push({label: "Fee", content: fmtXEM(tx.fee)});
			let change = "";
			if(tx.supplyType==1)
				change = " + " + fmtSplit(tx.delta);
			else if(tx.supplyType==2)
				change = " - " + fmtSplit(tx.delta);
			items.push({label: "Change", content: change});
			items.push({label: "Block", content: data.height});
		}
		$scope.items = items;
	});
}

function showUnconfirmedTransaction(tx, $scope) {
	let items = [];
	items.push({label: "Timestamp", content: tx.timeStamp});
	items.push({label: "Deadline", content: tx.deadline});
	if(tx.type==257){ //initiating a transfer transaction
		let typeName = "transfer";
		if(tx.mosaicTransferFlag==1)
			typeName += " | mosaic";
		if(tx.apostilleFlag==1)
			typeName += " | apostille";
		items.push({label: "Type", content: typeName});
		items.push({label: "Sender", content: tx.sender});
		items.push({label: "Recipient", content: tx.recipient});
		if(tx.mosaics && tx.mosaics.length>0){
			// check if 'nem:xem'
			let amount = 0;
			tx.mosaics.forEach(m => {
				if(m.mosaicId.namespaceId=="nem" && m.mosaicId.name=="xem")
					amount = fmtMosaic(tx.amountForMosaic/1000000 * m.quantity, m.divisibility);
			});
			items.push({label: "Amount", content: amount});
			// output mosaic info
			let multiplier = 0;
			if(tx.amountForMosaic)
				multiplier = tx.amountForMosaic/1000000;
			tx.mosaics.forEach((m, i) => {
				let mosaicID = m.mosaicId.namespaceId+":"+m.mosaicId.name;
				let quantity = fmtMosaic(m.quantity * multiplier, m.divisibility);
				let quantityRemark = "";
				if(multiplier!=1)
					quantityRemark = " (" + fmtMosaic(m.quantity, m.divisibility) + " * " + multiplier + ")";
				if(i==0)
					items.push({label: "Mosaic transfer", content: mosaicID + " - " + quantity + quantityRemark});
				else
					items.push({label: "", content: mosaicID + " - " + quantity + quantityRemark});
			});
		} else {
			if(tx.amount)
				items.push({label: "Amount", content: tx.amount});
			else
				items.push({label: "Amount", content: 0});
		}
		if(tx.fee)
			items.push({label: "Fee", content: tx.fee});
		if(tx.message){
			if(tx.message.type==2)
				items.push({label: "Message(encrypted)", content: tx.message.payload});
			else
				items.push({label: "Message", content: tx.message.payload});
		}
	} else if(tx.type==2049){ //Initiating a importance transfer transaction
		items.push({label: "Type", content: "importance"});
		items.push({label: "Sender", content: tx.sender});
		items.push({label: "Remote", content: tx.remoteAccount});
		items.push({label: "Fee", content: tx.fee});
		if(tx.mode && tx.mode==2)
			items.push({label: "Mode", content: "deactivate remote harvesting"});
		else if(tx.mode && tx.mode==1)
			items.push({label: "Mode", content: "activate remote harvesting"});
	} else if(tx.type==4097){ //convert to be multisig account
		items.push({label: "Type", content: "aggregate modification transaction (convert to be multisig account)"});
		items.push({label: "Account", content: tx.sender});
		items.push({label: "Fee", content: tx.fee});
		items.push({label: "Min signatures", content: tx.minCosignatories.relativeChange});
		if(tx.modifications){
			for(let i in tx.modifications){
				if(i==0)
					items.push({label: "Cosignatories", content: tx.modifications[i].cosignatoryAccount});
				else
					items.push({label: "   ", content: tx.modifications[i].cosignatoryAccount});
			}
		}
	} else if(tx.type==4100){ //init a multisig transaction
		if(tx.otherTrans && tx.otherTrans.type==4097)
			items.push({label: "Type", content: "multisig | aggregate modification transaction (cosignatory modification)"});
		else
			items.push({label: "Type", content: "multisig transaction"});
		items.push({label: "Sender", content: tx.otherTrans.sender});
		if(tx.otherTrans.recipient)
			items.push({label: "Recipient", content: tx.otherTrans.recipient});
		if(tx.otherTrans.amount && !isNaN(tx.otherTrans.amount))
			items.push({label: "Amount", content: fmtXEM(tx.otherTrans.amount)});
		items.push({label: "Fee", content: fmtXEM(tx.otherTrans.fee)});
		if(tx.message){
			if(tx.message.type==2)
				items.push({label: "Message(encrypted)", content: tx.message.payload});
			else
				items.push({label: "Message", content: tx.message.payload});
		}
		if(tx.mosaics && tx.mosaics.length>0){
			for(let i in tx.mosaics){
				if(i==0)
					items.push({label: "Mosaic transfer", content: tx.mosaics[i].mosaicId.namespaceId+":"+tx.mosaics[i].mosaicId.name + " - " + fmtSplit(tx.mosaics[i].quantity)});
				else
					items.push({label: "", content: tx.mosaics[i].mosaicId.namespaceId+":"+tx.mosaics[i].mosaicId.name + " - " + fmtSplit(tx.mosaics[i].quantity)});
			}
		}
		items.push({label: "Min signatures", content: tx.minSigned});
		for(let i in tx.signed){
			if(i==0)
				items.push({label: "Cosignatures", content: tx.signed[i] + " (" + fmtDate(tx.signedDate[i]) + ") (Initiator)"});
			else
				items.push({label: "   ", content: tx.signed[i] + " (" + fmtDate(tx.signedDate[i]) + ")"});
		}
		for(let i in tx.unSigned)
			items.push({label: "   ", content: tx.unSigned[i]});
		if(tx.otherTrans && tx.otherTrans.type==4097){
			items.push({label: "", content: ""});
			items.push({label: "Modifications", content: ""});
			let modifications = tx.otherTrans.modifications;
			if(tx.otherTrans.minCosignatories && tx.otherTrans.minCosignatories.relativeChange){
				let minSignedChange = tx.minSigned + tx.otherTrans.minCosignatories.relativeChange;
				if(minSignedChange==0)
					minSignedChange += " (convert to be normal account from multisig account)";
				items.push({label: "Min signatures", content: tx.minSigned + " -> " + minSignedChange});
			}
			for(let i in modifications){
				let changeStatus = modifications[i].modificationType==2?"REMOVE":"ADD";
				if(i==0)
					items.push({label: "Cosignatures", content: modifications[i].cosignatoryAccount + " (" + changeStatus + ")"});
				else
					items.push({label: "	", content: modifications[i].cosignatoryAccount + " (" + changeStatus + ")"});
			}
		}
	} else if(tx.type==8193){ //Provisioning a namespace
		items.push({label: "Type", content: "create namespace"});
		items.push({label: "Account", content: tx.sender});
		let namespace = "";
		if(tx.parent && tx.newPart){
			namespace = tx.parent + "." + tx.newPart;
		} else if (tx.newPart) {
			namespace = tx.newPart;
		}
		items.push({label: "Namespace", content: namespace});
		items.push({label: "Fee", content: tx.fee});
		items.push({label: "Rental fee", content: fmtXEM(tx.rentalFee)});
	} else if(tx.type==16385){ //Creating a mosaic definition
		items.push({label: "Type", content: "create mosaic"});
		items.push({label: "Account", content: tx.sender});
		let mosaic = "";
		let namespace = "";
		if(tx.mosaicDefinition && tx.mosaicDefinition.id){
			mosaic = tx.mosaicDefinition.id.name;
			namespace = tx.mosaicDefinition.id.namespaceId;
		}
		items.push({label: "Mosaic", content: mosaic});
		items.push({label: "Namespace", content: namespace});
		items.push({label: "Description", content: tx.mosaicDefinition.description?tx.mosaicDefinition.description:""});
		items.push({label: "Fee", content: tx.fee});
		items.push({label: "Creation fee", content: fmtXEM(tx.creationFee)});
		if(tx.mosaicDefinition && tx.mosaicDefinition.properties){
			items.push({label: "properties", content: ""});
			for(i in tx.mosaicDefinition.properties){
				let property = tx.mosaicDefinition.properties[i];
				if(property.name == "initialSupply")
					items.push({label: "", content: "Initial supply - " + property.value});
				if(property.name == "divisibility")
					items.push({label: "", content: "Divisibility - " + property.value});
				if(property.name == "supplyMutable")
					items.push({label: "", content: "Supply mutable - " + property.value});
				if(property.name == "transferable")
					items.push({label: "", content: "Transferable - " + property.value});
			}
		}
	}  else if(tx.type==16386){ //Changing the mosaic supply
		items.push({label: "Type", content: "change mosaic supply"});
		items.push({label: "Account", content: tx.sender});
		let mosaic = "";
		let namespace = "";
		if(tx.mosaicId){
			mosaic = tx.mosaicId.name;
			namespace = tx.mosaicId.namespaceId;
		}
		items.push({label: "Mosaic", content: mosaic});
		items.push({label: "Namespace", content: namespace});
		items.push({label: "Fee", content: tx.fee});
		let change = "";
		if(tx.supplyType==1)
			change = " + " + tx.delta;
		else if(tx.supplyType==2)
			change = " - " + tx.delta;
		items.push({label: "Change", content: change});
	}
	$scope.items = items;
}

function fixAmountWhenMosaicTransfer(tx){
	let amount = 0;
	if(("" + tx.amount).indexOf(",")!=-1)
		amount = Number(tx.amount.replace(/,/g, ""));
	else
		amount = tx.amount;
	if(tx.mosaics && tx.mosaics.length>0){
		// check if 'nem:xem'
		amount = 0;
		tx.mosaics.forEach(m => {
			if(m.mosaicId.namespaceId=="nem" && m.mosaicId.name=="xem")
				amount = fmtMosaic(tx.amount/1000000 * m.quantity, m.divisibility);
		});
	} else if(tx.otherTrans && tx.otherTrans.mosaics && tx.otherTrans.mosaics.length>0){
		// check if 'nem:xem'
		amount = 0;
		tx.otherTrans.mosaics.forEach(m => {
			if(m.mosaicId.namespaceId=="nem" && m.mosaicId.name=="xem")
				amount = fmtMosaic(Ntx.amount/1000000 * m.quantity, m.divisibility);
		});
	}
	return fmtXEM(amount);
}
