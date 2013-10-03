%Scratch Pad

<script>
    saveAs = function() {
        var name = prompt("Please enter a name","scratch")
        var editor = $(".CodeMirror")[0].CodeMirror
        
        var chapterName = _(location.href.split("/")).last().replace(".html","").split("#")[0];
        var exerciseName = [chapterName, name].join(".")
        editor.id = exerciseName
        editor.exerciseName = exerciseName
        
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
               },
               error: function() {
               console.log("POST to /code/" + exerciseName + ": failure");
               }
               });
               <!-- send to server... Need to prepend "Scratch"? -->
    }

loadFrom = function() {
    
    var name = prompt("Please enter the saved name","scratch")
    var editor = $(".CodeMirror")[0].CodeMirror
    
    var chapterName = _(location.href.split("/")).last().replace(".html","").split("#")[0];
    var exerciseName = [chapterName, name].join(".")
    
    $.ajax({
           url: "/code/" + exerciseName,
           success: function(json) {
//           // overwrite defaults
//           _(editor.options).extend({
//                                   text: json.code,
//                                   engine: json.engine
//                                   });
           editor.setValue(json.code)
           },
           error: function() {
           console.log("failure loading exercise " + exerciseName + ", using default");
           }
           });
           
}
</script>

Enter you own code here:

~~~~{data-exercise="scratch"}

~~~~

<button type="button" onclick="saveAs();">Save as...</button>
<button type="button" onclick="loadFrom();">Load from...</button>

