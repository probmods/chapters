/* global $, require */

// var d3 = require("d3");
// d3 = require("d3");
// var vega = require("./vega.js");
var format_result = require("./util").format_result;
var _ = require("underscore");
var typeUtils = require("./type-utils");
var listToArray = typeUtils.listToArray;
var arrayToList = typeUtils.arrayToList;

var maxBins = 20;
var titleOffset = 24;
var OneLineTitleOffset = 24;
var liveDelay = 50;

// input: list of rows. each row is itself a list
table = function(rows, title) {
    var arrayRows = listToArray(rows).map(function(cols) { return listToArray(cols) });

    sideEffects.push({type: 'table', data: arrayRows});
};


var lineifyTitle= function(title){
    var words = title.split(" ");
    var lineslist = [];
    var line= "";
    var width= 40;
    for (var i = 0; i < words.length; i++) {
       if (line.length + words[i].length + 1 > width || i == words.length - 1){
           line += " " + words[i];
           lineslist.push(line);
           line="";
       }
        else{
            line += " " + words[i];
        }
    }
    return lineslist;
};


var horz_rect_marks = {
    type: "rect",
    from: {data:"table"},
    properties: {
        enter: {
            x: {scale:"x", field:"data.value"},
            x2: {scale:"x", value:0},
            y: {scale:"y", field:"data.item"},
            height: {scale:"y", band:true}
        },
        update: {fill: {value: "steelblue"} }
    }
};

var make_spec = function(padding, width, height, data, scales, axes, marks, title) {
    var spec = {padding: padding, width: width, height: height, data: data, scales: scales, axes: axes, marks: marks};
    if (title) {
        for (var i = 0; i < title.length; i++){
            spec.marks.push({
                type: "text",
                properties: {
                    enter: {
                        x: {value: spec.width * 0.5},
                        y: {value: (title.length * -OneLineTitleOffset) + OneLineTitleOffset*0.5+(i * OneLineTitleOffset)},
                        fontSize: {value: 24},
                        text: {value: title[i]},
                        align: {value: "center"},
                        baseline: {value: "bottom"},
                        fill: {value: "#000"}
                    }
                }
            });
        }
    }
    return spec;
};

var live_render = function(n, func, spec_maker, title) {
    var el = create_and_append_result();
    var i = 0;
    var samps = [];
    var time;

    var render = function() {
        var tmp_title = (i == n) ? title : (title || "") + "("+i+"/"+n+")";
        render_vega(spec_maker(samps, tmp_title), el);
    };

    var execute = function() {
        var iterate = function() {
            i++;
            try {
                samps.push(func());
            } catch (e) {
                kill();
            }
        }
        time = Date.now();
        while (Date.now() - time < liveDelay && i < n) {
            iterate();
        }
        if (i >= n) kill();
    }

    var kill = function() {
        clearInterval(render_pid);
        clearInterval(execute_pid);
        render();
    }
    render();
    var render_pid = setInterval(render, liveDelay);
    var execute_pid = setInterval(execute, liveDelay);
}

var render_vega = function(spec, element, callback, renderer) {
    vg.parse.spec(
        spec,
        function(chart) {
            chart({el:element.get()[0], renderer:renderer || "svg"}).update();
            if (callback) callback(element);
        }
    );
}

var create_and_append_result = function() {
    var el = $("<div></div>");
    $results.append(el);
    return el;
};

function Counter(arr) {
    this.counter = {};
    this.total = 0;
    this.type = "number";
    this.min = Number.MAX_VALUE;
    this.max = Number.MIN_VALUE;
    if (arr) this.update_many(arr);
};

Counter.prototype.update = function(item) {
    if (typeof item == "number") {
        this.min = Math.min(this.min, item);
        this.max = Math.max(this.max, item);
    } else {
        this.type = "string";
    }
    var key = format_result(item);
    this.counter[key] = (this.counter[key] || 0) + 1;
    this.total++;
}

Counter.prototype.update_many = function(arr) {
    for (var i = 0; i < arr.length; i++) {this.update(arr[i]);}
}

Counter.prototype.sorted_keys = function() {
    if (this.type == "number") {
        return Object.keys(this.counter).sort(function(a,b) {return parseFloat(b)-parseFloat(a)});
    } else {
        return Object.keys(this.counter).sort();
    }
}

