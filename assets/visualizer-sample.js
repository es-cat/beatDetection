/*
 * Copyright 2013 Boris Smus. All Rights Reserved.

 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */


var WIDTH = 640;
var HEIGHT = 360;

// Interesting parameters to tweak!
var SMOOTHING = 0.8;
var FFT_SIZE = 2048;



function VisualizerSample() {
    this.analyser = context.createAnalyser();
    
 
    
    
    this.analyser.minDecibels = -140;
    this.analyser.maxDecibels = 0;
    
    loadSounds(this, {
        buffer: 'chrono.mp3'
    });

    this.freqs = new Uint8Array(this.analyser.frequencyBinCount);
    this.times = new Uint8Array(this.analyser.frequencyBinCount);


    this.isPlaying = false;
    this.startTime = 0;
    this.startOffset = 0;
}

// Toggle playback
VisualizerSample.prototype.togglePlayback = function() {
    if (this.isPlaying) {
        // Stop playback
        this.source[this.source.stop ? 'stop' : 'noteOff'](0);
        this.startOffset += context.currentTime - this.startTime;
        console.log('paused at', this.startOffset);
        // Save the position of the play head.
    } else {
        this.startTime = context.currentTime;
        console.log('started at', this.startOffset);
        this.source = context.createBufferSource();
        this.filter = context.createBiquadFilter();
        this.filter.type = "lowpass";
        this.scriptNode = context.createScriptProcessor.call(context,
                     8192, 2, 2);
        var init = 0;
        this.scriptNode.onaudioprocess = function(audioProcessingEvent) {
          // The input buffer is the song we loaded earlier
          if(init++ < 2){
            //console.log(audioProcessingEvent.inputBuffer.getChannelData(1));
          }
          var inputBuffer = audioProcessingEvent.inputBuffer;

          // The output buffer contains the samples that will be modified and played
          var outputBuffer = audioProcessingEvent.outputBuffer;

          // Loop through the output channels (in this case there is only one)
          for (var channel = 0; channel < outputBuffer.numberOfChannels; channel++) {
            var inputData = inputBuffer.getChannelData(channel);
            var outputData = outputBuffer.getChannelData(channel);

            // Loop through the 4096 samples
            for (var sample = 0; sample < inputBuffer.length; sample++) {
              // make output equal to the same as the input
              outputData[sample] = inputData[sample];

              // add noise to each output sample
              //outputData[sample] += ((Math.random() * 2) - 1) * 0.2;         
            }
          }
        }



        var buffer = this.buffer;
        var offlineContext = new OfflineAudioContext(1, buffer.length, buffer.sampleRate);
        // Create buffer source
        var source = offlineContext.createBufferSource();
        source.buffer = buffer;
        // Create filter
        var filter = offlineContext.createBiquadFilter();
        filter.type = "lowpass";
        // Pipe the song into the filter, and the filter into the offline context
        source.connect(filter);
        filter.connect(offlineContext.destination);
        // Schedule the song to start playing at time:0
        source.start(0);
        // Render the song
        offlineContext.startRendering()
        // Act on the result
        offlineContext.oncomplete = function(e) {
          // Filtered buffer!
          var filteredBuffer = e.renderedBuffer;
          console.log(filteredBuffer.getChannelData(0));
        };



        // Connect graph
        //Recorder(this.source);
        this.source.connect(this.scriptNode);
        this.scriptNode.connect(this.filter);
        this.filter.connect(this.analyser);
        this.analyser.connect(context.destination);
        // this.source.connect(this.filter);
        // this.filter.connect(this.analyser);
        // this.analyser.connect(this.scriptNode);
        // this.scriptNode.connect(context.destination);

        // this.source.connect(this.filter);
        // this.filter.connect(this.analyser);

        this.source.buffer = this.buffer;
        this.source.loop = true;
        // Start playback, but make sure we stay in bound of the buffer.
        this.source[this.source.start ? 'start' : 'noteOn'](0, this.startOffset % this.buffer.duration);
        // Start visualizer.
        requestAnimFrame(this.draw.bind(this));
        //bind onEnd event
        this.source.onended = function(e){
        };
    }
    this.isPlaying = !this.isPlaying;
}


VisualizerSample.prototype.draw = function() {
    this.analyser.smoothingTimeConstant = SMOOTHING;
    this.analyser.fftSize = FFT_SIZE;

    // Get the frequency data from the currently playing music
    this.analyser.getByteFrequencyData(this.freqs);
    this.analyser.getByteTimeDomainData(this.times);

    var width = Math.floor(1 / this.freqs.length, 10);

    var canvas = document.querySelector('canvas');
    var drawContext = canvas.getContext('2d');
    canvas.width = WIDTH;
    canvas.height = HEIGHT;
    // Draw the frequency domain chart.
    for (var i = 0; i < this.analyser.frequencyBinCount; i++) {
        var value = this.freqs[i];
        var percent = value / 256;
        var height = HEIGHT * percent;
        var offset = HEIGHT - height - 1;
        var barWidth = WIDTH / this.analyser.frequencyBinCount;
        var hue = i / this.analyser.frequencyBinCount * 360;
        drawContext.fillStyle = 'hsl(' + hue + ', 100%, 50%)';
        drawContext.fillRect(i * barWidth, offset, barWidth, height);
    }

    // Draw the time domain chart.
    for (var i = 0; i < this.analyser.frequencyBinCount; i++) {
        var value = this.times[i];
        var percent = value / 256;
        var height = HEIGHT * percent;
        var offset = HEIGHT - height - 1;
        var barWidth = WIDTH / this.analyser.frequencyBinCount;
        drawContext.fillStyle = 'white';
        drawContext.fillRect(i * barWidth, offset, 1, 2);
    }

    if (this.isPlaying) {
        requestAnimFrame(this.draw.bind(this));
    }
}

// VisualizerSample.prototype.getFrequencyValue = function(freq) {
//     var nyquist = context.sampleRate / 2;
//     var index = Math.round(freq / nyquist * this.freqs.length);
//     return this.freqs[index];
// }


// function getPeaksAtThreshold(data, threshold) {
//   var peaksArray = [];
//   var length = data.length;
//   for(var i = 0; i < length;) {
//     if (data[i] > threshold) {
//       peaksArray.push(i);
//       // Skip forward ~ 1/4s to get past this peak.
//       i += 10000;
//     }
//     i++;
//   }
//   return peaksArray;
// }



(function(window){


  var Recorder = function(source, cfg){
    var config = cfg || {};
    var bufferLen = config.bufferLen || 4096;
    var numChannels = config.numChannels || 2;
    this.context = source.context;
    this.node = (this.context.createScriptProcessor ||
                 this.context.createJavaScriptNode).call(this.context,
                 4096, 2, 2);

    this.node.onaudioprocess = function(e){
      var buffer = [];
      for (var channel = 0; channel < numChannels; channel++){
          buffer.push(e.inputBuffer.getChannelData(channel));
      }
    }

    source.connect(this.node);
    this.node.connect(this.context.destination);    //this should not be necessary
  };

  window.Recorder = Recorder;

})(window);