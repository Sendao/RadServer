
var whiteNoise=null, pinkNoise=null, brownian=null;

function stopNoiseGeneration()
{
  if( whiteNoise != null ) {
    stopNoise( whiteNoise );
    whiteNoise = null;
  }
  if( pinkNoise != null ) {
    stopNoise( pinkNoise );
    pinkNoise = null;
  }
  if( brownian != null ) {
    stopNoise( brownian );
    brownian = null;
  }
}

function whiteNoiseShield()
{
  if( whiteNoise == null ) {
    whiteNoise = newNoise();
  }

  var bufferSize = 2 * audioContext.sampleRate,
    noiseBuffer = audioContext.createBuffer(1, bufferSize, audioContext.sampleRate),
    output = noiseBuffer.getChannelData(0);
  for (var i = 0; i < bufferSize; i++) {
      output[i] = Math.random() * 2 - 1;
  }

  whiteNoise.source.buffer = noiseBuffer;

  startNoise(whiteNoise);
}

function pinkNoiseShield()
{
  var bufferSize = 4096;
  var pN = function() {
      var b0, b1, b2, b3, b4, b5, b6;
      b0 = b1 = b2 = b3 = b4 = b5 = b6 = 0.0;
      var node = audioContext.createScriptProcessor(bufferSize, 1, 1);
      node.onaudioprocess = function(e) {
          var output = e.outputBuffer.getChannelData(0);
          for (var i = 0; i < bufferSize; i++) {
              var white = Math.random() * 2 - 1;
              b0 = 0.99886 * b0 + white * 0.0555179;
              b1 = 0.99332 * b1 + white * 0.0750759;
              b2 = 0.96900 * b2 + white * 0.1538520;
              b3 = 0.86650 * b3 + white * 0.3104856;
              b4 = 0.55000 * b4 + white * 0.5329522;
              b5 = -0.7616 * b5 - white * 0.0168980;
              output[i] = b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362;
              output[i] *= 0.11; // (roughly) compensate for gain
              b6 = white * 0.115926;
          }
      }
      return node;
  };

  if( pinkNoise == null ) {
    pinkNoise = newNoise2(pN);
  }

  startNoise(pinkNoise);
}

function brownianShield()
{
  var bufferSize = 4096;
  var bN = function() {
      var lastOut = 0.0;
      var node = audioContext.createScriptProcessor(bufferSize, 1, 1);
      node.onaudioprocess = function(e) {
          var output = e.outputBuffer.getChannelData(0);
          for (var i = 0; i < bufferSize; i++) {
              var white = Math.random() * 2 - 1;
              output[i] = (lastOut + (0.02 * white)) / 1.02;
              lastOut = output[i];
              output[i] *= 3.5; // (roughly) compensate for gain
          }
      }
      return node;
  };

  if( brownian == null ) {
    brownian = newNoise2(bN);
  }

  startNoise(brownian);
}

function newNoiseData( data )
{
  var nx = {};
  nx.source = audioContext.createBufferSource();
  nx.source.loop = true;
  nx.gain = audioContext.createGain();
  nx.volume = 1.0;
  nx.gain.gain.setValueAtTime(nx.volume,audioContext.currentTime);
  nx.source.connect( nx.gain );
  nx.gain.connect( audioContext.destination );
  return nx;
}

function newNoise()
{
  var nx = {};
  nx.source = audioContext.createBufferSource();
  nx.source.loop = true;
  nx.gain = audioContext.createGain();
  nx.volume = 1.0;
  nx.gain.gain.setValueAtTime(nx.volume,audioContext.currentTime);
  nx.source.connect( nx.gain );
  nx.gain.connect( audioContext.destination );
  return nx;
}
function newNoise2( fSource )
{
  var nx = {};
  nx.source = audioContext.createBufferSource();
  nx.node = fSource();//audioContext.createBufferSource();
  nx.source.connect( nx.node );
  nx.node.connect( audioContext.destination );
  nx.source.loop = true;
  nx.gain = audioContext.createGain();
  nx.volume = 1.0;
  nx.gain.gain.setValueAtTime(nx.volume,audioContext.currentTime);
  nx.source.connect( nx.gain );
  nx.gain.connect( audioContext.destination );
  return nx;
}
function startNoise( nx )
{
  nx.source.start(0);
  nx.source.connect( audioContext.destination );
}
function stopNoise( nx )
{
  if( typeof nx.node != 'undefined' ) {
    nx.source.disconnect( nx.node );
    nx.node.disconnect( audioContext.destination );
  }
  nx.source.stop();
}
function noiseVolume( nx, volume )
{
  var lastVolume = nx.volume;
  nx.volume = volume;
  //nx.gain.gain.linearRampToValueAtTime(volume, audioContext.currentTime + 0.2);
}
