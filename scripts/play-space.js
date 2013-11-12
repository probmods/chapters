/* global $, location, Cookies, console, _ */

var fileNames = [];

// var chapterName = _(location.href.split("/")).last().replace(".html","").split("#")[0];
window.chapterName = "play-space";

var save = function(name) {
  if (typeof name === "undefined") {
    name = $("#code-names > [selected]").text();
  }
  var editor = $(".CodeMirror")[0].CodeMirror;
  
  var exerciseName = [chapterName, name].join(".");
  editor.id = exerciseName;
  editor.exerciseName = exerciseName;
  
  var newCode = editor.getValue(),
      newEngine = editor.engine;
  
  // unset editor.codeId
  editor.codeId = false;
  
  // asynchronously POST church code to /code/{exercise_name}
  $.ajax({
    type: "POST",
    url: "/code/" + exerciseName,
    data: {
      'code': newCode,
      'engine': newEngine,
      'isRevert': null,
      'csrfmiddlewaretoken': Cookies.get('csrftoken')
    },
    success: function(codeId) {
      console.log("POST to /code/" + exerciseName + ": success");
      editor.codeId = codeId;
      editor.exerciseName = exerciseName;
      if (fileNames.indexOf(name) > -1) {
        $("#code-names").val(exerciseName); // use exerciseName b/c it has the prefix 
      } else {
        $("#code-names").prepend(
          "<option value='" + exerciseName + "' selected>" + name + "</option>"
        );
      }
      // $("#displayname").text(exerciseName.split('.').pop());
    },
    error: function() {
      console.log("POST to /code/" + exerciseName + ": failure");
    }
  });
}


var saveAs = function() {
  var name = prompt("Please enter a name", editor.exerciseName.split('.').pop());

  save(name);
  
}

var loadFrom = function(name) {
  var editor = $(".CodeMirror")[0].CodeMirror;
  
  var shortName = name.replace(chapterName + ".", "");
  //var exerciseName = [chapterName, name].join(".");

  $(editor.display.wrapper).css("opacity", "0.1");
  $("pre.results").css("display", "none");
  
  $.ajax({
    url: "/code/" + name,
    success: function(json) {
      
      //           // overwrite defaults
      // _(editor.options).extend({
      //   text: json.code,
      //   engine: json.engine
      // });
      // TODO: switch engines
      editor.setValue(json.code);
      editor.exerciseName = name;
      $(editor.display.wrapper).css("opacity", "");
      // $("#displayname").text(exerciseName.split('.').pop());
    },
    error: function() {
      alert("failed to load " + shortName);
      console.log("failure loading exercise " + name + ", using default");
    }
  }); 
};

$("#code-names").change(function(x) {
  //console.log( $(x.target));
  var selectedName = $(this).find("option:selected").val();
  loadFrom(selectedName); 
});

$.ajax({
  url: "/code/_all",
  success: function(json) {
    //           // overwrite defaults
    //           _(editor.options).extend({
    //                                   text: json.code,
    //                                   engine: json.engine
    //                                   });

    $("#code-names").append(
      json.map(function(x) {
        var trueName = x.exercise_id__name,
            displayName = trueName.replace("play-space.","");

        fileNames.push( displayName );
        
        return "<option value='" + trueName + "'" +
          ( displayName == "scratch" ? " selected" : "") +
          ">" + displayName + "</option>";
      })
    );
  }
  
});
