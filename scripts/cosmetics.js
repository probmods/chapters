/* global $ */

// for all p nodes after the node with id references,
// select the first child span
// note that these first child spans should have
// font-variant: small
$("#references ~ p > span:first-child")
  .addClass("citekey")
  .map(function(index, el) {
    var key = $(el).text(),
        $sourceNodes = $('span[data-cites="' + key + '"]'); // find spans in the text that reference this

    $sourceNodes.map(function(j,y) {
      var $y = $(y);
      var targetNode = $(el.parentNode).clone().addClass("citation-expanded");
      targetNode.find("span").remove(); 
      
      $y.append(targetNode);

      // to handle touch events
      if (false) {
        var unclickHandler, clickHandler;

        unclickHandler = function() {
          $y.removeClass('hover').one('click', clickHandler);
        };

        clickHandler = function() {
          $y.addClass('hover');
          setTimeout(function() {
            $(document).one('click', unclickHandler);
          }, 30);
        };

        
        $y.one('click', clickHandler);
      }
    }); 
  });

