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

var currentMPG = 25;

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
        this.attributes['speechOutput'] = 'Welcome to ' + SKILL_NAME;

        this.attributes['repromptSpeech'] = 'Ask how to get to your destination?';
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
                initMap(distSlot1,"driving").then(function(result){
                    var gasprice = 2.50;
                    var distance = parseFloat(result[0]);
                    var time = result[1];
                    var priceToTravel = (gasprice*distance)/currentMPG;
                    var carbonEmissions = (distance*18.9)/currentMPG;
                    self.emit(':tell', " Driving to " + distSlot1 + " would take " + time + ", cost " + priceToTravel.toFixed(2) + " dollars and emmit " + carbonEmissions.toFixed(2) + " pounds of carbon dioxide");
                });

            }
        }
    },
    'chooseCar' : function(){
        var storedName = this.event.request.intent.slots.nickname.value;
        //var id = this.event.session.user.userId.value;
        var id = "Global ID";
        if(storedName!=undefined && id!=undefined){
        currentMPG= getCar(id,storedName);
            this.emit(':tell',  'Selected your car');
        }else{
            this.emit(':tell',  'Could not find this car. Did you save it as something else?');
        }

    },


    'addCar': function() {
    var carMake = this.event.request.intent.slots.make.value;
    var carModel = this.event.request.intent.slots.model.value;
    var carYear = this.event.request.intent.slots.year.value;
     var storedName = this.event.request.intent.slots.nickname.value;
     //var id = this.event.system.context.user.userId.value;
     var id = "Global ID"

     if(carMake!=undefined && carModel!=undefined && carYear!=undefined && storedName!=undefined){
        addCar(id,carMake,carModel,carYear,storedName);
        // promiseMPG(carMake,carModel,carYear).then(function(x){
        //     this.emit(':tell',x);
        // });
        

        this.emit(':tell',  'Added your car');









        // getPromiseCar(carMake,carModel).then(function(car){
        //     this.emit(':tell', car);
        // });

         
    







    } else {
          this.emit(':tell',  'Please try again');
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
    getPromiseCar(userId,name).then(function(car){
         return car;
    });
}
function getPromiseCar(userId,name){
     var p1 = new Promise( (resolve, reject) => {
          userId=userId.toLowerCase();
  var query = firebase.database().ref("/Personal Cars").orderByKey();
  query.once("value").then(function(data){
    data.forEach(function(id){
      if (id.key.toLowerCase()==userId){
        var myCars = id.val();
         for (var i=0;i<myCars.length;i++){
          if (myCars[i].Name.toLowerCase()==name.toLowerCase()){
            resolve(myCars[i].MPG);
          }
         }
      }
    });
  });
    });
    return p1;
}



//Takes a user ID, car name, car attributes, and stores to firebase 
//format of store is id { name: mpg}
function addCar(id, make, model, year, name){
        promiseMPG(make,model,year).then(function(mpg){
                       addCustomCar(id,name,mpg);
                       currentMPG=mpg;
        });

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
    var count = 0;
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

 function initMap(destination,modeOfTransport) {
        var p1 = new Promise((resolve, reject) => {
        var origin1 = "Durham, NC";
        var destinationB = destination;
        googleMapsClient.distanceMatrix({
          origins: [origin1],
          destinations: [destinationB],
          mode: modeOfTransport,
          units: 'imperial',
          //avoid:"highways",
          //avoid:"tolls"
        }, 

        function(err, response) {
  if (!err) {
    resolve([response.json.rows[0].elements[0].distance.text,response.json.rows[0].elements[0].duration.text]);
  }});
        
      } );
      return p1
  }

