/* global module */

var $x = {};

// TODO: this should probably be written using a stack, rather than recursion
var listToArray = $x.listToArray = function(list, recurse) {
    if (recurse) {
	      return list.slice(0, -1).map(function (x) {return Array.isArray(x) ? listToArray(x, recurse) : x});
    } else {
	      return list.slice(0, -1);
    }
};

var arrayToList = $x.arrayToList = function(arr, mutate) {
    if (mutate) {
        arr.push(null);
    } else {
	      arr = arr.concat(null);
    }
    return arr;
};

module.exports = $x;