// Produce another counter resampled from this one, with replacement, of course.
Counter.prototype.resample = function() {
    var new_counter = {};
    for (var key in this.counter) new_counter[key] = 0;
    for (var i = 0; i < this.total; i++) {
        var k = Math.random() * this.total;
        for (var key in this.counter) {
            if (k <= this.counter[key]) {
                new_counter[key] += 1;
                break;
            } else {
                k -= this.counter[key];
            }
        }
    }
    return new_counter;
}

Counter.prototype.keys = function() {
    if (this.type == "number") {
        return Object.keys(this.counter).map(Number);
    } else {
        return Object.keys(this.counter);
    }
}

Counter.prototype.count = function(item) {
    return this.counter[item];
}

Counter.prototype.bin = function() {
    var sorted_keys = this.sorted_keys().map(Number);
    var bin_size = (this.max - this.min) / maxBins;
    var new_counter = {};
    // TODO: A better binning system
    for (var i = 0; i < sorted_keys.length; i++) {
        var bin = Math.floor((sorted_keys[i] - this.min) / bin_size);
        bin = Math.min(bin, maxBins - 1);
        new_counter[bin*bin_size + this.min] = (new_counter[bin*bin_size + this.min] || 0) + this.count(sorted_keys[i]);
    }
    for (var i=0; i<maxBins; i++) {
        new_counter[i*bin_size + this.min] = new_counter[i*bin_size + this.min] || 0;
    }
    this.counter = new_counter;
    this.binned = true;
}

// barplot (data should be a list with two elements)
// first element is items, second element is values
// e.g., (barplot '((1 2 3) (4 5 6)))
barplot = function(data, title) {
    title = title ? lineifyTitle(title) : undefined;

    var myData = listToArray(data, true);


    var items = myData[0].map(format_result);
    var values = myData[1];

    var spec_values = [];
    for (var i = 0; i < items.length; i++) {
        spec_values.push({item: items[i], value: values[i]});
    }

    var padding = {
        top: 30 + (title ? title.length * OneLineTitleOffset : 0),
        left: 20 + Math.max.apply(undefined, items.map(function(x) {return x.length;})) * 5,
        bottom: 50, right: 30};
    var height = 1 + items.length * 20;
    var width = 600 - padding.left;
    var data = [{name: "table", values: spec_values}];
    var scales = [
        {name: "x", range: "width", nice: true, domain: {data:"table", field:"data.value"}},
        {name: "y", type: "ordinal", range: "height", domain: {data:"table", field:"data.item"}, padding: 0.1}];
    var axes = [
        {type:"x", scale:"x", ticks: 10},
        {type:"y", scale:"y"}];
    var marks = [horz_rect_marks];

    render_vega(make_spec(padding, width, height, data, scales, axes, marks, title),
                create_and_append_result()
               );
};

var make_hist_spec = function(samps, title) {
    title = title ? lineifyTitle(title) : undefined;
    var counter = new Counter(listToArray(samps));
    if (counter.type == "number" && Object.keys(counter.counter).length > maxBins) counter.bin();

    var sorted_keys = counter.sorted_keys();

    if (counter.type == "number") {
        var spec_values = sorted_keys.map(function(key) {return {item: parseFloat(key), value: counter.count(key) / counter.total}});
    } else {
        var spec_values = sorted_keys.map(function(key) {return {item: key, value: counter.count(key) / counter.total}});
    }

    var padding = {
        top: 30 + (title ? title.length * OneLineTitleOffset : 0),
        left: 20 + Math.max.apply(undefined, sorted_keys.map(function(x) {return x.length;})) * 5,
        bottom: 50,
        right: 30};
    var height = 1 + sorted_keys.length * 20;
    var width = 600 - padding.left;
    var data = [{name: "table", values: spec_values}];
    var scales = [
        {name: "x", range: "width", nice: true, domain: {data:"table", field:"data.value"}},
        {name: "y", type: "ordinal", range: "height", domain: {data:"table", field:"data.item"}, padding: 0.1}];
    var axes = [{type:"x", scale:"x", ticks: 10, format: "%"}]
    var marks = [horz_rect_marks];
    if (counter.binned) {
        scales.push({name: "y_labels", range: "height", nice: true, zero: false, domain: {data:"table", field:"data.item"}, padding: 0.1})
        axes.push({type:"y", scale:"y_labels"});
    } else {
        axes.push({type:"y", scale:"y"});
    }
    return make_spec(padding, width, height, data, scales, axes, marks, title);
}

hist = function(samps, title) {
    render_vega(make_hist_spec(samps, title), create_and_append_result());
};

