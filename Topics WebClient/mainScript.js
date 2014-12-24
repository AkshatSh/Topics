var obj = {};
var svg;
var showGraph = false;
var fbLogin = false;
var name = "Please Login";
var fbToken = "INSERT TOKEN"; // Placeholder name for the facebook token
var map = {};
var mapShowing = false;
var dataPresent = false;
var topic = "";
var prevTopic = "not same";

// This is called with the results from from FB.getLoginStatus().
function signinCallback(authResult) {
  if (authResult['status']['signed_in']) {
    // Update the app to reflect a signed in user
    document.getElementById('signinButton').setAttribute('style', 'display: none');
  } else {
    // Update the app to reflect a signed out user
    console.log('Sign-in state: ' + authResult['error']);
  }
}
function statusChangeCallback(response) {
  console.log('statusChangeCallback');
  fbToken = response.authResponse.accessToken;
  console.log(fbToken);
  if (response.status === 'connected') {
      // Logged into app and Facebook.
    testAPI();
  } else if (response.status === 'not_authorized') {
      // The person is logged into Facebook, but not app.
    console.log("Please log into the app");
    fbLogin = false;
  } else {
    // The person is not logged into Facebook
    console.log("Please log into facebook");
    fbLogin = false;
  }
}

// Called when login is complete
function checkLoginState() {
  FB.getLoginStatus(function(response) {
    statusChangeCallback(response);
  });
}

window.fbAsyncInit = function() {
  FB.init({
    appId      : '1521959691386418',
    cookie     : true,  
                        
    xfbml      : true,  
    version    : 'v2.1' 
  });

  FB.getLoginStatus(function(response) {
    statusChangeCallback(response);
  });

};

// Load the SDK asynchronously
(function(d, s, id) {
  var js, fjs = d.getElementsByTagName(s)[0];
  if (d.getElementById(id)) return;
  js = d.createElement(s); js.id = id;
  js.src = "https://connect.facebook.net/en_US/sdk.js";
  fjs.parentNode.insertBefore(js, fjs);
}(document, 'script', 'facebook-jssdk'));

// Test the login by reteiving the news feed of the user
function testAPI() {
  name = 'Logging in';
  $('.name').html(name);
  console.log('Welcome!  Fetching your information.... ');
  fbLogin = true;
  FB.api('/me', function(response) {
    console.log('Successful login for: ' + response.name);
    $.get( "http://localhost:8080/api/getFBFeed/Pro&t=" + fbToken, function ( data ) {
       var tobj = JSON.parse(data);
       console.log(tobj);
    }, 'text');
    name = response.name;
    $('.name').html(name);
  });
}

$(document).ready(function(){

  // When clicking on the plot button construct a new plot with the current data
  // If there is no current data, acces node server and get new data
  $("#search").click(function(){
      if (mapShowing){
        destoryMap();
        mapShowing = false;
      }

      if (showGraph){
        plotDestroy();
        showGraph = false;
      }
      topic = $("#topic").val();
      plotByTopic(topic, "nothing");
      showGraph = true;
   });

  // When clicking on the United States button, reterive all Twiter Data for the US
  $('#us').click(function(){
    if (showGraph){
      plotDestroy();
      showGraph = false;
    }
    var tdef = $.Deferred();
    var tdef2 = $.Deferred();
    var tdef3 = $.Deferred();
    topic = $("#topic").val();
    mapUS(topic, "USA", mapShowing, tdef);
    mapShowing = true;
  });

});

// Destroy the US Map
function destoryMap(){
  mapShowing = false;
  d3.select('svg').remove();
  map.svg.remove();
  $('.datamap').remove();
  $('.datamaps-hoverover').remove();
   map = {};
}

// Destroy the plot
function plotDestroy(){
  d3.select('svg').remove();
}

// For constructing the scatter plot
// Do not create new data unless no data is present or the topic has changed
function plotByTopic(topic, loc){
  if (topic != prevTopic){
    dataPresent = false;
    prevTopic = topic;
    $('#currentTopic').html("Loading...");
  }
  if (dataPresent){
    createScatterPlot(obj.data);
  } else {
    $.get( "http://localhost:8080/api/getTweets/" + topic+ "&loc=" + loc, function ( data ) {
       obj = JSON.parse(data);
       $('#currentTopic').html("<strong>"+topic+"</strong>");
       createScatterPlot(obj.data);
       dataPresent = true;
    }, 'text');
  }
}

// For constructing 
function mapUS(topic, loc, mapShowing, tempDef){
  if (topic != prevTopic){
    dataPresent = false;
    prevTopic = topic;
    $('#currentTopic').html("Loading");
  }
  if (dataPresent){
    loadGraph(obj, mapShowing, tempDef);
  } else {
    $.get( "http://localhost:8080/api/getTweets/" + topic + "&loc=" + loc, function ( data ) {
        obj = JSON.parse(data);
        $('#currentTopic').html("<strong>"+topic+"</strong>");
        loadGraph(obj, mapShowing, tempDef);
        dataPresent = true;
    }, 'text');
  }
}

// Loads the graph as a map of the US using DataMaps
function loadGraph(data, mapShowing, tempDef){
    $('#graphArea').width($(window).width() - 20).height($(window).height() - 100);
    if (mapShowing){
      map.updateChoropleth(
            data.states
      );
      tempDef.resolve();
    } else {
      map = new Datamap({
        scope: 'usa',
          element: document.getElementById('graphArea'),
          fills: {
              HIGH: 'green',
              LOW: 'red',
              Neutral: 'gray',
              defaultFill: 'black'
          },
          data: data.states,
          geographyConfig: {
              popupTemplate: function(geo, data) {
                  return '<div class="hoverinfo">' + geo.properties.name + '</br> Sentiment Score:' +  data.SA + ' '
              }
          }  
          });
          tempDef.resolve();
  }
}

// Create the scatter plot
function createScatterPlot(data) { 
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