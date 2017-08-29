/* global require */

var escodegen = require('escodegen');
var esprima = require('esprima');
var estraverse = require('escodegen/node_modules/estraverse');
var source_map = require('source-map');

var tokenize = require('./tokenize.js').tokenize;
var church_astify = require('./church_astify.js').church_astify;
var church_ast_to_string = require('./church_astify.js').church_ast_to_string;
var js_astify = require('./js_astify.js').church_tree_to_esprima_ast;
var precompile = require('./precompile.js').precompile;
var wctransform = require('./wctransform');
var util = require('./util.js');

var _ = require('underscore');

// Note: escodegen zero-indexes columns, while JS evaluators and the Church
// tokenizer uses 1-indexed columns.

function get_js_to_church_site_map(src_map) {
    var site_map = {};
    var smc = new source_map.SourceMapConsumer(JSON.parse(JSON.stringify(src_map)));
    smc.eachMapping(function(m) {
        // Some of the mappings map to undefined locations for some reason, ignore those
        if (m.originalLine) {
            site_map[m.generatedLine] = site_map[m.generatedLine] || {};
            site_map[m.generatedLine][m.generatedColumn] = m.originalLine + ":" + m.originalColumn;
        }
    });
    return site_map;
}

function get_church_sites_to_tokens_map(tokens) {
    var map = {}
    for (var i = 0; i < tokens.length; i++) {
	map[tokens[i].start] = tokens[i];
    }
    return map;
}

function get_sites_from_stack(split_stack) {
    var sites = [];
    for (var i = 0; i < split_stack.length; i++) {
	// This makes the fairly safe assumption that the first run of consecutive
	// stack frames containing "<anonymous>" belong to the generated code
	if (split_stack[i].match("<anonymous>")) {
	    var site = split_stack[i].match(/(\d+:\d+)[^:]*$/)[1].split(":");
	    sites.push([site[0], parseInt(site[1]-1)]); //See above note on indexing.
	} else if (sites.length > 0) {
	    break;
	}
    }
    return sites;
}

function churchToBareJs(churchCode) {
    return churchToJs(churchCode, {
        includePreamble: false,
        returnCodeOnly: true
    })
}

// options are:
// compact: whether the generated js has human-readable whitespace
// precompile: whether to use noah's precompiling optimizer
// includePreamble: whether js_astify should include the preamble or not
// returnCodeOnly: if true, return just the generated js string. otherwise, return tokens, code, and source map
var churchToJs = function(churchCode, options) {
    if (options === undefined) { options = {} }
    options = _(options).defaults({
        compact: false,
        precompile: false,
        includePreamble: true,
        returnCodeOnly: true,
        wrap: true
    })

    var tokens = tokenize(churchCode);

    var js_ast;

    if(options.precompile) {
        console.log("pre-compiling...");
        var js_precompiled = precompile(churchCode);
        js_ast = esprima.parse(js_precompiled);
    } else {
        var church_ast = church_astify(tokens);
        js_ast = js_astify(church_ast);
    }

    //new wc transform
    js_ast = wctransform.probTransformAST(js_ast, options.includePreamble);

    // transform code so that we can run code inside a global eval
    // we want to turn this:
    //
    //     line_1
    //     line_2
    //     ...
    //     line_n
    //
    // into this:
    //
    //     (function() {
    //     var sideEffects = [];
    //     line_1
    //     line_2
    //     ...
    //     return line_n
    //     })()
    //

    var body = js_ast.body;

    // add sideEffects initialization
    // body.unshift(esprima.parse('var sideEffects = []'));

    // convert the last statement into a return statement
    if (body.length > 0) {
        var lastStatement = body[body.length-1]
        if (/Statement/.test(lastStatement.type)) {

            lastStatement.type = 'ReturnStatement';
            lastStatement.argument = lastStatement.expression;
            delete lastStatement.expression;
        }
    }

    if (options.wrap) {
        // wrap the whole thing in an immediately executed function
        body = [
            {type: 'ExpressionStatement',
             expression: {
                 type: 'CallExpression',
                 callee: { type: 'FunctionExpression',
                           id: {type: "Identifier", name: "churchProgram"},
                           params: [],
                           defaults: [],
                           body:
                           { type: 'BlockStatement',
                             body: body
                           }
                         },
                 arguments: []

             }
            }
        ];
    }

    js_ast.body = body;

    var code_and_source_map = escodegen.generate(js_ast,
                                                 {"sourceMap": "whatever",
                                                  "sourceMapWithCode": true,
                                                  "format": {"compact" : options.compact}});

    if (options.returnCodeOnly) {
        return code_and_source_map.code;
    } else {
        return {
            tokens: tokens,
            code_and_source_map: code_and_source_map
        };
    }
}

