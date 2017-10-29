//var firebase = require("firebase");

//var config = {
//    apiKey: "AIzaSyDJQFS1YVoBNJNmJgk536UAqZEdA6H818c",
//    authDomain: "smart-transit.firebaseapp.com",
//    databaseURL: "https://smart-transit.firebaseio.com",
//    projectId: "smart-transit",
//    storageBucket: "",
//    messagingSenderId: "174393858511"
//  };
//  firebase.initializeApp(config);

function location(){
  var xhttp = new XMLHttpRequest();
  xhttp.onreadystatechange = function() {
    if (this.readyState == 4 && this.status == 200) {
      param = JSON.parse(this.responseText);
      $.ajax({
        url: "https:maps.googleapis.com/maps/api/distancematrix/json?units=imperial&origins=place_id:ChIJfzLrAbLmrIkRjaMc7lUWH7I&destinations=New+York+City,NY&key=AIzaSyCyFRE4TJ1V0lUBGEQM_1FCzR7Mrxmxnk4",
        success: function(response) {
          console.log(response);
        }
      });
    }
  };
  xhttp.open("GET", true);
  xhttp.send();
}




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


