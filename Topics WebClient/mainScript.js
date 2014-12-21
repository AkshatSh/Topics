var obj = {};
var svg;
var showGraph = false;

$(document).ready(function(){
  $("#search").click(function(){
     var topic = $("#topic").val();
     if (showGraph){
        d3.select('svg').remove();
        showGraph = false;
     }
     searchTopic(topic);
     showGraph = true;
  });
});

function searchTopic(topic){
  $.get( "http://localhost:8080/api/getTweets/" + topic, function ( data ) {
      obj = JSON.parse(data);
      createScatterPlot(obj.data);
  }, 'text');
}

function createScatterPlot(data) {
    // just to have some space around items. 
    var margins = {
        "left": 40,
            "right": 30,
            "top": 30,
            "bottom": 30
    };

    var tip = d3.tip()
      .attr('class', 'd3-tip')
      .offset([-10, 0])
      .html(function(d) {
        
        var text = d.text;
        var newText = "";
        
        for (i = 0; i < d.text.length && i < 50; i++){
          newText += text[i];
        }

        newText += "...";
        
        return "<strong></strong> <span style='color:"+ d.color +"' class='displayBox'>" + d.oName + "</br>"+ newText +"</span>";
      })
    
    var width = $(window).width() - 20;
    var height = $(window).height() - 125;

    // Add the SVG to the graphArea on the HTML doc
    svg = d3.select("#graphArea").append("svg").attr("width", width).attr("height", height).append("g")
        .attr("transform", "translate(" + margins.left + "," + margins.top + ")");

    svg.call(tip);

    // Set the domain for the graph
    var x = d3.scale.linear()
        .domain(d3.extent(data, function (d) {
        return d.number;
    }))

    // the range maps the domain to values from 0 to the width minus the left and right margins (used to space out the visualization)
        .range([0, width - margins.left - margins.right]);

    // Set the y axis
    var y = d3.scale.linear()
        .domain(d3.extent(data, function (d) {
        return d.score;
    }))

    .range([height - margins.top - margins.bottom, 0]);

    svg.append("g").attr("class", "x axis").attr("transform", "translate(0," + y.range()[0] + ")");
    svg.append("g").attr("class", "y axis");

    // label the X axis 
    svg.append("text")
        .attr("fill", "#414241")
        .attr("text-anchor", "end")
        .attr("x", width / 2)
        .attr("y", height - 35)
        .text("Tweet Number");

    // Define the x axis and y axis
    var xAxis = d3.svg.axis().scale(x).orient("bottom").tickPadding(2);
    var yAxis = d3.svg.axis().scale(y).orient("left").tickPadding(2);

    svg.selectAll("g.y.axis").call(yAxis);
    svg.selectAll("g.x.axis").call(xAxis);

    var media = svg.selectAll("g.node").data(data, function (d) {
        return d.oName;
    });

    
    var mediaGroup = media.enter().append("g").attr("class", "node")
    .attr('transform', function (d) {
        return "translate(" + x(d.number) + "," + y(d.score) + ")";
    });
 
    mediaGroup.append("circle")
        .attr("r", 5)
        .attr("class", "dot")
        .style("fill", function (d) {
            return d.color;
    });
    mediaGroup.on('mouseover', tip.show)
                  .on('mouseout', tip.hide);
}