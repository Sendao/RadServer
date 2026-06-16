//import { Scene, AudioListener, AudioLoader, AudioAnalyzer, Camera, WebGLRenderer, Audio, DataTexture, ShaderMaterial, PlaneBufferGeometry, Mesh, LuminanceFormat } from 'three';

var th3 = THREE;
var Scene = th3.Scene;
var AudioListener = th3.AudioListener;
var AudioLoader = th3.AudioLoader;
var AudioAnalyzer = th3.AudioAnalyzer;
var Camera = th3.Camera;
var WebGLRenderer = th3.WebGLRenderer;
var Audio = th3.Audio;
var DataTexture = th3.DataTexture;
var ShaderMaterial = th3.ShaderMaterial;
var PlaneBufferGeometry = th3.PlaneBufferGeometry;
var Mesh = th3.Mesh;
var LuminanceFormat = th3.LuminanceFormat;

const scene = new Scene();
const camera = new Camera();
var render, source, running_sound;

var sh_vertex = `			varying vec2 vUv;
			void main() {
				vUv = uv;
				gl_Position = vec4( position, 1.0 );
			}`;

var sh_fragment = `			uniform sampler2D tAudioData;
			varying vec2 vUv;
			void main() {
				vec3 backgroundColor = vec3( 0.125, 0.125, 0.125 );
				vec3 color = vec3( 1.0, 1.0, 0.0 );
				float f = texture2D( tAudioData, vec2( vUv.x, 0.0 ) ).r;
				float i = step( vUv.y, f ) * step( f - 0.0125, vUv.y );
				gl_FragColor = vec4( mix( backgroundColor, color, i ), 1.0 );
			}`;

function i3_init()
{
  render = new WebGLRenderer( { antialias: true } );
  render.setSize( 595, 395 );
  render.setClearColor( 0x000 );
  render.setPixelRatio( window.devicePixelRatio );
  // render.domElement
  camera.add( alist );
}

function i3_render(i3_sound)
{
  running_sound = i3_sound;
		uniforms = {
			tAudioData: { value: new DataTexture( running_sound.analyser.data, running_sound.i3_fft / 2, 1, LuminanceFormat ) }
		};
		var material = new ShaderMaterial( {
			uniforms: uniforms,
			vertexShader: sh_vertex,
			fragmentShader: sh_fragment,
		} );
		var geometry = new PlaneBufferGeometry( 1, 1 );
		var mesh = new Mesh( geometry, material );
		scene.add( mesh );
		//window.addEventListener( 'resize', i3_resize, false );
}

function i3_animate()
{
	requestAnimationFrame( i3_animate );
  i3_draw();
}

function i3_draw() {
	running_sound.analyser.getFrequencyData();
	uniforms.tAudioData.value.needsUpdate = true;
	render.render( scene, camera );
}

/*
function i3_resize() {
	render.setSize( 595, 395 );
}
*/
