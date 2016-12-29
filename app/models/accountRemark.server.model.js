import mongoose from 'mongoose';
import accountRemarkData from '../data/accountRemarkData';

let AccountRemarkSchema = new mongoose.Schema({
	address: {type: String, index: true, required: true, unique: true},
	remark: String
});

//init AccountRemark Schema
mongoose.model('AccountRemark', AccountRemarkSchema);

//init data
let AccountRemark = mongoose.model('AccountRemark');
if(accountRemarkData && accountRemarkData.data.length>0){
	AccountRemark.count().exec((err, doc) => {
		if(accountRemarkData.data.length > doc){
			AccountRemark.remove().exec(err => {
				if(err) {
					console.error(err);
					return;
				}
				AccountRemark.create(accountRemarkData.data, err => {
					if(err)
						console.error(err);
				});
			});
		}
	});
}
