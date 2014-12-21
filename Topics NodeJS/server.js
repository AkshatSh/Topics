// server.js
var express    = require('express');
var app        = express(); 				
var bodyParser = require('body-parser');
var $ = require('jquery');
var OAuth = require('OAuth');
var AFINN = require('./AFINN');
var natural = require('natural');
var config = require('./config');
var port = process.env.PORT || 8080; 
var count = 0;
var router = express.Router();
var fbBaseUrl = "https://graph.facebook.com/";
var tokenizer = new natural.WordTokenizer();
var wordnet = new natural.WordNet();
var newWords = {};
var oauth = new OAuth.OAuth(
      'https://api.twitter.com/oauth/request_token',
      'https://api.twitter.com/oauth/access_token',
      config.twitterConsumerKey,
      config.twitterConsumerSecret,
      '1.0A',
      null,
      'HMAC-SHA1'
	);

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// Log to the console each time someone access the API
router.use(function (req,res, next){
	count += 1;
	console.log('User Accessing API');

    // Count the number of times the API has been accessed
	console.log(count);
	next();
});

// Intro to API
router.get('/', function (req, res) {
	res.json({ message: 'Welcome to the Topics api!'});
});

// This route returns the name of the facebook user
router.route('/getFBName')
	.get(function (req, res) {
		var result = {};
        var fbDef = $.Deferred();
		getFacebookName(fbToken, fbBaseUrl, result);
		$.when(fbDef).done(function() {
			res.json(result);
		});
	});

// Is not currently supported
// This route returns the locations where a certain keyword is being used
router.route('/getFBLocations')
	.get(function (req, res){
        var fbLocationDef = $.Deferred();
		getLocationData(fbToken, fbBaseUrl);
		$.when(fbLocationDef).done(function() {
			res.json(lres);
		});
	});

// Gets the user feed from facebook
router.route('/getFBFeed')
	.get(function (req, res){
		var tempResult = [];
		var tempDef = $.Deferred();
		getAllUserFeed(fbToken, fbBaseUrl, tempResult, tempDef);
		$.when(tempDef).done(function(){
			res.json(tempResult);
		});
	});

// Searches for a topic on the user feed on facebook
router.route('/getFBFeed/:topic')
	.get(function (req, res){
		var tempTopic = req.params.topic;
		var tempResult = [];
		var tempDef = $.Deferred();
		getUserFeed(fbToken, fbBaseUrl, tempTopic, tempResult, tempDef);
		$.when(tempDef).done(function(){
			res.json(tempResult);
		});
	});

// Searches for a topic on Twitter
router.route('/getTweets/:topic')
	.get(function (req, res){
		var x;
		var tempDef = $.Deferred();
		var result = {min: 0, max: 0, data: []};
		var tempTopic = req.params.topic;
		getTweetByTopic(tempTopic, result, tempDef);
		$.when(tempDef).done(function(){

            // Train the words for every call
            //trainWords();
			
            res.json(result);
		}); 
	});

// Not currently supported
// Get the all the users social media results and analyze them
router.route('/getSocialMedia/:topic')
    .get(function (req, res){
        var x;
        var tempDef = $.Deferred();
        var tempDef2 = $.Deferred();
        var result = {min: 0, max: 0, data: []};
        var tempTopic = req.params.topic;
        getTweetByTopic(tempTopic, result, tempDef);
        getUserFeed(fbToken, fbBaseUrl, topic, result, tempDef2);
        $.when(tempDef, tempDef2).done(function(){
            res.json(result);
        }); 
    });

app.use(function (req, res, next) {

    // Allow all websites to connect to the API
    res.setHeader('Access-Control-Allow-Origin', '*');

    // Allow all methods
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');

    // Request headers to allow
    res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type');

    // Not sure 
    res.setHeader('Access-Control-Allow-Credentials', true);

    // Continue 
    next();
});

// all routes use /api ie: http://localhost:8080/api/getTweets/twitter will return all the tweets that talk about twitter
app.use('/api', router);


app.listen(port);
console.log('Port ' + port);

//-------------------Facebook--Data-------------------

// get the facebook name of a person
function getFacebookName(token, baseUrl, result){
	console.log("This has been called");
	try {
		$.get(baseUrl + 'me?access_token=' + token, '', function(data){
			console.log("Making request");
        	var obj = JSON.parse(data);
        	result.first = (obj["first_name"]);
        	result.last = (obj["last_name"]);
        	imDone(fbDef);
    	}, 'text');
    } catch (e){
    	console.log(e);
    }
}

// To make sure all requests are completed before the response is sent 
function imDone(a){
 	console.log("Im done");
 	a.resolve();
}

// get the user feed depending on a topic provided by the client
function getUserFeed(token, baseUrl, topic, result, tempDef){
	try {
		$.get(baseUrl + 'me/home?access_token=' + token, '', function(data){
			console.log("Making request for feed");

            // Make it more general by searching only lowercase
			topic = topic.toLowerCase();
        	var feedRes = JSON.parse(data);

            // The object which contains all the information needed by the client
            var obj = {
                            oName: "Placeholder",
                            number: result.data.length,
                            source: "facebook"
                        };

            // Iterate through the user feed and find posts that include the topic
        	for (i = 0; i < feedRes.data.length; i++){

                // Searches all posts 
        		if (feedRes.data[i].message != null){
        			var temp = feedRes.data[i].message;
        			var templ = feedRes.data[i].message.toLowerCase();
        			var id = feedRes.data[i].id;
        			if (templ.indexOf(topic) > -1){
        				var sent = sentimentAnalysis(templ);
                        obj.text = temp;
                        obj.score = sent;
                        obj.color = "#000000";
                        result.data.push(obj);
        			}
        		} else if (feedRes.data[i].story != null){

                    // Searches all story related posts
        			var temp = feedRes.data[i].story;
        			var templ = feedRes.data[i].story.toLowerCase();
        			var id = feedRes.data[i].id;
        			if (templ.indexOf(topic) > -1){
        				var sent = sentimentAnalysis(templ);
                        obj.text = temp;
                        obj.score = sent;
                        obj.color = "#000000";
                        result.data.push(obj);	
        			}
        	    }
        	}
        	imDone(tempDef);
    	}, 'text');
    } catch (e){
    	throw e;
    }
}

