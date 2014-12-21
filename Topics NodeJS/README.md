Topics
======
Features:

Node server

Webclient

Node.js Server
======
A node.js server which queries social media sites given a specific topic and analyzes the sentiment of the result

Uses a tokenizer to seperate each of the words in the text. Then an AFINN 111 dictionary is used to search for words with a pre-set sentiment score
and summates the score for each word. When it  encounters a new word it stores it in a local object (in future version will be in a file)
and computes a score for each new word by computing the average sentiment score for each tweet with that word.

To install Node:
======
  -Create a dev account on twitter.
  
  -Replace the values in config.json with the proper keys
  
  -Run $ npm install
  
  -Now run the server with node server.js
Web client
======
The webclient uses jQuery for the dynamic elements. The graphing uses d3.js and creates a scatter plot from the data obtained from 
the node server included in this repository 
Limitations
======
Current version does not account for grammar when computing the sentiment score it also does not support training for new words.
The search parameters right now only account for one word without special characters.

Sources
=======
Sentimental node module for the AFIN 111 JSON file 

http://www.slideshare.net/faigg/tutotial-of-sentiment-analysis
 for the algorithms used in the sentiment analysis
