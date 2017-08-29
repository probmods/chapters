var escodegen = require("escodegen")

var tokenize = require("../tokenize.js").tokenize
var church_astify = require("../church_astify.js").church_astify
var js_astify = require("../js_astify.js").church_tree_to_esprima_ast
var church_builtins = require("../church_builtins.js");

tests = [
	["(rejection-query (flip) #t)",
	 "rejectionSample(function(){condition(true);return church_builtins.wrapped_flip();});"],
	
	["(rejection-query (define a 1) a #t)",
	 "rejectionSample(function(){var _a=1;condition(true);return _a;});"],
	
	["(rejection-query (define a (flip)) (define b (flip)) (and a b) a)",
	 "rejectionSample(function(){var _a=church_builtins.wrapped_flip();var _b=church_builtins.wrapped_flip();condition(_a);return church_builtins.and(_a,_b);});"]
]

for (var i = 0; i < tests.length; i++) {
	try {
		result = escodegen.generate(
			js_astify(
				church_astify(
					tokenize(tests[i][0]))),
			{format: {compact: true}})
	} catch(err) {
		result = err.message
	}
	if (result != tests[i][1]) {
		console.log("Failed:\n" +
					tests[i][0] +
					"\n\nGot:\n" +
					result +
					"\n\nExpected:\n" +
					tests[i][1] +
					"\n\n******\n");
	}
	
}