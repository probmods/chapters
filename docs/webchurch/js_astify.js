/* global require */

/*
  This takes an AST for desugarred Church and turns it into a js AST.

  The langauge this accepts is:
  expression_list = expression | expression expression_list
  expression = lambda | application | define | if | quote | identifier | literal
  TODO: fill grammar.
*/

//var escodegen = require("escodegen");
var estraverse = require("escodegen/node_modules/estraverse");
var util = require('./util.js');
var builtins = require('./church_builtins.js');
var builtinAnnotations = builtins.__annotations__;

/*
  construct rename_map using builtinAnnotations
  using anything declared in the 'alias' key.
  if nothing is declared there, default to applying
  these substitutions to construct the alias:

  wrapped_foo => foo
  is_foo      => foo?
  foo_to_bar  => foo->bar
  _ => -

*/

var rename_map = {
    baseval: 'evaluate'
};

renameIdentifiers = {
    leave: function(node) {
	if(node.type == 'Identifier') {
	    if(node.name in rename_map) {
		node.name = rename_map[node.name]
	    } else {
		node.name = format_identifier(node.name)
	    }
	}
	return node
    }
}

Object.keys(builtinAnnotations).forEach(function(name) {
    var annotation = builtinAnnotations[name];
    // var alias;

    // if the annotation contains an explicit alias
    // or array of aliases, set those

    annotation.alias.forEach(function(a) {
        rename_map[a] = name
    }); 
    
    // if (annotation.alias) {
    //     alias = annotation.alias;
    //     if (typeof alias == 'string') {
    //         rename_map[alias] = name;
    //     }
    //     if (Array.isArray(alias)) {
    //         alias.forEach(function(a) {
    //             rename_map[a] = name;
    //         });
    //     }

    // } else {
    //     alias = name
    //         .replace(/wrapped_(.+)/, function(m, p1) { return p1 })
    //         .replace(/is_(.+)/, function(m, p1) { return p1 + "?"})
    //         .replace('_to_', '->')
    //         .replace(/_/g, '-');

    //     rename_map[alias] = name;
    // }
});

var program_node = {
    "type": "Program",
    "body": []
}
var declaration_node = {
    "type": "VariableDeclaration",
    "declarations": [
	{
	    "type": "VariableDeclarator",
	    "id": {
		"type": "Identifier",
		"name": null
	    },
	    "init": null
	}
    ],
    "kind": "var"
}
var assignment_node = {
    "type": "ExpressionStatement",
    "expression": {
	"type": "AssignmentExpression",
	"operator": "=",
	"left": {
	    "type": "Identifier",
	    "name": null
	},
	"right": null
    }
}
var function_expression_node = {
    "type": "FunctionExpression",
    "id": null,
    "params": [],
    "defaults": [],
    "body": {
	"type": "BlockStatement",
	"body": []
    },
    "rest": null,
    "generator": false,
    "expression": false
}
var expression_statement_node = {
    "type": "ExpressionStatement",
    "expression": null
}
var array_node = {
    "type": "ArrayExpression",
    "elements": []
}
var expression_node = {
    "type": null,
    "name": null,
    "value": null
}
//var member_expression_node = {
//	"type": "MemberExpression",
//	"computed": false,
//	"object": {
//		"type": "Identifier",
//		"name": null
//	},
//	"property": {
//		"type": "Identifier",
//		"name": null
//	}
//}

var return_statement_node = {
    "type": "ReturnStatement",
    "argument": null
}
var call_expression_node = {
    "type": "CallExpression",
    "callee": null,
    "arguments": []
}
//var if_statement_node = { //NOTE: using ternary operator instead of if statements, since that maps onto the semantics of church ifs best.
//	"type": "IfStatement",
//	"test": null,
//	"consequent": null,
//	"alternate": null
//}
var conditional_expression_node = { //ternary operator a?b:c
    "type": "ConditionalExpression",
    "test": null,
    "consequent": null,
    "alternate": null
}
var block_statement_node = {
    "type": "BlockStatement",
    "body": []
}

// This line must be the first line of any variadic Church function.
//"var <x> = args_to_list(arguments)"
var variadic_header = {
    "type": "VariableDeclaration",
    "declarations": [
	{
	    "type": "VariableDeclarator",
	    "id": {
		"type": "Identifier",
		"name": null
	    },
	    "init": {
		"type": "CallExpression",
		"callee": {
		    "type": "Identifier",
		    "name": "args_to_list"
		},
		"arguments": [
		    {
			"type": "Identifier",
			"name": "arguments"
		    }
		]
	    }
	}
    ],
    "kind": "var"
}

