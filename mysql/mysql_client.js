/*
 * Copyright (c) 2014 Yoichiro Tanaka. All rights reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

"use strict";

var MySQLClient = function() {
};

MySQLClient.prototype = {
    login: function(host, port, username, password,
                    callback, errorCallback, fatalCallback) {
        mySQLCommunication.connect(host, port, function(result) {
            if (result >= 0) {
                this._handshake(username, password, callback, fatalCallback);
            } else {
                errorCallback(result + "("
                              + networkErrorCode.getErrorMessage(result) + ")");
            }
        }.bind(this));
    },
    logout: function(callback) {
        mySQLCommunication.disconnect(callback);
    },
    query: function(queryString, resultsetCallback, noResultsetCallback,
                    errorCallback, fatalCallback) {
        if (!mySQLCommunication.isConnected()) {
            fatalCallback("Not connected.");
            return;
        }
        mySQLCommunication.resetSequenceNumber();
        this._sendQueryRequest(queryString, resultsetCallback, noResultsetCallback,
                               errorCallback, fatalCallback);
    },
    getDatabases: function(callback, errorCallback, fatalCallback) {
        if (!mySQLCommunication.isConnected()) {
            fatalCallback("Not connected.");
            return;
        }
        this.query("SHOW DATABASES", function(columnDefinitions, resultsetRows) {
            var databases = new Array();
            for (var i = 0; i < resultsetRows.length; i++) {
                databases.push(resultsetRows[i].values[0]);
            }
            callback(databases);
        }.bind(this), function(result) {
            console.log("This callback function never be called.");
        }.bind(this), function(result) {
            errorCallback(result);
        }.bind(this), fatalCallback);
    },
    initDB: function(schemaName, callback, fatalCallback) {
        if (!mySQLCommunication.isConnected()) {
            fatalCallback("Not connected.");
            return;
        }
        mySQLCommunication.resetSequenceNumber();
        var initDBRequest = mySQLProtocol.generateInitDBRequest(schemaName);
        var initDBPacket = mySQLCommunication.createPacket(initDBRequest.buffer);
        mySQLCommunication.writePacket(initDBPacket, function(writeInfo) {
            mySQLCommunication.readPacket(function(packet) {
                var result = mySQLProtocol.parseOkErrResultPacket(packet);
                callback(result);
            }.bind(this), fatalCallback);
        }.bind(this), fatalCallback);
    },
    _handshake: function(username, password, callback, fatalCallback) {
        mySQLCommunication.readPacket(function(packet) {
            var initialHandshakeRequest =
                    mySQLProtocol.parseInitialHandshakePacket(packet);
            var passwordHash =
                    mySQLProtocol.generatePasswordHash(
                        initialHandshakeRequest, password);
            var handshakeResponse =
                    mySQLProtocol.generateHandshakeResponse(
                        initialHandshakeRequest, username, passwordHash);
            var handshakeResponsePacket =
                    mySQLCommunication.createPacket(handshakeResponse.buffer);
            mySQLCommunication.writePacket(
                handshakeResponsePacket, function(writeInfo) {
                mySQLCommunication.readPacket(function(packet) {
                    var result = mySQLProtocol.parseOkErrResultPacket(packet);
                    callback(initialHandshakeRequest, result);
                }.bind(this), fatalCallback);
            }.bind(this), fatalCallback);
        }.bind(this), fatalCallback);
    },
    _readResultsetRows: function(result, callback, fatalCallback) {
        mySQLCommunication.readPacket(function(packet) {
            var eofResult = mySQLProtocol.parseEofPacket(packet);
            if (eofResult) {
                callback(result);
            } else {
                var row = mySQLProtocol.parseResultsetRowPacket(packet);
                result.push(row);
                this._readResultsetRows(result, callback, fatalCallback);
            }
        }.bind(this), fatalCallback);
    },
    _readColumnDefinitions: function(columnCount, resultsetCallback,
                                     noResultsetCallback, errorCallback,
                                     fatalCallback) {
        mySQLCommunication.readPluralPackets(columnCount, function(packets) {
            var columnDefinitions = new Array();
            for (var i = 0; i < packets.length; i++) {
                columnDefinitions.push(
                    mySQLProtocol.parseColumnDefinitionPacket(
                        packets[i]));
            }
            mySQLCommunication.readPacket(function(packet) {
                mySQLProtocol.parseEofPacket(packet);
                this._readResultsetRows(new Array(), function(resultsetRows) {
                    resultsetCallback(columnDefinitions, resultsetRows);
                }.bind(this), fatalCallback);
            }.bind(this), fatalCallback);
        }.bind(this), fatalCallback);
    },
    _readQueryResult: function(resultsetCallback, noResultsetCallback,
                               errorCallback, fatalCallback) {
        mySQLCommunication.readPacket(function(packet) {
            mySQLProtocol.parseQueryResultPacket(packet, function(result) {
                if (result.isSuccess() && result.hasResultset()) {
                    var columnCount = result.columnCount;
                    this._readColumnDefinitions(
                        columnCount, resultsetCallback, noResultsetCallback,
                        errorCallback, fatalCallback);
                } else if (result.isSuccess() && !result.hasResultset()) {
                    noResultsetCallback(result);
                } else {
                    errorCallback(result);
                }
            }.bind(this));
        }.bind(this), fatalCallback);
    },
    _sendQueryRequest: function(queryString, resultsetCallback, noResultsetCallback,
                                errorCallback, fatalCallback) {
        var queryRequest = mySQLProtocol.generateQueryRequest(queryString);
        var queryPacket = mySQLCommunication.createPacket(queryRequest.buffer);
        mySQLCommunication.writePacket(queryPacket, function(writeInfo) {
            this._readQueryResult(resultsetCallback, noResultsetCallback,
                                  errorCallback, fatalCallback);
        }.bind(this), fatalCallback);
    }
};

var mySQLClient = new MySQLClient();