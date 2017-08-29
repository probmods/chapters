var util = require('./util.js');
var church_builtins = require('./church_builtins.js');
var rename_map = require('./js_astify.js').rename_map;

var brackets_map = {"(": ")", "[": "]"};

var query_fns = ["rejection-query", "mh-query", "mh-query-scored", "enumeration-query", "conditional"];
var query_fns_to_num_params = {
    "rejection-query": 0,
    "enumeration-query": 0,
    "conditional": 1,
    "mh-query": 2,
    "mh-query-scored": 2
}
var query_decls = ["define", "condition", "factor", "condition-equal", "condition-repeat-equal"];
var condition_fns = ["condition", "factor", "condition-equal", "condition-repeat-equal"];

function make_generic_node(head, children) {
    return {"head": head, "children": children};
}

function deep_copy(obj) { return JSON.parse(JSON.stringify(obj)); }

function isquote(ast){return ast.children && ast.children[0].text && ast.children[0].text=="quote"}

// TODO: add all kinds of error-checking.
function church_astify(tokens) {
    // astify changes the opening bracket tokens so the end site is the matching closing bracket
    function astify(tokens) {

	function helper(opening_bracket) {
	    // Tree nodes have keys [children, start, end]
	    var result = {children: [], start: opening_bracket ? opening_bracket.start : "1:1"};
	    while (tokens.length > 0) {
		if (tokens[0].text == "(" || tokens[0].text == "[") {
		    var bracket = tokens[0];
		    storage.push(tokens.shift());
		    result.children.push(helper(bracket));
		} else if (tokens[0].text == ")" || tokens[0].text == "]") {
		    if (!opening_bracket || tokens[0].text != brackets_map[opening_bracket.text]) {
			throw util.make_church_error("SyntaxError", tokens[0].start, tokens[0].end, "Unexpected close parens");
		    } else {
			result["end"] = tokens[0].start;
			opening_bracket.end = tokens[0].start;
			storage.push(tokens.shift());
			return result;
		    }
		} else {
		    var token = tokens.shift();
		    storage.push(token);
		    result.children.push(token);
		}
	    }
	    if (!opening_bracket) {
		return result;
	    } else {
		throw util.make_church_error("SyntaxError", opening_bracket.start, opening_bracket.end, "Unclosed parens");
	    }
	}
	var storage = [];
	var ast = helper();
	for (var i = 0; i < storage.length; i++) {
	    tokens.push(storage[i]);
	}
	return ast;
    }

    function traverse(ast, fn, stopfn) {
	if (!util.is_leaf(ast) && ast.children.length > 0 && (!stopfn || !stopfn(ast))) {
	    ast = fn(ast);
	    for (var i = 0; i < ast.children.length; i++) {
		ast.children[i] = traverse(ast.children[i], fn, stopfn);
	    }
	}
	return ast;
    }

    function is_special_form(text) {
	return ["define", "lambda", "case", "cond", "if", "let"].indexOf(text) != -1;
    }

    function assert_not_special_form(node) {
	if (is_special_form(node.text)) {
	    throw util.make_church_error("SyntaxError", node.start, node.end, "Special form " + node.text + " cannot be used as an atom");
	}
    }

    function validate_leaves(ast) {
	for (var i = 1; i < ast.children.length; i++) {
	    assert_not_special_form(ast.children[i]);
	}
	return ast;
    }

    // NOTE: Many of the desugar functions don't add range information.
    // For now, it seems unlikely they'll be needed.

    function dsgr_define(ast) {
	if (ast.children[0].text=="define") {
	    if (ast.children.length < 3) {
		throw util.make_church_error("SyntaxError", ast.start, ast.end, "Invalid define");
	    }
	    // Function define sugar
	    if (!util.is_leaf(ast.children[1])) {
		var lambda_args;
		// Variadic sugar
		if (ast.children[1].children.length == 3 && ast.children[1].children[1].text == ".") {
		    lambda_args = ast.children[1].children[2];
		} else {
		    lambda_args = {children: ast.children[1].children.slice(1)};
		}
		var lambda = {
		    children: [
			{text: "lambda"},
			lambda_args
		    ].concat(ast.children.slice(2))
		};
		return {
		    children: [ast.children[0], ast.children[1].children[0], lambda],
		    start: ast.start,
		    end: ast.end
		};
	    }
	}
	return ast;
    }

    function dsgr_lambda(ast) {
	if (ast.children[0].text=="lambda") {
	    if (ast.children.length < 3) {
		throw util.make_church_error("SyntaxError", ast.start, ast.end, "lambda has no body");
	    }
	}
	return ast;
    }

  function dsgr_let(ast) {
    var let_varieties = ["let", "let*","letrec"];

	  if (let_varieties.indexOf(ast.children[0].text)!=-1) {
	    if (ast.children.length < 3) {
		    throw util.make_church_error("SyntaxError", ast.start, ast.end, ast.children[0].text + " has no body");
	    }
      var isNamedLet = (ast.children.length == 4);

      var bindings = isNamedLet ? ast.children[2] : ast.children[1];

      // named let
      if (isNamedLet) {
        // TODO: check that name is valid
      }

	    var valid_bindings = true;
	    if (util.is_leaf(bindings)) {
		    valid_bindings = false;
	    } else {
		    for (var i = 0; i < bindings.children.length; i++) {
		      if (util.is_leaf(bindings.children[i]) || bindings.children[i].children.length != 2) {
			      valid_bindings = false;
			      break;
		      }
		    }
	    }
	    if (!valid_bindings) {
		    throw util.make_church_error_range("SyntaxError", bindings.start, bindings.end, ast.children[0].text + " has invalid bindings");
	    }

      if (isNamedLet) {
        // example input:
        // (let
        //     loop ((arr '(3 -2 1 6 -5)))
        //     (if (null? arr)
        //         0
        //         (+ 1 (loop (cdr arr)))))

        // example output:
        // ((lambda ()
        //    (define loop (lambda (arr) (if (null? arr) 0 (+ 1 (loop (cdr arr))))))
        //    (loop (quote (3 -2 1 6 -5)))))

        // note that this is not iterative because we are doing this as a church desugaring
        // rather than a js compilation
        // i'm not sure that js compilation is feasible work, as the named let procedure might do randomness
        // and the loop counter for addressing is probably not enough to identify different addresses
        // (e.g., we could have the same loop counter for different procedure arguments, which would be bad)

        var loopName = ast.children[1].text;
        var argList = {children: bindings.children.map(function(x) {return x.children[0]})};
        var initialArgValues = bindings.children.map(function(x) {return x.children[1]});
        var body = ast.children[3];
        return {
          children: [
            {
              children: [
                {text: "lambda"},
                {children: []},
                {children: [
				          {text: "define"},
				          {text: loopName},
			            {children: [
				            {text: "lambda"},
				            argList,
				            body
			            ]}
			          ]},
                {children: [{text: loopName}].concat(initialArgValues)}
              ]
            }
          ]
        }
      }

	    switch (ast.children[0].text) {
	    case "let":
		    return {
		      children: [
			      {
			        children: [
				        {text: "lambda"},
				        {children: bindings.children.map(function(x) {return x.children[0]})},
				        ast.children[2]
			        ]
			      }
		      ].concat(bindings.children.map(function(x) {return x.children[1]}))
		    };
	    case "let*":
		    var new_ast = {
		      children: [
			      {
			        children: [
				        {text: "lambda"},
				        {children: []},
				        ast.children[2]
			        ]
			      }
		      ]
		    }
		    for (var i = bindings.children.length-1; i >= 0; i--) {
		      // console.log(JSON.stringify(bindings.children[i].children[0],undefined,2))
		      new_ast = {
			      children: [
			        {
				        children: [
				          {text: "lambda"},
				          {children: [bindings.children[i].children[0]]},
				          new_ast
				        ]
			        },
			        bindings.children[i].children[1]
			      ]
		      }
		    }
		    return new_ast;
      case "letrec":
        // example input:
        // (letrec ([is-even? (lambda (n) (if (= n 0) true (is-odd? (- n 1))))]
        //          [is-odd? (lambda (n) (if (= n 0) false (is-even? (- n 1))))])
        //  (is-odd? 131))

        // example output:
        // ((lambda ()
        //   (define is-even? (lambda (n) (if (= n 0) true (is-odd? (- n 1)))))
        //   (define is-odd? (lambda (n) (if (= n 0) false (is-even? (- n 1)))))
        //   (is-odd? 131)))

        var children = bindings.children.map(function(child) {
          return {
            children: [{text: "define"}].concat(child.children)
          }
        })

        var lambdaBody = children.concat(ast.children[2]);
        // console.log(JSON.stringify(lambdaBody, null, 1));

        var new_ast = {
		      children: [
			      {
			        children: [
				        {text: "lambda"},
				        {children: []}
			        ].concat(lambdaBody)
			      }
		      ]
		    };

        return new_ast;
	    }

	  } else {
	    return ast;
	  }
  }

    function dsgr_quote(ast) {
        var last = ast.children[ast.children.length-1];
        if (last.text=="'") {
            throw util.make_church_error("SyntaxError", last.start, last.end, "Invalid single quote");
        }
        for (var i = ast.children.length - 2; i >= 0; i--) {
            if (ast.children[i].text == "'") {
                ast.children.splice(i, 2, {
                                    children: [{text: "quote", start: ast.children[i].start, end: ast.children[i].end}, ast.children[i+1]],
                                    start: ast.children[i].start,
                                    end: ast.children[i+1].end
                                    });
            }
        }
        return ast;
    }

    function dsgr_unquote(ast) {
        for (var i = ast.children.length - 2; i >= 0; i--) {
            if (ast.children[i].text == ",") {
                ast.children.splice(i, 2, {
                                    children: [{text: "unquote", start: ast.children[i].start, end: ast.children[i].end}, ast.children[i+1]],
                                    start: ast.children[i].start,
                                    end: ast.children[i+1].end
                                    });
            }
        }
        return ast;
    }

    //turn (... , @ foo ...) into  (, (append ' (...) foo ' (...)))
    //because this wraps each items have to also turn "... , foo ..." into "... (list foo) ..."
    //note: do this before desugarring quote and unquote.
    function dsgr_splunquote(ast) {

        //todo:start and end
        var ats = false
        var children = [{text: "append"}]
        for(var c = 0; c < ast.children.length; c++){
            if(ast.children[c].text =="," && ast.children[c+1].text =="@") {
                ats = true
                children.push(ast.children[c+2])
                c=c+2
            } else if(ast.children[c].text ==","){
                children.push({children:[{text:"list"}, ast.children[c+1]]})
                c=c+1
            } else {
                children.push({text: "'"})
                children.push({children: [ast.children[c]]})
            }
        }
        if(ats){
            return {children: [{text:"unquote"}, {children: children}]}
        } else {
            return ast
        }
    }

    function dsgr_case(ast) {
	function case_helper(key, clauses) {
	    if (clauses.length == 0) {
		return undefined;
	    }
	    var clause = clauses[0];
	    if (util.is_leaf(clause) || clause.children.length != 2 ||
		(util.is_leaf(clause.children[0]) && clause.children[0].text!="else")) {
		throw util.make_church_error("SyntaxError", clause.start, clause.end, "Bad clause for case");
	    }

	    if (clause.children[0].text=="else") {
		if (clauses.length > 1) {
		    throw util.make_church_error("SyntaxError", clause.start, clause.end, "Bad placement of else clause in case");
		} else {
		    return clause.children[1];
		}
	    } else {
		for (var i = 0; i < clause.children[0]; i++) {
		    var datum = clause.children[0].children[i];
		    if (util.is_leaf(datum)) {
			throw util.make_church_error("SyntaxError", datum.start, datum.end, " for case");
		    }
		}

		var next = case_helper(key, clauses.slice(1));
		var new_ast = {
		    children: [
			{text: "if"},
			{
			    children: [
				{text: "member"},
				key,
                                {children: [{text: "list"}].concat(clause.children[0].children)}
				// {children: [{text: "list"}].concat(clause.children[0])}
			    ]
			},
			clause.children[1]
		    ]
		};
		if (next) {
		    new_ast.children.push(next);
		}
		return new_ast;
	    }
	}

	if (ast.children[0].text=="case") {
	    if (ast.children.length < 3) {
		throw util.make_church_error("SyntaxError", ast.start, ast.end, "case is missing clauses");
	    }
	    return case_helper(ast.children[1], ast.children.slice(2));
	} else {
	    return ast;
	}
    }

    function dsgr_cond(ast) {
	function cond_helper(clauses) {
	    if (clauses.length == 0) {
		return undefined;
	    }
	    var clause = clauses[0];
	    if (util.is_leaf(clause) || clause.children.length != 2) {
		throw util.make_church_error("SyntaxError", clause.start, clause.end, "Bad clause for cond");
	    }
	    if (clause.children[0].text=="else") {
		if (clauses.length > 1) {
		    throw util.make_church_error("SyntaxError", clause.start, clause.end, "Bad placement of else clause in cond");
		} else {
		    return clause.children[1];
		}
	    } else {
		var next = cond_helper(
		    clauses.slice(1));
		var new_ast = {
		    children: [
			{text: "if"},
			clause.children[0],
			clause.children[1]
		    ]
		};
		if (next) {
		    new_ast.children.push(next);
		}
		return new_ast;
	    }
	}

	if (ast.children[0].text=="cond") {
	    if (ast.children.length < 2) {
		throw util.make_church_error("SyntaxError", ast.start, ast.end, "cond is missing clauses");
	    }
	    return cond_helper(ast.children.slice(1));
	} else {
	    return ast;
	}
    }

    function dsgr_eval(ast) {
        if (ast.children[0].text == "eval") {
            return {
		            children: [
		                {text: "eval"},
		                {
                        children: [
                            // churchToBareJs: for use in eval only
                            {text: "churchToBareJs"},
                            {
                                children: [
                                    {text: "formatResult"},
                                    ast.children[1]
                                ]
                            }
                        ]
                    }
                ]
            }
	      }
        return ast;
    };

    function dsgr_load(ast) {
        if (ast.children[0].text == "load") {
            if (ast.children[0].text == "load") {
                return {
		                children: [
		                    {text: "eval"},
		                    {
                            children: [
                                // churchToBareJs: for use in eval only
                                {text: "load_url"},
                                ast.children[1]
                            ]
                        }
                    ]
                }
	          }
        }
        return ast;
    };


    function dsgr_query(ast) {
		// Makes the lambda that's passed to the query function
		function query_helper(statements, args) {
			// The final output of the query
			var query_exp;
			var query_exp_index;
			for (var i = 0; i < statements.length; i++) {
				// If query_exp is set, then any statement after that which is not a define, factor, or condition
				// is implicitly a condition
				if (util.is_leaf(statements[i]) || query_decls.indexOf(statements[i].children[0].text) == -1) {
					if (query_exp) {
						statements[i] = {
						    children: [{text: "condition"}, statements[i]],
						    start: condition.start,
						    end: condition.end
						};
					} else {
						query_exp = statements[i];
						query_exp_index = i;
					}
				}
			}
		    args = args || {children: []};
			return {
				children: [
					{text: "lambda"},
					args
				].concat(statements.slice(0, query_exp_index))
					.concat(statements.slice(query_exp_index+1))
					.concat(query_exp)
			}
		}

		if (query_fns.indexOf(ast.children[0].text) != -1) {
		    var num_params = query_fns_to_num_params[ast.children[0].text];
		    if (ast.children.length < num_params + 3) {
				throw util.make_church_error("SyntaxError", ast.start, ast.end, ast.children[0].text + " has the wrong number of arguments");
		    }
		    return {
				children: [
				    ast.children[0],
				    query_helper(ast.children.slice(num_params+1))
				].concat(ast.children.slice(1, num_params+1)),
				start: ast.start,
				end: ast.end
		    };
		}

		return ast;
    }

    function validate_if(ast) {
	if (ast.children[0].text=="if") {
	    if (ast.children.length < 3 || ast.children.length > 4) {
		throw util.make_church_error("SyntaxError", ast.start, ast.end, "if has the wrong number of arguments");
	    }
	}
	return ast;
    }

    function transform_equals_condition(ast) {
		function is_equals_conditionable(ast) {
		    if (util.is_leaf(ast)) return false;
		    var fn = church_builtins.__annotations__[rename_map[ast.children[0].text]];
		    return fn && fn.erp && ast.children[fn.numArgs[fn.numArgs.length-1]] == undefined;
		}

		function transform_erp(erp, conditioned_value) {
		    erp.children.push(conditioned_value);
		}

		function try_transform(left, right) {
		    if (left == undefined) return false;
		    if (is_equals_conditionable(left)) {
				transform_erp(left, right);
				statements.splice(i, 1, left);
				return true;
		    } else if (util.is_leaf(left) && define_table[left.text] && is_equals_conditionable(define_table[left.text].def)) {
				var left_entry = define_table[left.text];
				if (!util.is_identifier(right.text) || (
				    define_table[right.text] && left_entry.index > define_table[right.text].index)) {
				    transform_erp(left_entry.def, right);
				    statements.splice(i, 1);
				    return true;
				}
		    }
		    return false;
		}

		var transformed;
		if (query_fns.indexOf(ast.children[0].text) != -1) {
		    var define_table = {};
		    // Assumes preprocessing through dsgr_query
		    var statements = ast.children[1].children.slice(2);
		    var i = 0;
		    // Iterate through each lambda statement
		    for (var i = 0; i < statements.length; i++) {
				if (!util.is_leaf(statements[i])) {
				    // If statement is a define and an ERP without an existing condition, put it in a table
				    if (statements[i].children[0].text == "define") {
						define_table[statements[i].children[1].text] = {
						    index: i,
						    def: statements[i].children[2]
						};
					// If statement is a condition, check if it's an equality and attempt to transform
				    } else if (statements[i].children[0].text == "condition") {
						var condition = statements[i].children[1];
						if (!util.is_leaf(condition) && ["=", "equal?"].indexOf(condition.children[0].text) != -1 && condition.children.length == 3) {
						    var left = condition.children[1];
						    var right = condition.children[2];
						    if (!try_transform(left, right)) try_transform(right, left);
						}
				    }
				}
		    }
		} else if (ast.children[0].text == "condition") {
			function transform(left, right) {
			    if (is_equals_conditionable(left)) {
					transform_erp(left, right);
					return true;
				}
		    }
			var condition = ast.children[1];
			if (!util.is_leaf(condition) && ["=", "equal?"].indexOf(condition.children[0].text) != -1 && condition.children.length == 3) {
			    var left = condition.children[1];
			    var right = condition.children[2];
			    if (!transform(left, right)) transform(right, left);
			}
		}
		return ast;
    }

    function transform_repeat_equals_condition(ast) {
		function try_transform(left, right) {
		    if (!util.is_leaf(left) && left.children[0].text == "repeat") {
				ast.children[1].children[i+2] = {
				    children: [
					{"text": "multi-equals-condition"},
					left.children[2],
					left.children[1],
					right],
				    start: ast.children[1].children[i+2].children[0].start,
				    end: ast.children[1].children[i+2].children[0].end
			};
			return true;
		    }
		    return false;
		}

		if (query_fns.indexOf(ast.children[0].text) != -1) {
		    var statements = ast.children[1].children.slice(2);
		    for (var i = 0; i < statements.length; i++) {
				if (!util.is_leaf(statements[i]) && statements[i].children[0].text == "condition") {
				    var condition = statements[i].children[1];
				    if (!util.is_leaf(condition) && condition.children[0].text == "equal?" && condition.children.length == 3) {
					var left = condition.children[1];
					var right = condition.children[2];
					if (!try_transform(left, right)) try_transform(right, left);
				    }
				}
		    }
		}
		return ast;
    }

    // Break out conditions with ands into multiple condition statements
    function transform_and_condition(ast) {
	if (["rejection-query", "enumeration-query", "mh-query"].indexOf(ast.children[0].text) != -1) {
	    var lambda = ast.children[1];
	    var stmts = lambda.children.splice(2);
	    for (var i = 0; i < stmts.length; i++) {
		if (!util.is_leaf(stmts[i]) && stmts[i].children[0].text == "condition") {
		    var condition_stmt = stmts[i];
		    var condition = condition_stmt.children[1];
		    if (!util.is_leaf(condition) && condition.children[0].text == "and") {
			for (var j=1;j<condition.children.length;j++) {
			    lambda.children.push({children: [condition_stmt.children[0], condition.children[j]]});
			}
		    } else {
			lambda.children.push(stmts[i]);
		    }
		} else {
		    lambda.children.push(stmts[i]);
		}
	    }
	}
	return ast;
    }

    // Order is important, particularly desugaring quotes before anything else.
    var desugar_fns = [
	validate_leaves, dsgr_define, dsgr_lambda, dsgr_let, dsgr_case, dsgr_cond, dsgr_eval, dsgr_load, dsgr_query, validate_if,
	transform_and_condition, transform_equals_condition];

    var ast = astify(tokens);
    // Special top-level check
    for (var i = 0; i < ast.children.length; i++) {
	assert_not_special_form(ast.children[i]);
    }
    ast = traverse(ast, dsgr_splunquote);
    ast = traverse(ast, dsgr_quote);
    ast = traverse(ast, dsgr_unquote);
    for (var i = 0; i < desugar_fns.length; i++) {
	ast = traverse(ast, desugar_fns[i], isquote);
    }

    return ast;
}

function church_shallow_preconditions(ast) {
    return traverse(ast, transform_equals_condition, isquote)
}

// Print a Church AST for debugging
function church_ast_to_string(ast) {
    if (util.is_leaf(ast)) {
	return ast.text;
    } else {
	return "(" + ast.children.map(function(x) {return church_ast_to_string(x)}).join(" ") + ")"
    }
}

module.exports =
    {
	church_ast_to_string: church_ast_to_string,
        church_astify: church_astify,
        church_shallow_preconditions: church_shallow_preconditions
    }
