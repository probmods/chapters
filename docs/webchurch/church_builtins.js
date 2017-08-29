/* global global, require, module, exports */

var seedrandom = require('seedrandom');

// Contains the built-in Church functions written in Javascript.
// TODO: document annotations format

// style guide: in parameters to builtin functions, name them like 'lst'  rather than 'list'
// to call the list making function, i.e., the (list ...) function in church, use javascript
// function called List (or, to create a pair in javascript, use Pair)

// represents pairs as arrays
// represents lists as arrays with null as the last element

// TODO: move the asserts stuff into its own library
// it depends on two utility functions, though:
// _rest and listToArray
// maybe basic types stuff should live in a module
// separate from builtins and separate from asserts
var typeCheckers = {
    'integer': function(x) {
        return typeof x == 'number' && Math.floor(x) == x;
    },
    nat: function(x) {
        return typeof x == 'number' && Math.floor(x) == x && x >= 0;
    },
    'positive real': function(x) {
        return typeof x == 'number' && x > 0;
    },
    real: function(x) {
        return typeof x == 'number';
    },
    function: function(x) {
        return typeof x == 'function';
    },
    pair: function(x) {
        return Array.isArray(x) && x.length >= 2;
    },
    list: function(x) {
        return Array.isArray(x) && x[x.length - 1] == null;
    },
    'boolean': function(x) {
        return typeof x == 'boolean';
    },
    'string': function(x) {
        return typeof x == 'string';
    }
};

// handle simple parameterized types like
// List real, Pair real
// TODO: test this
function parseTypeString(s) {
    if (/list|pair/.test(s)) {
        var baseType = /list/.test(s) ? 'list' : 'pair';

        var uStart = s.indexOf("<");
        var uEnd = s.lastIndexOf(">");

        var baseChecker = typeCheckers[baseType];

        if (uStart == -1 || uEnd == -1) {
            return baseChecker;
        }

        var u = s.slice(uStart + 1, uEnd);
        var uChecker = parseTypeString(u);

        if (baseType == 'pair') {
            return function(x) {
                if (!baseChecker(x)) {
                    return false;
                }

                return uChecker(x[0]) && uChecker(_rest(x));
            };
        }

        // otherwise, return checker for list<...>
        return function(x) {
            if (!baseChecker(x)) {
                return false;
            }
            var x_array = listToArray(x);
            for(var i = 0, ii = x_array.length; i < ii; i++) {
                if (!uChecker(x_array[i])) {
                    return false;
                };
            }
            return true;
        };
    } else {
        return typeCheckers[s];
    }
}

// TODO: underscore is too heavy weight
// replace with mustache. or maybe something even dumber
var _ = require('underscore');
_.templateSettings = {
    interpolate: /\{\{(.+?)\}\}/g
};

var util = require('./util.js');
var fs = require('fs');

var typeUtils = require('./type-utils.js');
var listToArray = typeUtils.listToArray;
var arrayToList = typeUtils.arrayToList;

// determine whether we're running inside a browser
var inBrowser = false;
if (typeof document !== 'undefined') {
    inBrowser = true;
}

// var seed = require('seed-random');
// var set_seed =  function(str) {
//   seed(str, {global: true});//over-ride global Math.random
// };

module.exports.__annotations__ = {};

// add a Church builtin
// note: this transforms the alias property into
// an array containg zero or more aliases
var addBuiltin = function(dict) {
    var fWrapped = wrapAsserts(dict);

    // if alias is just a single string, embed it in an array
    if (typeof dict.alias == "string") {
        dict.alias = [dict.alias];
    }

    if (!dict.alias) {
        dict.alias = [];
    }

    // add the automated alias
    var autoAlias = dict.name
        .replace(/wrapped_(.+)/, function(m, p1) { return p1 })
        .replace(/is_(.+)/, function(m, p1) { return p1 + "?"})
        .replace('_to_', '->')
        .replace(/_/g, '-');

    if (dict.name !== autoAlias) {
        dict.alias.push(autoAlias);
    }

    module.exports[dict.name] = fWrapped;
    module.exports.__annotations__[dict.name] = dict;
    return fWrapped;
};
var $b = addBuiltin;

var the_empty_list = [];

function sizeof(obj) { return Object.keys(obj).length; }

// needs to live in global scope
// but users shouldn't need to directly call this function
// so don't add it to annotations
var args_to_array = module.exports.args_to_list = function(args) {
    return Array.prototype.slice.call(args, 0 );
};

// needs to live in global scope
// but users shouldn't need to directly call this function
// so don't add it to annotations
var args_to_list = module.exports.args_to_list = function (args) {
    return arrayToList(args_to_array(args));
};

function atLeastOne (args) {
    if (args.length < 1) {throw new Error('Needs at least one argument');};
}

var js_debug = $b({
    name: 'js_debug',
    desc: 'Trigger the javascript debugger',
    fn: function() {
        debugger;
    }
});

var plus = $b({
    name: 'plus',
    alias: '+',
    desc: "Add numbers",
    params: [{name: '[x ...]', type: 'real', desc: 'Numbers to add'}],
    fn: function () {
        atLeastOne(arguments);
        var sum = 0;
	for (var i = 0, ii = arguments.length; i < ii; i++) {
	    sum = sum + arguments[i];
	}
	return sum;
    }
});

var minus = $b({
    name: 'minus',
    alias: '-',
    desc: "Subtract numbers",
    params: [{name: '[x ...]', type: 'real', desc: 'Numbers to subtract'}],
    fn: function() {
        atLeastOne(arguments);
        var numArgs = arguments.length;
        if (numArgs == 1) {
            return -arguments[0];
        } else {
            var r = arguments[0];
            for (var i = 1; i < numArgs; i++) {
                r -= arguments[i];
            }
            return r;
        }
    }
});

var mult = $b({
    name: 'mult',
    alias: '*',
    desc: "Multiply numbers",
    params: [{name: '[x ...]', type: 'real', desc: 'Numbers to multiply'}],
    fn: function() {
        atLeastOne(arguments);
        var numArgs = arguments.length;
        var prod = 1;
        for (var i = 0; i < numArgs; i++) {
	    prod = prod * arguments[i];
	}
        return prod;
    }
});

var div = $b({
    name: 'div',
    alias: '/',
    desc: "Divide numbers. Returns x / (y1 * y2 * ... )",
    params: [{name: '[x]', type: 'real', desc: 'Numerator'},
             {name: '[y ...]', type: 'real', desc: 'Denominator values'}
            ],
    fn: function() {
        atLeastOne(arguments);
        var numerator = arguments[0];
        var numArgs = arguments.length;
        if (numArgs == 1) {
            return 1 / arguments[0];
        } else {
            var denominator = 1;
            for (var i = 1; i < numArgs; i++) {
	        denominator *= arguments[i];
	    }
            return numerator / denominator;
        }
    }
});

var mod = $b({
    name: 'mod',
    alias: 'modulo',
    desc: "Modulo. Returns x mod y",
    params: [{name: 'x', type: 'real'},
             {name: 'y', type: 'real'}],
    fn: function(x,y) {
        return x % y;
    }
});

var round = $b({
    name: 'round',
    desc: 'Round a number',
    params: [{name: 'x', type: 'real'}],
    fn: function(x) {
        return Math.round(x);
    }
});

var floor = $b({
    name: 'floor',
    desc: 'Floor of a number',
    params: [{name: 'x', type: 'real'}],
    fn: function(x) {
        return Math.floor(x);
    }
});

var ceil = $b({
    name: 'ceil',
    alias: 'ceiling',
    desc: 'Ceiling of a number',
    params: [{name: 'x', type: 'real'}],
    fn: function(x) {
        return Math.ceil(x);
    }
});

var abs = $b({
    name: 'abs',
    desc: 'Absolute value',
    params: [{name: 'x', type: 'real'}],
    fn: function(x) {
        return Math.abs(x);
    }
});

var log = $b({
    name: 'log',
    desc: 'Natural logarithm',
    params: [{name: 'x', type: 'real'}],
    fn: function(x) {
        return Math.log(x);
    }
});

var exp = $b({
    name: 'exp',
    desc: 'Exponential',
    params: [{name: 'x', type: 'real'}],
    fn: function(x) {
        return Math.exp(x);
    }
});

var expt = $b({
    name: 'expt',
    alias: ['pow','expt'],
    desc: 'Compute x raised to the power y',
    params: [{name: 'x', type: 'real'},
             {name: 'y', type: 'real'}
            ],
    fn: function(x, y) {
        return Math.pow(x, y);
    }
});

