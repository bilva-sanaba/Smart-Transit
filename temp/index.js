'use strict';

var Alexa = require('alexa-sdk');
var GoogleMapsAPI = require('googlemaps');
var firebase = require('firebase');
var config = {
    apiKey: "AIzaSyDJQFS1YVoBNJNmJgk536UAqZEdA6H818c",
    authDomain: "smart-transit.firebaseapp.com",
    databaseURL: "https://smart-transit.firebaseio.com",
    projectId: "smart-transit",
    storageBucket: "",
    messagingSenderId: "174393858511"
  };
var app =firebase.initializeApp(config);



var googleMapsClient = require('@google/maps').createClient({
  key: 'AIzaSyDgpV8_8Dy_Ir5Ah-v9dc39MksxxbAUWGM'
});

var APP_ID = 'amzn1.ask.skill.2044e42b-de5b-4195-99e5-12294a464665'; //OPTIONAL: replace with 'amzn1.echo-sdk-ams.app.[your-unique-value-here]';
var SKILL_NAME = 'Smart Transit';

var publicConfig = {
    key: 'AIzaSyDgpV8_8Dy_Ir5Ah-v9dc39MksxxbAUWGM',
    stagger_time:       100, // for elevationPath
    encode_polylines:   false,
    secure:             true, // use https
    //  proxy:              'http://127.0.0.1:9999' // optional, set a proxy for HTTP requests
};

var gmAPI = new GoogleMapsAPI(publicConfig);

exports.handler = function(event, context, callback) {
    var alexa = Alexa.handler(event, context);
    alexa.APP_ID = APP_ID;
    alexa.registerHandlers(handlers);
    alexa.execute();
};

var handlers = {
    'LaunchRequest': function () {
        console.log("went in newsession function");
//        this.emit('GetDistance');
        
        // If the user either does not reply to the welcome message or says something that is not
        // understood, they will be prompted again with this text.
        this.attributes['speechOutput'] = 'Welcome to ' + SKILL_NAME + '. You can add a car to your list of vehicles or ask a question like ' + 
        'how much does it cost to get from Duke to Chapel Hill?';

        this.attributes['repromptSpeech'] = 'Ask a question like, how much does it cost to get from Duke to Chapel Hill?';
        this.emit(':ask', this.attributes['speechOutput'], this.attributes['repromptSpeech'])
    
    },
    'costCalculator': function () {
        if(this.event.request.intent.slots.destination.value!=undefined){
            var self = this;
            var distSlot1 = this.event.request.intent.slots.destination.value; 
            var distSlot2 = "Duke University"; 
            if(distSlot1==undefined || distSlot2==undefined){
                self.emit('Unhandled')
            }
            else{
                initMap(distSlot1).then(function(result){

                    self.emit(':tell', result);
                });
            }
        }
    },


    'addCar': function() {
    var carMake = this.event.request.intent.slots.make.value;
    var carModel = this.event.request.intent.slots.model.value;
    var carYear = this.event.request.intent.slots.year.value;

     if(carMake!=undefined && carModel!=undefined && carYear!=undefined){
        promiseMPG(carMake,carModel,carYear).then(function(x){
            this.emit(':tell',x);
        });

         

        // speechOutput = `Your car is the ${currentYear} ${currentMake} ${currentModel}. You can ask me ` +
        //     "your favorite color by saying, what's my favorite color?";
        // repromptText = "Thanks for adding a car! You can add another by saying add new car";







    } else {
        // speechOutput = "I'm not sure what your mean. Please try again.";
        // repromptText = "I'm not sure what you mean. Please try again.";
         this.emit(':tell',"you fucked up");
    }
}
,

    'AMAZON.HelpIntent': function() {
        console.log("went in Amazon.HelpIntent");
        // If the user either does not reply to the welcome message or says something that is not
        // understood, they will be prompted again with this text.
        this.attributes['speechOutput'] = 'You can ask a question like, what is the ' +
            'distance from Seattle to Portland? Please tell me two cities you would like to find a driving distance between.';
        this.attributes['repromptSpeech'] = 'You can ask a question like, what is the ' +
            'distance from Seattle to Portland? Please tell me two cities you would like to find a driving distance between.';
        this.emit(':ask', this.attributes['speechOutput'], this.attributes['repromptSpeech'])
    },
    'AMAZON.StopIntent': function () {
        this.emit('SessionEndedRequest');
    },
    'AMAZON.CancelIntent': function () {
        this.emit('SessionEndedRequest');
    },
    'SessionEndedRequest':function () {
        this.emit(':tell', 'Goodbye!');
    },
    'Unhandled': function() {
        this.emit(':tell', 'Sorry, I was unable to understand and process your request. Please try again.');
        this.emit('SessionEndedRequest');
    },
    'HelpMe': function() {
        console.log("went in HelpMe");
        this.attributes['speechOutput'] = 'You can ask a question like, what is the ' +
            'distance from Atlanta to Boston? Please tell me two cities you would like to find a driving distance between.';
        this.attributes['repromptSpeech'] = 'You can ask a question like, what is the ' +
            'distance from Atlanta to Boston? Please tell me two cities you would like to find a driving distance between.';
        this.emit(':ask', this.attributes['speechOutput'], this.attributes['repromptSpeech'])
    }
};