hist_45ci = function(samps, title) {
    var counter = new Counter(listToArray(samps));
    if (counter.type == "number" && Object.keys(counter.counter).length > maxBins) counter.bin();

    var resample_bin_means = {};
    for (var key in counter.counter) resample_bin_means[key] = [];
    for (var i = 0; i < 1000; i++) {
        var resample = counter.resample();
        for (var key in resample) {
            resample_bin_means[key].push(resample[key]);
        }
    }
    for (var key in resample_bin_means) resample_bin_means[key].sort(function(a,b) {return a-b});

    var sorted_keys = counter.sorted_keys();
    var spec_values = sorted_keys.map(
        function(key) {
            return {
                item: key,
                value: counter.count(key) / counter.total,
                lo: resample_bin_means[key][49] / counter.total,
                hi: resample_bin_means[key][949] / counter.total
            }});

    var padding = {
        top: 30 + (title ? titleOffset : 0),
        left: 20 + Math.max.apply(undefined, sorted_keys.map(function(x) {return x.toString().length;})) * 6,
        bottom: 50,
        right: 30};
    var height = 1 + sorted_keys.length * 20;
    var width = 600 - padding.left;
    var data = [{name: "table", values: spec_values}];
    var scales = [
            {name: "x", range: "width", nice: true, domain: {data:"table", field:"data.hi"}},
            {name: "y", type: "ordinal", range: "height", domain: {data:"table", field:"data.item"}, padding: 0.1}];
    var axes = [{type:"x", scale:"x", ticks: 10, format: "%"}]
    var marks = [
        horz_rect_marks,
        {
            type: "rect",
            from: {data: "table"},
            properties: {
                enter: {
                  x: {scale: "x", field: "data.lo"},
                  x2: {scale: "x", field: "data.hi"},
                  y: {scale: "y", field: "data.item", offset:8},
                  height: {value: 1}
                },
                update: {fill: {value: "black"}}
          }
        },
        {
            type: "rect",
            from: {data: "table"},
            properties: {
                enter: {
                    x: {scale: "x", field: "data.lo"},
                    y: {scale: "y", field: "data.item", offset: 3},
                    y2: {scale: "y", field: "data.item", offset: 13},
                    width: {value: 1}
                },
                update: {fill: {value: "black"}}
            }
        },
        {
            type: "rect",
            from: {data: "table"},
            properties: {
                enter: {
                    x: {scale: "x", field: "data.hi"},
                    y: {scale: "y", field: "data.item", offset: 3},
                    y2: {scale: "y", field: "data.item", offset: 13},
                    width: {value: 1}
                },
                update: {fill: {value: "black"}}
            }
        }];

    if (counter.binned) {
        scales.push({name: "y_labels", range: "height", nice: true, zero: false, domain: {data:"table", field:"data.item"}, padding: 0.1})
        axes.push({type:"y", scale:"y_labels"});
    } else {
        axes.push({type:"y", scale:"y"});
    }
    var spec = make_spec(padding, width, height, data, scales, axes, marks, title);

    render_vega(spec, create_and_append_result());
};

livehist = function(n, func, title) {
    live_render(n, func, make_hist_spec, title);
};

