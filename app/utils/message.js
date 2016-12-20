import convert from './convert';

/**
 * convert the message from hex to string
 */
let hexToUtf8 = function (data) {
    if (data === undefined) return data;
    let o = data;
    if (o && o.length > 2 && o[0] === 'f' && o[1] === 'e') {
        return "HEX: " + o.slice(2);
    }
    let result;
    try {
        result = decodeURIComponent(escape(convert.hex2a(o)))
    } catch (e) {
        result = convert.hex2a(o);
        console.log('invalid text input: ' + data);
    }
    return result;
}

module.exports = {
    hexToUtf8
}