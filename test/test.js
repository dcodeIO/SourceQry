var SourceQry = require("../sourceqry.js");

var sq = new SourceQry();
sq.on("info", function(info, rinfo) {
	console.log("info", info, rinfo);
});
sq.on("players", function(players, rinfo) {
	console.log("players", players, rinfo);
});
sq.info("193.111.141.176", 28351);
sq.players("193.111.141.176", 28351);
