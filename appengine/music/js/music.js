/**
 * Blockly Games: Music
 *
 * Copyright 2016 Google Inc.
 * https://github.com/google/blockly-games
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

/**
 * @fileoverview JavaScript for Blockly's Music application.
 * @author fraser@google.com (Neil Fraser)
 */
'use strict';

goog.provide('Music');

goog.require('BlocklyDialogs');
goog.require('BlocklyGames');
goog.require('BlocklyInterface');
goog.require('Music.Blocks');
goog.require('Music.soy');
goog.require('Slider');


BlocklyGames.NAME = 'music';

/**
 * Go to the next level.
 */
BlocklyInterface.nextLevel = function() {
  if (BlocklyGames.LEVEL < BlocklyGames.MAX_LEVEL) {
    window.location = window.location.protocol + '//' +
        window.location.host + window.location.pathname +
        '?lang=' + BlocklyGames.LANG + '&level=' + (BlocklyGames.LEVEL + 1);
  } else {
    BlocklyInterface.indexPage();
  }
};

Music.HEIGHT = 400;
Music.WIDTH = 400;

/**
 * PID of animation task currently executing.
 * @type !Array.<number>
 */
Music.pidList = [];

/**
 * Should the music be drawn?
 * @type boolean
 */
Music.visible = true;

/**
 * Is the drawing ready to be submitted to Reddit?
 * @type boolean
 */
Music.canSubmit = false;

/**
 * Initialize Blockly and the music.  Called on page load.
 */
Music.init = function() {
  // Render the Soy template.
  document.body.innerHTML = Music.soy.start({}, null,
      {lang: BlocklyGames.LANG,
       level: BlocklyGames.LEVEL,
       maxLevel: BlocklyGames.MAX_LEVEL,
       html: BlocklyGames.IS_HTML});

  BlocklyInterface.init();

  var rtl = BlocklyGames.isRtl();
  var blocklyDiv = document.getElementById('blockly');
  var visualization = document.getElementById('visualization');
  var onresize = function(e) {
    var top = visualization.offsetTop;
    blocklyDiv.style.top = Math.max(10, top - window.pageYOffset) + 'px';
    blocklyDiv.style.left = rtl ? '10px' : '420px';
    blocklyDiv.style.width = (window.innerWidth - 440) + 'px';
  };
  window.addEventListener('scroll', function() {
      onresize();
      Blockly.fireUiEvent(window, 'resize');
    });
  window.addEventListener('resize', onresize);
  onresize();

    
  var toolbox = document.getElementById('toolbox');
  BlocklyGames.workspace = Blockly.inject('blockly',
      {'media': 'third-party/blockly/media/',
       'rtl': rtl,
       'toolbox': toolbox,
       'trashcan': true,
       'zoom': BlocklyGames.LEVEL == BlocklyGames.MAX_LEVEL ?
           {'controls': true, 'wheel': true} : null});
  // Prevent collisions with user-defined functions or variables.
  Blockly.JavaScript.addReservedWords('moveForward,moveBackward,' +
      'turnRight,turnLeft,penUp,penDown,penWidth,penColour,' +
      'hideMusic,showMusic,print,font');

  if (document.getElementById('submitButton')) {
    BlocklyGames.bindClick('submitButton', Music.submitToReddit);
  }

  // Initialize the slider.
  var sliderSvg = document.getElementById('slider');
  Music.speedSlider = new Slider(10, 35, 130, sliderSvg);

  if (BlocklyGames.LEVEL == BlocklyGames.MAX_LEVEL) {
    var defaultXml =
        '<xml>' +
        '</xml>';
  } else {
    var defaultXml =
        '<xml>' +
        '</xml>';
  }
  
  BlocklyInterface.loadBlocks(defaultXml, true);

  Music.ctxDisplay = document.getElementById('display').getContext('2d');
  Music.ctxAnswer = document.getElementById('answer').getContext('2d');
  Music.ctxScratch = document.getElementById('scratch').getContext('2d');
  Music.drawAnswer();
  Music.reset();

  BlocklyGames.bindClick('runButton', Music.runButtonClick);
  BlocklyGames.bindClick('resetButton', Music.resetButtonClick);

  // Preload the win sound.
  BlocklyGames.workspace.loadAudio_(['music/win.mp3', 'music/win.ogg'],
      'win');
  // Lazy-load the JavaScript interpreter.
  setTimeout(BlocklyInterface.importInterpreter, 1);
  // Lazy-load the syntax-highlighting.
  setTimeout(BlocklyInterface.importPrettify, 1);

  BlocklyGames.bindClick('helpButton', Music.showHelp);
  if (location.hash.length < 2 &&
      !BlocklyGames.loadFromLocalStorage(BlocklyGames.NAME,
                                         BlocklyGames.LEVEL)) {
    setTimeout(Music.showHelp, 1000);
    if (BlocklyGames.LEVEL == 9) {
      setTimeout(BlocklyDialogs.abortOffer, 5 * 60 * 1000);
    }
  }
  var assetsPath = "third-party/midi-js/examples/soundfont/acoustic_grand_piano-mp3/";
  
  var sounds = [
    {src: "G3.mp3", id: "55"},
    {src: "Ab3.mp3", id: "56"},
    {src: "A3.mp3", id: "57"},
    {src: "Bb3.mp3", id: "58"},
    {src: "B3.mp3", id: "59"},
    {src: "C4.mp3", id: "60"},
    {src: "Db4.mp3", id: "61"},
    {src: "D4.mp3", id: "62"},
    {src: "Eb4.mp3", id: "63"},
    {src: "E4.mp3", id: "64"},
    {src: "F4.mp3", id: "65"},
    {src: "Gb4.mp3", id: "66"},
    {src: "G4.mp3", id: "67"},
    {src: "Ab4.mp3", id: "68"},
    {src: "A4.mp3", id: "69"}
  ];

  createjs.Sound.registerSounds(sounds, assetsPath);
  
};

