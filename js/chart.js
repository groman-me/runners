"use strict";

window.Chart = (function() {
  function Chart() {
    var self = this;

    function _initialize() {
      self.data   = null;
      self.config = {};

      var w = window,
          d = document,
          e = d.documentElement,
          g = d.getElementsByTagName('body')[0],
          docWidth = w.innerWidth || e.clientWidth || g.clientWidth,
          docHeight = w.innerHeight|| e.clientHeight|| g.clientHeight;

      var margin = {top: 10, right: 20, bottom: 20, left: 40};

      self.config.barsTopOffset  = 0; //140;

      self.config.margin         = margin;
      self.config.barHeight      = 20;
      self.config.leftLabelsWidth = 100;
      self.config.width          = docWidth - margin.left - margin.right;
      self.config.height         = docHeight - margin.top - margin.bottom;
      self.config.mainChartHeight = self.config.height - self.config.barsTopOffset - 40;
      self.config.mainChartWidth = self.config.width - self.config.leftLabelsWidth - 80;

      self.config.animationDuration = 500;
      if (w.location.host.indexOf('localhost') >= 0) {
        self.config.jsonHost = 'http://localhost:9292'
      } else {
        self.config.jsonHost = 'http://runners-groman.rhcloud.com'
      }
      d3.select(".chart")
          .attr("width", self.config.width + margin.left )
          .attr("height", self.config.height + margin.top + margin.bottom)
        .append("g")
          .attr("transform", "translate(" + margin.left + "," + (margin.top + self.config.barsTopOffset) + ")")
          .attr("id", "chartContainer");

      self.chart = d3.select("#chartContainer");
      var chartWidth  = self.config.width - self.config.leftLabelsWidth - 80;
      self.x = d3.scale.linear().range([0, chartWidth - 50]);
    }
    _initialize();
  }
  return Chart;
})();

Chart.prototype.initChart = function(data) {
  this.data = data;

  var chartHeight = this.config.barHeight * this.data.length;
  this.y = d3.scale.linear().range([0, chartHeight - 10]);

  var maxX = d3.max(this.data, function(d) { return Math.max(d.cur_val, d.prev_val); });
  this.x.domain([0, maxX]);
};

Chart.prototype.buildBars = function() {
  var config = this.config,
      x = this.x;

  //create one group for each
  var barsH = this.chart.selectAll(".ybar").
          data(this.data).
          enter()
        .append("g")
          .attr("class","ybar")
          .attr("transform", function(d, i) {
            return "translate(" + config.leftLabelsWidth + ","+ (i) * config.barHeight +")";
          }); // todo: add event handlers here

  //yBars.exit().remove();

  //create new entries
  barsH.selectAll("rect")
      .data(function(d) {return [d.prev_val, d.cur_val, d.full_name]; })
      .enter()
    .append("rect")
      .attr("class", "bar")
      .attr("width", 0)
      .attr("height", this.config.barHeight-1);

  // for labels on bars
  barsH
    .append("text")
      .attr("x", 0)
      .attr("y", this.config.barHeight-6)
      .attr("fill", "#ffffff")
      .text(function(d) { return d.cur_val; });

  // create y labels
  var yBoxes = this.chart.selectAll(".ybox")
      .data(this.data)
      .enter()
    .append("g")
      .attr("class", "ybox ylabel caption");
  yBoxes
      .append("rect")
      .attr("x", 0.5)
      .attr("y", function(d, i){return (i)*config.barHeight + 0.5;})
      .attr("width", config.leftLabelsWidth)
      .attr("height", config.barHeight);
  yBoxes
      .append("text")
      .attr("y", function(d, i){return ((i)+0.5)*config.barHeight+5;});


  this.updateBars();
};

Chart.prototype.updateBars = function (data) {
  if (data) {
    this.initChart(data);
  }

  var iTrans = 0,
      x = this.x,
      config = this.config;

	//update existing entries
  var barsH = this.chart.selectAll(".ybar");
	barsH.data(this.data);
	barsH.selectAll("rect")
      .data(function(d) {return [d.prev_val, d.cur_val]; })
      .transition()
          .duration(config.animationDuration)
          .delay(function(){ iTrans++;return 10*iTrans; })
          .attr("x",0)
          .attr("width",function(d){ return x(+d); });

	iTrans = 0;

  barsH.selectAll("text")
      .data(function(d) {return [d.cur_val]; })
      .transition()
          .duration(config.animationDuration)
          .delay(function() { iTrans++;return 10*iTrans; })
          .attr("x", function(d) {
            var pos = x(+d) -34;
            return pos > 0 ? pos : 0 ;
          })
      .text(function(d) { return Math.round((+d)*100)/100; });
	//place arrows
	setTimeout(this.addBarsArrows.call(this), config.animationDuration);
    this.updateLabels();

};

Chart.prototype.addBarsArrows = function (){
	var config = this.config,
      x = this.x,
      iTrans = 0,
      arrowDuration = config.animationDuration,
	    addPosToHide  = arrowDuration ? 0 : 100;

  d3.selectAll(".arrow").remove();

	//add small triangles to show change direction
  var barsH = this.chart.selectAll(".ybar");
	barsH.append("svg:polygon")
      .attr("points", "0,0  " +  (config.barHeight-1) +",0  " + config.barHeight/2 + ",5")
      .attr("class", function(d) {
      	if(d.prev_val > d.cur_val){
      		return "arrow leftArrow";
      	} else {
      		return "arrow rightArrow";
      	}
      })
      .attr("transform", function(d) {
        return "translate(" + (config.mainChartWidth + addPosToHide) + ",0)rotate(90)";
      });

    d3.selectAll(".arrow")
      .transition()
        .duration(arrowDuration)
        .delay(function(){iTrans++;return 20*iTrans;})
      .attr("transform", function(d) {
        if(d.prev_val > d.cur_val){
          return "translate(" + (x(+d.cur_val)+0.5) + ",0)rotate(90)";
        }
        if(d.prev_val < d.cur_val){
          return "translate(" + (x(+d.cur_val)-0.1) + ","+(config.barHeight-1)+")rotate(-90)";
        }
        if(d.prev_val == d.cur_val){
          return "translate(-10000,0)";
        }
        });

};

Chart.prototype.updateLabels = function(){
  var ybox = this.chart.selectAll(".ybox");
  ybox.data(this.data);
  ybox.selectAll("text").data(function(d) { return[d.full_name] })
      .text(function(d){ return d;} );
};

Chart.prototype.validatePeriod = function(period) {
  if (period !== "week" && period !== "month") {
    console.log("wrong period: " + period);
    return false;
  } else {
    return true;
  }
};

Chart.prototype.init = function(period) {
  var graph = this;
  if (!graph.validatePeriod(period)) return;

  d3.json(graph.config.jsonHost + "/" + period + ".json", function(rows) {
    graph.initChart(rows);
    graph.buildBars();
  });
};

Chart.prototype.update = function(period) {
  var graph = this;
  if (!graph.validatePeriod(period)) return;

  d3.json(graph.config.jsonHost + "/" + period + ".json", function(rows) {
    graph.updateBars(rows);
  });
};
