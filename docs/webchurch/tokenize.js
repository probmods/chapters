var util = require('./util.js');

var delimiters = ["(", ")", "[", "]", "'", ",", "@", "\"", ";"]
var whitespace_re = /^\s/

function get_site_map(s) {
    var map = {};
    var row = 1;
    var col = 1;
    for (var i = 0; i < s.length; i++) {
	if (s[i] == "\n") {
	    row++;
	    col = 1;
	} else {
	    map[i] = row + ":" + col;
	    col++;
	}
    }
    return map;
}

function tokenize(s) {
    var tokens = [];
    var begin = 0;
    var end = 0;
    var site_map = get_site_map(s);
    while (begin < s.length) {
	if (s[begin].match(whitespace_re)) {
	    begin++;
	} else if (s[begin] == ";") {
	    for (; begin < s.length && s[begin] != "\n"; begin++) {}
	} else {
	    if (s[begin] == "\"") {
		for (end = begin + 1; ; end++) {
		    if (end > s.length) {
			throw util.make_church_error("SyntaxError", site_map[begin], site_map[begin], "Unclosed double quote");
		    } else if (s.slice(end, end + 2) == "\\\"") {
			end++;
		    } else if (s[end] == "\"") {
			end++;
			break;
		    }
		}
	    } else if (delimiters.indexOf(s[begin]) != -1) {
		end = begin + 1;
	    } else {
		for (end = begin; end < s.length; end++) {
		    if (delimiters.indexOf(s[end]) != -1 || s[end].match(whitespace_re)) {
			break;
		    }
		}
	    }
	    var token = s.slice(begin, end);
	    if (token[0] == '"')
		token = '"' + token.substring(1, token.length-1).replace(/\\\"/g, '"') + '"'
	    tokens.push({text: token, start: site_map[begin], end: site_map[end-1]});
	    begin = end;
	}
    }
    return tokens;
}

module.exports = {
    tokenize: tokenize
}
