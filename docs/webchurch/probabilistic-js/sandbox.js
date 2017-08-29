// var trace = require('./probabilistic/trace')
// var util = require('./probabilistic/util')
// util.openModule(trace)

// function foo()
// {
// 	//console.log(arguments.callee.caller.caller);
// 	//console.log(arguments.callee);
// 	//console.log(trace.getStack(0, 1)[0].getFunction().name)
// 	// var frameobj = trace.getStack(0, 1)[0]; var frameobj2 = trace.derp()
// 	// console.log(frameobj.getFileName())
// 	// console.log(frameobj.getLineNumber())
// 	// console.log(frameobj.getColumnNumber())
// 	// console.log(frameobj.pos)
// 	// console.log(frameobj2.pos)
// }
// foo = prob(foo)
// foo = prob(foo)
// console.log(foo.__probabilistic_lexical_id)

// function foo()
// {
// 	function bar()
// 	{
// 		function baz()
// 		{
// 			var s = getStack(1, 1)
// 			console.log(s.length)
// 			console.log(s[0].getFunction().name)
// 		}
// 		baz()
// 	}
// 	bar()
// }
// foo()


/////////////////////////////////////////////////////

// /*
// Testing if V8 interns the source code string for functions
// */

// var foo = function()
// {
// 	console.log('derp')
// 	return 42
// }

// var bar = function()
// {
// 	console.log('derp')
// 	return 42
// }

// var str1 = "Hey there"
// var str2 = "Hey there"

// var str3 = "Hey" + "there"
// var str4 = "Hey" + "there"

// // Function object comparison
// var taccum = 0
// for (var i = 0; i < 1000000; i++)
// {
// 	var t = new Date()
// 	var eq = (foo == bar)
// 	var t2 = new Date()
// 	taccum += (t2.getTime() - t.getTime())
// }
// console.log("Time for function object comparison: " + taccum)

// // String literal comparison
// var taccum = 0
// for (var i = 0; i < 1000000; i++)
// {
// 	var t = new Date()
// 	var eq = (str1 == str2)
// 	var t2 = new Date()
// 	taccum += (t2.getTime() - t.getTime())
// }
// console.log("Time for string literal comparison: " + taccum)

// // String nonliteral comparison
// var taccum = 0
// for (var i = 0; i < 1000000; i++)
// {
// 	var t = new Date()
// 	var eq = (str3 == str4)
// 	var t2 = new Date()
// 	taccum += (t2.getTime() - t.getTime())
// }
// console.log("Time for string nonliteral comparison: " + taccum)

// // Function string comparison
// var taccum = 0
// for (var i = 0; i < 1000000; i++)
// {
// 	var t = new Date()
// 	var eq = (foo.toString() == bar.toString())
// 	var t2 = new Date()
// 	taccum += (t2.getTime() - t.getTime())
// }
// console.log("Time for function string comparison: " + taccum)


/////////////////////////////////////////////////////


// Function.prototype.__defineGetter__("__testThingy", function()
// {
// 	throw new Error("error in " + this.name + "!")
// })

// function foo()
// {
// 	return 42
// }

// foo.__testThingy


/////////////////////////////////////////////////////

// var foo = prob(function foo()
// {
// 	var tr = trace.getGlobalTrace()
// 	console.log(tr.currentName(0))
// 	var bar = prob(function bar()
// 	{
// 		console.log(tr.currentName(0))
// 		var baz = prob(function baz()
// 		{
// 			console.log(tr.currentName(0))
// 		})
// 		baz()
// 	})
// 	bar()
// })

// var tr = trace.newTrace(foo)
// //tr.traceUpdate()


/////////////////////////////////////////////////////

// var erp = require("./probabilistic/erp")
// for (var i = 0; i < 20; i++)
// 	console.log(erp.flip())

/////////////////////////////////////////////////////

// function foo()
// {
// 	console.log(trace.getStack(8, 1)[0])
// }
// foo()

/////////////////////////////////////////////////////

// var pr = null
// try
// {
// 	pr = require("probabilistic")
// } catch (e)
// {
// 	pr = require("./probabilistic")
// }

// console.log(pr)

/////////////////////////////////////////////////////

// var esprima = require("esprima")
// var code = "(function() { return 5; })()"
// // var code = "foo()"
// var ast = esprima.parse(code)
// console.log(ast.body[0].expression)

/////////////////////////////////////////////////////

// // Add a string format method
// if (!String.prototype.format) {
//   String.prototype.format = function() {
//     var args = arguments;
//     return this.replace(/{(\d+)}/g, function(match, number) { 
//       return typeof args[number] != 'undefined'
//         ? args[number]
//         : match
//       ;
//     });
//   };
// }

// var esprima = require("esprima")
// var estraverse = require("escodegen/node_modules/estraverse")
// var escodegen = require("escodegen")

// var code = "var y = foo(1.0, 42); var z = bar(2.0, 99);"
// var replcode = "(function() {s.push({0}); var x = __p_REPLACEME_p__; s.pop(); return x; })()"

// function makeWrappedCallReplacer(callNode)
// {
// 	var replacer = 
// 	{
// 		enter: function(node)
// 		{
// 			if (node.type == estraverse.Syntax.Identifier &&
// 				node.name == "__p_REPLACEME_p__")
// 			{
// 				return callNode
// 			}
// 			return node
// 		}
// 	}
// 	return replacer
// }

// var nextid = 0
// var callWrapper = 
// {
// 	enter: function(node)
// 	{
// 		if (node.skip) return estraverse.VisitorOption.Skip;
// 		if (node.type == estraverse.Syntax.CallExpression)
// 		{
// 			var replacer = makeWrappedCallReplacer(node)
// 			var wrapast = esprima.parse(replcode.format(nextid)).body[0].expression
// 			nextid++
// 			wrapast.callee.skip = true
// 			estraverse.replace(wrapast, replacer)
// 			return wrapast
// 		}
// 		return node
// 	}
// }

// var ast = esprima.parse(code)
// estraverse.replace(ast, callWrapper)
// console.log(escodegen.generate(ast))

/////////////////////////////////////////////////////

console.log("hi")