var make_density_spec = function(samps, title, with_hist) {
    title = title ? lineifyTitle(title) : undefined;

    // NB: scale argument is no longer used, as we now estimate the bandwidth
    function kernelDensityEstimator(counter, kernel, scale) {
        var density_values = [];
        var keys = Object.keys(counter.counter);

        // get optimal bandwidth
        // HT http://en.wikipedia.org/wiki/Kernel_density_estimation#Practical_estimation_of_the_bandwidth
        var sum = samps.reduce(function(x,y) { return x + y });
        var n = samps.length;
        var mean = sum / n;
        var sd = Math.sqrt(samps.reduce(function(acc, x) {
            return acc + Math.pow(x - mean, 2)
        }) / (n-1));

        var bandwidth = 1.06 * sd * Math.pow(n, -0.2);
        var min = counter.min;
        var max = counter.max;

      var numBins = 100;
      var binWidth = (max - min) / numBins;

        for (var i = 0; i < numBins; i++) {
          var x = min + binWidth * i;
            var kernel_sum = 0;
            for (var j = 0; j < keys.length; j++) {
                kernel_sum += kernel((x - keys[j]) / bandwidth) * counter.count(keys[j]);
            }
            density_values.push({item: x, value: kernel_sum / (n * bandwidth)});
        }
        return density_values;
    }

    function epanechnikovKernel(u) {
            return Math.abs(u) <= 1 ? .75 * (1 - u * u) : 0;
    }

    var counter = new Counter(listToArray(samps));

    var padding = {top: 30 + (title ? titleOffset : 0), left: 45, bottom: 50, right: 30};
    var data = [{name: "density", values: kernelDensityEstimator(counter, epanechnikovKernel, 3)}];
    var height = 300;
    var width = 600 - padding.left;
    var scales = [
            {name: "x_density", type: "ordinal", range: "width", domain: {data:"density", field:"data.item"}, padding: 0.1},
            {name: "x_labels", nice: true, range: "width", zero: false, domain: {data:"density", field:"data.item"}, padding: 0.1},
            {name: "y", range: "height", nice: true, domain: {data:"density", field:"data.value"}}];
    var axes = [
        {type:"x", scale:"x_labels"},
        {type:"y", scale:"y", ticks: 10, format: "%"}];
    var marks = [{
            type: "line",
            from: {data:"density"},
            properties: {
                enter: {
                    x: {scale:"x_density", field: "data.item"},
                    y: {scale:"y", field: "data.value"},
                    strokeWidth: {value: 3},
                    stroke: {value: "black"}
                }
            }
    }];

    if (with_hist) {
        if (counter.type == "number" && Object.keys(counter.counter).length > maxBins) counter.bin();
        if (counter.type == "number" && Object.keys(counter.counter).length > maxBins) counter.bin();

        var sorted_keys = counter.sorted_keys();

        if (counter.type == "number") {
            var hist_data = sorted_keys.map(function(key) {return {item: parseFloat(key), value: counter.count(key) / counter.total}});
        } else {
            var hist_data = sorted_keys.map(function(key) {return {item: key, value: counter.count(key) / counter.total}});
        }

        data.push({name: "hist", values: hist_data});
        scales.push({name: "x_hist", type: "ordinal", range: [width, 0], domain: {data:"hist", field:"data.item"}, padding: 0.1},
                    {name: "y_hist", range: "height", domain: {data:"hist", field:"data.value"}});
        marks.unshift({
            type: "rect",
            from: {data: "hist"},
            properties: {
                enter: {
                    x: {scale:"x_hist", field: "data.item"},
                    width: {scale:"x_hist", band: true},
                    y: {scale:"y_hist", field: "data.value"},
                    y2: {scale:"y_hist", value: 0}
                },
                update: {fill: {value: "steelblue"}}
            }
        })
    }

    return make_spec(padding, width, height, data, scales, axes, marks, title);
};

density = function(samps, title, with_hist) {
    render_vega(make_density_spec(samps, title, with_hist), create_and_append_result());
};

livedensity = function(n, func, title, with_hist) {
    live_render(n, func, function(samps, title) {return make_density_spec(samps, title, with_hist);}, title);
};

var make_plot_spec = function(data, title) {
    title = title ? lineifyTitle(title) : undefined;
    var padding = {
        top: 30 + (title ? title.length * OneLineTitleOffset : 0),
        left: 45,
        bottom: 50,
        right: 30};
    var data_values = listToArray(data).map(function(datum) {return {x: datum[0], y: datum[1]}});
    var data = [{name: "points", values: data_values}];
    var height = 300;
    var width = 600 - padding.left;
    var scales = [
        {name: "x", range: "width", nice: true, domain: {data:"points", field:"data.x"}},
        {name: "y", range: "height", nice: true, domain: {data:"points", field:"data.y"}},
        {name: "y_labels", reverse: true, range: "height", nice: true, domain: {data:"points", field:"data.y"}}];
    var axes = [
        {type:"x", scale:"x", offset: {scale: "y_labels", value: 0}},
        {type:"y", scale:"y", offset: {scale: "x", value: 0}}];
    var marks = [{
        type: "symbol",
        from: {data:"points"},
        properties: {
            enter: {
                x: {scale:"x", field: "data.x"},
                y: {scale:"y", field: "data.y"},
                size: {value: 50},
                fill: {value:"steelblue"},
                fillOpacity: {value: 0.8}
            }
        }
    }];
    return make_spec(padding, width, height, data, scales, axes, marks, title);
}

