/* global require */

var builtins = require('./church_builtins.js');
var annotations = builtins.__annotations__;

annotations.eval = {
  name: 'eval',
  desc: 'Evaluate a list representing a Church s-expression, e.g., <code>(eval (list + 1 2))</code> returns 3',
  params: [{name: 'lst'}]
}

var _ = require('underscore');

_.templateSettings = {
    interpolate: /\{\{(.+?)\}\}/g
};

/*

  functionName

  description

  arg_1 - type_1 - desc_1
  arg_2 - type_2 - desc_2
  ...
  arg_3 - type_3 - desc_3

*/

// TODO: transform names like 'x ...' into 'x1 x2 ...'
function renderFunction(functionName, props) {
    var description = props.desc || "";
    var args = props.params || [];

    var renderArg = _.template("<tr><td><code>{{name}}</code><td>{{type}}</td><td>{{desc}}</td></tr>");

    var argsTable = _.template("<table>\n{{tbody}}\n</table>",
                               {tbody: args.map(function(arg) {
                                   arg = _.defaults(arg, {type: '', desc: ''});
                                   return renderArg(arg);
                               }).join('\n')});

    var templateString = ['<div class="function">',
                          '<code class="function-name">({{functionName}} {{argList}})</code>',
                          '<code class="aliases">{{aliases}}</code>',
                          '<div class="description">{{description}}</div>',
                          '{{table}}',
                          '</div>'].join('\n');

    // compute canonical scheme name from js name
    functionName = functionName
                .replace(/wrapped_(.+)/, function(m, p1) { return p1 })
                .replace(/is_(.+)/, function(m, p1) { return p1 + "?"})
                .replace('_to_', '->')
                .replace(/_/g, '-');

    // must be an array
    var aliases = props.alias;

    // strip out the canonical scheme name from the list of aliases
    aliases = _(aliases).without(functionName)

    if (aliases.length > 0) {
        aliases =  Array.isArray(aliases) ? aliases.join(",") : aliases;
        aliases = "<br />&nbsp;Aliases: " + aliases + "";
    } else {
        aliases = "";
    }

    var tableString =  _.template(templateString,
                                  {functionName: functionName,
                                   aliases: aliases,
                                   argList: _(args).pluck('name').join(' '),
                                   description: description,
                                   table: argsTable});

    return {name: functionName,
            string: tableString};
}

function renderAllFunctions() {
    var rendered = _(annotations).map(function(props, functionName) {
        return renderFunction(functionName, props);
    });
    var entries = rendered.sort(function(x, y) {
        var xn = x.name.toLowerCase();
        var yn = y.name.toLowerCase();
        if (xn < yn) {
            return -1;
        }
        if (xn > yn) {
            return 1;
        }
        return 0
    });

    return _(entries).pluck('string').join('\n');
}

var res = renderAllFunctions();

console.log('<link rel="stylesheet" type="text/css" href="css/ref.css" />')
console.log('<p><h2>Work in progress: email probmods@gmail.com with corrections (or send a pull request on Github)</h2></p><p></p>')
console.log(res);