if (window.location.pathname.match(/readonly.html$/)) {
  window.addEventListener('load', function() {
    BlocklyInterface.initReadonly(Music.soy.readonly());
  });
} else {
  window.addEventListener('load', Music.init);
}

/**
 * Show the help pop-up.
 */
Music.showHelp = function() {
  var help = document.getElementById('help');
  var button = document.getElementById('helpButton');
  var style = {
    width: '50%',
    left: '25%',
    top: '5em'
  };

  if (BlocklyGames.LEVEL == 3) {
    var xml = '<xml><block type="music_colour_internal" x="5" y="10">' +
        '<field name="COLOUR">#ffff00</field></block></xml>';
    BlocklyInterface.injectReadonly('sampleHelp3', xml);
  } else if (BlocklyGames.LEVEL == 4) {
    var xml = '<xml><block type="music_pen" x="5" y="10"></block></xml>';
    BlocklyInterface.injectReadonly('sampleHelp4', xml);
  }

  BlocklyDialogs.showDialog(help, button, true, true, style, Music.hideHelp);
  BlocklyDialogs.startDialogKeyDown();
};

/**
 * Hide the help pop-up.
 */
Music.hideHelp = function() {
  BlocklyDialogs.stopDialogKeyDown();
  if (BlocklyGames.LEVEL == 1) {
    // Previous apps did not have categories.
    // If the user doesn't find them, point them out.
    Music.watchCategories_();
    setTimeout(Music.showCategoryHelp, 5000);
  }
};

/**
 * Show the help pop-up to encourage clicking on the toolbox categories.
 */
Music.showCategoryHelp = function() {
  if (Music.categoryClicked_ || BlocklyDialogs.isDialogVisible_) {
    return;
  }
  var help = document.getElementById('helpToolbox');
  var style = {
    width: '25%',
    left: '525px',
    top: '3.3em'
  };
  var origin = document.getElementById(':0');  // Toolbox's tree root.
  BlocklyDialogs.showDialog(help, origin, true, false, style, null);
};


/**
 * Flag indicating if a toolbox categoriy has been clicked yet.
 * Level one only.
 * @private
 */
Music.categoryClicked_ = false;

/**
 * Monitor to see if the user finds the categories in level one.
 * @private
 */
Music.watchCategories_ = function() {
  if (BlocklyGames.workspace.toolbox_.flyout_.isVisible()) {
    Music.categoryClicked_ = true;
    BlocklyDialogs.hideDialog(false);
  }
  if (!Music.categoryClicked_) {
    setTimeout(Music.watchCategories_, 100);
  }
};

/**
 * On startup draw the expected answer and save it to the answer canvas.
 */
