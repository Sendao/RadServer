import { AudioListener, AudioLoader, AudioAnalyzer, Audio } from 'three';



const alist = new AudioListener();
const i3_fft = 128;

var listener;

export function i3_source( url, cb )
{
  var source = new Audio( alist );
  var Loa = new AudioLoader( url, (aB) => {
    source.setBuffer(aB);
    i3_analyze();
    i3_render();
    cb( { i3_fft: i3_fft, analyser: analyser } );
  });
}

export function i3_analyze()
{
  analyser = new AudioAnalyser( source, i3_fft );
}
