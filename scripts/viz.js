/* global _, d3, format_result, listToArray */
/* format_result and listToArray come from util.js inside webchurch */

(function() {

  //var format_result = require("./format_result").format_result;
  var maxBins = 20;


  var formatPercent = d3.format(".0%");

  function erinSort(array) {
    var firstElem = array[0];
    if (typeof(firstElem) == "number") {
      return array.sort(function(a,b) {return b-a});
    }
    if (typeof(firstElem) == "string") {
      return array.sort();
    }
    if (Object.prototype.toString.call(firstElem) === '[object Array]') {
      return array;
    }
    return array;
  }

  // listXY: a list containing (1) a list of x axis labels and (2) a list containing
  // y axis values
  barplot = function(listXY, title) {
    var arrayXY = listToArray(listXY, true),
        xs = arrayXY[0].map(function(x) { return format_result(x) }),
        ys = arrayXY[1],
        maxY = Math.max.apply(this, ys),
        n = xs.length,
        counts = [],
        continuous = false;

    for(var i = 0; i < n; i++) {
      counts.push({
        value: xs[i],
        freq:  ys[i]
      });
    }
    
    return function($div) {

      var $histDiv = $("<div></div>").appendTo($div);
      var div = $histDiv[0];
      
      //TODO: make left margin vary depending on how long the names of the elements in the list are
      var margin = {top: 40, right: 20, bottom: 60, left: 60},
          width = 0.85 * $div.width() - margin.left - margin.right,
          height = 100 + (20 * counts.length) - margin.top - margin.bottom;

      var x = d3.scale.linear()
            .domain([0, maxY])
            .range([0, width]);
      
	    var y = d3.scale.ordinal()
            .domain(xs)
            .rangeRoundBands([height, 0], .1);
      
	    var yAxis = d3.svg.axis()
	          .scale(y)
	          .orient("left");


      var svg = d3.select(div).append("svg")
            .attr("class", "chart")
            .attr("width", width + margin.left + margin.right)
            .attr("height", height+ margin.top + margin.bottom)
            .style('margin-left', '0')
            .style('margin-top', '10px')
            .append("g")
            .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

      drawHist(svg, counts, xs, width, height, x, y, false);

      var xAxis = d3.svg.axis()
            .scale(x)
            .orient("bottom");
      // .tickFormat(formatPercent);

      drawAxes(svg, xAxis, yAxis, height, 0, width, "hist");
      drawTitle(svg, title, width, margin);
      
      return counts;

    };
    
  };

  hist = function(samps, title) {

    // TODO: this is a hack. we want proper conversion of data types
    var values = erinSort(listToArray(samps)),
        strvalues = values.map(function(x) {return format_result(x);}),
        n = values.length,
        counts = _(strvalues)
          .uniq()
          .map(function(val) {
            return {
              value: val,
              freq: _(strvalues).filter(function(x) {return x == val;}).length / n
            };
          });

    // console.log(strvalues);
    
    var maxFreq = Math.max.apply(Math, counts.map(function(x) {return x.freq;}));
    var continuous;
    if (counts.length > maxBins  &&  counts.filter(function(x){return isNaN(x.value)}).length == 0) {
  	  var binnedData = binData(counts, values, maxBins);
  	  counts = binnedData.counts;
  	  values = binnedData.values;
  	  maxFreq = binnedData.maxFreq;
  	  continuous = true;
    } else {
  	  continuous = false;
    }

    return function($div) {

      var $histDiv = $("<div></div>").appendTo($div);
      var div = $histDiv[0];
      
      //TODO: make left margin vary depending on how long the names of the elements in the list are
      var margin = {top: 40, right: 20, bottom: 60, left: 60},
          width = 0.85 * $div.width() - margin.left - margin.right,
          height = 100 + (20 * counts.length) - margin.top - margin.bottom;

      var x = d3.scale.linear()
            .domain([0, maxFreq])
            .range([0, width]);
      if (continuous) {
	      var yMin = Math.min.apply(Math, values);
	      var yMax = Math.max.apply(Math, values);
	      var y = d3.scale.ordinal()
              .domain(values)
              .rangeRoundBands([0, height], .1);
	      var yAxis = d3.svg.axis()
	            .scale(d3.scale.linear()
	                   .domain([yMin, yMax])
	                   .range([height, 0]))
	            .orient("left");
      } else {
	      var y = d3.scale.ordinal()
              .domain(strvalues)
              .rangeRoundBands([height, 0], .1);
	      var yAxis = d3.svg.axis()
	            .scale(y)
	            .orient("left");
      }

      var svg = d3.select(div).append("svg")
            .attr("class", "chart")
            .attr("width", width + margin.left + margin.right)
            .attr("height", height+ margin.top + margin.bottom)
            .style('margin-left', '0')
            .style('margin-top', '10px')
            .append("g")
            .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

      drawHist(svg, counts, strvalues, width, height, x, y, false);

      var xAxis = d3.svg.axis()
            .scale(x)
            .orient("bottom")
            .tickFormat(formatPercent);

      drawAxes(svg, xAxis, yAxis, height, 0, width, "hist");
      drawTitle(svg, title, width, margin)
      
      return counts;

    };

  };

  density = function(samps, title, withHist) {

    // TODO: this is a hack. we want proper conversion of data types
    var values = erinSort(listToArray(samps)),
        n = values.length,
        counts = _(values)
          .uniq()
          .map(function(val) {
            return {
              value: val,
              freq: _(values).filter(function(x) {return x == val;}).length / n
            };
          }),
        maxFreq = _(counts).chain().map(function(x) { return x.freq}).max().value();

    return function($div) {

      var $densDiv = $("<div></div>").appendTo($div);
      var div = $densDiv[0];
      
      //TODO: make left margin vary depending on how long the names of the elements in the list are
      var margin = {top: 40, right: 20, bottom: 30, left: 40},
          width = 0.8 * $div.width() - margin.left - margin.right,
          height = 300 - margin.top - margin.bottom;
      
      var svg = d3.select(div).append("svg")
            .attr("width", width + margin.left + margin.right)
            .attr("height", height+ margin.top + margin.bottom)
            .style('margin-left', '10%')
            .style('margin-top', '20px')
            .append("g")
            .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

      var xMin = Math.min.apply(Math, values);
      var xMax = Math.max.apply(Math, values);
      /*    if (withHist) {
       var binnedData = binData(counts, values);
       if (binnedData.maxVal > xMax) {
       xMax = Math.max(xMax, binnedData.maxVal);
       }
       if (binnedData.minVal < xMin) {
       xMin = Math.min(xMin, binnedData.minVal);
       }
       }*/
      
      var range = xMax - xMin;
      var x = d3.scale.linear()
            .domain([xMin, xMax])
            .range([0, width]);
      var xAxis = d3.svg.axis()
            .scale(x)
            .orient("bottom");
      
      function kernelDensityEstimator(kernel, x) {
        return function(sample) {
          return x.map(function(x) {
            return [x, d3.mean(sample, function(v) { return kernel(x - v); })];
          });
        };
      }

      function epanechnikovKernel(scale) {
        return function(u) {
          return Math.abs(u /= scale) <= 1 ? .75 * (1 - u * u) / scale : 0;
        };
      }

      var kde = kernelDensityEstimator(epanechnikovKernel(3), x.ticks(100));

      var densities = kde(values).map(function(x) {return x[1];});

      var yMax = Math.max.apply(Math, densities);
      if (withHist) {
        var binnedData = binData(counts, values, maxBins);
        if (binnedData.maxFreq > yMax) {
          yMax = Math.max(yMax, binnedData.maxFreq);
        }
      }
      
      var y = d3.scale.linear()
            .domain([0, yMax])
            .range([height, 0]);
      var yAxis = d3.svg.axis()
            .scale(y)
            .ticks(5)
            .orient("left")
            .tickFormat(d3.format("%"));

      if (withHist) {
        drawHist(svg, binnedData.counts, binnedData.values, width, height, x, y, true, yMax/binnedData.maxFreq);
      }

      //density curve
      var line = d3.svg.line()
            .x(function(d) { return x(d[0]); })
            .y(function(d) { return y(d[1]); });
      svg.append("path")
        .datum(kde(values))
        .attr("class", "line")
        .attr("d", line);

      drawAxes(svg, xAxis, yAxis, height, 0, width, "density");
      drawTitle(svg, title, width, margin)
      var data = counts;
      return data;

    };

  };

  multiviz = function(vizs) {
    var vizs = Array.prototype.slice.call(arguments);
    
    //TODO: need to rescale the target div to accomodate more items?
    return function($div) {
      for (var i = 0; i < vizs.length; i++) {
        var inserteddivset = $("<div></div>").appendTo($div)
        if (typeof vizs[i] == "function") {
          vizs[i]($(inserteddivset[0]))
        }
        else {
          runResult = format_result(vizs[i]);
          $(inserteddivset[0]).text(runResult);
        }
        
        
      }
    }
  };

  scatter = function(samples, title) {
    return plot(samples, title, false)
  };

  lineplot = function(samples, title) {
    return plot(samples, title, true);
  };

  function plot(samples, title, lines) {
    //samples is a list of pairs
    var data = listToArray(samples);
    var xVals = data.map(function(x) {return x[0];});
    var yVals = data.map(function(x) {return x[1];});
    var maxX = Math.max.apply(Math, xVals)
    var maxY = Math.max.apply(Math, yVals)
    var minX = Math.min.apply(Math, xVals)
    var minY = Math.min.apply(Math, yVals)

    return function($div) {

      var $plotDiv = $("<div></div>").appendTo($div);
      var div = $plotDiv[0];
      
      var margin = {top: 40, right: 20, bottom: 30, left: 40},
          width = 0.8 * $div.width() - margin.left - margin.right,
          height = 300 - margin.top - margin.bottom;
      
      var svg = d3.select(div).append("svg")
            .attr("width", width + margin.left + margin.right)
            .attr("height", height+ margin.top + margin.bottom)
            .style('margin-left', margin.left)
            .style('margin-top', margin.top / 2)
            .append("g")
            .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

      var x = d3.scale.linear()
            .domain([minX, maxX])
            .range([0, width]);
      var xAxis = d3.svg.axis()
            .scale(x)
            .orient("bottom");

      var y = d3.scale.linear()
            .domain([minY, maxY])
            .range([height, 0]);
      var yAxis = d3.svg.axis()
            .scale(y)
            .orient("left");

      if (0 < maxY && 0 > minY) {
        var xAxisPos = maxY / (maxY - minY) * height;
      } else if (0 > maxY) {
        var xAxisPos = 0;
      } else {
        var xAxisPos = height;
      }

      if (0 < maxX && 0 > minX) {
        var yAxisPos = width - (maxX / (maxX - minX) * width);
      } else if (0 > maxX) {
        var yAxisPos = width;
      } else {
        var yAxisPos = 0;
      }

      drawAxes(svg, xAxis, yAxis, xAxisPos, yAxisPos, width, "plot");

      if (lines) {
        var sortedData = data.sort(function(a,b) {return a[0] - b[0];})
        var previous = sortedData[0];
        for (var i=1; i<sortedData.length; i++) {
          var d = sortedData[i];
          svg.append("line")
            .attr("class", "lineplot")
            .attr("x1", x(previous[0]))
            .attr("x2", x(d[0]))
            .attr("y1", y(previous[1]))
            .attr("y2", y(d[1]));
          previous = d;
        }
      }

      svg.selectAll("circle").data(data)
        .enter()
        .append("circle")
        .attr("class", "point")
        .attr("cx", function(d) {return x(d[0]);})
        .attr("cy", function(d) {return y(d[1]);})
        .attr("r", 3);

      drawTitle(svg, title, width, margin);
      return data;

    };
  }

  function binData(counts, values, maxBins) {
    function approxEqual(a, b) {
      var eps=0.000001;
      return Math.abs(a-b) < eps;
    }
    var binnedValues;
    var binnedCounts;
    var xMin = Math.min.apply(Math, values);
    var xMax = Math.max.apply(Math, values);
    function getBinValue(binNumber) {
      return ((binNumber + 0.5) * (xMax - xMin) / maxBins) + xMin;
    }
    if (counts.length > maxBins) {
      binnedValues = values.map(function(val) {
        if (approxEqual(val, xMax)) {
          binNumber = maxBins - 1;
        } else {
          var fractionOfRange = (val - xMin) / (xMax - xMin);
          var binNumber = Math.floor(fractionOfRange * maxBins);
        }
        return getBinValue(binNumber);
      });
      var n = binnedValues.length;
      var binnedCounts = _(binnedValues)
            .uniq()
            .map(function(val) {
              return {
                value: val,
                freq: _(binnedValues).filter(function(x) {
                  return x == val;
                }).length / n
              };
            });
      for (var i=0; i<maxBins; i++) {
        var binValue = getBinValue(i);
        if ((binnedValues).filter(function(x) {return approxEqual(x, binValue);}).length == 0) {
          binnedCounts.push({value: binValue, freq: 0});
        }
      }
    } else {
      binnedValues = values;
      binnedCounts = counts;
    }
    binnedCounts = binnedCounts.sort(function(a, b) {
      return a.value - b.value;
    })
    var frequencies = binnedCounts.map(function(x) {return x.freq;});
    var maxFreq = Math.max.apply(Math, frequencies);
    var minVal = Math.min.apply(Math, binnedValues);
    var maxVal = Math.max.apply(Math, binnedValues);
    return {values: binnedValues, counts: binnedCounts, maxFreq: maxFreq,
            minVal: minVal, maxVal: maxVal};
  }

  function drawHist(svg, binnedCounts, binnedValues, width, height, x, y, vertical, scale) {

    if (vertical) {
      function getFreq(d) {
        if (d.freq) {
          return d.freq;
        } else {
          return 0;
        }
      }
      var histX = d3.scale.ordinal()
            .domain(binnedCounts.map(function(x) {return x.value;}))
            .rangeRoundBands([0, width], .1);
      svg.selectAll(".bar")
        .data(binnedCounts)
        .enter().append("rect")
        .attr("class", "bar")
        .attr("fill", "none")
        .attr("y", function(d) {return y(getFreq(d)*scale);})
        .attr("x", function(d) {return histX(d.value);})
        .attr("height", function(d) { return height - y(getFreq(d)*scale);})
        .attr("width", histX.rangeBand());
    } else {
      svg.selectAll(".bar")
        .data(binnedCounts)
        .enter().append("rect")
        .attr("class", "bar")
        .attr("x", 0)
        .attr("y", function(d) {return y(d.value);})
        .attr("stroke","none")
        .attr("width", function(d) { return x(d.freq); })
        .attr("height", y.rangeBand());
    }
  }

  function drawTitle(svg, title, width, margin) {
    svg.append("text")
      .attr("x", width / 2)             
      .attr("y", 0 - (margin.top / 2))
      .attr("text-anchor", "middle")  
      .style("font-size", "24px") 
      .attr("stroke", "none") 
      .attr("fill", "black")
      .text(title);
  }

  function drawAxes(svg, xAxis, yAxis, xAxisPos, yAxisPos, width, type) {
    var xAxisGroup = svg.append("g")
          .attr("class", "x axis")
          .attr("transform", "translate(0," + xAxisPos + ")")
          .call(xAxis);

    if (type == "hist") {
      xAxisGroup.attr("class", "x axis")
        .append("text")
        .text("Frequency")
        .attr("dy", "3em")
        .attr("x", (width/2))
        .attr("text-anchor", "middle");
    }

    svg.append("g")
      .attr("class", "y axis")
      .attr("transform", "translate(" + yAxisPos + ",0)")
      .call(yAxis);
  }

})();
