/* global $, location, Cookies, console, _, editors */

var fileNames = ['scratch'];
var chapterName = "play-space";

var ed;

$(document).ready(function() {
    // this is set from new-injector.js
    ed = editors[0];
    ed.set('exerciseName','play-space.scratch');

    // get rid of reset button 
    ed.display.$resetButton.remove();
    
    var loadFrom = function(fullName) {
        
        var shortName = fullName.replace(chapterName + ".", "");
        //var exerciseName = [chapterName, name].join(".");

        $(ed.display.wrapper).css("opacity", "0.1");
        $("pre.results").css("display", "none");
        
        $.ajax({
            url: "/code/" + fullName,
            success: function(json) {
                ed.set({code: json.code,
                        engine: json.engine,
                        initialOptions: {
                            code: json.code,
                            engine: json.engine
                        }
                       },
                       {programmatic: true}) 
                
                $(ed.display.wrapper).css("opacity", "");
                // $("#displayname").text(exerciseName.split('.').pop());
            },
            error: function() {
                alert("failed to load " + shortName);
                console.log("failure loading exercise " + fullName + ", using default");
            }
        }); 
    }

    window.save = function(shortName) {
        if (typeof shortName === "undefined") {
            shortName = $("#code-names :selected").text();
        }

        ed.set('exerciseName', 'play-space.' + shortName); 
        ed.sendCode(); 
    }
    
    window.saveAs = function() {
        var shortName = prompt("Please enter a name", ""); 

        // user didn't enter name but clicked ok
        if (shortName === "") {
            alert('Please enter a non-empty name');
            setTimeout(saveAs, 0);
            return;
        }

        // user clicked cancel
        if (shortName === null) {
            return;
        }

        // warn if supplied name conflicts with an existing name
        var isExistingName = _(fileNames).contains(shortName);        
        if (isExistingName) {
            var overwriteExisting = window.confirm(
                shortName + " already exists - do you want to overwrite it?");
            if (!overwriteExisting) {
                return;
            }
        } 

        save(shortName);
        
        // if file name doesn't exist yet, create a new create a new <option></option> tag in the file selector and switch to it
        // otherwise, just switch to it
        if (!isExistingName) {
            $("#code-names").append(
                "<option value=\"play-space." + shortName + "\"" + " selected" + ">" + shortName); 
        } else {
            $("#code-names").find('option[value="play-space.' + shortName + '"]').attr("selected",true);
        }
        
    }

    // when the file selector changes,
    // change exerciseName and load it from the database
    $("#code-names").change(function(x) {
        ed.display.$results.html('').hide();
        var fullName = $(this).find("option:selected").val();
        loadFrom(fullName); 
        ed.set('exerciseName', fullName);
    }); 

    $.ajax({
        url: "/code/_all",
        success: function(json) {
            json.forEach(function(x) {
                    var trueName = x.exercise_id__name,
                        displayName = trueName.replace("play-space.","");

                fileNames.push( displayName ) ;
                
            });

            fileNames = _(fileNames).unique().sort(); 
            
            $("#code-names").append(
                fileNames.map(function(name) {
                    return "<option value=\"play-space." + name + "\"" +
                        ( name == "scratch" ? " selected" : "") +
                        ">" + name + "</option>";

                })
            );
        }
        
    });

    
});
