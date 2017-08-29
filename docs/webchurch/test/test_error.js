var evaluate = require("../evaluate.js").evaluate;
var church_builtins = require("../church_builtins.js");
var format_result = require("../evaluate.js").format_result;

tests = [
	["\"unclosed", "1:1-1:1: Unclosed double quote"],
	["(", "1:1-1:1: Unclosed parens"],
	[" ( ", "1:2-1:2: Unclosed parens"],
	["(define x)", "1:1-1:10: Invalid define"],
	["define x 1", "1:1-1:6: Special form define cannot be used as an atom"],
	["(define 1 2)", "1:9-1:9: Invalid variable name"],
	["(define (1 x) x)", "1:10-1:10: Invalid variable name"],
	["(lambda \"bad\" 1)", "1:9-1:13: Invalid variable name"],
	["(let ((#t #f)) #t)", "1:8-1:9: Invalid variable name"],
	["(if #t)", "1:1-1:7: if has the wrong number of arguments"],
	["(if #t 1 2 3)", "1:1-1:13: if has the wrong number of arguments"],

	["(rejection-query true)", "1:1-1:22: rejection-query has the wrong number of arguments"],

	["undef", "1:1-1:5: undef is not defined"],
	["(+ (+ undef))", "1:7-1:11: undef is not defined", "1:7-1:11,1:4-1:12,1:1-1:13"],

	["(undef)", "1:2-1:6: undef is not defined", "1:2-1:6,1:1-1:7"],
	["(+ (+ (undef 1)))", "1:8-1:12: undef is not defined", "1:8-1:12,1:7-1:15,1:4-1:16,1:1-1:17"],

	["(+ 'a)", "1:2-1:2: argument \"a\" to + is not a number", "1:2-1:2,1:1-1:6"],
	["(second (pair 1 2))", "1:2-1:7: 2 does not have required pair structure", "1:2-1:7,1:1-1:19"]
]

for (var i = 0; i < tests.length; i++) {
	try {
		format_result(evaluate(tests[i][0]));
	} catch(err) {
		if (err.message != tests[i][1] || (tests[i].length == 3 && err.stack != tests[i][2])) {
			console.log("Failed:\n" +
						tests[i][0] +
						"\n\nGot error message:\n" +
						err.message +
						"\n\nExpected:\n" +
						tests[i][1] +
						"\n\nGot stack:\n" +
						err.stack +
						"\n\nExpected:\n" +
						tests[i][2] +
						"\n\n******\n");
	}
	

	}
}