Music.drawAnswer = function() {
  Music.reset();
  Music.ctxAnswer.globalCompositeOperation = 'copy';
  Music.ctxAnswer.drawImage(Music.ctxScratch.canvas, 0, 0);
  Music.ctxAnswer.globalCompositeOperation = 'source-over';
};

/**
 * Reset the music to the start position, clear the display, and kill any
 * pending tasks.
 */
Music.reset = function() {
  // Clear the canvas.
  Music.ctxScratch.canvas.width = Music.ctxScratch.canvas.width;
  Music.ctxScratch.strokeStyle = '#ffffff';
  Music.ctxScratch.fillStyle = '#ffffff';
  Music.ctxScratch.lineWidth = 5;
  Music.ctxScratch.lineCap = 'round';
  Music.ctxScratch.font = 'normal 18pt Arial';
  Music.display();

  // Kill all tasks.
  for (var x = 0; x < Music.pidList.length; x++) {
    window.clearTimeout(Music.pidList[x]);
  }
  Music.pidList.length = 0;
  Music.startId = 0;
};

/**
 * Copy the scratch canvas to the display canvas. Add a music marker.
 */
Music.display = function() {
  // Clear the display with black.
  Music.ctxDisplay.beginPath();
  Music.ctxDisplay.rect(0, 0,
      Music.ctxDisplay.canvas.width, Music.ctxDisplay.canvas.height);
  Music.ctxDisplay.fillStyle = '#000000';
  Music.ctxDisplay.fill();

  // Draw the answer layer.
  Music.ctxDisplay.globalCompositeOperation = 'source-over';
  Music.ctxDisplay.globalAlpha = 0.2;
  Music.ctxDisplay.drawImage(Music.ctxAnswer.canvas, 0, 0);
  Music.ctxDisplay.globalAlpha = 1;

  // Draw the user layer.
  Music.ctxDisplay.globalCompositeOperation = 'source-over';
  Music.ctxDisplay.drawImage(Music.ctxScratch.canvas, 0, 0);

};

/**
 * Click the run button.  Start the program.
 * @param {!Event} e Mouse or touch event.
 */
Music.runButtonClick = function(e) {
  // Prevent double-clicks or double-taps.
  if (BlocklyInterface.eventSpam(e)) {
    return;
  }
  var runButton = document.getElementById('runButton');
  var resetButton = document.getElementById('resetButton');
  // Ensure that Reset button is at least as wide as Run button.
  if (!resetButton.style.minWidth) {
    resetButton.style.minWidth = runButton.offsetWidth + 'px';
  }
  runButton.style.display = 'none';
  resetButton.style.display = 'inline';
  document.getElementById('spinner').style.visibility = 'visible';
  BlocklyGames.workspace.traceOn(true);
  Music.execute();
};

/**
 * Click the reset button.  Reset the Music.
 * @param {!Event} e Mouse or touch event.
 */
Music.resetButtonClick = function(e) {
  // Prevent double-clicks or double-taps.
  if (BlocklyInterface.eventSpam(e)) {
    return;
  }
  var runButton = document.getElementById('runButton');
  runButton.style.display = 'inline';
  document.getElementById('resetButton').style.display = 'none';
  document.getElementById('spinner').style.visibility = 'hidden';
  BlocklyGames.workspace.traceOn(false);
  Music.reset();

  // Image cleared; prevent user from submitting to Reddit.
  Music.canSubmit = false;
};

/**
 * Inject the Music API into a JavaScript interpreter.
 * @param {!Object} scope Global scope.
 * @param {!Interpreter} interpreter The JS interpreter.
 */
Music.initInterpreter = function(interpreter, scope) {
  // API
  var wrapper;
  wrapper = function(duration, pitch, id) {
    Music.play(duration.valueOf(), pitch.toString(), id.toString(), interpreter);
  };
  interpreter.setProperty(scope, 'play',
      interpreter.createNativeFunction(wrapper));
  wrapper = function(duration, id) {
    Music.rest(duration.valueOf(), id.toString(), interpreter);
  };
  interpreter.setProperty(scope, 'rest',
      interpreter.createNativeFunction(wrapper));

  wrapper = function(instrument, id) {
    Music.setInstrument(instrument.valueOf(), id.toString());
  };
  interpreter.setProperty(scope, 'setInstrument',
      interpreter.createNativeFunction(wrapper));
};

