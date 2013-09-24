/* global $, _, console, location */

/*
 
 http://cdn.mathjax.org/mathjax/latest/MathJax.js?config=TeX-AMS-MML_HTMLorMML
 cookies-0.3.1.min.js 
 http://d3js.org/d3.v3.min.js

 viz.js
 codemirror/codemirror.js
 codemirror/scheme.js
 codemirror/matchbrackets.js

 webchurch.js

 nav.js
 injector.js
 cosmetics.js

 */

_.templateSettings = {
  interpolate: /\{\{(.+?)\}\}/g
};

(function() {
  // NB: path is relative to main content directory
  // for simplicity, don't allow // retrievals

  var mathJaxPaths = {
    file: "http://cdn.mathjax.org/mathjax/latest/MathJax.js",
    http: "http://cdn.mathjax.org/mathjax/latest/MathJax.js",
    https: "https://c328740.ssl.cf1.rackcdn.com/mathjax/latest/MathJax.js"
  };
  
  var libs = {
    mathjax: {
      paths: [mathJaxPaths[location.protocol.replace(":","")] + "?config=TeX-AMS-MML_HTMLorMML"]
    },
    periodicalupdater: {
      paths: ["scripts/jquery.periodicalupdater.js"]
    },
    webchurch: {
      //paths: ["scripts/webchurch.js"]
      paths: ["webchurch/online/webchurch.js"]
    },
    cm: {
      paths: ["codemirror/codemirror.js"]
    },
    cmscheme: {
      paths: ["codemirror/church.js"],
      parents: ["cm"]
    },
    cmbrackets: {
      paths: ["codemirror/matchbrackets.js"],
      parents: ["cm"]
    },
    cmclosebrackets: {
      paths: ["codemirror/closebrackets.js"],
      parents: ["cm"] 
    },
    cookies: {
      paths: ["scripts/cookies-0.3.1.min.js"]
    },
    injector: {
      paths: ["scripts/injector.js"],
      parents: ["webchurch", "cm", "cmscheme", "cmbrackets", "cookies", "periodicalupdater", "viz", "cmclosebrackets"]
    },
    nav: {
      paths: ["scripts/nav.js"]
    }, 
    cosmetics: {
      paths: ["scripts/cosmetics.js"]
    },
    d3: {
      paths: ["scripts/d3.v3.min.js"]
    },
    viz: {
      paths: ["scripts/viz.js"],
      parents: ["d3", "webchurch"]
    },
    phys: {
      paths: ["scripts/phys.js"],
      parents: ["box2dweb", "webchurch"]
    },
    box2dweb: {
      paths: ["scripts/Box2dWeb-2.1.a.3.js"]
    },
    plinko: {
      paths: ["scripts/plinko.js"],
      parents: ["box2dweb"]
    }
  };

  // explicitly fill in the parent, child relationships
  // in the libs object
  for (var name in libs) {
    var props = libs[name];
    props.name = name;
    
    if (typeof props.parents == "undefined") {
      props.parents = [];
    }
    props.unloadedParents = _(props.parents).clone();

    var parents = props.parents;
    
    _(parents).each(function(parentName) {
      var parent = libs[parentName];

      if (typeof parent.children == "undefined") {
        parent.children = [name];
      } else {
        parent.children.push(name);
      } 
    });

    // create a loader. on successful load,
    // remove this library from the list of
    // unloadedParents for all its children
    // if, afterward, any children don't have
    // any unloadedParents
    
    props.load = _.bind(
      function() {
        console.log("try loading " + this.name);
        // TODO: implement fall-back paths
        var path = this.paths[0],
            loadedLibName = this.name,
            children = this.children;

        if (typeof children == "undefined") {
          children = [];
        }

        var success = function(script, textStatus) {
          console.log("success loading " + loadedLibName);
          _(children).each(function(childName) {
            var childLib = libs[childName];
            childLib.unloadedParents = _(childLib.unloadedParents).without(loadedLibName);
            if (childLib.unloadedParents.length == 0) {
              console.log( "-- all dependencies for " + childName + " satisfied");
              childLib.load();
            }
          });
        };
        
        $.getScript(path)
          .done( success )
          .fail(function() {
            console.log('FAIL loading ' + loadedLibName, "via ajax, try writing to head");
            var script = document.createElement('script'); 
            script.src = path;
            script.async = true;
            script.onload = function(f) {
              console.log('loaded ' + loadedLibName + ' from head');
              success();
            };
            document.getElementsByTagName('head')[0].appendChild(script);
          
        }); 
          
      },
      props); 
  }

  $.ajaxSetup({cache: true});

  window.libs = libs;
  // load all the parentless libraries
  _(libs).each(function(props, names) {
    if (props.parents.length == 0) {
      props.load();
    }
  });
  
  
})();
