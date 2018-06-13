Topics
======
Features:

Node server

Webclient

Node.js Server
======
A node.js server which queries social media sites given a specific topic and analyzes the sentiment of the result

Uses a tokenizer to seperate each of the words in the text. Then an AFINN 111 dictionary is used to search for words with a pre-set sentiment score and summates the score for each word. When it  encounters a new word it stores it in a local object (in future version will be in a file) and computes a score for each new word by computing the average sentiment score for each tweet with that word.

The server also looks through each tweet and uses the geolib module to find which state the tweet is located in. In turn the server now provides the client by the total sentiment score for each state in the response and that data is used to generate the a map of the US color coding the overall sentiment scores for each state. 

To install Node Server:
======
  -Clone the repository

  -Create a dev account on twitter.
  
  -Replace the values in config.json with the proper keys
  
  -Run -$ npm install
  
  -Now run the server with node server.js

Limitations
======
Current version does not account for grammar when computing the sentiment score it also does not support training for new words.
The search parameters right now only account for one word without special characters.

For the Facebook Sign-in to work the webclient must be on a server and register with facebook in app management. 

Sources
=======
Sentimental node module for the AFIN 111 JSON file 

http://www.slideshare.net/faigg/tutotial-of-sentiment-analysis <--- for the algorithms used in the sentiment analysis

http://datamaps.github.io/ <--- DataMaps 

http://stackoverflow.com/questions/1814169/geographical-boundaries-of-states-provinces-google-maps-polygon <--- Source for the data for the states.json

