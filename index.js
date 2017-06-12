'use strict';

process.env.DEBUG = 'actions-on-google:*';
const App = require('actions-on-google').ApiAiApp;

const NUMBER_SEQUENCE = "number_sequence";
const LONGEST_SQUENCE = "longest_sequence";
const SCORE = "score";
const WON_GAME = "won_game";
const MAX_SEQUENCE_LENGTH = 30;

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
    app.setContext(SCORE, 100, {
      "maxGameLength": 1,
      "setBacks": 1,
    });
  }

  function introRestart (app) {
    let fullSequence = generateSequence(30);
    let endIndex = 1;
    app.setContext(NUMBER_SEQUENCE, 100, {"sequence": fullSequence, "endIndex": endIndex});
    app.setContext(SCORE, 100, {
      "maxGameLength": 1,
      "setBacks": 1,
    });
    app.ask("Let's start with: "  + fullSequence.slice(0,endIndex));
  }

  function attemptedSequence(app) {
    let numberSequenceUttered = app.getArgument("NumberSequence").match(/\d/g).map(num => parseInt(num));

    let endIndex = app.getContextArgument(NUMBER_SEQUENCE, "endIndex").value;
    let fullSequence = app.getContextArgument(NUMBER_SEQUENCE, "sequence").value;
    let maxGameLength = app.getContextArgument(SCORE, "maxGameLength").value;
    let setBacks = app.getContextArgument(SCORE, "setBacks").value;
    let numberSequencedAskFor = fullSequence.slice(0,endIndex);

    if (numberSequenceUttered.toString() === numberSequencedAskFor.toString()) {
      app.setContext(SCORE, 100, {
        "maxGameLength": Math.max(maxGameLength, endIndex + 1),
        "setBacks": setBacks,
      });
      if (endIndex === MAX_SEQUENCE_LENGTH) {
        app.setContext(WON_GAME,100);
        app.ask("Congratulations, you completed " + MAX_SEQUENCE_LENGTH + " digits! Do you want to start again?");
      } else {
        app.setContext(LONGEST_SQUENCE,100,{"longest_sequence": endIndex});
        endIndex++;
        app.setContext(NUMBER_SEQUENCE, 100, {"sequence": fullSequence, "endIndex": endIndex});
        app.ask("That is correct! ... " + fullSequence.slice(0,endIndex));
      }
    } else {
      app.setContext(SCORE, 100, {
        "maxGameLength": Math.max(maxGameLength, endIndex),
        "setBacks": setBacks + 1,
      });
      endIndex = endIndex === 1 ? endIndex : endIndex - 1;
      app.setContext(NUMBER_SEQUENCE, 100, {"sequence": fullSequence, "endIndex": endIndex});
      app.ask("You said: " + numberSequenceUttered + ". That is not correct. " + fullSequence.slice(0,endIndex));
    }
  }

  function endGame(app) {
    let maxGameLength = app.getContextArgument(SCORE, "maxGameLength").value;
    let setBacks = app.getContextArgument(SCORE, "setBacks").value;
    app.tell("Thanks for playing! You had " + (setBacks - 1) + " setbacks. Your longest completed sequence was " + (maxGameLength - 1) + ".");
  }

  function gameScore(app) {
    let maxGameLength = app.getContextArgument(SCORE, "maxGameLength").value;
    let setBacks = app.getContextArgument(SCORE, "setBacks").value;
    app.ask("You had " + (setBacks - 1) + " setbacks. Your longest completed sequence is " + (maxGameLength - 1) + ".");
  }

  const actionMap = new Map();
  actionMap.set('input.welcome', intro);
  actionMap.set('input.sequence', attemptedSequence);
  actionMap.set('input.restart_after_win', introRestart);
  actionMap.set('input.restart', introRestart);
  actionMap.set('input.end_game', endGame);
  actionMap.set('input.score', gameScore);

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
