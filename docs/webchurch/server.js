global["evaluate"] = require('./evaluate.js').evaluate
var format_result = require("./evaluate.js").format_result;

var http = require("http");

http.createServer(function(request, response) {
  var post_data = ""
  request.on("data", function(chunk) {post_data += chunk;})

  response.writeHead(200, {"Content-Type": "text/plain"});

  request.on("end", function() {
	response.write(format_result(evaluate(post_data)));
	response.end();
  });

}).listen(8888);
	
