var msg = function(obj) {
    self.postMessage(obj);
}

self.addEventListener('message', function(e) {
    var code = e.data;
    var church_to_js = require("./church_to_js").church_to_js;
    var format_result = require("./format_result").format_result;
    var transform = require("./probabilistic/transform");
    var church_builtins = require("./church_builtins");

    try
    {
        var js_code = church_to_js(code);
        js_code = transform.probTransform(js_code);
        // msg({status: 'compiled', data: js_code});
        msg({status: 'done', data: format_result(eval(js_code)) });
    }
    catch (e)
    {
        msg({status: 'error', data: e.message });
    }

}, false);

_hist = function() {
    var args = Array.prototype.slice.call(arguments, 0);
    msg({status: 'running', action: "hist", data: args});
};

_density = function() {
    var args = Array.prototype.slice.call(arguments, 0);
    msg({status: 'running', action: "density", data: args});
};

_scatter = function() {
    var args = Array.prototype.slice.call(arguments, 0);
    msg({status: 'running', action: "scatter", data: args});
};

_display = function() {
    var args = Array.prototype.slice.call(arguments, 0);
    msg({status: 'running', action: "display", data: args});

}

// shim. this doesn't work properly for strings or, e.g.,
// lists of strings
_multiviz = function() {
    msg({status: 'running', action: "multiviz", data: args});
}
