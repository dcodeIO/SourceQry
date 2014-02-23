 /*
 Copyright 2013 Daniel Wirtz <dcode@dcode.io>

 Licensed under the Apache License, Version 2.0 (the "License");
 you may not use this file except in compliance with the License.
 You may obtain a copy of the License at

 http://www.apache.org/licenses/LICENSE-2.0

 Unless required by applicable law or agreed to in writing, software
 distributed under the License is distributed on an "AS IS" BASIS,
 WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 See the License for the specific language governing permissions and
 limitations under the License.
 */

/**
 * @license SourceQry (c) 2014 Daniel Wirtz <dcode@dcode.io>
 * Released under the Apache License, Version 2.0
 * see: http://github.com/dcodeIO/SourceQry for details
 */ //
 var dgram = require("dgram"),
	events = require("events"),
	Long = require("long");

/** 
 * Constructs a new SourceQry instance.
 * @extends events.EventEmitter
 */
var SourceQry = function() {
	events.EventEmitter.call(this);
	this.socket = dgram.createSocket('udp4');
	this.socket.on("message", this._processMessage.bind(this));
}

// Extends EventEmitter
SourceQry.prototype = Object.create(events.EventEmitter.prototype);

/**
 * A2S_INFO type
 * @type {number}
 * @const
 */
SourceQry.A2S_INFO = 0x54;

/**
 * Prebuilt A2S_INFO data
 * @type {!Buffer}
 * @const
 */
SourceQry.A2S_INFO_DATA = new Buffer("\xFF\xFF\xFF\xFF\x54Source Engine Query\x00", "binary");

/**
 * Queries a server for basic information.
 * @param {string} host
 * @param {number} port
 */
SourceQry.prototype.info = function(host, port) {
	this.socket.send(SourceQry.A2S_INFO_DATA, 0, SourceQry.A2S_INFO_DATA.length, port, host);
};

/**
 * A2S_PLAYER type
 * @type {number}
 * @const
 */
SourceQry.A2S_PLAYER = 0x55;

/**
 * Prebuilt A2S_PLAYER challenge data
 * @type {!Buffer}
 * @const
 */
SourceQry.A2S_PLAYER_DATA = new Buffer("\xFF\xFF\xFF\xFF\x55\xFF\xFF\xFF\xFF", "binary");

/**
 * Queries a server for connected players.
 * @param {string} host
 * @param {number} port
 */
/* SourceQry.prototype.players = function(host, port) {
	this.socket.send(SourceQry.A2S_PLAYER_DATA, 0, SourceQry.A2S_PLAYER_DATA.length, port, host);
}; */ // needs logic for multi packet responses

/**
 * Processes an incoming packet.
 * @param {!Buffer} msg
 * @private
 */
SourceQry.prototype._processMessage = function(msg, rinfo) {
	var offset = 0;

	// Reads a null-terminated string
	function readString() {
		var len = 0, b;
		do {
			b = msg.readUInt8(offset++);
			len++;
		} while (b !== 0);
		return msg.slice(offset-len, offset-1).toString("utf8");
	}

	try { // see: https://developer.valvesoftware.com/wiki/Server_queries

		var head = msg.readInt32LE(offset); offset += 4;
		if (head !== -1) throw(new Error("illegal header"));
		head = msg.readUInt8(offset++);
		if (head === 0x49) {
			var res = {};
			res.proto = msg.readUInt8(offset++);
			res.name = readString();
			res.map = readString();
			res.folder = readString();
			res.game = readString();
			res.id = msg.readInt16LE(offset); offset += 2;
			res.players = msg.readUInt8(offset++);
			res.maxPlayers = msg.readUInt8(offset++);
			res.bots = msg.readUInt8(offset++);
			res.serverType = String.fromCharCode(msg.readUInt8(offset++));
			res.environment = String.fromCharCode(msg.readUInt8(offset++));
			res.visibility = msg.readUInt8(offset++);
			res.vac = msg.readUInt8(offset++);
			res.version = readString();
			res.edf = msg.readUInt8(offset++);
			if (res.edf & 0x80) {
				res.port = msg.readUInt16LE(offset); offset += 2;
			}
			if (res.edf & 0x10) {
				var lo = msg.readUInt32LE(offset); offset += 4;
				var hi = msg.readUInt32LE(offset); offset += 4;
				res.steamId = new Long(lo, hi, true).toString();
			}
			if (res.edf & 0x40) {
				res.spectatorPort = msg.readUInt16LE(offset); offset += 2;
				res.spectatorName = readString();
			}
			if (res.edf & 0x20) {
				res.keywords = readString();
			}
			if (res.edf & 0x01) {
				var lo = msg.readUInt32LE(offset); offset += 4;
				var hi = msg.readUInt32LE(offset); offset += 4;
				res.gameId = new Long(lo, hi, true).toString();
			}
			this.emit("info", res, rinfo);

		} /* else if (head === 0x41) {
			var challenge = msg.readUInt32LE(offset); offset += 4;
			var buf = new Buffer("\xFF\xFF\xFF\xFF\x55\x00\x00\x00\x00", "binary");
			buf.writeUInt32LE(challenge, 5);
			this.socket.send(buf, 0, buf.length, rinfo.port, rinfo.address);
		} else if (head === 0x44) {
			var n = msg.readUInt8(offset++);
			var players = [];
			for (var i=0; i<n; i++) {
				var id = msg.readUInt8(offset++);
				var name = readString();
				var score = msg.readUint32(offset); offset += 4;
				var duration = msg.readFloat32(offset); offset += 4;
				players.push({
					id: id,
					name: name,
					score: score,
					duration: duration
				});
			}
			this.emit("players", players, rinfo);
		} */ else {
			throw(new Error("illegal header"));
		}
	} catch (err) {
		this.emit("invalid", err, msg, rinfo);
	}
};

module.exports = SourceQry;