function evaluate(church_codestring, options) {
    function really_evaluate() {
        var result = eval(jsCode);
        var t2 = new Date().getTime();
        if (options.timed) console.log("Time to execute: " + (t2-t1) + "ms");
        return result;
    }

    var t0 = new Date().getTime();
    options = options || {};

    // ask churchToJs for all the data, not just the js string
    options.returnCodeOnly = false;

    if (options.desugar) return church_ast_to_string(church_astify(tokenize(church_codestring)));

    var compileResult = churchToJs(church_codestring, options);
    var tokens = compileResult.tokens;
    var code_and_source_map = compileResult.code_and_source_map;
    var jsCode = code_and_source_map.code;
    var sourceMap = code_and_source_map.map;

    // initialize sideEffects
    // this global variable is modified in viz.js
    // and accessed in editor.js (makewebchurchrunner)
    sideEffects = [];
    if (gensym) {
        gensym.__gensymcounter__ = 0;
    }

    if (options.compile) return jsCode;

    var result;

    var t1 = new Date().getTime();
    if (options.timed) console.log("Time to compile: " + (t1-t0) + "ms");
    var argstring = options.argstring;
    if (options.disable_church_errors) return really_evaluate();

    try {
        // var d1 = new Date()

        // use local eval for speed but avoid introducing global variables
        // that stick around after model execution because the transformed code
        // is wrapped inside a function
        result = really_evaluate();
        // var d2 = new Date()
        // console.log("transformed source run time: ", (d2.getTime() - d1.getTime()) / 1000)
    } catch (err) {

	var js_to_church_site_map = get_js_to_church_site_map(sourceMap);
        var churchLines = church_codestring.split("\n");
	var church_sites_to_tokens_map = get_church_sites_to_tokens_map(tokens);
	var stack = err.stack ? err.stack.split("\n") : [":"];
	var msg = stack[0].split(":");

        console.log(err.stack);

	var js_sites = get_sites_from_stack(stack.slice(1));
	var church_sites = [];
	for (var i = 0; i < js_sites.length; i++) {
	    var js_site = js_sites[i];
	    var church_site = js_to_church_site_map[js_site[0]] && js_to_church_site_map[js_site[0]][js_site[1]];

	    if(church_site){church_sites.push(church_site);};
	}


        //        console.log("js source ",sourceMap)
        //        console.log("error stack ", msg)
        //        console.log("js_sites ",js_sites)
        //        console.log("source map ", code_and_source_map.map)
        //        console.log("js to church site map ", js_to_church_site_map)
        //        console.log("church sites ot tokens ", church_sites_to_tokens_map)
        //        console.log("church_sites ", church_sites)

        // 		church_sites = church_sites.filter(function (x) {return x});

 	if (church_sites.length == 0) {
 	    throw err;
 	} else {

	    var token = church_sites_to_tokens_map[church_sites[0]];

            // error sometimes matches on starting paren rather than the function name
            // so seek to next token, which willbe the function name
            var fntoken;
            if (token.text == "(") {
                var tokStart = token.start,
                    tokEnd = token.end,
                    tokeNum;

                for(var j = 0, jj = tokens.length; j < jj; j++) {
                    if (tokens[j].start == tokStart && tokens[j].end == tokEnd) {
                        tokeNum = j;
                    }
                }
                fntoken = tokens[tokeNum + 1];
            }

            var displayedMessage;

            if (msg[0] == "ReferenceError") {
                token = fntoken?fntoken:token;
                displayedMessage = token.text + " is not defined";

            } else if (msg[0] == "TypeError") {
                token = fntoken?fntoken:token;
                displayedMessage = token.text + " is not a function";
            } else {
                displayedMessage = err.message.replace('<<functionName>>', fntoken ? fntoken.text : token.text)
            }

	    var e = util.make_church_error(msg[0], token.start, token.end, displayedMessage);
	    e.stack = church_sites.map(function(x) {
                var tok = church_sites_to_tokens_map[x];
                return tok.start + "-" + tok.end;
            }).join(",");
            e.stackarray = church_sites.map(function(x) {return church_sites_to_tokens_map[x]})

            e.jsStack = stack;

 	    throw e;
 	}
    }

    return result;
}

module.exports = {
    evaluate: evaluate,
    format_result: util.format_result,
    churchToJs: churchToJs,
    churchToBareJs: churchToBareJs
};
