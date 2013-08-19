/* global $, Cookies, console, require, CodeMirror */

var js_outmirror = null,
    exec_outmirror = null,
    church_to_js = require("./church_to_js").church_to_js,
    church_builtins = require("./church_builtins"),
    pr = require("./probabilistic/index"),
    util = require("./probabilistic/util"),
    transform = require("./probabilistic/transform");

util.openModule(pr);
util.openModule(church_builtins);

// check if user is logged in
(function() {

  // we can't use Cookies.get('sessionid') because that's an HTTPOnly
  // cookie - it can't be read by client-side javascript
  var loggedIn = Cookies.get("loggedin") || false;

  // return a dictionary of DOM element attributes
  var getAttributes = function(x) {
    var attributes = {};
    // extract all info from 
    for(var i = 0, ii = x.attributes.length; i < ii; i++) {
      var attr = x.attributes.item(i),
          name = attr.name,
          value = attr.value;
      
      attributes[name] = value;
    }
    return attributes;
  };

  var injectEditor = function(item, text) {
    var attributes = getAttributes(item),
        exerciseName = $(item).data("exercise");

    // var $textArea = $('<textarea>')
    //       .val(text)
    //       .attr(attributes)
    //       .attr("rows", text.split("\n").length + 1);
    // $(item).replaceWith($textArea); 

    // var editor = CodeMirror.fromTextArea($textArea[0], {
    //   lineNumbers: true,
    //   matchBrackets: true,
    //   continueComments: "Enter",
    //   viewportMargin: Infinity
    // });

    var editor = CodeMirror(
      function(el) {$(item).replaceWith(el);},
      {
        value: text,
        lineNumbers: true,
        matchBrackets: true,
        continueComments: "Enter",
        viewportMargin: Infinity
      });


    var $container = $(editor.display.wrapper),
        $results = $("<div class='results'>"),
        $runButton = $("<button>").html("Run").click(function() {
          var churchCode = editor.getValue();

          if (!(typeof exerciseName == "undefined")) {

            // asynchronously POST church code to /code/{exercise_name}
            $.ajax({
              type: "POST",
              url: "/code/" + exerciseName + "/",
              data: {
                'new_code': churchCode
              },
              success: function() {
                console.log("POST to /code/" + exerciseName + ": success");
              },
              error: function() {
                console.log("POST to /code/" + exerciseName + ": failure");
              }
            });
          }

          try
          {
            var jsCode = church_to_js(churchCode);
            jsCode = transform.probTransform(jsCode);

            // asynchronously POST church results to /result/{exercise_name}
            
            
            var resultText = JSON.stringify(eval(jsCode));
            $results.removeClass("error").text(resultText);

          }
          catch (e)
          {
            var error = e.message;
            $results.addClass("error").text( error );
          }


        });

    $container.attr("id", "ex-"+ exerciseName).after( $results, $runButton  );

    
    
  };


  $(document).ready(function() {
    $("pre").map(function(index, item) {
      var exerciseName = $(item).attr("data-exercise");
      
      if (!loggedIn || !exerciseName) {
        injectEditor(item, $(item).text());
      } else {

        $.ajax({
          url: "/code/" + exerciseName + "/",
          success: function(text) {
            console.log(text);
            injectEditor(item, text);
          },
          error: function() {
            console.log("failure");
          }
        });

        
      }
    });
  });

})();