function strip_quotes(s) { return s.slice(1, -1); }
function get_value_of_string_or_number(s) {
    if (util.is_string(s)) {
	return strip_quotes(s);
    } else {
	return parseFloat(s);
    }
}

function make_location(node) {
    if (node && node.start && node.end) {
	var start_coords = node.start.split(":");
	var end_coords = node.end.split(":");
	return {
	    start: {line: start_coords[0], column: start_coords[1]},
	    end: {line: end_coords[0], column: end_coords[1]}
	};
    }
}

function validate_variable(church_tree) {
    if (!(util.is_leaf(church_tree) && util.is_identifier(church_tree.text))) {
	throw util.make_church_error("SyntaxError", church_tree.start, church_tree.end, "Invalid variable name");
    }
}

function deep_copy(obj) { return JSON.parse(JSON.stringify(obj)); }

// TODO: add all kinds of error-checking.
function church_tree_to_esprima_ast(church_tree) {
    var heads_to_helpers = {
	"lambda": make_function_expression,
	"if": make_if_expression,
	"quote": make_quoted_expression
    }

    function make_declaration(church_tree) {
	validate_variable(church_tree.children[1]);

	var name = church_tree.children[1].text;
	var val = make_expression(church_tree.children[2]);

	var node = deep_copy(declaration_node);
	node["declarations"][0]["id"]["name"] = name;
	node["declarations"][0]["init"] = val;
	return node;
    }

    function make_marginalize(lambda_args, mh_query) {
	// TODO
	var call_expression = deep_copy(call_expression_node);
	call_expression["callee"] = {"type": "Identifier", "name": "marginalize"};

	var computation = make_query_computation(mh_query.slice(3, -1), mh_query[mh_query.length - 1], lambda_args);

	call_expression["arguments"] = [
	    computation,
	    {"type": "Identifier", "name": "traceMH"},
	    make_expression(mh_query[1]),
	    make_expression(mh_query[2])];
	return call_expression;
    }

    function make_function_expression(church_tree) {
	var lambda_args = church_tree.children[1];
	var church_actions = church_tree.children.slice(2);
	if (church_actions.length == 1 && util.is_leaf(church_actions[0]) && church_actions[0].text == "embedded-mh-query") {
	    return make_marginalize(lambda_args, church_actions[0]);
	}

	var func_expression = deep_copy(function_expression_node);
	func_expression["body"]["body"] = make_expression_statement_list(church_actions.slice(0, -1));
	func_expression["body"]["body"].push(make_return_statement(church_actions[church_actions.length-1]));
	if (!util.is_leaf(lambda_args)) {
	    for (var i = 0; i < lambda_args.children.length; i++) {
		validate_variable(lambda_args.children[i]);
		func_expression["params"].push(make_leaf_expression(lambda_args.children[i]));
	    }
	} else {
	    validate_variable(lambda_args);
	    var variadic = deep_copy(variadic_header);
	    variadic["declarations"][0]["id"]["name"] = lambda_args.text;
	    func_expression["body"]["body"].unshift(variadic);
	}
	return func_expression;
    }

    function make_call_expression(church_tree) {
	var call_expression = deep_copy(call_expression_node);
	var callee = church_tree.children[0];
	var args = church_tree.children.slice(1);

	call_expression["callee"] = make_expression(callee);
	call_expression["arguments"] = make_expression_list(args);
	call_expression["loc"] = make_location(church_tree);
	return call_expression;
    }

    function make_return_statement(church_tree) {
	var return_statement = deep_copy(return_statement_node);
	return_statement["argument"] = make_expression(church_tree);
	return return_statement;
    }

    function make_if_expression(church_tree) {
        var conditional_expression = deep_copy(conditional_expression_node)
        conditional_expression.test = make_expression(church_tree.children[1])
        conditional_expression.consequent = make_expression(church_tree.children[2])
        if(church_tree.children[3]) {
            conditional_expression.alternate = make_expression(church_tree.children[3])
        } else {
            conditional_expression.alternate = {type: "Identifier", name: "undefined"}
        }

	return conditional_expression;
    }

    function make_quoted_expression(church_tree) {
        function quote_helper(quoted) {
            if (!util.is_leaf(quoted)) {
                if (quoted.children.length == 0) {
                    return make_leaf_expression(quoted);
                } else if(quoted.children[0].text == "unquote") { //unquote means stop making things literal: translate to js as usual.
                    return make_expression(quoted.children[1])
                } else {
                    var array = {type: "ArrayExpression", elements: [] }//= deep_copy(array_node);
                    var proper_list = true;
                    for (var i = 0; i < quoted.children.length; i++) {
                        if (quoted.children[i].text == ".") {
                            if (i != quoted.children.length - 2) {
                                throw util.make_church_error("SyntaxError", quoted.children[i].start, quoted.children[i].end, "Invalid dot");
                            } else {
                                proper_list = false;
                            }
                        } else {
                            array.elements.push(quote_helper(quoted.children[i]));
                        }
                    }
                    if (proper_list) {
                        array.elements.push({"type": "Literal", "name": null, "value": null});
                    }
                    return array;
                }
            } else {
                if (util.is_identifier(quoted.text)) {
                    var copy = deep_copy(quoted)
                    copy.text = '"' + copy.text + '"'
                    return make_leaf_expression(copy);
                } else {
                    return make_leaf_expression(quoted);
                }
            }
        }
        return quote_helper(church_tree.children[1]);
    }

    function make_expression(church_tree) {
	if (util.is_leaf(church_tree) || church_tree.children.length == 0) {
	    return make_leaf_expression(church_tree);
	} else {
	    if (!util.is_leaf(church_tree) && church_tree.children.length > 0) {
		if (church_tree.children[0].text in heads_to_helpers) {
		    return heads_to_helpers[church_tree.children[0].text](church_tree);
		} else {
		    return make_call_expression(church_tree);
		}
	    }
	}
    }

    function make_leaf_expression(church_leaf) {
	var expression = deep_copy(expression_node);
	if (!util.is_leaf(church_leaf) && church_leaf.children.length == 0) {
	    expression =  {
		type: "ArrayExpression",
		elements: [{"type": "Literal", "name": null, "value": null}]
	    }
	} else if (church_leaf.text == ".") {
	    throw util.make_church_error("SyntaxError", church_leaf.start, church_leaf.end, "Invalid dot");
	} else if (church_leaf.text == undefined) {
	    expression["type"] = "Identifier";
	    expression["name"] = "undefined";
	} else if (util.boolean_aliases[church_leaf.text] != undefined) {
	    expression["type"] = "Literal";
	    expression["value"] = util.boolean_aliases[church_leaf.text];
	} else if (util.is_identifier(church_leaf.text)) {
	    expression = {type: 'Identifier', name: church_leaf.text}
	} else {
	    var value = get_value_of_string_or_number(church_leaf.text);
	    if (typeof value == "number" && value < 0) {
		expression["type"] = "UnaryExpression";
		expression["operator"] = "-"
		expression["argument"] = {"type": "Literal", "value": -value}
	    } else {
		expression["type"] = "Literal";
		expression["value"] = value
	    }

	}
	expression["loc"] = make_location(church_leaf);
	return expression;
    }

    function make_expression_list(church_trees) {
	var body = []
	for (var i = 0; i < church_trees.length; i++) {
	    body.push(make_expression(church_trees[i]));
	}
	return body;
    }

    function make_expression_statement(church_tree) {
	if (!util.is_leaf(church_tree) && church_tree.children.length > 1 && church_tree.children[0].text == "define") {
	    return make_declaration(church_tree);
	} else {
	    var expr_statement = deep_copy(expression_statement_node);
	    expr_statement["expression"] = make_expression(church_tree);
	    return expr_statement;
	}
    }

    function make_expression_statement_list(church_trees) {
	var body = []
	for (var i = 0; i < church_trees.length; i++) {
	    body.push(make_expression_statement(church_trees[i]));
	}
	return body;
    }

    var ast = deep_copy(program_node);
    var body = make_expression_statement_list(church_tree.children);

    ast["body"] = body;
    ast = estraverse.replace(ast, renameIdentifiers)
    return ast;
}

function convert_char(c) { return ("_" + c.charCodeAt(0)); }

// Any identifier that doesn't match the form [a-zA-Z_$][0-9a-zA-Z_$]* isn't
// okay in JS, so we need to rename them.
function format_identifier(id) {

    var new_id;
    if (id[0].match("[a-zA-Z_$]")) {
	new_id = id[0];
    } else {
	new_id = convert_char(id[0]);
    }
    for (var j = 1; j < id.length; j++) {
	if (id[j].match("[0-9a-zA-Z_$]")) {
	    new_id = new_id + id[j];
	} else {
	    new_id = new_id + convert_char(id[j]);
	}
    }

    return new_id;
}

exports.church_tree_to_esprima_ast = church_tree_to_esprima_ast;
exports.rename_map = rename_map;