var make_multi_spec = function(padding, width, height, data, scales, axes, marks, title, graph_legend) {
    var spec = {padding: padding, width: width, height: height, data: data, scales: scales, axes: axes, marks: marks, legends: graph_legend};
    if (title) {
        for (var i = 0; i < title.length; i++){
            spec.marks.push({
                type: "text",
                properties: {
                    enter: {
                        x: {value: spec.width * 0.5},
                        y: {value: (title.length * -OneLineTitleOffset) + OneLineTitleOffset*0.5+(i * OneLineTitleOffset)},
                        fontSize: {value: 24},
                        text: {value: title[i]},
                        align: {value: "center"},
                        baseline: {value: "bottom"},
                        fill: {value: "#000"}
                    }
                }
            });
        }
    }
    return spec;
};
var make_multi_plot_spec = function(data, title, axis_labels) {
    var get_color_palette = function(n) {
        var colors = [
            "steelblue",
            "mediumvioletred",
            "olivedrab",
            "orange",
            "mediumpurple",
            "coral",
            "hotpink",
            "deepskyblue",
            "yellowgreen",
            "indigo",
            "slategray"
        ];
        var levels = {
            "hotpink": 0,
            "mediumvioletred": 1,
            "coral": 2,
            "orange": 3,
            "yellowgreen": 4,
            "olivedrab": 5,
            "deepskyblue": 6,
            "steelblue": 7,
            "mediumpurple": 8,
            "indigo": 9,
            "slategray" : 10
        }
        var color_palette = colors.slice(0, n).sort(function(a, b) {
            if (levels[a] < levels[b]) {
                return -1;
            }
            if (levels[a] > levels[b]) {
                return 1;
            }
            return 0;
        });
        return color_palette;
    }

    title = title ? lineifyTitle(title) : undefined;

    var padding = {
        top: 30 + (title ? title.length * OneLineTitleOffset : 0),
        left: 45,
        bottom: 50,
        right: 5};
    var color_palette = get_color_palette(listToArray(data).length);
    var data_values = function(arrdata) {
        var data_values_collector = [];
        for (i=0; i<arrdata.length; i++) {
            var subdata = listToArray(arrdata[i][1]);
            for (j=0; j<subdata.length; j++) {
                var datum = subdata[j];
                data_values_collector.push({
                    x: datum[0],
                    y: datum[1],
                    label: (color_palette.length > i) ? listToArray(arrdata[i])[0] : "other",
                    c: (color_palette.length > i) ? color_palette[i] : "black"
                });
            }
        }
        return data_values_collector;
    }(listToArray(data));
    var length_of_char = 10;
    var legend_width = length_of_char * Math.max.apply(null, data_values.map(function(x) {return x.label.length}));
    console.log(legend_width);
    var data = [{name: "points", values: data_values}];
    var height = 300;
    var width = 600 + padding.left + padding.right;
    var scales = [
            {name: "x", range: width - legend_width - padding.left - padding.right, nice: true, domain: {data:"points", field:"data.x"}},
            {name: "y", range: "height", nice: true, domain: {data:"points", field:"data.y"}},
            {name: "y_labels", reverse: true, range: "height", nice: true, domain: {data:"points", field:"data.y"}},
            {name: "color", type:"ordinal", range: {data: "points", field:"data.c"}, domain: {data: "points", field:"data.label"}}
        ];
    if (axis_labels) {
        var axes = [
                {type:"x", scale:"x", offset: {scale: "y_labels", value: 0}, title:axis_labels[0]},
                {type:"y", scale:"y", offset: {scale: "x", value: 0}, title:axis_labels[1]}
            ];
    } else {
        var axes = [
                {type:"x", scale:"x", offset: {scale: "y_labels", value: 0}},
                {type:"y", scale:"y", offset: {scale: "x", value: 0}}
            ];
    }
    var marks = [{
        type: "symbol",
        from: {data:"points"},
        properties: {
            enter: {
                x: {scale:"x", field: "data.x"},
                y: {scale:"y", field: "data.y"},
                size: {value: 50},
                fill: {scale:"color", field: "data.label"},
                fillOpacity: {value: 0.8}
            }
        }
    }];

    graph_legend = [{
        "fill": "color",
        "properties": {
            "title": {
                "fontSize": {"value": 14}
            },
            "labels": {
                "fontSize": {"value": 12}
            },
            "symbols": {
                "stroke": {"value": "transparent"}
            },
            "legend": {
                "stroke": {"value": "#ccc"},
                "strokeWidth": {"value": 1.5}
            }
        }
    }];
    return make_multi_spec(padding, width, height, data, scales, axes, marks, title, graph_legend);
}
multiscatter = function(samps, title, axis_labels) {
    render_vega(make_multi_plot_spec(samps, title, axis_labels), create_and_append_result());
}