// returns the user feed from facebook
function getAllUserFeed(token, baseUrl, result, tempDef){
	try {
		$.get(baseUrl + 'me/home?access_token=' + token, '', function(data){
			console.log("Making request for feed");
        	var feedRes = JSON.parse(data);
        	for (i = 0; i < feedRes.data.length; i++){
        		if (feedRes.data[i].message != null){
        			var temp = feedRes.data[i].message;
        			var id = feedRes.data[i].id;
        			result.push([temp, id]);
        		} else if (feedRes.data[i].story != null){
        			var temp = feedRes.data[i].story;
        			var id = feedRes.data[i].id;
        			result.push([temp,id]);
        	    }
        	}
        	imDone(tempDef);
    	}, 'text');
    } catch (e){
    	throw e;
    }
}

// For future use not supported for this version
function getLocationData(token, baseUrl){
	console.log("attempt");
	try {
		$.get(baseUrl + 'fql/?access_token=' + token + '&q=SELECT%20location_results%20FROM%20keyword_insights%20WHERE%20term', '', function(data){
        	console.log("start");
        	var obj = JSON.parse(data);

        	console.log(obj);
        	console.log("end");
        	imDone(fbLocationDef);
    	}, 'text');
    } catch (e){
    	console.log(e);
    }
    console.log("attempt end");
}

//-------------------Twitter--Data--------------

// Search for a tweet by the topic 
function getTweetByTopic(tempTopic, result, tempDef){

    //Access Twitter API with OAuth
	oauth.get(
            // Currently only supports one word search for topic
      		'https://api.twitter.com/1.1/search/tweets.json?q=' + tempTopic + '&count=100',
      		config.twitterAPIKey, 
      		config.twitterAPISecret, 
      		function (e, data, res){
        		if (e) console.error(e);        
        		var x = JSON.parse(data);

                // Number of results
        		var i = (x.statuses.length);
                console.log(i);

                // Store the min and the max in an Array
                var minMax = [0,0];

                // Iterate through each tweet
        		for (j = 0; j < i; j++){
        			var temps = (x.statuses[j].text);

                    // Get the sentiment score for the text in the tweet
                    var sent = sentimentAnalysis(temps.toLowerCase(), minMax);

                    // The resulting object to be added to the response 
                    var obj = {
                        oName: x.statuses[j].user.name,
                        number: j + 1,
                        score: sent,
                        source: "twitter",
                        text: temps
                    };
                    result.data.push(obj);
        		}

                // Store the min and the max sentiment scores in the response
                result.min = minMax[0];
                result.max = minMax[1];

                // Assign the proper color for the data shown (Green for positive, Red for Negative, and Black for neutral)
                for (j = 0; j < result.data.length; j++){
                    if (result.data[j].score < 0){
                        result.data[j].color = "#FF0000";
                    } else if (result.data[j].score > 0){
                        result.data[j].color = "#009933";
                    } else {
                        result.data[j].color = "#000000";
                    }
                }

        		imDone(tempDef);    

      			}
			);
}   

//-------------Sentiment--Analysis--------
function sentimentAnalysis(x, minMax){
    
    // Values that can be calcualated
    var posScore = 0;
    var negScore = 0;
	
    // tokenize the text
    var tokens = tokenizer.tokenize(x);
    
    // Iterate through the tokens and add the sentiment score of each word to the corresponding score
    for (i = 0; i < tokens.length; i++){
        var word = tokens[i];
        if (AFINN[word] > 0){
            posScore += AFINN[word];
        } else if (AFINN[word] < 0){
            negScore += AFINN[word];
        }
    }

    // Calculate the total score
    var totalScore = posScore + negScore;

    // If the score is the min, make it the min 
    // If the score is the max, make it the max
    if (totalScore < minMax[0]){
        minMax[0] = totalScore;
    } else if (totalScore > minMax[1]){
        minMax[1] = totalScore;
    }

    // If the word is not found in AFINN 111 add it to the newWords array
    for (i = 0; i < tokens.length; i++){
        var word = tokens[i];
        if (AFINN[word] == null){
            if (newWords[word] == null){
                newWords[word] = { count: 1, SA: totalScore};
            } else {
                newWords[word].count++;
                newWords[word].SA += totalScore;
            }
        }
    }

    return totalScore;

}

// Feature not currently supported
// At the end of a response look at the newWords and generate a sentiment score
// The new score is based on the average sentiment score of each peice of text with the word
function trainWords(){
    for (var key in newWords){
        var wordPos = [];

        // Only look at adjectives 
        wordnet.lookup(key, function(results){
            var i = 0;
            results.forEach(function(result){
                var found = false;
                if (result.pos == "a"){
                    i++;
                }
                if (i > 0){
                    wordPos.push(i);
                    console.log(wordPos);
                }
            });
        });

        // If the word has been mentioned only two times ignore it
        if (newWords[key].count < 2){
            delete newWords[key];
        } else {

            // Compute the score for the new word
            newWords[key].SA = (newWords[key].SA/newWords[key].count);
        }
    }
}