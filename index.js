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
    let fullSequence = generateSequence(30);
    app.setContext(NUMBER_SEQUENCE, 100, {"sequence": fullSequence, "endIndex": 1});
    app.ask(introSpeech + " Let's start with: "  + fullSequence.slice(0,1));
  }

  function attemptedSequence(app) {
    let numberSequenceUttered = app.getArgument("NumberSequence").match(/\d/g).map(num => parseInt(num));

    let endIndex = app.getContextArgument(NUMBER_SEQUENCE, "endIndex").value;
    let fullSequence = app.getContextArgument(NUMBER_SEQUENCE, "sequence").value;
    let numberSequencedAskFor = fullSequence.slice(0,endIndex);

    if (numberSequenceUttered.toString() === numberSequencedAskFor.toString()) {
      endIndex++;
      app.setContext(NUMBER_SEQUENCE, 100, {"sequence": fullSequence, "endIndex": endIndex});
      app.ask("That is correct! ... " + fullSequence.slice(0,endIndex));
    } else {
      endIndex--;
      app.setContext(NUMBER_SEQUENCE, 100, {"sequence": fullSequence, "endIndex": endIndex});
      app.ask("You said: " + numberSequenceUttered + ". That is not correct. " + fullSequence.slice(0,endIndex));
    }
  }

  const actionMap = new Map();
  actionMap.set('input.welcome', intro);
  actionMap.set('input.sequence', attemptedSequence);

  app.handleRequest(actionMap);
};

function generateSequence(size) {
  let reVal = [];
  for (let i = 0;i < size;i++) {
    reVal.push(Math.floor(Math.random() * 10));
  }
  return reVal;
}

// [END YourAction]
