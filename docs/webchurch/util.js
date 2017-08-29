// ******************************
// * PARSING
// ******************************

function is_leaf(node) { return (!node["children"]); }

var boolean_aliases = {
    "#t": true,
    "#T": true,
    "true": true,
    "#f": false,
    "#F": false,
    "false": false
}

function is_string(s) { return s != undefined && s[0] == "\""; }
function is_number(s) { return !isNaN(parseFloat(s)); }
function is_identifier(s) { return !(boolean_aliases[s]!=undefined || is_string(s) || is_number(s)); }

// ******************************
// * EVALUATION
// ******************************

function make_church_error(name, start, end, msg) {
    return {name: "Church" + name, message: start + "-" + end + ": " + msg, start: start, end: end};
}

// TODO: update this for new list format
function format_result(obj) {
    if (Array.isArray(obj)) {
        // if we're a list
        if (obj[obj.length-1] == null) {
            return "(" + obj.slice(0,-1).map(format_result).join(" ") + ")";
        }
        // if we're just a pair
        else {
            var formatted = obj.map(format_result);
            var most = formatted.slice(0,-1);
            var last = formatted[formatted.length - 1]

            return "(" +
                most.join(" ") +
                " . " +
                last +
                ")";
        }
    } else {
	if (typeof(obj) == "boolean") {
	    if (obj) {
		return "#t";
	    } else {
		return "#f";
	    }
	} else if (typeof obj == "string") {
	    return obj
	} else if (obj instanceof RegExp) {
    return obj.toString();
  } else if (typeof obj == "object") {
      return JSON.stringify(obj);
  }  else {
      return obj + "";
  }
    }
}

function log(obj, header) {
    console.log(header||"*********************************");
    if (typeof(obj) == "string") {
	console.log(obj);
    } else {
	console.log(JSON.stringify(obj, undefined, 2));
    }
}

module.exports = {
    is_leaf: is_leaf,
    boolean_aliases: boolean_aliases,
    is_string: is_string,
    is_identifier: is_identifier,

    make_church_error: make_church_error,
    format_result: format_result,
    log: log
}
