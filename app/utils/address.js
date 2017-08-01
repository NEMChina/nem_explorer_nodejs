import CryptoJS from 'crypto-js';
import convert from './convert';
import config from '../config/config';

const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";

/**
 *  convert publicKey to address
 */
let publicKeyToAddress = publicKey => {
	if(!publicKey){
		return '';
	}
	let binPubKey = CryptoJS.enc.Hex.parse(publicKey);
    let hash = CryptoJS.SHA3(binPubKey, {
        outputLength: 256
    });
    let hash2 = CryptoJS.RIPEMD160(hash);
    let networkPrefix = config.network; //Main Network
    let versionPrefixedRipemd160Hash = networkPrefix + CryptoJS.enc.Hex.stringify(hash2);
    let tempHash = CryptoJS.SHA3(CryptoJS.enc.Hex.parse(versionPrefixedRipemd160Hash), {
        outputLength: 256
    });
    let stepThreeChecksum = CryptoJS.enc.Hex.stringify(tempHash).substr(0, 8);
    let concatStepThreeAndStepSix = convert.hex2a(versionPrefixedRipemd160Hash + stepThreeChecksum);
    let ret = b32encode(concatStepThreeAndStepSix);
    return ret;
    // return ret.toUpperCase().replace(/-/g, '').match(/.{1,6}/g).join('-');
}

let b32encode = function(s) {
    let parts = [];
    let quanta = Math.floor((s.length / 5));
    let leftover = s.length % 5;
    if (leftover != 0) {
        for (let i = 0; i < (5 - leftover); i++) {
            s += '\x00';
        }
        quanta += 1;
    }
    for (let i = 0; i < quanta; i++) {
        parts.push(alphabet.charAt(s.charCodeAt(i * 5) >> 3));
        parts.push(alphabet.charAt(((s.charCodeAt(i * 5) & 0x07) << 2) | (s.charCodeAt(i * 5 + 1) >> 6)));
        parts.push(alphabet.charAt(((s.charCodeAt(i * 5 + 1) & 0x3F) >> 1)));
        parts.push(alphabet.charAt(((s.charCodeAt(i * 5 + 1) & 0x01) << 4) | (s.charCodeAt(i * 5 + 2) >> 4)));
        parts.push(alphabet.charAt(((s.charCodeAt(i * 5 + 2) & 0x0F) << 1) | (s.charCodeAt(i * 5 + 3) >> 7)));
        parts.push(alphabet.charAt(((s.charCodeAt(i * 5 + 3) & 0x7F) >> 2)));
        parts.push(alphabet.charAt(((s.charCodeAt(i * 5 + 3) & 0x03) << 3) | (s.charCodeAt(i * 5 + 4) >> 5)));
        parts.push(alphabet.charAt(((s.charCodeAt(i * 5 + 4) & 0x1F))));
    }
    let replace = 0;
    if (leftover == 1) replace = 6;
    else if (leftover == 2) replace = 4;
    else if (leftover == 3) replace = 3;
    else if (leftover == 4) replace = 1;
    for (let i = 0; i < replace; i++) parts.pop();
    for (let i = 0; i < replace; i++) parts.push("=");
    return parts.join("");
}

module.exports = {
	publicKeyToAddress
}