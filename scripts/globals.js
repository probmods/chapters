// a hack to pollute the global namespace
// with browserify packages
// needed for packages that we can't yet include
// (or maybe should not include) in the browserified bundle

d3 = require('d3');
