/* global global, require, $, location */

var app = {
  protocol: location.protocol,
  loggedIn: false,
  chapterName: typeof chapterName !== 'undefined' ? chapterName : location.href.split("/").pop().replace(".html","").split("#")[0] 
};

var inject = require('./editor').injector;

var foo = false;

$("pre:not(.norun)").map(function(index, item) {

  var rawExerciseName = $(item).data('exercise');
  var defaultEngine = $(item).attr("data-engine") || 'webchurch'; 
  var defaultCode = $(item).text(); 

  if (rawExerciseName === undefined) {
    rawExerciseName = md5(defaultEngine + defaultCode);
  } 

  var exerciseName = [app.chapterName,index,rawExerciseName].join(".");

  var edOptions = {
    code: defaultCode,
    engine: defaultEngine,
    exerciseName: exerciseName
  };
  
  var ed = inject(item, edOptions);

  // TODO: if we are not logged in or this exercise isn't explicitly named
  // (i.e., is not a homework assignment), then directly inject the codemirror
  // element
  
  if (!app.loggedIn || !rawExerciseName) {
    ed.supplant(item);
  } else {
    // get code 
    $.ajax({
      url: "/code/" + exerciseName,
      success: function(json) {
        // overwrite defaults
        _(edOptions).extend({
          code: json.code,
          engine: json.engine
        });

        injectEditor(item, editorOptions);
      },
      error: function() {
        console.log("failure loading exercise " + exerciseName + ", using default");
        injectEditor(item, editorOptions);
      }
    })
  }

  ed.on('run.start', function() {

    ed.runStatus = 0;
    
    $.ajax({
      type: "POST",
      url: "/code/" + exerciseName,
      data: {
        'code': this.get('code'),
        'engine': this.get('engine'),
        'isRevert': null,
        'csrfmiddlewaretoken': Cookies.get('csrftoken')
      },
      success: function(codeId) {
        console.log("POST to /code/" + exerciseName + ": success");
        ed.codeId = codeId;
        ed.trigger('code.sent');
        
      },
      error: function() {
        console.log("POST to /code/" + exerciseName + ": failure");
      }
    });

    console.log('mocking codeId receipt');
    ed.set('codeId', 'fake_code_id');
    ed.trigger('code.sent');

  });

  // send result to the server if runStatus == 2
  // runStatus gets incremented once when we have the result
  // and once again when we get a code id back from the server
  var trySendResult = function() {
    ed.runStatus++;
    // if we've both got the result and the code id from the server
    // then send the result
    if (ed.runStatus == 2) {
      ed.runStatus = 0;

      var data = {'exercise_id': exerciseName,
                  'csrfmiddlewaretoken': Cookies.get('csrftoken'),
                  'forest_results': this.get('result'),
                  'code_id': this.codeId
                 }; 
      
      $.ajax({
        type: "POST",
        url: "/result",
        data: data,
        success: function() { console.log("POST to /result/" + exerciseName + ": success");},
        error: function() { console.log("POST to /result/" + exerciseName + ": failure");}
      }); 
    }
  }

  ed.on({
    'code.sent': trySendResult,
    'run.finish': trySendResult
  }); 

}); 

/*

 model attributes:
 - code
 - defaultCode
 - engine
 - defaultEngine

 events:
 - run.start
 - run.finish
 - end
 - 


 */
