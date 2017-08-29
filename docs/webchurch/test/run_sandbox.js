// To be run from the webchurch directory

global["evaluate"] = require('../evaluate.js').evaluate
var format_result = require("../evaluate.js").format_result;

var numargs = process.argv.length
if (numargs > 2) {
    var srcfile = process.argv[process.argv.length-1]
} else {
    var srcfile = "./test/sandbox.church"
}

var pc = process.argv.some(function(x){return x.match(/-pc/)})

code = require('fs').readFileSync(srcfile, "utf8");

try {
	result = format_result(evaluate(code,pc));
	console.log(result);
} catch (e) {
	console.log(e.message)
    throw e
}