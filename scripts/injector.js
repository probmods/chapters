/* global $, Cookies, console, require, CodeMirror, _ */

var js_outmirror = null,
    exec_outmirror = null,
    church_to_js = require("./church_to_js").church_to_js,
    church_builtins = require("./church_builtins"),
    pr = require("./probabilistic/index"),
    util = require("./probabilistic/util"),
    transform = require("./probabilistic/transform");

var format_result = require("./format_result").format_result;

util.openModule(pr);
util.openModule(church_builtins);

// check if user is logged in
(function() {


  var runners = {};
  runners['webchurch'] = function(exerciseName, code, editor) {
    var $results = editor.$results;
    try {
      var jsCode = church_to_js(code);
      jsCode = transform.probTransform(jsCode);

      var runResult = eval(jsCode),
          underlyingData; 
      
      if (typeof runResult == "function") {
        // otherwise, call the function with the current div as an argument
        underlyingData = runResult($results);
        //underlyingData = format_result(runResult($results));
      }
      else {
        runResult = format_result(runResult);
        // if we get back a string, just show the text
        underlyingData = runResult;
        //underlyingData = format_result(runResult);
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
  };

  var query_settings = {
    method: 'get',          // method; get or post
    data: '',               // array of values to be passed to the page - e.g. {name: "John", greeting: "hello"}
    minTimeout: 300,        // starting value for the timeout in milliseconds
    maxTimeout: 8000,       // maximum length of time between requests
    multiplier: 2,          // if set to 2, timerInterval will double each time the response hasn't changed (up to maxTimeout)
    type: 'jsonp',           // response type - text, xml, json, etc.  See jq.ajax config options
    maxCalls: 0,            // maximum number of calls. 0 = no limit.
    autoStop: 0            // automatically stop requests after this many returns of the same data. 0 = disabled.
  };

  function query_url(task_id){
    return 'http://forestbase.com/api/query/' + task_id + '/';
  };

  function query_stop_url(task_id){
    return 'http://forestbase.com/api/query/stop/' + task_id + '/';
  };

  function query_update(task_id, handlers){
    $.ajax({ url : query_url(task_id),
              type : 'json',
              method: 'get',
              success: function(json){
//                signal_handlers(json, handlers);
              }});
  };

  function query_stop(task_id, handlers){
    $.get(
      query_stop_url(task_id),
      {},
      function(json) {
//        signal_handlers(json, handlers);
      },
      "jsonp"
    );
  };

  function query_periodicalupdater(task_id, handlers){
    function query_receiver(json) {
      if (json.status == "done") {
        console.log(json.status);
        updater.stop();
        _(handlers).each(function(handler) {
          handler(json);
        });
      }
    };
    var updater = $.PeriodicalUpdater(query_url(task_id), query_settings, query_receiver);
  };

  var forestRunner = function(exerciseName, code, editor) {
    var $results = editor.$results,
        engine = editor.engine;

    var handlers = {};
   
    // NB: debugger statement doesn't work quite right here...
    // i don't get access to, e.g., exerciseName in debugger
    handlers.error = function(json) {
      if (json.errors.length > 0) {
        var errorString = json.errors.join("\n");
        $results.addClass('error').html(errorString);
      } else {
        $results.removeClass('error');
      }
    };

    handlers.textOutAndResult = function(json) {
      var resultString = "";
      if (json.data && json.data.result && json.data.result.base) {
        resultString += json.data.result.base.values.join("\n");
      }

      if (json.text && json.text != "\n\n") {
        resultString += json.text;
      }

      $results.html(resultString);
      
    }; 


    handlers.hist = function(json) {
      if (json.data && json.data.hist && _(json.data.hist).keys().length > 0) {
        var histData = _(json.data.hist).values()[0],
            title = histData.attributes.title,
            counts = histData.counts;

        // cosh returns a histogram where counts are probabilities
        // convert this to an approximate count
        if (engine == "cosh") {
          _(histData.counts).each(function(prob, key) {
            counts[key] = Math.round(prob * 1000);
          });
        }

        // for compatibility with _hist,
        // convert summary counts back into
        // a full data structure
        var samps = Array.prototype.concat.apply([],
                                                 _(counts).map(function(count, key) {
                                                   var arr = [];
                                                   while (count--) {
                                                     arr.push(key);
                                                   }
                                                   return arr; 
                                                 })
                                                ),
            // convert from array to list (this is convoluted)
            sampsList = arrayToList(samps);


        var histPlotter = _hist(sampsList, title);
        histPlotter($results);;
      } 
    }; 
    
    $.get("http://forestbase.com/api/query/",
           {"code": code, "engine": engine},
           function(json) {
             if (json.status == "submitted") {
               // load_handlers(handlers);
               query_periodicalupdater(json.task_id, _(handlers).values() );
             }
           },
           "jsonp");

  };

  runners['cosh'] = forestRunner;
  runners['mit-church'] = forestRunner;
  runners['bher'] = forestRunner;
  

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

  var injectEditor = function(item, text, selectedEngine) {
    var attributes = getAttributes(item),
        exerciseName = $(item).data("exercise");

    // editor
    var editor = CodeMirror(
      function(el) {$(item).replaceWith(el);},
      {
        value: text,
        lineNumbers: true,
        matchBrackets: true,
        continueComments: "Enter",
        viewportMargin: Infinity
      });
    editor.engine = selectedEngine || 'webchurch'; 

    // results div
    var $results = $("<pre class='results'>"); 

    // engine selector

    var engines = ["webchurch", "cosh", "bher", "mit-church"],
        engineSelectorString = "<select>\n" + _(engines).map(
          function(engine) {
            var tmpl = _.template('<option value="{{ engine }}" {{ selectedString }}> {{ engine }} </option>'),
                str = tmpl({
                  engine: engine,
                  selectedString: engine == editor.engine ? "selected" : ""
                });

            return str; 
          } 
        ).join("\n") + "\n</select>",
        $engineSelector = $(engineSelectorString);
    
    $engineSelector.change(function(e) {
      editor.engine = $(this).val();
    });

    // reset button
    var $resetButton = $("<button>").html("Reset").css('float', 'right');

    // run button
    var $runButton = $("<button>").html("Run"); 
    $runButton.click(function() {
      $results.html('');
      var churchCode = editor.getValue();

      // submit church code to accounts server
      if (!(typeof exerciseName == "undefined") && loggedIn) {
        // asynchronously POST church code to /code/{exercise_name}
        $.ajax({
          type: "POST",
          url: "/code/" + exerciseName,
          data: {
            'new_code': churchCode,
            'csrfmiddlewaretoken': Cookies.get('csrftoken')
          },
          success: function() {
            console.log("POST to /code/" + exerciseName + ": success");
          },
          error: function() {
            console.log("POST to /code/" + exerciseName + ": failure");
          }
        });
      }

      // use runner on this editor and code
      runners[editor.engine](exerciseName, churchCode, editor); 
    });

    // add non-codemirror bits after codemirror
    $(editor.display.wrapper).attr("id", "ex-"+ exerciseName).after( $runButton,
                                                                     $engineSelector,
                                                                     $resetButton,
                                                                     $results ); 

    editor.$runButton = $runButton;
    editor.$engineSelector = $engineSelector;
    editor.$resetButton = $resetButton;
    editor.$results = $results;
    
  };


  $(document).ready(function() {
    $("pre:not(.norun)").map(function(index, item) {
      var exerciseName = $(item).attr("data-exercise"),
          defaultEngine = $(item).attr("data-engine") || 'webchurch',
          defaultText = $(item).text();
      
      if (!loggedIn || !exerciseName) {
        injectEditor(item, defaultText, defaultEngine); 
      } else {

        $.ajax({
          url: "/code/" + exerciseName,
          success: function(text) {
            // HACK: remove trailing newline that gets added
            // by django somewhere
            text = text.substring(0, text.length - 1);
            // TODO: store & get engine from db
            var engine = defaultEngine;

            injectEditor(item, text, engine);
          },
          error: function() {
            console.log("failure loading exercise " + exerciseName + ", using default");
            injectEditor(item, defaultText, defaultEngine);
          }
        });

        
      }
    });
  });

})();
