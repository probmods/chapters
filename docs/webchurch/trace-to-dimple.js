/* global require, module */

/*

 Overview
 ========
 
 Take a finite trace which is in simple form (namely, the output of trace.js) and convert into a set of Dimple calls to construct a factor graph.
 Then call a Dimple solver. (What's the right Church abstraction? 'dimple-query'? needs access to traced source, not just thunk though).

 Translation
 ===========
 
 Input language spec: Single-static assignment (SSA), except that the final var in an 'if' is assigned in each branch.
 - assignment: var = function(var, ...)
 - conditional: if(var){...; assignment} else {...; assignment}
 - evidence: condition(var) | factor(var)
 
 Translation is pretty straightforward, except that a bunch of information is needed about primitive functions. The transformation metadata is defined for each Church primitive inside the dimple/factors/ directory. Files in this directory are named after the canonical JS version of Church primitives. For example: 
 - Info for `flip` lives in `wrapped_flip.js`, because wc compiles church erp calls named x to JS calls named wrapped_x
 - Info for `+` lives in `plus.js`, because wc defines + as an alias for the canonical name `plus`.
 - Info for `pow` lives in `expt.js`, because wc defines `pow` as an alias for the canonical name `expt`.

 For more on the metadata files, see the comments for DimpleFactor further down

 Header
 ------
 FactorGraph fg = new FactorGraph();

 Declaring variables
 -------------------
 IN:
 var ab1 = foo(ab2, ab3)
 
 OUT:
 <dimpleReturnType("foo")> ab1 = new <dimpleReturnType("foo")>();
 fg.addFactor(<dimpleFactor("foo")>, ab1, ab2, ab3); 

 Conditioning
 ------------
 IN: 
 condition(ab1)

 OUT:
 ab1.FixedValue = true;

 (Church) factor statements
 --------------------------
 IN:
 factor(ab1)

 OUT:
 fg.addFactor(<some-dimple-factor-that-just-returns-the-input-value, ab1)

 Notes
 ======
 - most dimple built-in factors have church/js equivalents.
 - sometimes the arg patterns mismatch. need to wrap them up.
    -for ERPs without dimple builtins we could wrap up scoring code (or ask dimple team to add them…).
    -are there (common) church/js deterministic functions that don't have dimple builtins? can we translate to java directly? (is it possible to automatically generate java functions for deterministic parts using Rhino or another js->java compiler?)
 
 treatment for condition and factor statements:
    -factor statements can get directly translated into dimple factor statements. (note we may eventually want to intercept the expression computing score before it gets traced, because otherwise we generate a ton of variables with deterministic dependencies. i don't know how well dimple deals with these.)

 inference and execution:
    how flexible should the dimple solver call be? maybe start by just choosing one, later can pass control args that setup the solver.
    initially we can just generate a source code file which we run with java by system call?
    what's the simplest js<->java glue to use more generally? maybe wrap dimple as an applet and call methods using browser magic?

 
 TODO:
 
 -Update the above spec, given that i've changed the function signatures somewhat... ;)
 -First pass assumes all variables are boolean, only erp is flip, and primitives are: and, or, not. 
   -Need to do correct dimple translations.
   -Make basic models to test the pipeline.
   - handle querying
 - source maps (longer term)

*/

var escodegen = require('escodegen');
var esprima = require('esprima');
var _ = require('underscore'); 
// HT http://blog.elliotjameschong.com/2012/10/10/underscore-js-deepclone-and-deepextend-mix-ins/
_.mixin({ deepClone: function (p_object) { return JSON.parse(JSON.stringify(p_object)); } });

_.templateSettings = {
  interpolate: /\{\{(.+?)\}\}/g
};

var h1 = require('./debug.js').section;

function toDimpleFile(line) {
//    console.log(line)
//    dimpleCode = dimpleCode + line +"\n"
}