scatter = function(samps, title, axis_labels) {
    render_vega(make_plot_spec(samps, title), create_and_append_result());
}

livescatter = function(n, func, title) {
    live_render(n, func, make_plot_spec, title);
}

var make_lineplot_spec = function(data, title) {
//    title = title ? lineifyTitle(title) : undefined;
    var spec = make_plot_spec(data, title);
    spec.marks.push({
        type: "line",
        from: {data:"points", transform: [{type: "sort", by: "data.x"}]},
        properties: {
            enter: {
                x: {scale:"x", field: "data.x"},
                y: {scale:"y", field: "data.y"},
                stroke: {value: "steelblue"},
                strokeWidth: {value: 2}
            }
        }
    });
    // spec.axes.map(function(axis) {delete axis.offset})
    return spec;
}

lineplot = function(samps, title) {
    render_vega(make_lineplot_spec(samps, title), create_and_append_result());
}

livelineplot = function(n, func, title) {
    live_render(n, func, make_lineplot_spec, title);
}

multiviz = function() {
};

var make_timeseries_spec = function(data, title) {
    title = title ? lineifyTitle(title) : undefined;
    var padding = {top: 30 + (title ? titleOffset : 0), left: 45, bottom: 50, right: 30};
    data = listToArray(data);
    var data_values = [];
    for (var i = 0; i < data.length - 1; i++) {
        data_values[i] = {x: i, y: data[i]};
    }
    var data = [{name: "points", values: data_values}];
    var height = 300;
    var width = 600 - padding.left;
    var scales = [
            {name: "x", range: "width", nice: true, domain: {data:"points", field:"data.x"}},
            {name: "y", range: "height", nice: true, zero: false,  domain: {data:"points", field:"data.y"}},
            {name: "y_labels", reverse: true, range: "height", nice: true, domain: {data:"points", field:"data.y"}}];
    var axes = [
        {type:"x", scale:"x"},
        {type:"y", scale:"y"}];
    var marks = [

        {
            type: "line",
            from: {data:"points", transform: [{type: "sort", by: "data.x"}]},
            properties: {
                enter: {
                    x: {scale:"x", field: "data.x"},
                    y: {scale:"y", field: "data.y"},
                    stroke: {value: "steelblue"},
                    strokeWidth: {value: 2}
                }
            }
        }
    ];
    return make_spec(padding, width, height, data, scales, axes, marks, title);

}

viz_45mh = function(samps, title) {
    samps = listToArray(samps, true);
    var samples = samps.map(function(x){return x[0];})
    var logprobs = samps.map(function(x){return x[1];})
    multi_spec([make_hist_spec(samples, title), make_timeseries_spec(logprobs, title + " : sample scores")]);
};

var multi_spec = function(specs) {
    var display = $('<div></div>');
    var thumbnails = $('<table align="center"><tbody><tr></tr></tbody></table>');
    var thumbnails_row = thumbnails.children().children();

    for (var i = 0; i < specs.length; i++) {
        thumbnails_row.append($('<td></td>'));
        display.append($('<div></div>').css("display", "none"));
    }
    display.children().eq(0).css("display", "inline");
    thumbnails_row.children().eq(0).css("background-color", "LightSteelBlue").addClass("multi-spec-on");
    $results.append($('<div></div>').append(display).append(thumbnails));

    for (var i = 0; i < specs.length; i++) {
        render_vega(specs[i], display.children().eq(i), function(element) {
            // When finished rendering, make the thumbnail version
            var index = element.index();
            var thumbnail = thumbnails_row.children().eq(index);
            // The element is structured like <div><div><svg><g>...
            var svg = element.children().children().clone();
            svg.attr("height", svg.attr("height") * 0.1);
            svg.attr("width", svg.attr("width") * 0.1);
            var g = svg.children().attr("transform", "scale(0.1)");
            thumbnail.append(svg);

            thumbnail.hover(
                function() {
                    $(this).css("background-color", "LightSteelBlue");
                },
                function() {
                    if (!$(this).hasClass("multi-spec-on")) $(this).css("background-color", "white");
                }
            )
            thumbnail.click(
                function() {
                    var index = $(this).index();
                    console.log(index);
                    display.children().css("display", "none");
                    display.children().eq(index).css("display", "inline");
                    thumbnails_row.children().css("background-color", "white").removeClass("multi-spec-on");
                    $(this).css("background-color", "LightSteelBlue").addClass("multi-spec-on");
                }
            )
        });
    }
};


module.exports = {
    hist: hist
}