function getMPG(make, model, year){
  promiseMPG(make,model,year).then(function(mpg){
    return mpg;
  });
}


function getCar(userId,name){
  userId=userId.toLowerCase();
  var query = firebase.database().ref("/Personal Cars").orderByKey();
  query.once("value").then(function(data){
    data.forEach(function(id){

      if (id.key.toLowerCase()==userId){
        var myCars = id.val();
         for (var i=0;i<myCars.length;i++){
          if (myCars[i].Name.toLowerCase()==name.toLowerCase()){
            return myCars[i].MPG;
          }
         }
      }
    });
  });
}



//Takes a user ID, car name, car attributes, and stores to firebase 
//format of store is id { name: mpg}
function addCar(id, make, model, year, name){
        promiseMPG(make,model,year).then(function(mpg){
                       addCustomCar(id,name,mpg);
        })

}

function addCustomCar(id, name, mpg){
                       promiseNumberOfCars(id).then(function(numberOfCars){
                        if (numberOfCars!=0){
                          var setting = firebase.database().ref('/Personal Cars/' + id+"/"+numberOfCars).set({
                              Name:name,
                              MPG:mpg
                          });
                        }else{
                          var updateObject = {
                              Name: name,
                              MPG: mpg
                            };
                            var setting = firebase.database().ref('/Personal Cars/' + id+"/").set({
                              0 : updateObject
                          });
                        }
  
                        });  

}

function promiseMPG(make,model,year){
  var p1 = new Promise( (resolve, reject) => {
    var query = firebase.database().ref("/Cars").orderByKey();
  query.once("value").then(function(data) { 
    data.forEach(function(company) {
              if (make.toLowerCase()==company.key.toLowerCase()){
                var myCars= company.val();
                for (var i=0; i<myCars.length;i++){
                  if (myCars[i].Model.toLowerCase()==model.toLowerCase() && myCars[i].Year==year){
                    resolve(myCars[i].MPG);
                  }
                }
              }
            });
  });
  } );
  return p1;
}

function promiseNumberOfCars(id){
  var p1 = new Promise( (resolve, reject) => {
    var query = firebase.database().ref('/Personal Cars/' + id);
    count = 0;
    resolve(count++);
    query.once("value").then(function(data) { 
      data.forEach(function(x){
        count++;
        resolve(count++);
      });

  });

});
  return p1;
}

 function initMap(destination) {
        var p1 = new Promise((resolve, reject) => {
        var origin1 = "Durham, NC";
        var destinationB = destination;
        googleMapsClient.distanceMatrix({
          origins: [origin1],
          destinations: [destinationB],
          mode: 'driving',
          units: 'imperial',
          //avoid:"highways",
          //avoid:"tolls"
        }, 

        function(err, response) {
  if (!err) {
    resolve(response.json.rows[0].elements[0].distance.text);
  }});
        
      } );
      return p1
  }


