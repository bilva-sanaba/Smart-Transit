# Smart Transit

An Alexa Skill for making environmentally sound decisions on transportation.
Made during Hack Duke 2017

## Installation

The Skill is run through the Amazon Web Service. The AWS uses a UI to work with front end audio. This code repository represents the backend to be used with the AWS skill. To use, create a config file with the necessary firebase configuration codes and the Google Maps API Key. Zip the contents and upload this to the Lambda Manager on AWS.  
The non-standard node modules used were firebase, @google/maps, and alexa-sdk

  ```
  npm install alexa-sdk
  npm install firebase
  npm install @google/maps
```
The node modules are provided in this repository however. 

In AWS Skill Manager you will need to create three intents: costCalculator, addCar, chooseCar. 

Now the Skill is ready to use. 

## Usage
The Skill has two main features storing your cars and calculating transportation costs.
Our front end audio implementation is not public, but for each intent listed above

costCalculator: Given a spoken destination variable, Alexa will tell you different options to get to the destination from your echo location. 

addCar: Given a year, make, model, and nickname, Alexa will store your car into a firebase database and select it for future methods.

chooseCar: Given a nickname, Alexa will select the car under your id with this nickname for future methods. 

View the Sample Statements.txt file for more options. 

## Contributing

1. Fork it!
2. Create your feature branch: `git checkout -b my-new-feature`
3. Commit your changes: `git commit -am 'Add some feature'`
4. Push to the branch: `git push origin my-new-feature`
5. Submit a pull request :D

## Credits
Authors: Bilva Sanaba, Teddy Ruby, Justin Ledinh