var log = function() {
    var args = Array.prototype.slice.call(arguments);
    console.log(args.join("\n"));
}

// a global store of dimple variable types
var varTypeStore = {};

// works on either ast or strings
function traceToDimple(x) {
    var ast = (typeof x == 'string') ? ast = esprima.parse(x) : x
    var java = "";

    function add(code) {
        java += "\n" + code;
    }
    
    // TODO: we might have to create subgraphs
    // i need to figure out how to name and keep track of these

    if (ast.type == 'Identifier') {
        return ast.name;
    } else if (ast.type == 'BlockStatement') {
        add("{");
        var lines = ast.body.map(function(x) { return traceToDimple(x) });
        add(lines.join("\n"));
        add("}") 
        
    }
    else if (ast.type == 'ExpressionStatement') { 
        // should be final statement which is return value.
        // TODO: make a dimple-query in webchurch that runs a solver and returns the marginal on this final statement??
        if (ast.expression.name !== 'undefined') {
            var tplQuery = ["SRealVariable queryVar = (SRealVariable){{name}}.getSolver();",
                            "queryVar.saveAllSamples();",
                            "solver.solve();",
                            "double [] allSamples = queryVar.getAllSamples();",
                            "System.out.println(Arrays.toString(allSamples));"
                           ].join("\n")

            var datQuery = {
                name : ast.expression.name
            };

            add( _.template(tplQuery, datQuery) );
        }

        // notes on Belief
        // what the Belief property is for different types
        // Bit: a single number that represents the marginal probability of the value 1.
        // Real variables when using the SumProduct solver, the Belief is represented the mean and precision parameters of a Normal distribution

    } else if (ast.type == 'VariableDeclaration') {
        // a VariableDeclaration is a node of the form
        // var {id} = {init}
        // where {id} will parse to an Identifier object
        // and {init} will parse to an Expression object (I think this code currently assumes
        // that it will be a CallExpression, in particular. this is to be contrasted with
        // a BinaryExpression (e.g., 1 + x) or an ObjectExpression (e.g., x) 
        
        //assume one declarator per declaration.
        var decl = ast.declarations[0];
        var id = decl.id.name;
        var init = decl.init;
        var type;

        if (init.type == "CallExpression") {
            var callee = init.callee.name
            if ( callee == 'condition' || callee == 'factor' ) {
                add( evidence(init) );
            } else {
                var factor = varDec(id, init);
                varTypeStore[id] = factor.type;
                add( factor.java );
            }
        } else if (init.type == 'Literal') {

            // dictionary that maps js literal types onto Dimple literal types
            // TODO: how to handle strings?
            // TODO: Dimple has other types that don't have analogues in church yet (see p29 of dimple java manual)
            // - discrete (though this is the output of a uniform-draw)
            // - realjoint
            // - complex
            // - finitefieldvaraible
            var typeLiteralMappings = {
                'number': "Real",
                'boolean': "Bit"
            }

            var value = init.value;

            var constantParams = {
                type: typeLiteralMappings[typeof value],
                name: id,
                value: value
            };
            
            var str = DimpleConstant(constantParams);

            varTypeStore[id] = constantParams.type;
            
            add( str );
            
        } else if (init.type == 'Identifier') {
            // defining a new variable in terms of an already existing variable
            // (at least i hope it's already existing)
            
            var tpl = "{{type}} {{name}} = {{existingName}};";

            var name = id;
            var existingName = decl.init.name;
            var dat = {name: name,
                       existingName: existingName,
                       type: varTypeStore[existingName]
                      };

            var str = _.template(tpl, dat)
            add( str );

            varTypeStore[name] = varTypeStore[existingName];
        }
        
    } else if (ast.type == 'IfStatement') {

        // TODO: singleton object pattern for decreasing memory usage
        // if we've got a ton of if statements
        
        // template and template data for the multiplexer
        var tplMux = [
            "{{outputType}} {{outputName}} = new {{outputType}}();",
            "{{consequentLines}}",
            "{{alternateLines}}",
            "fg.addFactor(new Multiplexer(), {{outputName}}, {{selector}}, {{consequent}}, {{alternate}});"
        ].join("\n")
        var datMux = {};
        
        datMux.selector = traceToDimple(ast.test);

        // clone (c)onsequent and (a)lternate branches
        var c = _(ast.consequent).deepClone();
        var a = _(ast.alternate).deepClone();

        // get the name of the output variable for the multiplexer.
        // it's the final variable declaration from the consequent and alternate branches
        // (the variable name should be the same)
        datMux.out = c.body[c.body.length - 1].declarations[0].id.name;
        
        // c and a declare variables with different names, except
        // for the last var, which is the same
        // add a suffix (T for c, F for a) to distinguish them 
        c.body[c.body.length - 1].declarations[0].id.name += "T"; 
        a.body[a.body.length - 1].declarations[0].id.name += "F";

        // each branch is a BlockStatement
        // walk through all the lines in a block, adding it to our current factor graph
        var cLines = c.body.map(function(x) { return traceToDimple(x) });
        var aLines = a.body.map(function(x) { return traceToDimple(x) });

        // h1('consequent js', escodegen.generate(c));
        // h1('c.body dimplified', cLines);

        _(datMux).extend({
            // get output name from last line of (unmodified) consequent
            outputName: ast.consequent.body[ast.consequent.body.length - 1].declarations[0].id.name,
            // get output type by munging the emitted java code for the
            // modified consequent (hack)
            outputType: _(cLines).last().split(" ")[0].trim(),
            consequentLines: cLines.join("\n"),
            alternateLines: aLines.join("\n"),
            // get the variable names for two input lines to the multiplexer 
            consequent: c.body[c.body.length - 1].declarations[0].id.name,
            alternate: a.body[a.body.length - 1].declarations[0].id.name 
        });

        var str = _.template(tplMux, datMux);

        h1('cLines', cLines);

        add(_.template(tplMux, datMux)); 
    } else if (ast.type == 'Program') {
        // walk through the ast
        var lines = ast.body
                .map(function(subast) {
                    return traceToDimple(subast)
                });
        add(lines.join("\n")); 
    } else {
        throw new Error("Haven't implemented translation for expression of type " + ast.type)
    }
    
    return java;
}

