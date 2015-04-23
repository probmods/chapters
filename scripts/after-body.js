/* global location */

(function() {
    var isLocal = /file/.test(location.protocol);

    // load mathjax if we're in a local repository
    if (isLocal) {
        var mathjax = document.createElement('script');
        mathjax.src = "http://cdn.mathjax.org/mathjax/latest/MathJax.js?config=TeX-AMS-MML_HTMLorMML";
        document.getElementsByTagName('head')[0].appendChild(mathjax);
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
});
