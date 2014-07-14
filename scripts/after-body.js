/* global location */

(function() {
    var isLocal = /file/.test(location.protocol);

    // load mathjax
    var mathjax = document.createElement('script'); 
    var mjPath = "//cdn.mathjax.org/mathjax/latest/MathJax.js?config=TeX-AMS-MML_HTMLorMML";
    mathjax.src = (isLocal ? "http:" : "") + mjPath;

    document.getElementsByTagName('head')[0].appendChild(mathjax); 

    // load google analytics
    if (!isLocal & "probmods.org".match(location.hostname)) {
    (function(i,s,o,g,r,a,m){i['GoogleAnalyticsObject']=r;i[r]=i[r]||function(){
        (i[r].q=i[r].q||[]).push(arguments)},i[r].l=1*new Date();a=s.createElement(o),
                             m=s.getElementsByTagName(o)[0];a.async=1;a.src=g;m.parentNode.insertBefore(a,m)
                            })(window,document,'script','//www.google-analytics.com/analytics.js','ga');


    ga('create', 'UA-44328902-1', 'probmods.org');
    ga('send', 'pageview');
    }

})()
