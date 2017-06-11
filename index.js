'use strict';

process.env.DEBUG = 'actions-on-google:*';
const App = require('actions-on-google').ApiAiApp;

const NUMBER_SEQUENCE = "number_sequence";

// [START numberRecall]
exports.numberRecall = (request, response) => {
  const app = new App({request, response});
  console.log('Request headers: ' + JSON.stringify(request.headers));
  console.log('Request body: ' + JSON.stringify(request.body));

  // Fulfill action business logic
  function intro (app) {
    let introSpeech = "Welcome to Number Recall. Try your hand at recalling a list of numbers.  We will start with one number. The length will increase by one when you correctly repeat the sequence. The length will decrease by one when you do not repeat the sequence correctly.";
    let nextRandomNumber = Math.floor(Math.random() * 9) + 1;
    app.setContext(NUMBER_SEQUENCE, 100, {"sequence": [nextRandomNumber]});
    app.ask(introSpeech + " Let's started with: "  + nextRandomNumber);
  }

  function attemptedSequence(app) {
    let numberSequence = extractToDigits(app.getArgument("NumberSequence").match(/\d+/g));
    app.ask("You said: " + numberSequence);
  }

  const actionMap = new Map();
  actionMap.set('input.welcome', intro);
  actionMap.set('input.sequence', attemptedSequence);

  app.handleRequest(actionMap);
};


function extractToDigits(listOfNumbers) {
  let reVal = [];
  for(let i = 0;i < listOfNumbers.length;i++) {
    let number = Math.abs(listOfNumbers[i]);
    if (number < 10) {
      reVal.push(number);
      continue;
    }
    let digits = [];
    while (number > 0) {
      digits.push(number % 10);
      number = Math.floor(number / 10);
    }
    reVal.push(...digits.reverse());
  }
  return reVal;
}
// [END YourAction]
