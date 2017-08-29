/* global location */

var renderMath = function() {
  $("span.math").each(function(i,el) {
    var innerHTML = el.innerHTML;
    var string = el.innerText;
    var displayMode = false;

    if (/^\\\(/.test(string)) {
      string = string.replace(/^\\\(/,"").replace(/\\\)$/,"");
    } else if (/^\\\[/.test(string)) {
      displayMode = true;
      string = string.replace(/^\\\[/,"").replace(/\\\]$/,"");
    }

    try {
      katex.render(string, el, {displayMode: displayMode});
    } catch(e) {
      el.innerHTML = innerHTML;
      console.log(e)
    }
  });
};

(function() {
  var isLocal = /file/.test(location.protocol);

  // load katex
  if (!isLocal) {
    renderMath();
  } else {
    // on file: protocol, rewrite protocol-relative url
    // to http
    var newHref = 'http:' + $('link.katex-include').attr('href');
    var newSrc =  'http:' + $('script.katex-include').attr('src');

    $('link.katex-include').replaceWith(
      $('<link>')
        .addClass('katex-include')
        .attr({href: newHref,
               rel: 'stylesheet'
              })
    );

    var script = document.createElement('script');
    script.className = 'katex-include';
    script.onload = function() { renderMath() };
    script.src = newSrc;

    // load() doesn't seem to work using the
    // replaceWith method above
    $('script.katex-include').remove();
    $('head')[0].appendChild(script);

  }

  // load google analytics
  if (!isLocal & "probmods.org".match(location.hostname)) {
    (function(i,s,o,g,r,a,m){i['GoogleAnalyticsObject']=r;i[r]=i[r]||function(){
      (i[r].q=i[r].q||[]).push(arguments)},i[r].l=1*new Date();a=s.createElement(o),
                             m=s.getElementsByTagName(o)[0];a.async=1;a.src=g;m.parentNode.insertBefore(a,m)
                            })(window,document,'script','//www.google-analytics.com/analytics.js','ga');


    ga('create', 'UA-44328902-1', 'probmods.org');
    ga('send', 'pageview');
  }

})();

$(document).ready(function() {
  $("#references ~ p > span:first-child")
    .addClass("citekey")
    .map(function(index, el) {
      var key = $(el).text(),
          $sourceNodes = $('span[data-cites="' + key + '"]'); // find spans in the text that reference this

      $sourceNodes.map(function(j,y) {
        var $y = $(y);
        var targetNode = $(el.parentNode).clone().addClass("citation-expanded");
        targetNode.find("span").remove();

        // to handle touch events
        if (true) {
          var unclickHandler, clickHandler;

          unclickHandler = function() {
            $y.removeClass('hover').one('click', clickHandler);

            $(targetNode).removeClass("citation-animate").remove();
          };

          clickHandler = function(e) {
            $y.addClass("hover");

            $(document.body).append(targetNode);

            $(targetNode)
              .css({
                position: "absolute",
                left: e.pageX - ($(targetNode).width() * 0.5),
                top: e.pageY - ($(targetNode).height() * 0.5)
              })
              .on('click', function(e) {
                e.preventDefault();
                e.stopImmediatePropagation()
              })
              .show();

            $(targetNode)
              .addClass("citation-animate")

            setTimeout(function() {
              $(document).one('click', unclickHandler);
            }, 30);
          };


          $y.one('click', clickHandler);
        }
      });
    });
});


// headroom.js

(function() {
  var header = document.getElementById("header");
  var headroom = new Headroom(header, {
    "tolerance": 15
  });
  headroom.init();
})()
