'use strict';

//Node modules used as well as json config file to access maps and firebase api
var Alexa = require('alexa-sdk');
var GoogleMapsAPI = require('googlemaps');
var firebase = require('firebase');
var CONFIG = require('./config.json');

//firebase api
var config = {
    apiKey: CONFIG.apiKey,
    authDomain: CONFIG.authDomain,
    databaseURL: CONFIG.databaseURL,
    projectId: CONFIG.projectId,
    storageBucket:  CONFIG.storageBucket,
    messagingSenderId: CONFIG.messagingSenderId
  };
var app =firebase.initializeApp(config);


//Google Maps API
var googleMapsClient = require('@google/maps').createClient({
  key: CONFIG.googleAPIKey
});


//Global Constants
var APP_ID = 'amzn1.ask.skill.2044e42b-de5b-4195-99e5-12294a464665'; 
var SKILL_NAME = 'Smart Transit';

//When user has no cars the global current car MPG is set to 25 MPG.
var currentMPG = 25;


//Alexa API following the handler -> execute convention
exports.handler = function(event, context, callback) {
    var alexa = Alexa.handler(event, context);
    alexa.APP_ID = APP_ID;
    alexa.registerHandlers(handlers);
    alexa.execute();
};


//Alexa handlers
var handlers = {

    //On launch
    'LaunchRequest': function () {
        this.attributes['speechOutput'] = 'Welcome to ' + SKILL_NAME;
        this.attributes['repromptSpeech'] = 'Ask how to get to your destination?';
        this.emit(':ask', this.attributes['speechOutput'], this.attributes['repromptSpeech'])
    
    },

    //Calculate and says cost from given distance
    'costCalculator': function () {
        if(this.event.request.intent.slots.destination.value!=undefined){
            //Must be stored due to HTTP request
            var self = this;
            var distSlot1 = this.event.request.intent.slots.destination.value; 
            var distSlot2 = "Duke University"; 
            if(distSlot1==undefined || distSlot2==undefined){
                self.emit('Unhandled')
            }
            else{
                initMap(distSlot1,"driving").then(function(result){
                    var toSay = calculateInfo(result);
                    self.emit(':ask', " Driving to " + distSlot1 + " would take " + toSay[1] + ", cost " + toSay[2].toFixed(2) + " dollars and emmit " + toSay[3].toFixed(2) + " pounds of carbon dioxide. On the other hand, biking would take " +toSay[4] + " hours " + toSay[5]+ " minutes and emmit 0 carbon dioxide.")          
            });
        }
    }},    

    //Chooses a car which is stored in a global session attribute
    'chooseCar' : function(){
        var storedName = this.event.request.intent.slots.nickname.value;
        //var id = this.event.session.user.userId.value;
        var id = "Global ID";
        if(storedName!=undefined && id!=undefined){
            getPromiseCar(id,storedName).then(function(mpg){
                currentMPG=mpg;
                this.emit(':ask',  'Selected your car');
                this.emit(':ask', "Where do you want to go?")
            });
        }else{
            this.emit(':ask',  'Could not find this car. Did you save it as something else?');
        }
        const shouldEndSession = false;
    },

    //Stores a car into a database associated with the echo id and an epa listing for its mpg
    'addCar': function() {
        var carMake = this.event.request.intent.slots.make.value;
        var carModel = this.event.request.intent.slots.model.value;
        var carYear = this.event.request.intent.slots.year.value;
        var storedName = this.event.request.intent.slots.nickname.value;
        //var id = this.event.system.context.user.userId.value;
        var id = "Global ID"

        if(carMake!=undefined && carModel!=undefined && carYear!=undefined && storedName!=undefined){
            addCar(id,carMake,carModel,carYear,storedName);
            this.emit(':ask',  'Added your car ' + storedName);
            this.emit(':ask', "");
        } else {
            this.emit(':ask',  'Please try again');
        }
    },  

    //Default actions for alexa key commands such as help 
    'AMAZON.HelpIntent': function() {
        this.attributes['speechOutput'] = 'You can ask a question like, what is the ' +
            'best way to get to Raleigh';
        this.attributes['repromptSpeech'] = 'You can ask a question like, what is the ' +
            'best way to get to Raleigh.';
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
        this.attributes['speechOutput'] = 'You can ask a question like, what is the ' +
            'best way to get to Raleigh';
        this.attributes['repromptSpeech'] = 'You can ask a question like, what is the ' +
            'best way to get to Raleigh';
        this.emit(':ask', this.attributes['speechOutput'], this.attributes['repromptSpeech'])
    }
};





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



function calculateInfo(result){
    var gasprice = 2.50;
    var distance = parseFloat(result[0]);
    var time = result[1];
    currentMPG=25;
    var priceToTravel = (gasprice*distance)/currentMPG;
    var carbonEmissions = (distance*18.9)/currentMPG;
    var btime = distance/15;
    var hours = Math.round(btime);
    var minutes = (btime - hours)*60
    minutes = Math.round(minutes);
    minutes = parseInt(minutes);
    hours = parseInt(hours);
    return [distance, time, priceToTravel, carbonEmissions, hours, minutes];
}

//Takes a user ID, car name, car attributes, and stores to firebase 
//format of store is id { name: mpg}
function addCar(id, make, model, year, name){
        promiseMPG(make,model,year).then(function(mpg){
            addCustomCar(id,name,mpg);
            currentMPG=mpg;
        });
}

//Takes a user ID, car name, and MPG, and stores it to firebase. Useful for non standard cars
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

//Returns a promise for the MPG of a car
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
    });
    return p1;
}

//Returns a promise for the number of cars a certain ID has
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

//Uses google maps API to calculate the distance between two locations
//given the destination and a mode of transport
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
                }
            }   
       );
    });
    return p1
}




//Example code for using the promise methods
function getMPG(make, model, year){
  promiseMPG(make,model,year).then(function(mpg){
    return mpg;
  });
}

//Example code for using the promise methods
function getCar(userId,name){
    getPromiseCar(userId,name).then(function(car){
         return car;
    });
}

