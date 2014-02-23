SourceQry
=========
Super lean A2S_INFO querying for SRCDS-based servers that supports querying lots of servers at once.

Usage
-----
`npm install sourceqry`

```js
var SourceQry = require("sourceqry");
var sq = new SourceQry();
sq.on("info", function(info, rinfo) {
	console.log(info, rinfo);
});
sq.query("ip", port);
```

License: Apache License, Version 2.0