/**
 * Execute the user's code.  Heaven help us...
 */
Music.startId = 0;

Music.execute = function() {
  if (!('Interpreter' in window)) {
    // Interpreter lazy loads and hasn't arrived yet.  Try again later.
    setTimeout(Music.execute, 250);
    return;
  }
  
  Music.reset();
  var code = Blockly.JavaScript.workspaceToCode(BlocklyGames.workspace);
  //alert(code);
  for(var i = 1; i <= Music.startId; i++) {
    var interpreter = new Interpreter(code + "start" + i + "();\n", Music.initInterpreter);
    interpreter.idealTime = Number(new Date());
    Music.pidList.push(setTimeout(goog.partial(Music.executeChunk_, interpreter), 100));
  }
};

/**
 * Execute a bite-sized chunk of the user's code.
 * @private
 */
Music.executeChunk_ = function(interpreter) {
  interpreter.pauseMs = 0;
  var go;
  do {
    try {
      go = interpreter.step();
    } catch (e) {
      // User error, terminate in shame.
      alert(e);
      go = false;
    }
    if (go && interpreter.pauseMs) {
      // The last executed command requested a pause.
      go = false;
      Music.pidList.push(
          setTimeout(goog.partial(Music.executeChunk_, interpreter), interpreter.pauseMs));
    }
  } while (go);
  // Wrap up if complete.
  if (!interpreter.pauseMs) {
    document.getElementById('spinner').style.visibility = 'hidden';
    BlocklyGames.workspace.highlightBlock(null);
    Music.checkAnswer();
    // Image complete; allow the user to submit this image to Reddit.
    Music.canSubmit = true;
  }
};

/**
 * Highlight a block and pause.
 * @param {?string} id ID of block.
 */
Music.animate = function(id) {
  Music.display();
  if (id) {
    BlocklyInterface.highlight(id);
  }
};

/**
 * Play the music.
 * @param {duration} distance Pixels to move.
 * @param {?string} id ID of block.
 */
Music.play = function(duration, pitch, id, interpreter) {
  var mySound = createjs.Sound.play(pitch);
  var scaleDuration = duration * 1000 * (2.5 - 2 * Music.speedSlider.getValue());
  interpreter.pauseMs = scaleDuration - (Number(new Date()) - interpreter.idealTime);
  interpreter.idealTime += scaleDuration;
  setTimeout(function() {
      mySound.stop();
      }, interpreter.pauseMs);
  Music.animate(id);
};

Music.rest = function(duration, id, interpreter) {
  var scaleDuration = duration * 1000 * (2.5 - 2 * Music.speedSlider.getValue());
  interpreter.pauseMs = scaleDuration - (Number(new Date()) - interpreter.idealTime);
  interpreter.idealTime += scaleDuration;
  Music.animate(id);
}

/**
 * Verify if the answer is correct.
 * If so, move on to next level.
 */

Music.checkAnswer = function() {
  
  if (Music.isCorrect(delta)) {
    BlocklyInterface.saveToLocalStorage();
    if (BlocklyGames.LEVEL < BlocklyGames.MAX_LEVEL) {
      // No congrats for last level, it is open ended.
      BlocklyDialogs.congratulations();
    }
  } else {
    Music.penColour('#ff0000');
  }
};

/**
 * Send an image of the canvas to Reddit.
 */
Music.submitToReddit = function() {
  if (!Music.canSubmit) {
    alert(BlocklyGames.getMsg('Music_submitDisabled'));
    return;
  }
  // Encode the thumbnail.
  var thumbnail = document.getElementById('thumbnail');
  var ctxThumb = thumbnail.getContext('2d');
  ctxThumb.globalCompositeOperation = 'copy';
  ctxThumb.drawImage(Music.ctxDisplay.canvas, 0, 0, 100, 100);
  var thumbData = thumbnail.toDataURL('image/png');
  document.getElementById('t2r_thumb').value = thumbData;

  // Encode the XML.
  var xml = Blockly.Xml.workspaceToDom(BlocklyGames.workspace);
  var xmlData = Blockly.Xml.domToText(xml);
  document.getElementById('t2r_xml').value = xmlData;

  // Submit the form.
  document.getElementById('t2r_form').submit();
};
