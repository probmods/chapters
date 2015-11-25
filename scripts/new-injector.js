/* global global, require, $, location, Cookies */

var app = {
    protocol: location.protocol,
    loggedIn: Cookies.get('gg') || false,
    chapterName: typeof chapterName !== 'undefined' ? chapterName : location.href.split("/").pop().replace(".html","").split("#")[0]
};

var editors = [];

var EditorModel = require('./editor').EditorModel;

$(document).ready(function() {

    $("pre:not(.norun)").map(function(index, item) {

        var rawExerciseName = $(item).data('exercise');
        var exerciseName;

        var defaultEngine = $(item).attr("data-engine") || 'webchurch';
        var defaultCode = $(item).text();

        // if the codebox doesn't declare an exercise name, compute one
        if (rawExerciseName === undefined) {
            exerciseName = md5(defaultEngine + defaultCode);
        } else {
            exerciseName = rawExerciseName;
        }

        var edOptions = {
            code: defaultCode,
            engine: defaultEngine,
            exerciseName: app.chapterName == 'play-space' ?
                // HACK: hard code the format for play-space names
                [app.chapterName, exerciseName].join(".") :
                [app.chapterName, index, exerciseName].join(".")
        };

        var ed = new EditorModel(edOptions);

        editors.push(ed);

        // if we are not logged in or this exercise isn't explicitly named
        // (i.e., is not a homework assignment), then just insert the dom element.
        // otherwise, do a network action to get the code contents and then insert
        // the dom element
        if (!app.loggedIn // || !rawExerciseName
           ) {
               ed.replaceDomEl(item);
           } else {
               // get code
               $.ajax({
                   url: "/code/" + ed.get('exerciseName'),
                   success: function(json) {
                       ed.set({code: json.code,
                               engine: json.engine},
                              {programmatic: true});

                       if (json.code !== defaultCode) {
                           $(ed.display.wrapper).find(".code-settings").prepend($("<span>(modified)</span>"))
                       }
                   },
                   error: function() {
                       console.log("failure loading exercise " + ed.get('exerciseName') + ", using default");
                   },
                   complete: function() {
                       ed.replaceDomEl(item);
                   }
               })
           }

        // attach a method to the editor instance for sending code to the db
        ed.sendCode = function() {
            var exerciseName = ed.get('exerciseName');
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
        }

        // attach a method to the editor instance for sending results to the db
        // this assumes that ed.code_id and ed.get('results') are available
        ed.sendResult = function() {
            var exerciseName = ed.get('exerciseName');


            var data = {'exercise_id': exerciseName,
                        'csrfmiddlewaretoken': Cookies.get('csrftoken'),
                        'forest_results': ed.get('result'),
                        'forest_errors': JSON.stringify(ed.get('error')),
                        'code_id': ed.codeId
                       };

            $.ajax({
                type: "POST",
                url: "/result",
                data: data,
                success: function() { console.log("POST to /result/" + exerciseName + ": success");},
                error: function() { console.log("POST to /result/" + exerciseName + ": failure");}
            });
        }

        ed.on('run.start', function() {
            ed.unset('error');
            ed.runStatus = 0;
            ed.sendCode();
        });

        // send result to the server if runStatus == 2
        // runStatus gets incremented once when we have the result
        // and once again when we get a code id back from the server
        // (we don't know in advance the order of these events)
        var trySendResult = function() {
            ed.runStatus++;
            // if we've both got the result and the code id from the server
            // then send the result
            if (ed.runStatus == 2) {
                ed.runStatus = 0;
                ed.sendResult();
            }
        }

        // after running, replace svg element with img element
        // containing the svg as a data uri so that users can
        // right click charts and download them
        ed.on('run.finish', function() {
            setTimeout(function() {
                var $svgs = $(ed.display.$results).find("svg");

                var svgTemplate = _.template(
                    '<?xml version="1.0" standalone="no"?><!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.1//EN" "http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd"><svg class="marks" width="<%- width %>" height="<%- height %>" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink"><defs><style type="text/css"></style></defs>');


                $svgs.map(function(i, svg) {
                    var svgText = svg.innerHTML;
                    var svgHeader = svgTemplate({width: $(svg).width(),
                                                 height: $(svg).height()})

                    $(svg).replaceWith(
                        $("<img>").attr({src: 'data:image/svg+xml;utf8,' +
                                             svgHeader +
                                             svgText + '</svg>'

                                            }))
                });

            }, 0)
        })

        ed.on({
            'code.sent': trySendResult,
            'run.finish': trySendResult
        });

        ed.on('reset', function() {

            $(ed.display.wrapper).find(".code-settings > span ").remove();
            var initialOptions = ed.get('initialOptions'),
                exerciseName = ed.get('exerciseName');

            $.ajax({
                type: "POST",
                url: "/code/" + exerciseName,
                data: {
                    'code': initialOptions.code,
                    'engine': initialOptions.engine,
                    'isRevert': 1,
                    'csrfmiddlewaretoken': Cookies.get('csrftoken')
                },
                success: function(codeId) {
                    console.log("[reset] POST to /code/" + exerciseName + ": success");
                    ed.codeId = codeId;
                },
                error: function() {
                    console.log("[reset] POST to /code/" + exerciseName + ": failure");
                }
            });

        })

    });

});
