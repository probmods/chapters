/* global CodeMirror */

var editor = CodeMirror.fromTextArea(document.getElementById("code"), {
  lineNumbers: true,
  matchBrackets: true,
  continueComments: "Enter"
});
var js_outmirror = null;
var exec_outmirror = null;

var church_to_js = require("./church_to_js").church_to_js;
var church_builtins = require("./church_builtins");

var pr = require("./probabilistic/index");
var util = require("./probabilistic/util");
var transform = require("./probabilistic/transform");
util.openModule(pr);
util.openModule(church_builtins);

function __updateJSOutput(str)
{
  if (!js_outmirror)
  {
    js_outmirror = CodeMirror(document.getElementById("js_output"));
    js_outmirror.readonly = true;
  }
  js_outmirror.setValue(str);

  document.getElementById("clearBtn").style.display = "inline";
}

function __updateExecOutput(str)
{
  if (!exec_outmirror)
  {
    exec_outmirror = CodeMirror(document.getElementById("exec_output"));
    exec_outmirror.readonly = true;
  }
  exec_outmirror.setValue(str);

  document.getElementById("clearBtn").style.display = "inline";
}


function __clearOutput()
{
  var outelem = document.getElementById("output");
  outelem.removeChild(outelem.childNodes[0]);
  outmirror = null;
  document.getElementById("clearBtn").style.display = "none";
}

function __runCode()
{
  var church_code = editor.getValue();
  var js_code = church_to_js(church_code);
  __updateJSOutput(js_code);
  try
  {
    js_code = transform.probTransform(js_code);
    __updateExecOutput(JSON.stringify(eval(js_code)));
  }
  catch (e)
  {
    __updateExecOutput(JSON.stringify(e.message));
  }
}
