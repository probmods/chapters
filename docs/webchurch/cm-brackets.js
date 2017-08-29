// README: this file contains slightly modified versions of closebrackets.js
// and matchbrackets.js from the codemirror repo (from the addon/edit folder)

var CodeMirror = require('codemirror');

// closebrackets.js
// -----------------------------------

(function() {
    var DEFAULT_BRACKETS = "()[]{}\"\"";
    var DEFAULT_EXPLODE_ON_ENTER = "[]{}";
    var SPACE_CHAR_REGEX = /\s/;

    var Pos = CodeMirror.Pos;

    CodeMirror.defineOption("autoCloseBrackets", false, function(cm, val, old) {
        if (old != CodeMirror.Init && old)
            cm.removeKeyMap("autoCloseBrackets");
        if (!val) return;
        var pairs = DEFAULT_BRACKETS, explode = DEFAULT_EXPLODE_ON_ENTER;
        if (typeof val == "string") pairs = val;
        else if (typeof val == "object") {
            if (val.pairs != null) pairs = val.pairs;
            if (val.explode != null) explode = val.explode;
        }
        var map = buildKeymap(pairs);
        if (explode) map.Enter = buildExplodeHandler(explode);
        cm.addKeyMap(map);
    });

    function charsAround(cm, pos) {
        var str = cm.getRange(Pos(pos.line, pos.ch - 1),
                              Pos(pos.line, pos.ch + 1));
        return str.length == 2 ? str : null;
    }

    function buildKeymap(pairs) {
        var map = {
            name : "autoCloseBrackets",
            Backspace: function(cm) {
                if (cm.getOption("disableInput")) return CodeMirror.Pass;
                var ranges = cm.listSelections();
                for (var i = 0; i < ranges.length; i++) {
                    if (!ranges[i].empty()) return CodeMirror.Pass;
                    var around = charsAround(cm, ranges[i].head);
                    if (!around || pairs.indexOf(around) % 2 != 0) return CodeMirror.Pass;
                }
                for (var i = ranges.length - 1; i >= 0; i--) {
                    var cur = ranges[i].head;
                    cm.replaceRange("", Pos(cur.line, cur.ch - 1), Pos(cur.line, cur.ch + 1));
                }
            }
        };
        var closingBrackets = "";
        for (var i = 0; i < pairs.length; i += 2) (function(left, right) {
            if (left != right) closingBrackets += right;
            map["'" + left + "'"] = function(cm) {
                if (cm.getOption("disableInput")) return CodeMirror.Pass;
                var ranges = cm.listSelections(), type, next;
                for (var i = 0; i < ranges.length; i++) {
                    var range = ranges[i], cur = range.head, curType;
                    if (left == "'" && cm.getTokenTypeAt(cur) == "comment")
                        return CodeMirror.Pass;
                    var next = cm.getRange(cur, Pos(cur.line, cur.ch + 1));
                    if (!range.empty())
                        curType = "surround";
                    else if (left == right && next == right) {
                        if (cm.getRange(cur, Pos(cur.line, cur.ch + 3)) == left + left + left)
                            curType = "skipThree";
                        else
                            curType = "skip";
                    } else if (left == right && cur.ch > 1 &&
                               cm.getRange(Pos(cur.line, cur.ch - 2), cur) == left + left &&
                               (cur.ch <= 2 || cm.getRange(Pos(cur.line, cur.ch - 3), Pos(cur.line, cur.ch - 2)) != left))
                        curType = "addFour";
                    else if (left == right && CodeMirror.isWordChar(next))
                        return CodeMirror.Pass;
                    else if (cm.getLine(cur.line).length == cur.ch || closingBrackets.indexOf(next) >= 0 || SPACE_CHAR_REGEX.test(next))
                        curType = "both";
                    else
                        return CodeMirror.Pass;
                    if (!type) type = curType;
                    else if (type != curType) return CodeMirror.Pass;
                }

                cm.operation(function() {
                    if (type == "skip") {
                        cm.execCommand("goCharRight");
                    } else if (type == "skipThree") {
                        for (var i = 0; i < 3; i++)
                            cm.execCommand("goCharRight");
                    } else if (type == "surround") {
                        var sels = cm.getSelections();
                        for (var i = 0; i < sels.length; i++)
                            sels[i] = left + sels[i] + right;
                        cm.replaceSelections(sels, "around");
                    } else if (type == "both") {
                        cm.replaceSelection(left + right, null);
                        cm.execCommand("goCharLeft");
                    } else if (type == "addFour") {
                        cm.replaceSelection(left + left + left + left, "before");
                        cm.execCommand("goCharRight");
                    }
                });
            };
            if (left != right) map["'" + right + "'"] = function(cm) {
                var ranges = cm.listSelections();
                for (var i = 0; i < ranges.length; i++) {
                    var range = ranges[i];
                    if (!range.empty() ||
                        cm.getRange(range.head, Pos(range.head.line, range.head.ch + 1)) != right)
                        return CodeMirror.Pass;
                }
                cm.execCommand("goCharRight");
            };
        })(pairs.charAt(i), pairs.charAt(i + 1));
        return map;
    }

    function buildExplodeHandler(pairs) {
        return function(cm) {
            if (cm.getOption("disableInput")) return CodeMirror.Pass;
            var ranges = cm.listSelections();
            for (var i = 0; i < ranges.length; i++) {
                if (!ranges[i].empty()) return CodeMirror.Pass;
                var around = charsAround(cm, ranges[i].head);
                if (!around || pairs.indexOf(around) % 2 != 0) return CodeMirror.Pass;
            }
            cm.operation(function() {
                cm.replaceSelection("\n\n", null);
                cm.execCommand("goCharLeft");
                ranges = cm.listSelections();
                for (var i = 0; i < ranges.length; i++) {
                    var line = ranges[i].head.line;
                    cm.indentLine(line, null, true);
                    cm.indentLine(line + 1, null, true);
                }
            });
        };
    }
})();

