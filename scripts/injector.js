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
        $runButton = $("<button>").html("Run");
    $runButton.click(function() {
      var churchCode = editor.getValue();

      if (!(typeof exerciseName == "undefined") && loggedIn) {
        // asynchronously POST church code to /code/{exercise_name}
        $.ajax({
          type: "POST",
          url: "/code/" + exerciseName,
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

      try {
        var jsCode = church_to_js(churchCode);
        jsCode = transform.probTransform(jsCode);

        var runResult = eval(jsCode),
            underlyingData;

        
        if (typeof runResult == "function") {
          // otherwise, call the function with the current div as an argument
          underlyingData = runResult($results);
        }
        else {
          // if we get back a string, just show the text
          underlyingData = runResult;
          $results.removeClass("error").text(runResult);
        } 
        
        // asynchronously POST church results to /result/{exercise_name}
        if (!(typeof exerciseName == "undefined") && loggedIn) {

          $.ajax({
            type: "POST",
            url: "/result",
            data: {
              'exercise_id': exerciseName,
              'forest_results': JSON.stringify(underlyingData),
              'csrfmiddlewaretoken': Cookies.get('csrftoken')
            },
            success: function() {
              console.log("POST to /result/" + exerciseName + ": success");
            },
            error: function() {
              console.log("POST to /result/" + exerciseName + ": failure");
            }
          });
          }
      } catch (e) {
        var error = e.message;
        $results.addClass("error").text( error );

        // asynchronously POST church results to /result/{exercise_name}
        if (!(typeof exerciseName == "undefined") && loggedIn) {
          $.ajax({
            type: "POST",
            url: "/result",
            data: {
              'exercise_id': exerciseName,
              'forest_errors': error,
              'csrfmiddlewaretoken': Cookies.get('csrftoken')
            },
            success: function() {
              console.log("POST to /result/" + exerciseName + ": success");
            },
            error: function() {
              console.log("POST to /result/" + exerciseName + ": failure");
            }
          });
        }
      } 
    });

    $container.attr("id", "ex-"+ exerciseName).after( $results, $runButton  );

    
    
  };


  $(document).ready(function() {
    $("pre:not(.norun)").map(function(index, item) {
      var exerciseName = $(item).attr("data-exercise"),
          defaultText = $(item).text();
      
      if (!loggedIn || !exerciseName) {
        injectEditor(item, defaultText);
      } else {

        $.ajax({
          url: "/code/" + exerciseName,
          success: function(text) {
            // HACK: remove trailing newline that gets added
            // by django somewhere
            text = text.substring(0, text.length - 1);
            injectEditor(item, text);
          },
          error: function() {
            console.log("failure loading exercise " + exerciseName + ", using default");
            injectEditor(item, defaultText);
          }
        });

        
      }
    });
  });

})();