//evidence comes from condition and factor statements in the church code
//assume the expression is an identifier for both cases.

// conditioning on a boolean requires that we do
// .setFixedValue(1)
// since we apparently don't have true Booleans in dimple
function evidence(init) {
    var evexp = init.arguments[0].name
    if(init.callee.name == 'condition'){
        // toDimpleFile( evexp+ ".setFixedValue(1);");
        return evexp+ ".setFixedValue(1);";
        
    } else if (init.callee.name == 'factor') {
        //todo: fg.addFactor(<some-dimple-factor-that-just-returns-the-input-value, ab1)>
    }
}

// construct a DimpleFactor object based on (ast) arguments id and init
// most trace statements will be declarations of the form 'var ab0 = foo(ab1,const);'
// id is the ab0 part
// init is the foo(ab1, const) part
function varDec(id, init) {
    var callee = init.callee.name
    //get args, which might each be literal, identifier, or array:
    var args = []
    for(var i = 0, ii = init.arguments.length; i < ii; i++) {
        var arg = init.arguments[i]
        switch(arg.type) {
        case 'Literal':
            args.push(arg.value)
            break
            
        case 'Identifier':
            args.push(arg.name)
            break
            
        case 'ArrayExpression':
            // unparse each esprima object into a javascript string
            var arr = arg.elements.map(function(el) {
                return escodegen.generate(el)
            }) 
            args.push(arr)
            break
        }
    }

    // this is required because the tracer turns ERP calls like (flip 0.5)
    // into javascript like:
    // var ab0 = random('wrapped_flip',[0.5,JSON.parse('null')]);
    // so the function call we'll be dealing with for ERPs is actually
    // a call to random, rather than wrapped_flip. here, we just unwrap
    // the random() call
    if ( callee=='random' ) {
        callee = args[0]
        args = args[1]
    }
    
    //Generate Dimple statements
    var factor = new DimpleFactor(id, callee, args)

    return factor;
    // toDimpleFile( "fg.addFactor(new {{factor}}(), {{id}}, {{factorArgString}""
    
} 