// matchbrackets.js

(function() {

    var ie_lt8 = /MSIE \d/.test(navigator.userAgent) &&
        (document.documentMode == null || document.documentMode < 8);

    var Pos = CodeMirror.Pos;

    var matching = {"(": ")>", ")": "(<", "[": "]>", "]": "[<", "{": "}>", "}": "{<"};

    function findMatchingBracket(cm, where, strict, config) {
        var line = cm.getLineHandle(where.line), pos = where.ch - 1;
        var match = (pos >= 0 && matching[line.text.charAt(pos)]) || matching[line.text.charAt(++pos)];
        if (!match) return null;
        var dir = match.charAt(1) == ">" ? 1 : -1;
        if (strict && (dir > 0) != (pos == where.ch)) return null;
        var style = cm.getTokenTypeAt(Pos(where.line, pos + 1));

        var found = scanForBracket(cm, Pos(where.line, pos + (dir > 0 ? 1 : 0)), dir, style || null, config);
        if (found == null) return null;
        return {from: Pos(where.line, pos), to: found && found.pos,
                match: found && found.ch == match.charAt(0), forward: dir > 0};
    }

    // bracketRegex is used to specify which type of bracket to scan
    // should be a regexp, e.g. /[[\]]/
    //
    // Note: If "where" is on an open bracket, then this bracket is ignored.
    //
    // Returns false when no bracket was found, null when it reached
    // maxScanLines and gave up
    function scanForBracket(cm, where, dir, style, config) {
        var maxScanLen = (config && config.maxScanLineLength) || 10000;
        var maxScanLines = (config && config.maxScanLines) || 1000;

        var stack = [];
        var re = config && config.bracketRegex ? config.bracketRegex : /[(){}[\]]/;
        var lineEnd = dir > 0 ? Math.min(where.line + maxScanLines, cm.lastLine() + 1)
            : Math.max(cm.firstLine() - 1, where.line - maxScanLines);
        for (var lineNo = where.line; lineNo != lineEnd; lineNo += dir) {
            var line = cm.getLine(lineNo);
            if (!line) continue;
            var pos = dir > 0 ? 0 : line.length - 1, end = dir > 0 ? line.length : -1;
            if (line.length > maxScanLen) continue;
            if (lineNo == where.line) pos = where.ch - (dir < 0 ? 1 : 0);
            for (; pos != end; pos += dir) {
                var ch = line.charAt(pos);
                if (re.test(ch) && (style === undefined || cm.getTokenTypeAt(Pos(lineNo, pos + 1)) == style)) {
                    var match = matching[ch];
                    if ((match.charAt(1) == ">") == (dir > 0)) stack.push(ch);
                    else if (!stack.length) return {pos: Pos(lineNo, pos), ch: ch};
                    else stack.pop();
                }
            }
        }
        return lineNo - dir == (dir > 0 ? cm.lastLine() : cm.firstLine()) ? false : null;
    }

    function matchBrackets(cm, autoclear, config) {
        // Disable brace matching in long lines, since it'll cause hugely slow updates
        var maxHighlightLen = cm.state.matchBrackets.maxHighlightLineLength || 1000;
        var marks = [], ranges = cm.listSelections();
        for (var i = 0; i < ranges.length; i++) {
            var match = ranges[i].empty() && findMatchingBracket(cm, ranges[i].head, false, config);
            if (match && cm.getLine(match.from.line).length <= maxHighlightLen) {
                var style = match.match ? "CodeMirror-matchingbracket" : "CodeMirror-nonmatchingbracket";
                marks.push(cm.markText(match.from, Pos(match.from.line, match.from.ch + 1), {className: style}));
                if (match.to && cm.getLine(match.to.line).length <= maxHighlightLen)
                    marks.push(cm.markText(match.to, Pos(match.to.line, match.to.ch + 1), {className: style}));
            }
        }

        if (marks.length) {
            // Kludge to work around the IE bug from issue #1193, where text
            // input stops going to the textare whever this fires.
            if (ie_lt8 && cm.state.focused) cm.display.input.focus();

            var clear = function() {
                cm.operation(function() {
                    for (var i = 0; i < marks.length; i++) marks[i].clear();
                });
            };
            if (autoclear) setTimeout(clear, 800);
            else return clear;
        }
    }

    var currentlyHighlighted = null;
    function doMatchBrackets(cm) {
        cm.operation(function() {
            if (currentlyHighlighted) {currentlyHighlighted(); currentlyHighlighted = null;}
            currentlyHighlighted = matchBrackets(cm, false, cm.state.matchBrackets);
        });
    }

    CodeMirror.defineOption("matchBrackets", false, function(cm, val, old) {
        if (old && old != CodeMirror.Init)
            cm.off("cursorActivity", doMatchBrackets);
        if (val) {
            cm.state.matchBrackets = typeof val == "object" ? val : {};
            cm.on("cursorActivity", doMatchBrackets);
        }
    });

    CodeMirror.defineExtension("matchBrackets", function() {matchBrackets(this, true);});
    CodeMirror.defineExtension("findMatchingBracket", function(pos, strict, config){
        return findMatchingBracket(this, pos, strict, config);
    });
    CodeMirror.defineExtension("scanForBracket", function(pos, dir, style, config){
        return scanForBracket(this, pos, dir, style, config);
    });

})()
