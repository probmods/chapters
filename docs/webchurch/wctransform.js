var esprima = require("esprima")
//var escodegen = require("escodegen")
var estraverse = require("escodegen/node_modules/estraverse")

/*
  -Webchurch generates a simpler js sublanguage than full js.. so transform can be simpler. Make a specialized transform for webchurch, and just use probabilistic-js runtime.
  -In transform, first put into A-normal form, by lifting any CallExpression to enclosing statement (which turns into a block statement).
  -Then can wrap calls with enter / leave without making and using a thunk.
  -on enter:
  if a ConditionalExpression replace any non-imediate subexpression (ie not identifier or literal) with function(){subexp}() statement. (to maintain control flow.) mark this call as skipped so it desn't get moved.
  -on leave:
  if a CallExpression (an not skip marked) replace with a fresh identifier, add to  list of calls to move.
  if a Statement, if call list is not empty, replace with Block statement which is variable declaration for each call, wrapped in enterfn/leavefn, then original statement.

  Note: could be more efficient by not wrapping deterministic primitive calls....
*/

function templateReplace(template, replacenode) {
    var replacer =
	{
            enter: function(node)
	    {
		if (node.type == estraverse.Syntax.Identifier &&
		    node.name == "__REPLACEME__")
		{
		    return replacenode
		}
		return node
	    }
	}
    var templateAST = esprima.parse(template).body[0] //NOTE: template must be expression or single statement.
    return estraverse.replace(templateAST, replacer)
}

var WrapIfs =
    {

        enter: function(node)
	{
            if(node.type == 'ConditionalExpression') {
                //replace any non-imediate subexpression (ie not identifier or literal) with function(){subexp}() statement. (to maintain control flow.) mark this call as skipped so it desn't get moved.
                if(!(node.test.type == 'Identifier' ||  node.test.type == 'Literal')) {
                    node.test = templateReplace("(function(){return __REPLACEME__}())", node.test).expression
                    node.test.skipcall=true
                }
                if(!(node.consequent.type == 'Identifier' ||  node.consequent.type == 'Literal')) {
                    node.consequent = templateReplace("(function(){return __REPLACEME__}())", node.consequent).expression
                    node.consequent.skipcall=true
                }
                if(!(node.alternate.type == 'Identifier' ||  node.alternate.type == 'Literal')) {
                    node.alternate = templateReplace("(function(){return __REPLACEME__}())", node.alternate).expression
                    node.alternate.skipcall=true
                }
            }
            return node
        }
    }

var nextid = 0;

var idToFunctionName = {};

global.humanizeAddress = function(name) {
    var splitName = name.split("."),
        erpStack = splitName[0].split(":"),
        loopCounter = splitName[1];

    return erpStack.map(function(name) { return idToFunctionName[name]}).join(" ") + "." + loopCounter;
}

var MoveCalls =
    {
        leave: function(node)
        {

            //get call to be moved up from children:
            var callsToMove = []
            var candidates = estraverse.VisitorKeys[node.type]
            for(var c in candidates) {
                var candidate = node[candidates[c]]
                if(!candidate){break}
                if(candidate instanceof Array) {
                    for(var i in candidate){callsToMove = callsToMove.concat(candidate[i].callsToMove || [])}
                } else {
                    callsToMove = callsToMove.concat(candidate.callsToMove || [])
                }
            }

            //transform calls (which could be in args) by replacing with new identifier, wrapping with enter/leave marks, and adding to queue to move up.
            if(!node.skipcall && node.type == 'CallExpression') {
                //replace with new identifier, add to call queue.
                var id = nextid++
                var idNode = {type: "Identifier", name: "call"+id}
                idToFunctionName[id + ""] = node.callee.name;
                var newCallBlock = templateReplace("{enterfn("+id+"); var call"+id+"=__REPLACEME__; leavefn();}",node)
                newCallBlock.body[1].loc = node.loc //original location of new assignment is set to original call. needed because error stack inside eval doesn't give character, only line.
                callsToMove.push(newCallBlock)
                idNode.callsToMove = callsToMove
                return idNode
            }

            //catch calls that are being moved at closest Statement:
            //IfStatement (which may be generated by tracer) are handled because then paths will be statements of below types and calls in test expression are lifted above the if.
            if(node.type == 'ExpressionStatement'
               || node.type == 'Program'
               || node.type == 'BlockStatement'
               || node.type == 'ReturnStatement'
               || node.type == 'VariableDeclaration') {

                //statements that don't already have a body sequence get wrapped in a block statement:
                if(node.type == 'ExpressionStatement'
                   || node.type == 'ReturnStatement'
                   || node.type == 'VariableDeclaration') {
                    node = {type: "BlockStatement", body: [node]}
                }
                //stick moved calls onto top of body sequence:
                node.body = callsToMove.concat(node.body)
                return node
            }

            //if we didn't already return, add moved calls to queue on this node and return:
            node.callsToMove = callsToMove
            return node

        }
    }

/*
  Collapse out nested blockSatements, just to make things prettier.
*/

var BlockStatementCollapser ={
    leave: function(node){
        if(node.type == 'BlockStatement' || node.type == 'Program') {
            var newbody = []
            for(var i in node.body) {
                if(node.body[i].type == 'BlockStatement') {
                    node.body[i].body.map(function(x){newbody.push(x)})
                } else {
                    newbody.push(node.body[i])
                }
            }
            node.body = newbody
        }
        return node
    }
}

//preamble that forwards the functions needed at runtime:
var preamble = "\
var formatResult = require('./util.js').format_result;\
var churchToBareJs = require('./evaluate').churchToBareJs;\
var __pr = require('./probabilistic-js');\
__pr.openModule(__pr);\
var __ch = require('./church_builtins');\
openModule(__ch);";

//function probTransform(codeString)
//{
//	var ast = esprima.parse(codeString)
//    return probTransformAST(ast)
//}

function probTransformAST(ast, includePreamble)
{
    estraverse.replace(ast, WrapIfs)
    estraverse.replace(ast, MoveCalls)
    if (includePreamble) {
	ast.body.unshift(esprima.parse(preamble))
    }
    estraverse.replace(ast, BlockStatementCollapser)
    return ast
}

module.exports =
    {
	probTransformAST: probTransformAST,
        //	probTransform: probTransform,
        BlockStatementCollapser: BlockStatementCollapser
    }

"var x = foo(1, bar(), 3)"