var sqrt = $b({
    name: 'sqrt',
    desc: 'Square root',
    params: [{name: 'x', type: 'real'}],
    fn: function(x) {
        return Math.sqrt(x);
    }
});

var sin = $b({
  name: 'sin',
  desc: 'Sine',
  params: [{name: 'x', type: 'real'}],
  fn: function(x) {
    return Math.sin(x);
  }
});

var cos = $b({
  name: 'cos',
  desc: 'Cosine',
  params: [{name: 'x', type: 'real'}],
  fn: function(x) {
    return Math.cos(x);
  }
});

var tan = $b({
  name: 'tan',
  desc: 'Tangent',
  params: [{name: 'x', type: 'real'}],
  fn: function(x) {
    return Math.tan(x);
  }
});

var asin = $b({
  name: 'asin',
  desc: 'Arcsine',
  params: [{name: 'x', type: 'real'}],
  fn: function(x) {
    return Math.asin(x);
  }
});

var acos = $b({
  name: 'acos',
  desc: 'Arccosine',
  params: [{name: 'x', type: 'real'}],
  fn: function(x) {
    return Math.acos(x);
  }
});

var atan = $b({
  name: 'atan',
  desc: 'Arctangent',
  params: [{name: 'x', type: 'real'}],
  fn: function(x) {
    return Math.atan(x);
  }
});

var atan2 = $b({
  name: 'atan2',
  desc: 'Arctangent (quotient version)',
  params: [{name: 'y', type: 'real'},
           {name: 'x', type: 'real'}],
  fn: function(y, x) {
    return Math.atan2(y, x);
  }
});


var sum = $b({
    name: 'sum',
    desc: 'Sum a list of numbers',
    params: [{name: 'lst', type: 'list<real>', desc: 'List of numbers to sum'}],
    fn: function(lst) {
        return _.foldl(listToArray(lst), function(a,b){return a+b;}, 0);
    }
});

var prod = $b({
    name: 'prod',
    desc: 'Multiply a list of numbers',
    params: [{name: 'lst', type: 'list<real>', desc: 'List of numbers to multiply'}],
    fn: function(lst) {
        return _.foldl(listToArray(lst), function(a,b){return a*b;}, 1);
    }
});

// check whether y \in (x - tol, x + tol)
var soft_equal = $b({
    name: 'soft_equal',
    alias: ['soft='],
    desc: 'Check whether y is in the interval [x - tol, x + tol]',
    params: [{name: 'y', type: 'real'},
             {name: 'x', type: 'real'},
             {name: 'tol', type: 'real'}
            ],
    fn: function(y, x, tol) {
        // FIXME: assert upper > lower
        return (y > x - tol && y < x + tol);
    }
});

var and = $b({
    name: 'and',
    desc: 'Logical conjunction',
    params: [{name: '[b ...]', type: 'boolean', desc: 'Boolean values'}],
    fn: function() {
        return _.every(arguments)
    }
});

var or = $b({
    name: 'or',
    desc: 'Logical disjunction',
    params: [{name: '[b ...]', type: 'boolean', desc: 'Boolean values'}],
    fn: function() {
        return _.some(arguments)
    }
});

var not = $b({
    name: 'not',
    desc: 'Logical negation',
    params: [{name: 'b', type: 'boolean', desc: 'Boolean value'}],
    fn: function(b) {
        return !b;
    }
});

var all = $b({
    name: 'all',
    desc: 'Test whether all of the values in a list are true',
    params: [{name: 'lst', type: 'list<boolean>', desc: 'List of boolean values'}],
    fn: function(lst) {
        return and.apply(null, listToArray(lst));
    }
});

var none = $b({
    name: 'none',
    desc: 'Test whether none of the values in a list are true',
    params: [{name: 'lst', type: 'list<boolean>', desc: 'List of boolean values'}],
    fn: function(lst) {
        return !or.apply(null, listToArray(lst));
    }
});

var some = $b({
    name: 'some',
    alias: 'any',
    desc: 'Test whether some of the values in a list are true',
    params: [{name: 'lst', type: 'list<boolean>', desc: 'List of boolean values'}],
    fn: function(lst) {
        return or.apply(null, listToArray(lst));
    }
});

// there is a case to be made that this needs to be pairwise not first vs rest
// maybe make alternate versions that are pairwise
var greater = $b({
    name: 'greater',
    alias: '>',
    desc: 'Test whether x is greater than all y\'s',
    params: [{name: 'x', type: 'real'},
             {name: '[y ...]', type: 'real'}
            ],
    fn: function() {
        var numArgs = arguments.length;
        var x = arguments[0];
        for (var i = 1; i < numArgs ; i++) {
            if (!(x > arguments[i])) {
                return false;
            }
        }
        return true;
    }
});

var less = $b({
    name: 'less',
    alias: '<',
    desc: 'Test whether x is less than all y\'s',
    params: [{name: 'x', type: 'real'},
             {name: '[y ...]', type: 'real'}
            ],
    fn: function() {
        var numArgs = arguments.length;
        var x = arguments[0];
        for (var i = 1; i < numArgs ; i++) {
            if (!(x < arguments[i])) {
                return false;
            }
        }
        return true;
    }
});

var geq = $b({
    name: 'geq',
    alias: '>=',
    desc: 'Test whether x is greater than or equal to all y\'s',
    params: [{name: 'x', type: 'real'},
             {name: '[y ...]', type: 'real'}
            ],
    fn: function() {
        var numArgs = arguments.length;
        var x = arguments[0];
        for (var i = 1; i < numArgs ; i++) {
            if (x < arguments[i]) {
                return false;
            }
        }
        return true;
    }
});

var leq = $b({
    name: 'leq',
    alias: '<=',
    desc: 'Test whether x is less than or equal to all y\'s',
    params: [{name: 'x', type: 'real'},
             {name: '[y ...]', type: 'real'}
            ],
    fn: function() {
        var numArgs = arguments.length;
        var x = arguments[0];
        for (var i = 1; i < numArgs ; i++) {
            if (x > arguments[i]) {
                return false;
            }
        }
        return true;
    }
});

var pw_greater = $b({
    name: 'pw_greater',
    alias: '.>.',
    desc: 'Test whether greater applies transitively',
    params: [{name: 'x', type: 'real'},
             {name: '[y ...]', type: 'real'}
            ],
    fn: function() {
        var numArgs = arguments.length;
        for (var i = 0, j = 1; j < numArgs ; i++, j++) {
            if (!(arguments[i] > arguments[j])) {
                return false;
            }
        }
        return true;
    }
});

var pw_less = $b({
    name: 'pw_less',
    alias: '.<.',
    desc: 'Test whether less than applies transitively',
    params: [{name: 'x', type: 'real'},
             {name: '[y ...]', type: 'real'}
            ],
    fn: function() {
        var numArgs = arguments.length;
        for (var i = 0, j = 1; j < numArgs ; i++, j++) {
            if (!(arguments[i] < arguments[j])) {
                return false;
            }
        }
        return true;
    }
});

var pw_geq = $b({
    name: 'pw_geq',
    alias: '.>=.',
    desc: 'Test whether greater than or equal to applies transitively',
    params: [{name: 'x', type: 'real'},
             {name: '[y ...]', type: 'real'}
            ],
    fn: function() {
        var numArgs = arguments.length;
        for (var i = 0, j = 1; j < numArgs ; i++, j++) {
            if (!(arguments[i] >= arguments[j])) {
                return false;
            }
        }
        return true;
    }
});

var pw_leq = $b({
    name: 'pw_leq',
    alias: '.<=.',
    desc: 'Test whether less than or equal to applies transitively',
    params: [{name: 'x', type: 'real'},
             {name: '[y ...]', type: 'real'}
            ],
    fn: function() {
        var numArgs = arguments.length;
        for (var i = 0, j = 1; j < numArgs ; i++, j++) {
            if (!(arguments[i] <= arguments[j])) {
                return false;
            }
        }
        return true;
    }
});

var eq = $b({
    name: 'eq',
    alias: '=',
    canonical: '=',
    desc: 'Test whether all (numeric) arguments are equal',
    params: [{name: '[x ...]', type: 'real'}],
    fn: function() {
        var numArgs = arguments.length;
        var x = arguments[0];
        for (var i = 1; i < numArgs ; i++) {
            if (x != arguments[i]) {
                return false;
            }
        }
        return true;
    }
});

