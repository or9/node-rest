var restify = require("restify");
var os = require("os");
var server = restify.createServer();
var prevRequest = {};
var forceTimeout = 6;
var interval = {id: 0, time: 3000, limit: 10};

interval.id = setInterval(tick, interval.time);

function startTick(num) {
	interval.limit = 10;
	interval.id = setInterval(tick, num);
}

function tick() {
	interval.limit -= 1;
	if(interval.limit >= 0) {
		console.log("—…—");
	} else {
		clearInterval(interval.id);
	}
}

function respond(req, res, next) {
	//var log = req.log;
	clearInterval(interval.id);
	startTick(3000);

	var time = (function() {
		var d = new Date(),
				d1 = d.getDate(),
				d2 = d.getHours(),
				d3 = d.getMinutes(),
				d4 = d.getSeconds(),
				d5 = d.getMilliseconds();
		return  "{"+d1+"} "+d2+":"+d3+":"+d4+"."+d5;
	}());
	var name = !!req.params.name? req.params.name: "Anonymous",
			user = req.peername,
			headers = (function() {
				var tmp = "";
				for(var key in res._headers) {
					tmp += key + ": " + res._headers[key] + " ";
				}
				return tmp;
			}()),
			methods = res.methods;

	console.log("cache…");
	res.cache();

	console.log("name: ", name, "\nuser: ", user, "\nheaders: ", headers, "\nmethods: ", methods);

//	console.log(":::::::::::::::::::: " + req.method + " REQUEST RECEIVED AT", time, "::::::::::::::::::::::\n",
//			"\n\n\n\n\n::::\t::::REQUEST::::: \n\n\n\n\n\n\n\n\t", getObjKeys(req), "\n\n\n\n\n\n\n\n\n\n\t::::/REQUEST::::\n:::::\t:::RESPONSE::::\n\n\n\n\n\n\t", getObjKeys(res), "\n\n\n\n\n\n:::::\t:::/RESPONSE::::\t",
	//		"\n:::::::::::::::::::: / " + req.method + " request received at…", time,  "::::::::::::::::::::::");

	console.log("\n\n\n", req.url, req.method, req.headers["cache-control"]);

	res.end("{Hello: " + name + ", Request Method: " + req.method + ", Response Methods: " + methods + ", " + "Response Headers: " + headers + "}");


	if(!!res.next)
			console.log("not not next, call next");

	function getObjKeys(obj) {
		var compilation = "";
		for(var key in obj) {
			compilation += key + ":" + obj[key] + "\n";
		}
		return compilation;
	}
}

function unknownHandler(request, response, next) { 
	console.log("METHOD NOT ALLOWED: unknownHandler…");
	var origin = request.headers.origin || "*";
  response.setHeader('Access-Control-Allow-Headers', 'Origin, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, X-Response-Time, X-PINGOTHER, X-CSRF-Token, Cache-Control');
	if(request.method.toUpperCase() === "OPTIONS") {

		response.methods.push("OPTIONS");
		response.header("Access-Control-Allow-Origin", "*");
		response.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS, CONNECT, HEAD");
		console.log("Returning response.send: ", typeof response.methods, response.methods);
	//	return response.send(response.methods);
		response.end();	
	//return response.end();
	} else {
		return next();
	}
}

server.use(function(req, res, next) {
	res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader('Access-Control-Allow-Headers', 'Origin, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, X-Response-Time, X-PINGOTHER, X-CSRF-Token, Cache-Control');
//	res.header("Access-Control-Allow-Headers", "*");
	res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS, CONNECT, HEAD");
//	res.header("Access-Control-Allow-Methods", "*");
	return next();
});

function routeOptions(request, response, next) {
	console.log("routeOptions called");
//  response.setHeader('Access-Control-Allow-Headers', 'Origin, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, X-Response-Time, X-PINGOTHER, X-CSRF-Token, Cache-Control');
	//response.send(204);
	//return next();
	response.end();
}

function corsHandler(request, response, next) {
	console.log("corsHandler called…");
	var origin = request.headers.origin || "*";
	response.setHeader('Access-Control-Allow-Origin', origin);
  response.setHeader('Access-Control-Allow-Headers', 'Origin, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, X-Response-Time, X-PINGOTHER, X-CSRF-Token, Cache-Control');
  response.setHeader('Access-Control-Allow-Methods', 'GET, PUT, POST, DELETE, OPTIONS, CONNECT, HEAD');
  response.setHeader('Access-Control-Expose-Headers', 'X-Api-Version, X-Request-Id, X-Response-Time');
  response.setHeader('Access-Control-Max-Age', '1000');

	return next();
}

server.use(restify.CORS());
server.use(restify.fullResponse());
server.use(restify.acceptParser(server.acceptable));
server.use(restify.authorizationParser());
server.use(restify.dateParser());
server.use(restify.queryParser());
server.use(restify.jsonp());
server.use(restify.gzipResponse());
server.use(restify.bodyParser());
server.use(restify.throttle({
	burst: 100,
	rate: 50,
	ip: true,
	overrides: {
		'192.168.10.2': {
			rate: 0, //unlimited
			burst: 0
		}
	}
}));

server.on("MethodNotAllowed", unknownHandler);

server.head("/hello/:name", respond);
server.post("/hello/:name", respond);
server.put("/hello/:name", respond);
//				 /^\/([a-zA-Z0-9_\.~-]+)\/(.*)/
server.get(/^\/(jsonp|webapp|storage)\/([a-zA-Z0-9_\.~-]+)\/(.*)/, corsHandler, respond);
server.post(/^\/(jsonp|webapp|storage)\/([a-zA-Z0-9_\.~-]+)\/(.*)/, corsHandler, respond);
server.put(/^\/(jsonp|webapp|storage)\/([a-zA-Z0-9_\.~-]+)\/(.*)/, corsHandler, respond);
server.del(/^\/(jsonp|webapp|storage)\/([a-zA-Z0-9_\.~-]+)\/(.*)/, corsHandler, respond);
server.head(/^\/(jsonp|webapp|storage)\/([a-zA-Z0-9_\.~-]+)\/(.*)/, corsHandler, respond);
//server.opts(/\.*/, corsHandler, routeOptions);
//server.opts(/^\/(jsonp|webapp|storage)\/([a-zA-Z0-9_\.~-]+)\/(.*)/, corsHandler, routeOptions);
//server.options("/jsonp" + /^\/([a-zA-Z0-9_\.~-]+)\/(.*)/, getOptions);
//server.connect("/jsonp" + /^\/([a-zA-Z0-9_\.~-]+)\/(.*)/, respond);

server.listen(9999, "192.168.10.2", function() {
//server.listen(9999, function() {
	console.log("%s listening at %s", server.name, server.url);
});

//server.pre(restify.pre.userAgentConnection());
server.pre(function(request, response, next) {
	restify.pre.userAgentConnection();

	forceTimeout -= 1;
	console.log("timeout in… ", forceTimeout);
	if(forceTimeout <= 0) {
		var timer = 0;
		timer = setTimeout(function() {console.log("timer complete"); clearTimeout(timer);}, 5000);
		forceTimeout = 5;
	} else {
		console.log("server.pre…");
		response.setHeader("Access-Control-Allow-Methods", "GET, PUT, POST, DELETE, OPTIONS, CONNECT");
  	response.setHeader('Access-Control-Allow-Headers', 'Origin, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, X-Response-Time, X-PINGOTHER, X-CSRF-Token, Cache-Control');
		response.setHeader("Access-Control-Allow-Headers", "*");

		return next();
	}
});

console.log("log >>>>>> OS:\n", os, "\n<<<<<<< /log OS");

