/* global _ */

var format_result = require("./format_result").format_result;

var listToArray = function(xs) {
  var pair = xs;
  var kar = xs[0];
  var a = [];

  while(pair.length == 2) {
    var nextVal = pair[0];
    /*
    if (Object.prototype.toString.call( nextVal ) === '[object Array]') {
      nextVal = listToArray(nextVal);
    } */
    a.push(nextVal);
    pair = pair[1];
  }
  return a;
};

var formatPercent = d3.format(".0%");

function erinSort(array) {
  var firstElem = array[0];
  if (typeof(firstElem) == "number") {
    return array.sort(function(a,b) {return a-b});
  }
  if (typeof(firstElem) == "string") {
    return array.sort();
  }
  if (Object.prototype.toString.call(firstElem) === '[object Array]') {
    return array;
  }
  return array;
}

_hist = function(samps, title) {

  // TODO: this is a hack. we want proper conversion of data types
  var values = erinSort(listToArray(samps)).map(function(x) {return format_result(x);}),
      strvalues = values,//values.map(function(x) {return format_result(x);}),
      n = values.length,
      counts = _(strvalues)
        .uniq()
        .map(function(val) {
          return {
            value: val,
            freq: _(strvalues).filter(function(x) {return x == val;}).length / n
          };
        }),
      maxFreq = _(counts).chain().map(function(x) { return x.freq}).max().value();

  var binnedData = binData(counts, values);

  return function($div) {

    var $histDiv = $("<div></div>").appendTo($div);
    var div = $histDiv[0];
    
    //TODO: make left margin vary depending on how long the names of the elements in the list are
    var margin = {top: 40, right: 20, bottom: 60, left: 60},
        width = 0.85 * $div.width() - margin.left - margin.right,
        height = 100 + (14 * _(binnedData.values).uniq().length) - margin.top - margin.bottom;

    var x = d3.scale.linear()
          .domain([0, binnedData.maxFreq])
          .range([0, width]);
        
    var y = d3.scale.ordinal()
            .domain(binnedData.values)
            .rangeRoundBands([height, 0], .1);
    var yMin = Math.min.apply(Math, values);
    var yMax = Math.max.apply(Math, values);
    var yAxis = d3.svg.axis()
        .scale(d3.scale.linear()
                       .domain([yMin, yMax])
                       .range([height, 0]))
          //.scale(y)
          .orient("left");

    var xAxis = d3.svg.axis()
                  .scale(x)
                  .orient("bottom")
                  .tickFormat(formatPercent);

    var svg = d3.select(div).append("svg")
          .attr("class", "chart")
          .attr("width", width + margin.left + margin.right)
          .attr("height", height+ margin.top + margin.bottom)
          .style('margin-left', '0')
          .style('margin-top', '10px')
          .append("g")
          .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    svg.append("g")
      .attr("class", "x axis")
      .attr("transform", "translate(0," + height + ")")
      .call(xAxis)
      .append("text")
      .text("Frequency")
      .attr("dy", "3em")
      .attr("x", (width/2))
      .attr("text-anchor", "middle");

    svg.append("g")
      .attr("class", "y axis")
      .call(yAxis);

    drawHist(svg, binnedData.counts, binnedData.values, width, height, x, y, false, yMax);
    
    svg.append("text")
        .attr("x", (width / 2))             
        .attr("y", 0 - (margin.top / 2))
        .attr("text-anchor", "middle")  
        .style("font-size", "24px") 
        .attr("stroke", "none") 
        .attr("fill", "black")
        .text(title);
        
    return binnedData.counts;

  };

};

_density = function(samps, title, withHist) {

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
      var binnedData = binData(counts, values);
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
      console.log(yMax);
      console.log(binnedData.maxFreq);
      drawHist(svg, binnedData.counts, binnedData.values, width, height, x, y, true, (yMax/binnedData.maxFreq));
    }

    //density curve
    var line = d3.svg.line()
        .x(function(d) { return x(d[0]); })
        .y(function(d) { return y(d[1]); });
    svg.append("path")
        .datum(kde(values))
        .attr("class", "line")
        .attr("d", line);

    svg.append("g")
        .attr("class", "x axis")
        .attr("transform", "translate(0," + height + ")")
        .call(xAxis);
    
    svg.append("g")
        .attr("class", "y axis")
        .call(yAxis);
    
    svg.append("text")
        .attr("x", (width / 2))             
        .attr("y", 0 - (margin.top / 2))
        .attr("text-anchor", "middle")  
        .style("font-size", "24px") 
        .attr("stroke", "none") 
        .attr("fill", "black")
        .text(title);
 
    var data = counts;
    return data;

  };

};

function binData(counts, values) {
  function approxEqual(a, b, eps=0.000001) {
    return Math.abs(a-b) < eps;
  }
  var maxBins = 20;
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
    console.log(binnedCounts.length);
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
      //.attr("y", getY)
      .attr("y", function(d) {return y(getFreq(d)*scale);})
      .attr("x", function(d) {return histX(d.value);})
      //.attr("height", function(d) { console.log(d.freq); console.log(getY(d)); return height - getY(d);})
      //.attr("height", function(d) { return height - y(getFreq(d)*scale);})
      .attr("height", function(d) { return height - y(getFreq(d));})
      .attr("width", histX.rangeBand());
  } else {
    var histY = d3.scale.ordinal()
                .domain(binnedCounts.map(function(x) {return x.value;}))
                .rangeRoundBands([height, 0], .1);
    svg.selectAll(".bar")
    .data(binnedCounts)
    .enter().append("rect")
    .attr("class", "bar")
    .attr("x", 0)
    .attr("y", function(d) {return histY(d.value);})
    .attr("stroke","none")
    .attr("width", function(d) { return x(d.freq); })
    .attr("height", histY.rangeBand());
  }
}

_multiviz = function(vizs) {
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
}