var is_null = $b({
    name: 'is_null',
    desc: 'Test whether x is null',
    params: [{name: 'x'}],
    fn: function(x) {
        return Array.isArray(x) && x.length == 1 && x[0] == null;
    }
});

// use uppercase to indicate that it's a constructor
var List = $b({
    name: 'list',
    desc: 'List constructor',
    params: [{name: '[...]'}],
    fn: function() {
        var args = args_to_array(arguments);
        return arrayToList(args, true);
    }
});

var is_list = $b({
    name: 'is_list',
    desc: 'Test whether x is a list',
    params: [{name: 'x'}],
    fn: function(x) {
        return Array.isArray(x) && x[x.length-1] == null;
    }
});

var Pair = $b({
    name: 'pair',
    alias: 'cons',
    desc: 'Pair constructor',
    params: [{name: 'head'},
             {name: 'tail'}
            ],
    fn: function(head, tail) {
        return [head].concat(tail);
    }
});

var is_pair = $b({
    name: 'is_pair',
    desc: 'Test whether x is a pair',
    params: [{name: 'x'}],
    fn: function(x) {
        return Array.isArray(x) && x.length >= 2;
    }
});

var first = $b({
    name: 'first',
    alias: 'car',
    desc: 'Get the first item of a list (or pair)',
    params: [{name: 'lst', type: 'pair'}],
    fn: function(lst) {
        var arr = listToArray(lst);
        if (arr.length < 1) {
            throw new Error('Tried to get the first element of an empty list');
        }
        return arr[0];
    }
});

var second = $b({
    name: 'second',
    desc: 'Get the second item of a list',
    params: [{name: 'lst', type: 'list'}],
    fn: function(lst) {
        var arr = listToArray(lst);
        if (arr.length < 2) {
            throw new Error('Tried to get the 2nd element of a list with only ' + arr.length + ' item');
        }
        return arr[1];
    }
});

var third = $b({
    name: 'third',
    desc: 'Get the third item of a list',
    params: [{name: 'lst', type: 'list'}],
    fn: function(lst) {
        var arr = listToArray(lst);
        if (arr.length < 3) {
            throw new Error('Tried to get the 3rd element of list with only ' + arr.length + ' elements');
        }
        return arr[2];
    }
});

var fourth = $b({
    name: 'fourth',
    desc: 'Get the fourth item of a list',
    params: [{name: 'lst', type: 'list'}],
    fn: function(lst) {
        var arr = listToArray(lst);
        if (arr.length < 4) {
            throw new Error('Tried to get the 4th element of list with only ' + arr.length + ' elements');
        }
        return arr[3];
    }
});

var fifth = $b({
    name: 'fifth',
    desc: 'Get the fifth item of a list',
    params: [{name: 'lst', type: 'list'}],
    fn: function(lst) {
        var arr = listToArray(lst);
        if (arr.length < 5) {
            throw new Error('Tried to get the 5th element of list with only ' + arr.length + ' elements');
        }
        return arr[4];
    }
});

var sixth = $b({
    name: 'sixth',
    desc: 'Get the sixth item of a list',
    params: [{name: 'lst', type: 'list'}],
    fn: function(lst) {
        var arr = listToArray(lst);
        if (arr.length < 6) {
            throw new Error('Tried to get the 6th element of list with only ' + arr.length + ' elements');
        }
        return arr[5];
    }
});

var seventh = $b({
    name: 'seventh',
    desc: 'Get the seventh item of a list',
    params: [{name: 'lst', type: 'list'}],
    fn: function(lst) {
        var arr = listToArray(lst);
        if (arr.length < 7) {
            throw new Error('Tried to get the 7th element of list with only ' + arr.length + ' elements');
        }
        return arr[6];
    }
});

// pulled out into its own function because we use it elsewhere
var _rest = function(x) {
    if (x.length == 2 && x[1] != null) {
	return x[1];
    } else {
	return x.slice(1);
    }
};

var rest = $b({
    name: 'rest',
    alias: 'cdr',
    desc: 'Get everything after the first item in a pair or list',
    params: [{name: 'x', type: 'pair'}],
    fn: _rest
});

var but_last = $b({
    name: 'but_last',
    alias: 'initial',
    desc: 'Get everything except the last item in a list',
    params: [{name: 'lst', type: 'list'}],
    fn: function (lst) {
        return arrayToList(_.initial(listToArray(lst)));
    }
});

var last = $b({
    name: 'last',
    desc: 'Get the last item in a list',
    params: [{name: 'lst', type: 'list'}],
    fn: function (lst) {
        return _.last(listToArray(lst));
    }
});

var list_ref = $b({
    name: 'list_ref',
    desc: 'Get the nth item of a list (0-indexed)',
    params: [{name: 'lst', type: 'list'},
             {name: 'n', type: 'nat'}],
    fn: function(lst, n) {
        var array = listToArray(lst);
	if (n >= array.length) {
	    throw new Error("Tried to the " + (n+1) + "th item in a list that only contains " + array.length + ' items');
	} else {
	    return array[n];
	}
    }
});

var list_elt = $b({
    name: 'list_elt',
    desc: 'Get the nth item of a list (1-indexed)',
    params: [{name: 'lst', type: 'list'},
             {name: 'n', type: 'nat'}],
    fn: function(lst, n) {
        if (n < 1) {
            throw new Error('The n argument to list-elt should be an integer >= 1');
        }
        return list_ref(lst, n-1);
    }
});

var take = $b({
    name: 'take',
    desc: 'Get the first n items in a list. If there are fewer than n items in the list, returns just the list.',
    params: [{name: 'lst', type: 'list'},
             {name: 'n', type: 'nat'}],
    fn: function(lst,n) {
        return arrayToList(listToArray(lst).slice(0,n));
    }
});

var drop = $b({
    name: 'drop',
    desc: 'Drop the first n items from a list. If there are fewer than n items in the list, return the empty list.',
    params: [{name: 'lst', type: 'list'},
             {name: 'n', type: 'nat'}],
    fn: function(lst,n) {
        return arrayToList(listToArray(lst).slice(n));
    }
});

var sort = $b({
    name: 'sort',
    desc: 'Sort a list according to a comparator function cmp(a,b) that returns a number greater than 0 if a > b, 0 if a == b, and a number less than 0 if a < b',
    params: [{name: "lst", type: "list"},
             {name: "[cmp]", type: "function", default: ">"}],
    fn: function(lst, cmp) {
        var arr = listToArray(lst);
        var sortedArr;
        if (cmp === undefined ) {
            sortedArr = arr.sort();
        } else {
            sortedArr = arr.sort( cmp );
        }
        return arrayToList( sortedArr, true );
    }
});

var unique = $b({
    name: 'unique',
    desc: 'Get the unique items in a list',
    params: [{name: "lst", type: "list"},
             {name: "[eq]", type: "function", desc: "Optional equality comparison function", default: "equal?"}
            ],
    fn: function(lst, eq) {
        eq = eq || is_equal;

        var arr = listToArray(lst);
        var uniques = [];
        for(var i = 0, ii = arr.length ; i < ii; i++) {
            var v = arr[i];
            var alreadySeen = false;
            for(var j = 0, jj = uniques.length; j < jj; j++) {
                if (eq(v, uniques[j])) {
                    alreadySeen = true;
                    break;
                }
            }
            if (!alreadySeen) {
                uniques.push(v);
            }
        }

        return arrayToList(uniques, true);
    }
});

var nub = $b({
    name: 'nub',
    desc: 'Remove duplicates with equality as ===',
    params: [{name: "lst", type: "list"}],
    fn: function(lst) {
        return arrayToList(_.uniq(listToArray(lst)));
    }
});

var list_index = $b({
    name: 'list_index',
    alias: 'position',
    desc: '',
    params: [{name: "lst", type: "list"},
             {name: "x"}],
    fn: function(lst, x) {
        var arr = listToArray(lst);
        return arr.indexOf(x);
    }
});

var map_at = $b({
    name: 'map_at',
    alias: 'f-at',
    desc: '',
    params: [{name: "lst", type: "list"},
             {name: "i", type: "nat"},
             {name: "f", type: "function"}],
    fn: function(lst, i, f) {
        var arr = listToArray(lst);
        arr[i] = f(arr[i]);
        return arrayToList(arr, true);
    }
});

