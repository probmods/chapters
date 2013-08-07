/* global $, Cookies */

//

// check if user is logged in
(function() {

  var loggedIn = Cookies.get("sessionid") || false;

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
    var attributes = getAttributes(item); 
    
    $(item).replaceWith(
      $('<textarea>')
        .val(text)
        .attr(attributes)
        .attr("rows", text.split("\n").length + 1)
    ); 
  };


  $(document).ready(function() {
    $("pre").map(function(index, item) {
      if (!loggedIn) {
        injectEditor(item, $(item).text());
      } else {
        var exerciseName = $(item).attr("data-exercise");
        
        $.ajax({
          url: "/code/" + exerciseName + "/",
          success: function(text) {
            injectEditor(item, text);
          } 
        }).fail(function() {
          console.log("failure");
        });

        
      }
    });
  });

})();
