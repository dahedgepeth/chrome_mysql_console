"use strict";

var BinaryUtils = function() {
};

BinaryUtils.prototype = {
    arrayBufferToString: function(buf) {
        return String.fromCharCode.apply(null, new Uint8Array(buf));
    },
    stringToArrayBuffer: function(str) {
        var buf = new ArrayBuffer(str.length);
        var bufView = new Uint8Array(buf);
        for (var i = 0, strLen = str.length; i < strLen; i++) {
            bufView[i] = str.charCodeAt(i);
        }
        return buf;
    }
};

var binaryUtils = new BinaryUtils();