var max = $b({
    name: 'max',
    desc: 'Maximum of arguments',
    params: [{name: "[x ...]", type: "real", desc: ""}],
    fn: function() {
        // we don't use Math.max.apply here because that
        // can choke on small-ish arguments sizes (~80k suffices)
        // because v8 is weird with nested apply calls
        var maxVal = -Infinity;
        for(var i = 0, n = arguments.length; i < n; i++) {
            if (arguments[i] > maxVal) {
                maxVal = arguments[i];
            }
        }
        return maxVal;
    }
});

var min = $b({
    name: 'min',
    desc: 'Minimum of arguments',
    params: [{name: "[x ...]", type: "real", desc: ""}],
    fn: function() {
        // we don't use Math.min.apply here because that
        // can choke on small-ish arguments sizes (~80k suffices)
        // because v8 is weird with nested apply calls
	      var minVal = Infinity;
        for(var i = 0, n = arguments.length; i < n; i++) {
            if (arguments[i] < minVal) {
                minVal = arguments[i];
            }
        }
        return minVal;
    }
});

var mean = $b({
    name: 'mean',
    desc: 'Mean of a list',
    params: [{name: "lst", type: "list<real>", desc: ""}],
    fn: function(lst) {
        var a = listToArray(lst);
        var n = a.length;
        var total = 0;
        for(var i = 0; i < n; i++) {
            total += a[i];
        }
        return total / a.length;
    }
});

var variance = $b({
    name: 'variance',
    alias: ['var'],
    desc: 'Population variance',
    params: [{name: 'lst', type: 'list<real>', desc: 'List of numbers'}],
    fn: function(lst) {
        var a = listToArray(lst);
        var n = a.length;
        var total = 0;
        for(var i = 0 ; i < n; i++) {
            total += a[i];
        }

        var mean = total / n;

        var r = 0;

        for(var i = 0; i < n; i++) {
            r += Math.pow(a[i] - mean, 2);
        }

        return r / n;
    }
});


var append = $b({
    name: 'append',
    desc: 'Merge an arbitrary number of lists',
    params: [
        {name: '[lst ...]', type: 'list'}
    ],
    fn: function() {
        // not ideal because we're crossing the list abstraction barrier
        var r = [];
        for(var i = 0, ii = arguments.length; i < ii; i++) {
            r = r.concat(listToArray(arguments[i]));
        }
        return arrayToList(r, true);
    }
});

var flatten = $b({
    name: 'flatten',
    desc: '',
    params: [{name: "lst", type: "list", desc: ""}],
    fn: function(lst) {
        return arrayToList(_.flatten(listToArray(lst,true)));
    }
});

var zip = $b({
    name: 'zip',
    desc: 'Zip together lists using longest list as base -- is invertable',
    params: [{name: "[lst ...]", type: "list", desc: ""}],
    fn: function() {
        var args = args_to_array(arguments).map(listToArray);
        var cleanA2L = function(a) {
            return arrayToList(a.map(function(v){return v == undefined ? null : v}));
        }
        return arrayToList(_.zip.apply(this,args).map(cleanA2L));
    }
});

var zipT = $b({
    name: 'zipT',
    desc: 'Zip together lists using shortest list as base -- not invertable as it truncates',
    params: [{name: "[lst ...]", type: "list", desc: ""}],
    fn: function() {
        var args = args_to_array(arguments).map(listToArray);
        var mlen = Math.min.apply(this, args.map(function(e){return e.length;}));
        args = args.map(function(a){return a.slice(0,mlen);});
        return arrayToList(_.zip.apply(this,args).map(arrayToList));
    }
});

var transpose = $b({
    name: 'transpose',
    desc: 'Transpose list of lists',
    params: [{name: "mat", type: "list", desc: ""}],
    fn: function(mat) {
        return arrayToList(_.zip.apply(this,listToArray(mat)).map(arrayToList).slice(0,-1))
    }
});

var identity = $b({
    name: 'identity',
    alias: 'id',
    desc: 'The Identity function',
    params: [{name: 'v'}],
    fn: _.identity
});

var fold = $b({
    name: 'fold',
    desc: 'Accumulate the result of applying a function to a list',
    mathy: "f(lst_0, f(lst_1, f(..., f(lst_n, init)))))",
    params: [
        {name: 'f', type: 'function', desc: 'Function to apply'},
        {name: 'init', desc: 'Seed value for function'},
        {name: '[lst ...]', type: 'list', desc: 'List to apply the fold over'}
    ],
    fn: function(fn, initialValue /*, ... */ ) {
        var args = args_to_array(arguments);
        var arrs = args.slice(2).map(function(x) { return listToArray(x) });

        var max_length = Math.min.apply(this, arrs.map(function(el) {return el.length;}));
        var cumulativeValue = initialValue;
        for (var i=0; i<max_length; i++) {
            var fn_args = arrs.map(function(el) {return el[i];});
            fn_args.push(cumulativeValue);
            cumulativeValue = fn.apply(this, fn_args);
        }
        return cumulativeValue;
    }
});

// NOTE: foldl and foldr only work on single lists
var foldl = $b({
    name: 'foldl',
    desc: 'Accumulate the result of applying a function to a list left to right',
    // mathy: "f(lst_0, f(lst_1, f(..., f(lst_n, init)))))",
    params: [
        {name: 'f', type: 'function', desc: 'Function to apply'},
        {name: 'init', desc: 'Seed value for function'},
        {name: 'lst', type: 'list', desc: 'List to apply the fold over'}
    ],
    fn: function(func, initialValue, lst) {
        return _.foldl(listToArray(lst), function(a,v){return func(a,v)}, initialValue);
    }
});

var foldr = $b({
    name: 'foldr',
    desc: 'Accumulate the result of applying a function to a list right to left',
    // mathy: "f(lst_0, f(lst_1, f(..., f(lst_n, init)))))",
    params: [
        {name: 'f', type: 'function', desc: 'Function to apply'},
        {name: 'init', desc: 'Seed value for function'},
        {name: 'lst', type: 'list', desc: 'List to apply the fold over'}
    ],
    fn: function(func, initialValue, lst ) {
        return _.foldr(listToArray(lst), function(a,v){return func(a,v)}, initialValue);
    }
});

var repeat = $b({
    name: 'repeat',
    desc: "Repeat a function n times",
    params: [
        {name: 'n', type: 'nat', desc: 'Number of times to repeat'},
        {name: 'f', type: 'function', desc: 'Function to repeat'}
    ],
    fn: function(n, fn) {
	var lst = [];
	for(var i=0;i<n;i++) {
	    lst.push(fn());
	}
	lst.push(null);
	return lst;
    }
});

var for_each = $b({
    name: 'for_each',
    desc: 'Apply a function to every member of a list, but don\'t return anything',
    params: [
        {name: 'fn', type: 'function'},
        {name: 'lst', type: 'list'}],
    fn: function(fn,lst) {
        var arr = listToArray(lst);
        arr.forEach(function(x, i, lst) { fn(x) });
        return;
    }
});

var map = $b({
    name: 'map',
    desc: 'Apply a function to every element of a list',
    params:
    [
        {name: 'fn', type: 'function', desc: ''},
        {name: '[lst ...]', type: 'list'}
    ],
    fn: function() {
        var args = args_to_array(arguments),
            fn = args[0];

        var lists = args.slice(1),
            arr = [],
            numLists = lists.length;

        var arrays = lists.map(function(L) { return listToArray(L) });

        // ^ have to write it verbosely because otherwise, map will pass in extra arguments
        // namely the current index and the entire array. the index element will
        // get used as the recursive flag to the listToArray function
        // this causes nested maps to have the wrong behavior

        var n = Math.min.apply(null, arrays.map(function(a) { return a.length}));

        for(var i=0;i<n;i++) {
	    arr[i] = fn.apply(null, arrays.map(function(L) { return L[i]}));
	}
	return arrayToList(arr, true);
    }
});

var filter = $b({
    name: 'filter',
    desc: 'Select subset of elements of a list that satisfy a predicate pred',
    params: [{name: "pred", type: "function", desc: ""},
             {name: "lst", type: "list", desc: ""}],
    fn: function(pred, lst) {
        return arrayToList(listToArray(lst).filter(pred));
    }
});

var partition = $b({
    name: 'partition',
    desc: 'Partition elements of a list into those that satisfy a predicate and those that don\'t',
    params: [{name: "pred", type: "function", desc: ""},
             {name: "lst", type: "list", desc: ""}],
    fn: function(pred, lst) {
        var p = _.partition(listToArray(lst),pred)
        return arrayToList(p.map(arrayToList));
    }
});