var constantTemplate = _.template(
    "{{type}} {{name}} = new {{type}}();\n{{name}}.setFixedValue({{value}});"
);

var DimpleConstant = function(opts) {
    return constantTemplate(opts);
} 

// lookup table mapping church primitives onto Dimple factor built-ins  
var primitiveToFactor = {};

// NB: note that there is no comma between outputVariable and inputVariableStr in the template
// this is because if inputVariableStr is empty, we don't want there to be an extraneous comma
// before it, so we handle this in the computation of inputVariableStr itself
// TODO: we eventually need to handle arguments for the variable constructor, e.g.,
// Discrete ab0 = new Discrete(0, 1, 5);
var factorTemplate = _.template(
    "{{type}} {{id}} = new {{type}}();\n" + 
        "fg.addFactor(new {{constructor}}( {{constructorArgStr}} ), {{outputVariable}} {{inputVariableStr}});")

var isErp = function(name) {
    // bizarre: if i defined this as a global, it broke stuff
    var erps = ["wrapped_uniform_draw", "wrapped_multinomial", "wrapped_flip", "wrapped_uniform", "wrapped_random_integer", "wrapped_gaussian", "wrapped_gamma", "wrapped_beta", "wrapped_dirichlet"];
    var i = erps.length;
    while(i--) {
        if (erps[i] === name) {
            return true
        }
    }
    return false
}

// return the java code for adding a factor
// - id: name of the factor
// - fn: the (traced) church primitive used to define this variable (the transformations for each church primitives lives in the dimple/factors directory).
// - args: the (traced) js arguments provided to fn
// you call this by using the "new" keyword, e.g.,
// var factor = new DimpleFactor("ab2", "or", ["ab0","ab1"])

// These metadata files must define a module.exports variable that is a function f of a single variable x. f mutates x, setting:
//     - x.type (the Dimple type that the church function returns)
//     - x.constructor (the constructor for the dimple variable)
//     - x.outputVariable (the dimple output variable)
//     - x.inputVariables (the dimple input variables)


var DimpleFactor = function(id, fn, args) {
    this.id = id;
    
    var me = this; // alias for "this" that is safe to use inside map() 
    
    // if it's an erp, omit the last argument, which should be "JSON.parse('null')"
    if (isErp(fn)) {
        args = args.slice(0, args.length - 1);
    }

    this.args = args; 

    if (typeof primitiveToFactor[fn] == "undefined") {
        try {
            primitiveToFactor[fn] = require('./dimple/factors/' + fn + '.js');
        } catch (e) {
            throw new Error("Can't yet translate function \""+fn+"\" to Dimple.");
        }
    }

    // call the function for adding the current factor's metadata (e.g., type, constructor)
    // to the this object
    (primitiveToFactor[fn])( this );

    if (typeof this.constructorArgs == 'undefined') {
        this.constructorArgs = [];
    } 
    this.constructorArgStr = this.constructorArgs.join(",")

    if (typeof this.inputVariables == 'undefined' || (Array.isArray(this.inputVariables) && this.inputVariables.length == 0)) {
        this.inputVariableStr = "";
    } else {
        this.inputVariableStr = ", " + this.inputVariables.join(", ");
    } 

    this.java = factorTemplate(this);
    
}
                 

module.exports =
{
traceToDimple: traceToDimple
}
