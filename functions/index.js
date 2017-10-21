'use strict';

process.env.DEBUG = 'actions-on-google:*';
const App = require('actions-on-google').ApiAiApp;
const functions = require('firebase-functions');
const dashbot = require('dashbot')(functions.config().dashbot.key).google;

const NUMBER_SEQUENCE = "number_sequence";
const LONGEST_SQUENCE = "longest_sequence";
const SCORE = "score";
const WON_GAME = "won_game";
const MAX_SEQUENCE_LENGTH = 30;

exports.numberRecall = functions.https.onRequest((request, response) => {
    const app = new App({
        request,
        response
    });
    dashbot.configHandler(app);
    console.log('Request headers: ' + JSON.stringify(request.headers));
    console.log('Request body: ' + JSON.stringify(request.body));

    // Fulfill action business logic
    function intro(app) {
        let introSpeech = "Welcome to Number Recall. Try your hand at recalling a list of numbers.  We will start with one number. The length will increase by one when you correctly repeat the sequence. The length will decrease by one when you do not repeat the sequence correctly.";
        let fullSequence = generateSequence(30);
        app.setContext(NUMBER_SEQUENCE, 100, {
            "sequence": fullSequence,
            "endIndex": 1
        });
        app.setContext(SCORE, 100, {
            "maxGameLength": 1,
            "setBacks": 1,
        });
        app.ask("<speak>" + introSpeech + " Let's start with: " + fullSequence.slice(0, 1) + "<audio src='https://s3-us-west-2.amazonaws.com/number-recall/beep_short.ogg'></audio></speak>");
    }

    function introRestart(app) {
        let fullSequence = generateSequence(30);
        let endIndex = 1;
        app.setContext(NUMBER_SEQUENCE, 100, {
            "sequence": fullSequence,
            "endIndex": endIndex
        });
        app.setContext(SCORE, 100, {
            "maxGameLength": 1,
            "setBacks": 1,
        });
        app.ask("<speak>Let's start with: " + fullSequence.slice(0, endIndex) + "<audio src='https://s3-us-west-2.amazonaws.com/number-recall/beep_short.ogg'></audio></speak>");
    }

    function attemptedSequence(app) {
        let rawInput = app.getRawInput().toLowerCase()
            .replace(new RegExp("zero", 'g'), "0")
            .replace(new RegExp("one", 'g'), "1")
            .replace(new RegExp("two", 'g'), "2")
            .replace(new RegExp("three", 'g'), "3")
            .replace(new RegExp("four", 'g'), "4")
            .replace(new RegExp("five", 'g'), "5")
            .replace(new RegExp("six", 'g'), "6")
            .replace(new RegExp("seven", 'g'), "7")
            .replace(new RegExp("eight", 'g'), "8")
            .replace(new RegExp("nine", 'g'), "9")
            .replace(new RegExp("juane", 'g'), "1")
            .replace(new RegExp("sex", 'g'), "6")
            .replace(new RegExp("to", 'g'), "2")
            .replace(new RegExp("night", 'g'), "9")
            .replace(new RegExp("do", 'g'), "3")
            .replace(new RegExp("free", 'g'), "3")
            .replace(new RegExp("tree", 'g'), "3")
            .replace(new RegExp("pate", 'g'), "8")
            .replace(new RegExp("when's", 'g'), "1")
            .replace(new RegExp("for", 'g'), "4")
            .replace(new RegExp("v", 'g'), "5")
            .replace(new RegExp("at", 'g'), "8")
            .replace(new RegExp("hate", 'g'), "8");

        let numberSequenceUttered = rawInput.match(/\d/g).map(num => parseInt(num));

        let numberSequenceUtteredBackup = rawInput.replace("-", "2").match(/\d/g).map(num => parseInt(num));

        let endIndex = app.getContextArgument(NUMBER_SEQUENCE, "endIndex").value;
        let fullSequence = app.getContextArgument(NUMBER_SEQUENCE, "sequence").value;
        let maxGameLength = app.getContextArgument(SCORE, "maxGameLength").value;
        let setBacks = app.getContextArgument(SCORE, "setBacks").value;
        let numberSequencedAskFor = fullSequence.slice(0, endIndex);

        let matchedWithUtterenceOneOfBecauseOSpecialCase = false;
        if (numberSequenceUttered.length === 10) {
            matchedWithUtterenceOneOfBecauseOSpecialCase =
                matchWithFirstValueOffByOne(
                    numberSequenceUttered, numberSequencedAskFor);
        }

        if (numberSequenceUttered.toString() === numberSequencedAskFor.toString() ||
            numberSequenceUtteredBackup.toString() === numberSequencedAskFor.toString() ||
            matchedWithUtterenceOneOfBecauseOSpecialCase) {
            app.setContext(SCORE, 100, {
                "maxGameLength": Math.max(maxGameLength, endIndex + 1),
                "setBacks": setBacks,
            });
            if (endIndex === MAX_SEQUENCE_LENGTH) {
                app.setContext(WON_GAME, 100);
                app.ask("Congratulations, you completed " + MAX_SEQUENCE_LENGTH + " digits! Do you want to start again?");
            } else {
                app.setContext(LONGEST_SQUENCE, 100, {
                    "longest_sequence": endIndex
                });
                endIndex++;
                app.setContext(NUMBER_SEQUENCE, 100, {
                    "sequence": fullSequence,
                    "endIndex": endIndex
                });
                app.ask("<speak>That is correct! ... " + fullSequence.slice(0, endIndex) + "<audio src='https://s3-us-west-2.amazonaws.com/number-recall/beep_short.ogg'></audio></speak>");
            }
        } else {
            app.setContext(SCORE, 100, {
                "maxGameLength": Math.max(maxGameLength, endIndex),
                "setBacks": setBacks + 1,
            });
            endIndex = endIndex === 1 ? endIndex : endIndex - 1;
            app.setContext(NUMBER_SEQUENCE, 100, {
                "sequence": fullSequence,
                "endIndex": endIndex
            });
            app.ask("<speak>I heard: " + numberSequenceUttered + ". That is not correct. " + fullSequence.slice(0, endIndex) + "<audio src='https://s3-us-west-2.amazonaws.com/number-recall/beep_short.ogg'></audio></speak>");
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
        if (setBacks - 1 === 1) {
            app.ask("You had " + (setBacks - 1) + " setback. Your longest completed sequence is " + (maxGameLength - 1) + ".");
        } else {
            app.ask("You had " + (setBacks - 1) + " setbacks. Your longest completed sequence is " + (maxGameLength - 1) + ".");
        }
    }

    function repeat(app) {
        let endIndex = app.getContextArgument(NUMBER_SEQUENCE, "endIndex").value;
        let fullSequence = app.getContextArgument(NUMBER_SEQUENCE, "sequence").value;
        app.ask("<speak>" + fullSequence.slice(0, endIndex).toString() + "<audio src='https://s3-us-west-2.amazonaws.com/number-recall/beep_short.ogg'></audio></speak>");
    }

    const actionMap = new Map();
    actionMap.set('input.welcome', intro);
    actionMap.set('input.sequence', attemptedSequence);
    actionMap.set('input.restart_after_win', introRestart);
    actionMap.set('input.restart', introRestart);
    actionMap.set('input.end_game', endGame);
    actionMap.set('input.score', gameScore);
    actionMap.set('input.repeat', repeat);

    app.handleRequest(actionMap);
});


function matchWithFirstValueOffByOne(firstText, secondText) {
    let firstTextPointer = 0;
    let secondTextPointer = 0;
    if (firstText.toString() === secondText.toString()) {
        return true;
    }
    if (firstText.length - secondText.length !== 1) {
        return false;
    }
    while (firstTextPointer < firstText.length && secondTextPointer < secondText.length) {
        if (firstText[firstTextPointer] === secondText[secondTextPointer]) {
            firstTextPointer++;
            secondTextPointer++;
        } else {
            firstTextPointer++;
        }
    }
    return firstTextPointer - secondTextPointer < 2;
}

function generateSequence(size) {
    let reVal = [];
    for (let i = 0; i < size; i++) {
        reVal.push(Math.floor(Math.random() * 10));
    }
    return reVal;
}