var reverse = $b({
    name: 'reverse',
    desc: 'Reverse a list',
    params: [{name: "lst", type: "list", desc: ""}],
    fn: function(lst) {
	return arrayToList(listToArray(lst).reverse());
    }
});

var length = $b({
    name: 'length',
    desc: 'Get the length of a list',
    params: [{name: "lst", type: "list", desc: ""}],
    fn: function(lst) {
        return listToArray(lst).length;
    }
});

// set operations
var union = $b({
    name: 'union',
    desc: 'union of sets',
    params:
    [{name: '[lst ...]', type: 'list'}],
    fn: function () {
        var args = args_to_array(arguments).map(listToArray);
        return arrayToList(_.union.apply(this,args));
    }
});

var intersection = $b({
    name: 'intersection',
    desc: 'intersection of sets',
    params:
    [{name: '[lst ...]', type: 'list'}],
    fn: function () {
        var args = args_to_array(arguments).map(listToArray);
        return arrayToList(_.intersection.apply(this,args));
    }
});

var difference = $b({
    name: 'difference',
    desc: 'difference of sets',
    params:
    [{name: 'lst', type: 'list'},
     {name: '[lst ...]', type: 'list'}],
    fn: function () {
        var args = args_to_array(arguments).map(listToArray);
        if (args.length <= 1) { return args[0] }
        return arrayToList(_.difference.apply(this,args));
    }
});

// https://gist.github.com/sjoerdvisscher/3078744
function _fHelper(f, args) {
    return function(a) {
        var args1 = args.concat([a]);
        if (args1.length == f.length)
            return f.apply(this, args1);
        else
            return _fHelper(f, args1);
    };
}

var uncurry = $b({
    name: 'uncurry',
    alias: 'uc',
    desc: 'uncurry function: f::a,b -> (f::a)::b',
    params: [{name: "f", type: "function", desc: ""}],
    fn: function(f) {
        if (typeof f != "function" || f.length < 2)
            return f;
        return _fHelper(f, []);
    }
});

var curry = $b({
    name: 'curry',
    alias: 'c',
    desc: 'curry function: (f::a)::b -> f::a,b',
    params: [{name: "f", type: "function", desc: ""}],
    fn: function(f) {
        if (typeof f != "function" || f.length == 0)
            return f;
        return function() {
            var r = f;
            for (var i = 0; i < arguments.length; i++)
                r = r(arguments[i]);
            return r;
        };
    }
});

var compose = $b({
    name: 'compose',
    alias: 'o',
    desc: 'compose functions: ((o f g) a) == (f (g a))',
    params: [{name: "[f ...]", type: "function", desc: ""}],
    fn: function() {
        // TODO: check if arguments are all functions
        return _.compose.apply(null,arguments);
    }
});

// predefine the length, decently quick and
// not so complicated as recursive merge
// http://jsperf.com/best-init-array/3
var make_list = $b({
    name: 'make_list',
    desc: 'Make a list of length n where all elements are x',
    params: [{name: "n", type: "nat", desc: ""},
             {name: "x"}],
    fn: function(n, x) {
	if (n == 0) return the_empty_list;
	var results = new Array(n);

	for (var i = 0; i < n; i += 1) {
	    results[i] = x;
	}
	return arrayToList(results, true);
    }
});

var is_eq = $b({
    name: 'is_eq',
    desc: "Type-strict and reference-based equality check (e.g., (eq? '(1 2) '(1 2)) returns #f)",
    params: [{name: "x", type: "", desc: ""}, {name: "y", type: "", desc: ""}],
    fn: function(x, y) {
	      return x === y;
    }
});

var is_equal = $b({
    name: 'is_equal',
    desc: "Less strict and value-based equality check (e.g., (equal? '(1 2) '(1 2)) returns #f)",
    params: [{name: "x", type: "", desc: ""}, {name: "y", type: "", desc: ""}],
    fn: function(x, y) {
        if (typeof(x) == typeof(y)) {
	    if (Array.isArray(x)) {
		if (x.length == y.length) {
                    for(var i = 0, ii = x.length; i < ii; i++) {
                        if (!is_equal(x[i], y[i])) {
                            return false;
                        }
                    };
                    return true;
		} else {
		    return false;
		}
	    } else {
		return x == y;
	    }
	} else {
	    return false;
	}
    }
});

var member = $b({
    name: 'member',
    desc: 'Test whether x is in a list according to some optional comparator function cmp',
    params: [
        {name: "x"},
        {name: "list", type: "list"},
        {name: "[cmp]", type: "function"}
    ],
    fn: function(x, lst, cmp) {
        cmp = cmp || is_equal;
        var array = listToArray(lst);
	      for (var i = 0, ii = array.length; i < ii; i++) {
	          if (cmp(x, array[i])) {
		            return arrayToList(array.slice(i));
	          }
	      }
	      return false;
    }
});

var apply = $b({
    name: 'apply',
    desc: 'If lst is (x1 x2 x3 ...), returns the function call (fn x1 x2 x3 ...)',
    params: [{name: "fn", type: "function", desc: ""},
             {name: "lst", type: "list", desc: ""}],
    fn: function(fn, lst) {
	return fn.apply(null, listToArray(lst));
    }
});

var assoc = $b({
    name: 'assoc',
    desc: 'Lookup a value in an association list',
    params: [{name: "x", type: "", desc: ""},
             {name: "alist", type: "list<pair>", desc: ""}],
    fn: function(x, alist) {
	alist = listToArray(alist);
	for (var i=0; i<alist.length; i++) {
	    if (is_equal(alist[i][0], x)) {
		return alist[i];
	    }
	}
	return false;
    }
});

var regexp_split = $b({
    name: 'regexp_split',
    desc: 'Split a string into a list of substrings based on a separator',
    alias: 'string-split',
    params: [{name: "s", type: "string", desc: ""},
             {name: "sep", type: "string", desc: ""}],
    fn: function(str, sep) {
    	return arrayToList(str.split(sep));
    }
});

var string_append = $b({
    name: 'string-append',
    desc: 'Concatenates the given strings',
    alias: 'string-append',
    params: [{name: '[x ...]', type: 'string', desc: 'Strings to concatenate'}],
    fn: function() {
        var result = "";
        for (var i = 0; i < arguments.length; i++) {
            result += arguments[i];
        }
        return result;
    }
});

var boolean_to_number = $b({
    name: 'boolean_to_number',
    desc: 'Convert a boolean to a number',
    params: [{name: "b", type: "boolean", desc: ""}],
    fn: function(b) {
        return b ? 1 : 0;
    }
});

var number_to_boolean = $b({
    name: 'number_to_boolean',
    desc: 'Convert a number to a boolean',
    params: [{name: "x", type: "real", desc: ""}],
    fn: function(x) {
        return x == 0 ? false : true;
    }
});

var bang_bang = $b({
    name: 'bang_bang',
    desc: 'Coerce an object to a boolean',
    params: [{name: 'x'}],
    fn: function(x) {
        return !!x;
    }
})

var string_to_number = $b({
    name: 'string_to_number',
    desc: 'Convert a string to a number',
    params: [{name: "s", type: "string", desc: ""}],
    fn: function(s) {
        var x = parseFloat(s);
        if (isNaN(x)) {
            return false;
        }
        return x;
    }
});

var string_to_symbol = $b({
    name: 'string_to_symbol',
    desc: 'Convert a string to a symbol',
    params: [{name: "s", type: "string", desc: ""}],
    fn: function(s) {
        return s;
    }
});

var stringify = $b({
    name: "stringify",
    desc: 'Convert an object to a string',
    params: [{name: "x", type: "", desc: ""}],
    fn: function(x) {
	      return x.toString();
    }
})

var number_to_string = $b({
    name: 'number_to_string',
    desc: 'Convert a number to a string',
    params: [{name: "x", type: "real", desc: ""}],
    fn: function(num) {
	      return num.toString();
    }
});

var string_slice = $b({
    name: 'string_slice',
    desc: 'Extract a substring from a string',
    params: [{name: "string", type: "string", desc: ""},
             {name: "start", type: "nat", desc: ""},
             {name: "[end]", type: "nat", desc: ""}
            ],
    fn: function(string, start, end) {
        return string.slice(start, end)
    }
});

var string_length = $b({
    name: 'string_length',
    desc: 'Get the length of string',
    params: [{name: "string", type: "string", desc: ""}],
    fn: function(string) {
        return string.length;
    }
});


var sample_discrete = $b({
    name: 'sample_discrete',
    desc: 'Takes a list of weights and samples an index between 0 and (number of weights - 1) with probability proportional to the weights.',
    numArgs: [1,3],
    params: [{name: "weights", type: "list<real>", desc: ""}],
    fn: function(weights, isStructural, conditionedValue) {
        return multinomialDraw( listToArray(iota(weights.length)),
                                listToArray(weights),
                                isStructural, conditionedValue);
    }
})

var multi_equals_condition = $b({
    name: 'multi_equals_condition',
    desc: '',
    numArgs: [3],
    params: [{name: "fn", type: "function", desc: ""},
             {name: "n", type: "nat", desc: ""},
             {name: "value", type: "list", desc: ""}],
    fn: function (fn, n, values) {
        if (values.length != n+1) condition(false);
        var marg = enumerateDist(fn);

        try {
            var marg = enumerateDist(fn);
        } catch (e) {
            throw new Error("Function in a repeated condition must be enumerable to be computed");
        }
        for (var i=0;i<n;i++) {
            var key = typeof(values[i]) == "string" ? '"'+values[i]+'"' : String(values[i]);
            var entry = marg[key];
            if (entry) {
                factor(Math.log(entry.prob));
            } else {
                condition(false);
                break;
            }
        }
    }
});

var wrapped_uniform_draw = $b({
    name: 'wrapped_uniform_draw',
    desc: 'Uniformly sample an element from a list',
    numArgs: [1,2],
    params: [{name: "items", type: "list", desc: ""},
             {name: "[conditionedValue]", type: "", desc: "", noexport: true}],
    erp: true,
    fn: function(items, conditionedValue) {
        return uniformDraw(listToArray(items), conditionedValue);
    }
});

var wrapped_multinomial = $b({
    name: 'wrapped_multinomial',
    desc: 'Sample an element from lst with the probability specified in probs',
    numArgs: [2,3],
    params: [{name: "lst", type: "list", desc: ""},
             {name: "probs", type: "list<real>", desc: ""},
             {name: "[conditionedValue]", type: "", desc: ""}],
    erp: true,
    fn: function(lst, probs, conditionedValue) {
	if (lst.length != probs.length) {
	    throw new Error("For multinomial, lists of items and probabilities must be of equal length");
	}
	return multinomialDraw(listToArray(lst), listToArray(probs), undefined, conditionedValue);
    }
});

// TODO: make sure p is less than 1
var wrapped_flip = $b({
    name: 'wrapped_flip',
    desc: 'Flip a weighted coin. Returns true or false',
    numArgs: [0,1,2],
    params: [{name: "[p]", type: "real", desc: "", default: "0.5"},
             {name: "[conditionedValue]", type: "", desc: "", noexport: true}
            ],
    erp: true,
  fn: function(p, conditionedValue) {
    if (p < 0 || p > 1) {
      throw new Error("flip called on " + p + ", which is not a probability");
    }
	    return flip(p, undefined, conditionedValue) == 1;
    }
});

var wrapped_uniform = $b({
    name: 'wrapped_uniform',
    desc: 'Sample a random real uniformly from the interval [a,b]',
    numArgs: [2,3],
    params: [{name: "a", type: "real", desc: ""},
             {name: "b", type: "real", desc: ""},
             {name: "[conditionedValue]", type: "", desc: "", noexport: true}
            ],
    erp: true,
    fn: function(a, b, conditionedValue) {
	return uniform(a, b, undefined, conditionedValue);
    }
});

var wrapped_random_integer = $b({
    name: 'wrapped_random_integer',
    desc: '',
    alias: 'sample-integer',
    numArgs: [1,2],
    params: [{name: "n", type: "nat", desc: ""},
             {name: "[conditionedValue]", type: "", desc: "", noexport: true}
            ],
    erp: true,
    fn: function(n, conditionedValue) {
        var probs = [], p = 1/n;
	for (var i = 0; i < n; i++){
            probs[i] = p;
        };
        return multinomial(probs, undefined, conditionedValue);
    }
});

var wrapped_gaussian = $b({
    name: 'wrapped_gaussian',
    desc: 'Sample from the Gaussian distribution N(mu, sigma)',
    numArgs: [0,1,2,3],
    params: [{name: "[mu]", type: "real", desc: "", default: 0},
             {name: "[sigma]", type: "real", desc: "", default: 1},
             {name: "[isStructural]", type: "", desc: "", noexport: true},
             {name: "[conditionedValue]", type: "", desc: "", noexport: true}
            ],
    erp: true,
  fn: function(mu, sigma, conditionedValue) {
    if (mu === undefined) {
      mu = 0;
    }
    if (sigma === undefined) {
      sigma = 1
    }

    if (sigma === 0) {
      return mu
    } else {
	    return gaussian(mu, sigma, undefined, conditionedValue);
    }
    }
});

var wrapped_gamma = $b({
    name: 'wrapped_gamma',
    desc: 'Sample from the gamma distribution G(a,b)',
    numArgs: [2,3],
    params: [{name: "a", type: "real", desc: ""},
             {name: "b", type: "real", desc: ""},
             {name: "[conditionedValue]", type: "", desc: "", noexport: true}],
    erp: true,
    fn: function(a, b, conditionedValue) {
	return gamma(a, b, undefined, conditionedValue);
    }
});

var wrapped_exponential = $b({
    name: 'wrapped_exponential',
    desc: 'Sample from the exponential distribution with parameter rate',
    numArgs: [1,2],
    params: [{name: "rate", type: "positive real", desc: ""},
             {name: "[conditionedValue]", type: "", desc: "", noexport: true}],
    erp: true,
    fn: function(rate, conditionedValue) {
	      return exponential(rate, undefined, conditionedValue);
    }
});

var wrapped_beta = $b({
    name: 'wrapped_beta',
    desc: 'Sample from the beta distribution B(a,b). Returns only the first element.',
    numArgs: [2,3],
    params: [{name: "a", type: "positive real", desc: ""},
             {name: "b", type: "positive real", desc: ""},
             {name: "[conditionedValue]", type: "", desc: "", noexport: true}],
    erp: true,
    fn: function(a, b, conditionedValue) {
        if (a <= 0) {
            throw new Error('The a argument to beta must be greater than 0');
        }
        if (b <= 0) {
            throw new Error('The b argument to beta must be greater than 0');
        }
	return beta(a, b, undefined, conditionedValue);
    }
});

var wrapped_dirichlet = $b({
    name: 'wrapped_dirichlet',
    desc: 'Sample from the Dirichlet distribution Dir(alpha).',
    numArgs: [1,2],
    params: [{name: "alpha", type: "list<positive real>", desc: ""},
             {name: "[conditionedValue]", type: "", desc: "", noexport: true}],
    erp: true,
    fn: function(alpha, conditionedValue) {
	alpha = listToArray(alpha);
	return arrayToList(dirichlet(alpha, undefined, conditionedValue));
    }
});

var DPmem = $b({
    name: 'DPmem',
    desc: 'Stochastic memoization using the Dirichlet Process',
    params: [{name: 'alpha', type: 'positive real', desc: 'Concentration parameter of the DP'},
             {name: 'f', type: 'function', desc: 'Function to stochastically memoize'}
            ],
    fn: function(alpha, f) {
        var allLabels = {};
        var allIndices = {};
        var allCounts = {};
        return function() {
            var args = args_to_array(arguments);
            var extractingTables = false;

            if (args[0] == 'get-tables') {
                extractingTables = true;
                args.shift();
            }
            var argsHash = JSON.stringify(args);

            var labels = allLabels[argsHash];
            var counts = allCounts[argsHash];
            var indices = allIndices[argsHash];

            if (extractingTables) {
                // return a list of table pairs
                // in each pair, the first element is the label
                // and the second value is the count
                if (!labels) {
                    return arrayToList([]);
                }
                var ret = [];
                for(var i = 0; i < labels.length; i++) {
                    ret.push([labels[i], counts[i+1]])
                };
                return arrayToList(ret);
            }

            if (labels === undefined) {
                labels = allLabels[argsHash] = [];

                // virtual index of -1 for sampling a new table
                indices = allIndices[argsHash] = [-1];

                // virtual count of alpha for sampling a new table
                counts = allCounts[argsHash] = [alpha];
            }

            var sampledIndex = wrapped_multinomial(arrayToList(indices),
                                                   arrayToList(counts));

            var label;
            if (sampledIndex == -1) {
                label = f.apply(null,arguments);
                indices.push(indices.length - 1);
                labels.push(label);
                counts.push(1);
            } else {
                // NB: labels will always have 1 fewer item than counts
                label = labels[sampledIndex];
                counts[sampledIndex + 1]++;
            }

            return label;
        }
    }
})



var wrapped_conditional = $b({
    name: 'wrapped_conditional',
    desc: '',
    params: [{name: 'comp', type: 'function', desc: ''},
             {name: 'params', type: 'list',
              desc: 'List where the first element is the sampling strategy, ' +
              'one of ("enumeration", "rejection, "mh"), if "mh", second element is the lag'
             }],
    fn: function(comp, params) {
        var options = {};
        if (params[0] == "enumeration") {
            options.algorithm = "enumerate";
        } else if (params[0] == "mh") {
            options.algorithm = "traceMH";
            options.lag = params[1];
        }
        return conditional(comp, options);
    }
});

// TODO: try to provide better error handling if
// numsamps / lag is not provided. might have to fix this
// inside js_astify
var wrapped_mh_query = $b({
    name: 'wrapped_mh_query',
    desc: '',
    params: [{name: 'comp'},
             {name: 'samples', type: 'nat'},
             {name: 'lag', type: 'nat'}],
    fn: function(comp, samples, lag) {
	var inn = traceMH(comp, samples, lag, false, "lessdumb").map(function(x) {return x.sample});
	var res = arrayToList(inn);
	return res;
    }
});

var wrapped_mh_query_scored = $b({
    name: 'wrapped_mh_query_scored',
    desc: '',
    params: [{name: 'comp'},
             {name: 'samples', type: 'nat'},
             {name: 'lag', type: 'nat'}],
    fn: function(comp, samples, lag) {
    var inn = traceMH(comp, samples, lag, false, "lessdumb").map(function(x) {return [x.sample, x.logprob, null]});
    var res = arrayToList(inn);
    return res;
    }
});

var wrapped_rejection_query = $b({
    name: 'wrapped_rejection_query',
    desc: '',
    params: [{name: 'comp'}],
    fn: function(comp) {
        return rejectionSample(comp);
    }
});

var wrapped_enumeration_query = $b({
    name: 'wrapped_enumeration_query',
    desc: 'Do enumeration query on a model',
    params: [{name: 'comp'}],
    fn: function(comp) {
	var d = enumerateDist(comp);
	var p=[],v=[];
	var norm = 0;
	for (var x in d) {
	    p.push(d[x].prob);
	    v.push(d[x].val);
	    norm += d[x].prob;
	}
	var res = List(arrayToList(v, true),
                       arrayToList(p.map(function(x){return x/norm}), true));
	return res;
    }
});

var wrapped_condition_equal = $b({
    name: 'wrapped_condition_equal',
    alias: 'condition-equal',
    desc: '',
    params: [{name: 'comp'}, {name: 'value'}],
    fn: function(comp, value) {
        var marg;
        try {
            marg = wrapped_enumeration_query(comp);
        } catch (e) {
            throw new Error("Unable to enumerate over function");
        }
        for (var i = 0; i < marg.length - 1; i++) {
            console.log(JSON.stringify(marg), value)
            if (is_equal(marg[0][i], value)) {
                factor(Math.log(marg[1][i]));
                return;
            }
        }
        // If no match is found, then the condition fails
        condition(false);
    }

});


var wrapped_condition_repeat_equal = $b({
    name: 'wrapped_condition_repeat_equal',
    alias: 'condition-repeat-equal',
    desc: '',
    params: [{name: 'comp'}, {name: 'values'}],
    fn: function(comp, values) {
        var marg;
        try {
            marg = wrapped_enumeration_query(comp);
        } catch (e) {
            throw new Error("Unable to enumerate over function");
        }
        for (var i = 0; i < marg.length - 1; i++) {
            console.log(JSON.stringify(marg), value)
            if (is_equal(marg[0][i], value)) {
                factor(Math.log(marg[1][i]));
                return;
            }
        }
        // If no match is found, then the condition fails
        condition(false);
    }

});

var read_file = $b({
    name: 'read_file',
    desc: '',
    params: [{name: "fileName", type: "string", desc: ""}],
    fn: function(fileName) {
	return fs.readFileSync(fileName, "utf8");
    }
});

// CSV stuff follows RFC4180 (http://tools.ietf.org/html/rfc4180)
// - in double quote-enclosed fields, double quotes are escaped with another double quote
var read_csv = $b({
    name: 'read_csv',
    desc: '',
    params: [{name: "fileName", type: "string", desc: ""},
             {name: "[sep]", type: "string", desc: ""}],
    fn: function(fileName, sep) {
	sep = sep || ",";
        if (sep.indexOf('"') != -1) throw new Error("CSV separator cannot contain a double quote");
        var text = fs.readFileSync(fileName, "utf8");
        var data = [];
        var row = [];
        var begin = 0;
        var i = 0;
        var j = 0;
        var cell;
        while (i<text.length) {
            if (text[i] == '"') {
                for (j=i+1; !(text[j] == '"' && text[j+1] != '"'); j++) {
                    if (j >= text.length) throw new Error("Malformed CSV file");
                }
                j++;
                cell = text.slice(i+1, j-1).replace(/""/g, '"');
            } else {
                for (; j < text.length && text.slice(j, j + sep.length) != sep && text[j] != "\n"; j++) {
                    if (text[j] == '"') throw new Error("Malformed CSV file");
                }
                cell = text.slice(i, j);
            }
            row.push(cell);
            if (j >= text.length || text[j] == "\n") {
                data.push(arrayToList(row, true));
                row = [];
                j++;
            } else if (text.slice(j, j + sep.length) == sep) {
                j += sep.length;
            } else {
                // Only reached if cell was quoted but not properly closed
                throw new Error("Malformed CSV file");
            }
            i = j;
        }
	return arrayToList(data, true);
    }
});

var write_csv = $b({
    name: 'write_csv',
    desc: '',
    params: [{name: "data", type: "list<list>", desc: ""},
             {name: "fileName", type: "string", desc: ""},
             {name: "[sep]", type: "string", desc: ""}],
    fn: function(data, fileName, sep) {
        sep = sep || ",";
        var stream = fs.createWriteStream(fileName);
        for (var i=0;i<data.length-1;i++) {
            var cells = [];
            for (var j=0;j<data[i].length-1;j++) {
                var cell = data[i][j];
                var modified = cell.toString().replace(/"/g, '""');
                cells.push(cell == modified ? cell : '"' + modified + '"');
            }
            stream.write(cells.join(sep) + "\n");
        }
    }
});

var console_log = $b({
    name: 'console_log',
    desc: 'Print arguments to Javascript console',
    params: [{name: "[s ...]", type: "", desc: ""}],
    fn: function() {
        var args = args_to_array(arguments);
        var strs = args.map(util.format_result);
        for (var i=0;i<strs.length;i++) {
            console.log(strs[i]);
        };
    }
});

var display = $b({
    name: 'display',
    alias: ['print', 'pn'],
    desc: '',
    params: [{name: "[s ...]", type: "", desc: ""}],
    fn: function() {
        var args = args_to_array(arguments);
        var strs = args.map(util.format_result);
        if (inBrowser) {
            for (var i = 0; i < strs.length; i++) {
                var el = document.createElement("div");
                el.innerHTML = strs[i];
                $results.append(el);
            }
        } else {
            console.log(strs.join("\n"));
        }
    }
});

var bootstrap = $b({
    name: 'bootstrap',
    desc: '',
    params: [{name: "fn", type: "function", desc: ""},
             {name: "fileName", type: "string", desc: ""},
             {name: "n", type: "nat", desc: ""}],
    fn: function(fn, fileName, n) {
	var data = read_csv(fileName);
	var results = [null];
	for (var i=0;i<n;i++) {
	    var sampled_data = [null];
	    for (var j=0;j<data.length-1;j++) {
		sampled_data.unshift(data[Math.floor(Math.random()*(data.length-1))]);
	    }
	    results.unshift(fn(sampled_data));
	}
	return results;
    }
});

var string_append = $b({
    name: 'string_append',
    desc: 'Append an arbitrary number of strings',
    params: [
        {name: '[s ...]', type: 'string'}
    ],
    fn: function() {
        var args = args_to_array(arguments);
        return args.join("");
    }
});

// TODO: document the fact that there is no symbol type
var symbol_to_string = $b({
    name: 'symbol_to_string',
    desc: '',
    params: [{name: "sym", type: "string", desc: ""}],
    fn: function(sym) {
        return sym;
    }
});

var iota = $b({
    name: 'iota',
    desc: 'Create list based on arithmetic progressions',
    params: [{name: 'count', type: 'nat', desc: 'Number of items'},
             {name: '[start]', type: 'real', desc: 'First item in list', default: 0},
             {name: '[step]', type: 'real',
              desc: 'Difference between successive items in the list', default: 1}],
    fn: function(count, start, step) {
        if (start === undefined) { start = 0; }
        if (step === undefined) { step = 1; }

        var r = [];
        for(var k = start, i = 0;
            i < count;
            i++, k += step) {
            r.push(k);
        }
        return arrayToList(r);
    }
});

var range = $b({
    name: 'range',
    desc: 'Create list based on a range',
    params: [
        {name: 'start', type: 'integer'},
        {name: 'end', type: 'integer'}
    ],
    fn: function(start, end) {
        return iota(end - start + 1, start, 1);
    }
});

var update_list = $b({
    name: 'update_list',
    desc: '',
    params: [{name: "lst", type: "list", desc: ""},
             {name: "n", type: "nat", desc: ""},
             {name: "value", type: "", desc: ""}],
    fn: function(lst, n, value) {

        var array = listToArray(lst);
        if (array.length < n) {
	    throw new Error("list index too big: asked for item #" + (n+1) + " but list only contains " + n + " items");
	}

        array[n] = value;

        return arrayToList(array);
    }
});

var get_time = $b({
    name: 'get_time',
    desc: '',
    params: [],
    fn: function() {
        return Date.now();
    }
});

var make_gensym = $b({
    name: 'make_gensym',
    desc: "Returns a gensym, which is a function that returns a new string value every time you call it (i.e., you're guaranteed to never get the same return value twice). You can specify an optional prefix for these values (default is 'g')",
    params: [{name: '[prefix]', default: 'n/a', type: 'string'}],
    nowrap: true,
    fn: function(prefix) {
        prefix = prefix || "g";
        prefix += "";
        var f = function() {
            return prefix + (f.__gensymcounter__++);
        };
        f.__gensymcounter__ = 0;
        return f;
    }
});

var gensym = $b({
    name: 'gensym',
    desc: 'A default gensym (prefix is g)',
    params: [],
    nowrap: true,
    fn: make_gensym('g')
});

// var dict = $x.dict = function() {
//   return {};
// }

// var update_dict = $x.update_dict = function(d, key, val) {
//   // copy version
//   var dict = _(d).clone();
//   dict[key] = val;
//   return dict;
// }

// var dict_to_list = $x.dict_to_list = function(d) {
//   var keys = Object.keys(d);
//   var arr = keys.map(function(k) {
//     return arrayToList( [k, d[k]] );
//   });
//   return arrayToList(arr);
// };

// var dict_lookup = $x.dict_lookup = function(d,k) {
//   var keys = Object.keys(d);
//   k = k + "";

//   if ( keys.indexOf(k) > -1) {
//     var entry = [k, d[k]];
//     return arrayToList(entry);
//   } else {
//     return false;
//   }
// };

var sample = $b({
    name: 'sample',
    desc: 'apply a thunk',
    params: [{name: 'thunk', type: 'function'}],
    fn: function(thunk) {
        return thunk();
    }
})

var set_seed = $b({
    name: 'set_seed',
    desc: 'Seed a seed for the PRNG',
    params: [{name: 'seed', type: 'string'}],
    fn: function(seed) {
        Math.random = seedrandom(seed);
    }
})

// var ch_import = $b({
//     name: 'ch_import',
//     alias: ['ch-import','import-as'],
//     desc: 'import a js library into webchurch with a prefix',
//     params: [{name: 'lib'}, {name: 'prefix'}],
//     fn: function(lib, prefix) {
//         var __m = require('' + lib);
//         openModule(__m,prefix)
//     }
// })

// var c = parseTypeString('pair<pair<real>>');
// console.log(c(Pair(Pair(0.1, 'a'),
//                    Pair(0.3, 0.4)
//                   )));

// console.log( c( List(1,2,'a') ) )

// probability distribution is list<pair<_,positive real>>


var load_url = $b({
    name: 'load_url',
    desc: 'Load a remote url',
    params: [{name: 'path', type: 'string'}],
    fn: function(path) {
        var isChurch = true;

        var extension = path.split("/").pop().split(".").pop();

        if (extension == 'js') {
            isChurch = false;
        }

        if (inBrowser) {
            // by default, assume we're working with Church

            var jqxhr = $.ajax({
                url: path + '?' + (new Date()).getTime(),
                async: false,
                error: function(response, textStatus, errorThrown) {
                    throw new Error('Could not load library ' + path);
                },
                dataType: 'text' // needed so that js libraries aren't executed immediately by jquery
            });

            var code = jqxhr.responseText;
        } else {
            code = fs.readFileSync(path, 'utf8');
        }

        if (isChurch) {
            var churchToJs = require('./evaluate.js').churchToJs;
            code = churchToJs(code,
                              {
                                  includePreamble: false,
                                  returnCodeOnly: true,
                                  wrap: false
                              });
        }
        return code;
    }
});


function wrapAsserts(annotation) {

    var fnName = annotation.name;
    var fn = annotation.fn;
    fn.displayName = fnName;
    var paramProps = annotation.params || [];
    var nowrap = annotation.nowrap;

    if (global.unsafe_types || nowrap) {
        return fn;
    }

    var validArgumentLengths = annotation.numArgs;

    var numParams = paramProps.length;

    // compute number of mandatory arguments
    var numMandatoryParams = paramProps.filter(function(prop) {
        return !prop.name.match(/\[/);
    }).length;

    var wrapped = function() {
        // var userArgs = Array.prototype.slice.call(arguments, 0);
        var userArgs = arguments;

        var userNumArgs = userArgs.length;
        // console.log( 'inside wrapped ' + fnName);

        if (userNumArgs < numMandatoryParams) {
            var err = _.template('<<functionName>> takes {{numArgs}} argument{{plural}}, but {{userNumArgs}} were given',
                                 {userNumArgs: userNumArgs == 0 ? 'none' : 'only ' + userNumArgs,
                                  numArgs: ((numParams == numMandatoryParams) ? '' : '(at least) ') + numMandatoryParams,
                                  plural: numMandatoryParams == 1 ? '' : 's'
                                 }
                                );
            throw new Error(err);
        }

        // make sure that the number of arguments that the
        // user supplied is a valid number of arguments
        // to this function
        if (validArgumentLengths) {
            if (validArgumentLengths.indexOf(userNumArgs) == -1) {
                throw new Error('Invalid number of arguments to <<functionName>>');
            }
        }


        // for each supplied argument, check type
        for(var i = 0, a, props, variadic = false, specType, argName; i < userNumArgs; i++) {

            a = userArgs[i];
            if (!variadic) {
                props = paramProps[i];
                specType = props.type;
            }
            argName = props.name;
            if (argName.match(/\.\.\./)) {
                variadic = true;
            }

            if (specType) {
                // run the appropriate type checker on the argument
                var checker = parseTypeString(specType); // typeCheckers[specType];

                if (checker === undefined) {
                    var errorString = _.template(
                        'Bug in Church builtins - annotation for (<<functionName>> ...) tries to declare the type of the "{{argName}}" argument as "{{specType}}", which is not a recognized type',
                        { specType: specType,
                          argName: argName
                        }
                    );
                    throw new Error(errorString);
                }

                var typeChecks = checker(a);

                if (!typeChecks) {
                    var errorString = _.template(
                        // <<functionName>> will get filled in inside evaluate.js
                        '{{argName}} to (<<functionName>> ...) should be a {{specType}}, not a {{userType}}',
                        {
                            userType: typeof a,
                            specType: specType,
                            argName: variadic ? 'Argument' : 'The ' + argName + ' argument'
                        }
                    );

                    throw new Error(errorString);
                }
            }
        }
        return fn.apply(null, userArgs);
    };

    // set the function's displayName for debugging purposes
    wrapped.displayName = "asserted/" + fnName;

    return wrapped;
}
