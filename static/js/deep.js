import * as THREE from 'three';
import { TrackballControls } from 'three/addons/controls/TrackballControls.js';
import { bin_decode, bin_encode } from '/js/binary.js';

export let paused=false, running=false, gravTimeout=45, gravTimer=-1;
export var neighbors = null, cells = null, lifetime = null;
export var wires = null;
export var posns = null;

var usefreq=0.1;
let total_cells=68*68*68;
let silent=false;
let running_cells = false;
let use_full_rules = true;
let rules_stick = true;
let fire_length = 25;

var start_health = 10; // 10
let max_health = 1000; // 10000
let life_per_tick = 0;
let life_per_sec = 40; // 400
let damage = 9;
let healing_constant = 0;
let healing_factor = 0; // 0.01
let damage_entropy = 0.2;
let adversity = 0.1;
let chosen_fov = 67;
let neighbor_range = 2;
let rule_mult = 6;
let zeroGroundBalance = false;

// <= and >=

let lifers_first=true;
let rule_reversal = [];
let chosen_rules = 0;

// neighbors <= min_death || neighbors >= max_death // they die outside the death border
// neighbors >= min_lifer && neighbors <= min_lifer // they live inside the life border

export var rulesets = [
[
  { 
    cond: { above: 100000 },
    min_birth: 6, max_birth: 8,
    min_death: 2, max_death: 9,
    min_lifer: 3, max_lifer: 8
},
{ 
    cond: { above: 50000 },
    min_birth: 6, max_birth: 9,
    min_death: 2, max_death: 10,
    min_lifer: 3, max_lifer: 8
},
 { // rescue rule (<5:rel000 cells)
    min_birth: 6, max_birth: 10,
    min_death: 2, max_death: 11,
    min_lifer: 3, max_lifer: 8
}], //1:
[
{
  cond: { above: 100000 },
  min_birth: 0, max_birth: 0
}
],
];
export var rules = rulesets[0];


export let fade_toning = true;
export let silver_toning = true;
export let sneaker_toning = true;

let scene=null, renderer=null;
let instances = null;

var material, geometry;
var controls = null, camera;

var rNums = [], rC = 0, cC = 0, rndMax=2000;

export function startupOneCell()
{
    start();
    genereateRandom(total_cells*usefreq);
    resizeScreen(); // starts the animation as well if not already running.
}

export function restartScreen() {
    // initialize
    cpu_work = false;
    paused = false;
    running_cells = true;
    animate();
}


let last_frame = 0;

let current_rule=9, current_rules = '9';
let camera_vel = [0,0,0];
let camera_tgt_vel = [0,0,0];
let camera_dist = 0;
let last_time = 0;
let colorMode = 0;
let lastSwitch = 0;
let timer_mode = 1;
let show_status=false;
let experiment=0;

export let groundBal = [0,0,0];
let colorsets = [
  [ 'purple', [6,0,28], [0,0,10] ],
  [ 'bluegreen', [-25,-1,20], [25,0,-5] ],
  [ 'scanning', [-5,-4,5], [5,7,-5] ],
  [ 'brightscan', [-2,-1,25], [25,30,-25] ],
  [ 'darkness', [-1.3, -1, 10], [8, 0, 0] ],
  [ 'light', [10,7,2.5], [-0.5,0,-1] ],
  [ 'test', [1,0,0], [0,0,1] ]
];
let no_visual_import = true;
let no_rules_import = false;
let imported_static_rules = null;
let colorpick = 3;
export var colorBal = colorsets[colorpick][1];
export var filterBal = colorsets[colorpick][2];

export let opacity = 0.5; // 0.86;
export let sizing = 0.9; // 0.6 // 0.92;
export let spacing = 0.8; // 1.65;

let fullW=68, fullH=68, fullD=68;
function livingBorders()
{
  var min_x, max_x, min_y, max_y, min_z, max_z;
  var x,y,z;
    
  min_x = fullW;
  min_y = fullH;
  min_z = fullD;
  max_x = 0;
  max_y = 0;
  max_z = 0;
    
  for( z=0; z<fullD; z++ ) {
    for( x=0; x<fullW; x++ ) {
      for( y=0; y<fullH; y++ ) {
        if( cells[z][x][y] != 0 ) {
          min_x = Math.min(min_x,x);
          min_y = Math.min(min_y,y);
          min_z = Math.min(min_z,z);
          max_x = Math.max(max_x,x);
          max_y = Math.max(max_y,y);
          max_z = Math.max(max_z,z);
        }
      }
    }
  }
  return [ min_x, max_x, min_y, max_y, min_z, max_z ];
}

function resizeTo(newsize)
{
  cpu_work = true;
  
  wires = [];

  // re-center on newly generated area:
  let cellmap = new Array(newsize);
  let lifemap = new Array(newsize);
  let neighbormap = new Array(newsize);
  let posnsmap = new Array(newsize);
  
  var z,x,y,x0,y0,z0;
  
  if( newsize > fullW ) {
    let offsize = parseInt((newsize-fullW)/2);
    
    for( z=0; z<newsize; z++ ) {
      z0 = z-offsize;
      cellmap[z] = new Array(newsize);
      lifemap[z] = new Array(newsize);
      neighbormap[z] = new Array(newsize);
      posnsmap[z] = new Array(newsize);
      for( x=0; x<newsize; x++ ) {
        x0 = x+offsize;
        cellmap[z][x] = new Array(newsize).fill(0);
        lifemap[z][x] = new Array(newsize).fill(0);
        neighbormap[z][x] = new Array(newsize).fill(0);
        posnsmap[z][x] = new Array(newsize).fill(0);
        for( y=0; y<newsize; y++ ) {
          y0 = y+offsize;
          if( z0 < 0 || y0 < 0 || x0 < 0 || z0 >= fullD || y0 >= fullH || z0 >= fullW ) {
            cellmap[z][x][y] = 0;
            lifemap[z][x][y] = 0;
            neighbormap[z][x][y] = 0;
            posnsmap[z][x][y] = 0;
            continue;
          }
          cellmap[z][x][y] = cells[z0][x0][y0];
          lifemap[z][x][y] = lifetime[z0][x0][y0];
          neighbormap[z][x][y] = neighbors[z0][x0][y0];
          posnsmap[z][x][y] = posns[z0][x0][y0];
        }
      }
    }
  } else {
    var min_x, max_x, min_y, max_y, min_z, max_z;
    [ min_x, max_x, min_y, max_y, min_z, max_z ] = livingBorders();
    
    let offsize = parseInt((fullD-newsize)/2);
    
    for( z=0; z<newsize; z++ ) {
      z0 = z+min_z;
      cellmap[z] = new Array(newsize);
      lifemap[z] = new Array(newsize);
      neighbormap[z] = new Array(newsize);
      posnsmap[z] = new Array(newsize);
      for( x=0; x<newsize; x++ ) {
        x0 = x+min_x;
        cellmap[z][x] = new Array(newsize).fill(0);
        lifemap[z][x] = new Array(newsize).fill(0);
        neighbormap[z][x] = new Array(newsize).fill(0);
        posnsmap[z][x] = new Array(newsize).fill(0);
        for( y=0; y<newsize; y++ ) {
          y0 = y+min_y;
          if( z0 < 0 || x0 < 0 || y0 < 0 || z0 >= fullD || x0 >= fullW || y0 >= fullH ) {
            cellmap[z][x][y] = 0;
            lifemap[z][x][y] = 0;
            neighbormap[z][x][y] = 0;
            posnsmap[z][x][y] = 0;
            continue;
          }
          cellmap[z][x][y] = cells[z0][x0][y0];
          lifemap[z][x][y] = lifetime[z0][x0][y0];
          neighbormap[z][x][y] = neighbors[z0][x0][y0];
          posnsmap[z][x][y] = posns[z0][x0][y0];
        }
      }
    }
  }
  
  total_cells = fullW*fullH*fullD;
  cells = cellmap;
  lifetime = lifemap;
  neighbors = neighbormap;
  posns = posnsmap;
  
  fullW = fullH = fullD = newsize;
  buildInstances();
  cpu_work = false;
}
let total_alive=0;

let bugcount = 0;

let app_state=0, app_iter=0;
let cpu_work=false;

export function getSizing() {
    return sizing;
}
export function getSpacing() {
    return spacing;
}
export function setSpacing(s) {
    spacing = s;
    showToast("Spacing: " + spacing);
    resetCamera();
    refreshConfig();
}
export function setSizing(s) {
    sizing = s;
    showToast("Sizing: " + sizing);
    resetCamera();
    refreshConfig();
}
export function setOpacity(o) {
    opacity = o;
    showToast("Opacity: " + opacity);
    refreshConfig();
}
export function one(js) {
    eval(js);
}
export function tell() {
    console.log(JSON.stringify({total_alive,damage,damage_entropy,healing_factor,healing_constant}));
}


let lastColorPick = 0;
export function setColorBal(value, rgb, cm)
{
    var rgbColor;
    lastColorPick = rgb;

    switch( rgb ) {
    case 0:
        rgbColor = 'Red: ';
        break;
    case 1:
        rgbColor = 'Green: ';
        break;
    case 2:
        rgbColor = 'Blue: ';
        break;
    default:
        console.log("setColorBal undefined " + rgb);
        return;
    }
    showToast(rgbColor + value);

    switch( cm ) {
        case 0: colorBal[rgb] = 0+value; break;
        case 1: filterBal[rgb] = 0+value; break;
        case 2: groundBal[rgb] = 0+value; break;
    }
}




export function pause() {
    paused=!paused;
}


let lastTick = 0;
function backupCycler() {
    if( lastTick < new Date().getTime() - 1000 ) {
        animate();
    }
}

// provide random noise to cpu
function burner() {
    let cycles = qRandom(50);
    var a,b,c,d,e,f,g;
    while( cycles > 0 ) {
        a=qRandom();
        b=2*a;
        c=b/3;
        d=2*c;
        e=d/3;
        f=2*e;
        g=parseInt(f/3);
        g-=g+1;
        cycles--;
    }
    return g;
}
let last_timer_mode = 'f';
export function animate() { // a 'no' comment :)
    if( timer_mode != last_timer_mode ) {
        last_timer_mode = timer_mode;
        clearInterval(gravTimer);
    }
    switch( timer_mode ) {
        case 0:
            animate_1();
            break;
        case 1:
            watchTimer();
            break;
        case 2:
            animate_2();
            break;
        case 3:
            useAnimationFrames();
            break;
    }
}
export function nextTimer() {
    timer_mode = (timer_mode+1)%4;
    showToast("Timer mode: " + ['anim_1','watch','anim_2','requestframe'][timer_mode]);
    showStatus(['old','watch','1','animframes'][timer_mode]);
    paused = false;
    running = false;
    cpu_work = false;
    gravTimeout = 30;
    resizeScreen();
}

export function animate_1() {
    if( paused ) return;
    if( running ) {
        return;
    } else {
        running = true;
    }
    var tn = new Date();

    application();

    var tx = new Date();
    var td = tx - tn;
    var chg=false;
    if( gravTimeout == 0 ) {
        chg=true;
        gravTimeout = 50;
    } else if( gravTimeout < 1.5*td ) { // using too much cpu.
        gravTimeout *= 1.5;
        chg=true;
    } else if( gravTimeout > td*4 ) { // going too slowly.
        gravTimeout /= 1.5;
        chg=true;
    }
    if(chg){
        clearInterval(gravTimer);
        gravTimer = setInterval( animate, gravTimeout );
        if( gravTimeout > 6000 )
            showToast("gt="+gravTimeout);
    }
    //showToast(td, tn.getSeconds(), tx.getSeconds());
    running=false;
}

export function useAnimationFrames()
{
    application();
    requestAnimationFrame(animate);
}


export function animate_2() {
    if( paused ) return;
    if( running ) return;
    else running = true;

    let tn = new Date();
    application();
    let tx = new Date();
    let td = tx - tn;

    let chg=false;
    if( gravTimeout < 1.5*td ) { // using too much cpu.
        gravTimeout *= 1.5;
        chg=true;
    } else if( gravTimeout > td*4 ) { // going too slowly.
        gravTimeout /= 1.5;
        chg=true;
    }
    if(chg){
        clearInterval(gravTimer);
        gravTimer = setInterval( "animate()", gravTimeout );
        if( gravTimeout > 6000 )
            showToast("gt="+gravTimeout);
    }
    running=false;
}

var canvas, ctx, img;
let staccato = false;
var renderTimer;
var fpsnow;
let lastChart = null;
let lastFrames = [];
let gravAdjust = 100;
let userWork = false; // for now
let cpuWork = false;
let cyclesPerFrame = 5;
let used_time = 0;
let slowed_down=0, sped_up=0, was_greedy=0;
let fpsMap = new Map();
let fpsLimit = {0:100};
let fpsMax = 42;
let min_grav_adjust = fpsMax/1000;
let learnLockLoseState = 0;
let lockIsHard = false;
let timerMode = [ 'learn', 'lock', 'lose' ];
let superslower = 0;

export function setMaxFPS(v)
{
    fpsMax = parseInt(v);
}

export function getStats()
{
    return [fpsLimit,fpsMap];
}

function watchTimer()
{
    lastTick = new Date().getTime();

    if( paused ) {
        requestAnimationFrame( finishRendering );
        renderTimer = setTimeout( animate, 200 );
        return;
    } else {
      renderTimer = -1;
    }

    // measure fps
    let tn = lastTick;
    
    while( lastFrames.length > 0 && lastFrames[0] < tn-1000 )
        lastFrames.shift();

    fpsnow = lastFrames.length;
    if( learnLockLoseState == 0 ) { // learning:
        if( !(fpsnow in fpsLimit) ) {
            var i;
            for( i=fpsnow-1; i>=0; i-- ) {
                if( i in fpsLimit ) {
                    //console.log("fpsLimit[" + i + "]=" + fpsLimit[i] + "->" + fpsnow);
                    while( i < fpsnow ) {
                        fpsLimit[i+1]=fpsLimit[i]*0.95;
                        i++;
                    }
                    break;
                }
            }
            if( i <= 0 ) {
                fpsLimit[0] *= 2;
            }
        }
    }

    if( fpsnow != 0 ) {

        if( lastChart === null ) {
            lastChart = tn;
        }
        if( lastChart < tn - 400 ) {
            //chartFps();
            showStatus(timerMode[learnLockLoseState] + " @fps=" + fpsnow + "         pS:" + sped_up + "     Sp\\:" + was_greedy + ( slowed_down > 0 ? (" Gr." + slowed_down + "!..") : " __._!.." ));

            if( learnLockLoseState == 0 ) {
                var f;
                if( fpsMap.has(fpsnow) ) {
                    f = fpsMap.get(fpsnow);
                    f.push( [0+slowed_down,0+sped_up,0+was_greedy] );
                    if( f.length > 9 ) f.shift();
                } else {
                    f = [ [0+slowed_down,0+sped_up,0+was_greedy] ];
                    fpsMap.set(fpsnow, f);
                }

                slowed_down=0;
                sped_up=0;
                was_greedy=0;

            }


            lastChart = tn;
        }
    }

    // if lockIsHard && learnLockLoseState == 1 we skip this
    if( (!lockIsHard || learnLockLoseState != 1 ) && fpsnow != 0 && used_time > 1000/fpsnow ) { // uusing increasing amts of time
        if( gravAdjust == 0 ) gravAdjust = 1;
        gravAdjust *= 1.11;
        slowed_down++;
    }

    if( fpsnow > fpsMax ) {
        // slow down
        gravAdjust *= 1.1;
        superslower++;
    }


    if( fpsnow > fpsMax ) {
        renderTimer = setTimeout( animate, gravAdjust );
        return;
    }
    
    try {
        lastFrames.push(tn);
        if( application() ) {
            let tx = new Date().getTime();
            used_time = tx-tn;
        }
    } catch( e ) {
        used_time=0;
        console.log(e, "appplication");
    }

    renderTimer = setTimeout( animate, gravAdjust );    

    if( fpsMap.has(fpsnow) && ( learnLockLoseState != 1 || !lockIsHard ) ) { 
        let fm = fpsMap.get(fpsnow);
        let slowedThen=0;
        let relativelySlow = slowed_down * fm.length;
        for( var i=0; i<fm.length; i++ ) {
            slowedThen += fm[i][0];
        }
        if( fm.length != 0 && slowedThen > 0 ) {
            if( relativelySlow > slowedThen*1.1 ) {
                gravAdjust *= 0.95;
                sped_up++
            } else if( relativelySlow < slowedThen*0.9 ) {
                gravAdjust *= 1.1;
            }

            let oldValue = gravAdjust;
            if( fpsnow>0 && learnLockLoseState != 1 ) {
                let fp = fpsnow+1;
                if( fp in fpsLimit ) {
                    oldValue = (fpsLimit[fp] + gravAdjust)/2;
                    // fpsLimit+1 max=333,*=1.1
                    //fpsLimit[fp] = Math.min(333, fpsLimit[fp]);
                } else { // oldValue max=333,gravAdjust*3/4
                    oldValue = gravAdjust*0.75;
                }
                oldValue = Math.min(333, oldValue);

                if( fpsnow in fpsLimit ) // oldValue max=333,2*fpsLimit(now)
                    oldValue = Math.min(2*fpsLimit[fpsnow], oldValue);

                gravAdjust = oldValue;
                if( learnLockLoseState == 0 ) { // locked|losing = don't alter record
                    fpsLimit[fpsnow] = oldValue;
                }
            }
        }
    }


    if( (gravAdjust<min_grav_adjust) || ( fpsnow in fpsLimit && gravAdjust < fpsLimit[fpsnow]*0.5 ) ) {
        gravAdjust=Math.max(min_grav_adjust,fpsLimit[fpsnow]); // don't get too picky
        was_greedy++;
    }

    if( !lockIsHard || learnLockLoseState != 1 ) {
        gravAdjust *= 0.99;
        sped_up++
    }
}

function chartFps() {
    let diffs = [];
    for( var i=0; i<lastFrames.length-1; i++ ) {
        diffs.push( lastFrames[i+1] - lastFrames[i] );
    }
    console.log(new Date().getSeconds() + ": " + diffs.join("->"));
    //console.log("fps: " + lastFrames.length)
}


function qRandom() { // note we do use the arguments[] list
    if( rNums.length < rndMax ) {
        startRandoms();
    }
    rC++;
    if( rC >= rNums.length ) rC -= rNums.length;
    cC += Math.floor( rNums[rC] * 50 );
    while( cC >= rNums.length ) cC -= rNums.length;
    let x = (rNums[rC]*0.1 + rNums[cC]*0.9);

    return !(0 in arguments) ? (x) : ( !(1 in arguments) ? ( x * arguments[0] ) : ( arguments[0] + arguments[1]*x ) );
};
function startRandoms() {
    while( rNums.length < rndMax ) {
        rNums.push( Math.random() );
    }
}
function checkWebGLStatus(msgs) {
    const canvas = document.createElement('canvas');
    let gl = null;
    try {
        gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
    } catch (e) {
        msgs.push(e);
    }

    if (!gl) {
        msgs.push("WebGL is not supported or is disabled.");
        return false;
    }
    
    // Use an extension to get specific driver info if available
    const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
    let vendor = "N/A";
    let renderer = "N/A";
    if (debugInfo) {
        vendor = gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL);
        renderer = gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL);
    }
    
    // Check if a major performance caveat caused it to use software rendering
    const performanceCaveat = gl.getContextAttributes().failIfMajorPerformanceCaveat ? "Yes" : "No";

    msgs.push(`WebGL Status: Supported. Vendor: ${vendor}, Renderer: ${renderer}, Major Performance Caveat: ${performanceCaveat}`);
    return true;
}


function finishRendering() // out of band i guess, kind of a primitive way to do it
{
    //this.instances.computeBoundingBox();
    if( staccato || cpu_work ) return;

    controls.update();
    renderer.render(scene, camera);
}
// Call this function and log the result

function buildCanvas()
{    
    const el = document.getElementById('mainscroll');
    var rv = [];

    if( !checkWebGLStatus(rv) ) {
        console(rv, rv.join("\n"));
        alert(rv.join("\n"));
        return false;
    }

    renderer = new THREE.WebGLRenderer({
        //antialias: false,
        alpha: false,
        premultipliedAlpha: true,
        preserveDrawingBuffer: false,
        logarithmicDepthBuffer: true,
        reverseDepthBuffer: false
    });
    renderer.setPixelRatio( window.devicePixelRatio );
    renderer.setSize( window.innerWidth, window.innerHeight );

    el.appendChild( ( canvas = renderer.domElement ) );
    el.style.position = 'absolute';
    el.style.top = '0px';
    el.style.left = '0px';
    return true;
}

function threeCanvas()
{
    const el = document.getElementById("mainscroll");
    if( renderer !== null ) {
        for( var i=0; i<el.children.length; i++ ) {
            if( el.children[i].nodeName.toLowerCase() == 'canvas' ) {
                el.removeChild( el.children[i] );
                --i;
            }
        }
        renderer = null;
    }

    if( !buildCanvas() ) {
        renderer = null;
        return false;
    }

    buildScene(); // also calls buildInstances()

    camera = new THREE.PerspectiveCamera( chosen_fov, window.innerWidth / window.innerHeight, 0.1, 10000 );
    resetCamera();

    useTrackball();
    trackToCamera();
    return true;
}

function buildScene()
{
    if( scene !== null ) {
        scene = null;
    }
    scene = new THREE.Scene();
    scene.background = new THREE.Color( groundBal[0]/255, groundBal[1]/255, groundBal[2]/255 );
    let light = new THREE.AmbientLight(0xffffff, 2.3);
    scene.add(light);
    buildInstances();
}
function resetCamera() {
    camera.position.set( fullW*spacing*0.5, fullH*spacing*0.5, -4*fullD*spacing );
    camera.lookAt(new THREE.Vector3(fullW*spacing*0.5, fullH*spacing*0.5, fullD*spacing*0.5) );//fullW*spacing*0.5, fullH*spacing*0.5, fullD*spacing*0.5));
    if( controls !== null ) {
      controls.reset();
      camera.updateProjectionMatrix();
    }
}

function trackToCamera() {
  let extents = livingBorders();
  let mid_x = (extents[1] - extents[0])/2 + extents[0];
  let mid_y = (extents[3] - extents[2])/2 + extents[2];
  let mid_z = (extents[5] - extents[4])/2 + extents[4];
  //alert(mid_x + "," + mid_y + "," + mid_z);
  controls.reset();
  camera.position.set( mid_x*spacing, mid_y*spacing, -4*mid_z*spacing );
  controls.target = new THREE.Vector3(mid_x*spacing, mid_y*spacing, mid_z*spacing*0.5);
  camera.lookAt( controls.target );
  camera.updateProjectionMatrix();
}


function getCameraControls()
{
    return [camera,controls];
}

function useTrackball()
{
    controls = new TrackballControls( camera, renderer.domElement );
    controls.rotateSpeed = 20.0;
    controls.zoomSpeed = 4.5;
    controls.panSpeed = 1.0;
    controls.staticMoving= true;
    controls.keys = []; // [ 'KeyA', 'KeyS', 'KeyD' ];
}

function refreshConfig(reset_camera=false)
{
    if( reset_camera ) {
        resetCamera();
    }

    if( qRandom(bugcount) > 0.5 ) { // if there's a bug. only do it half the time. mock the system.
        console.log("ha ah ah ah ha ah ah ah ha ah ah ah and why");
        updateAllInstances(false);
    } else {
        buildInstances();
    }
}
function buildInstances()
{
    if( instances !== null ) {
        instances.dispose();
        instances=null;
        buildScene(); // calls buildInstances again
        return;
    }
    if( scene === null ) {
        buildScene();
        return;
    }
    geometry = new THREE.BoxGeometry( sizing, sizing, sizing );
    // ? geometry.applyMatrix4(new THREE.Matrix4().makeTranslation(0, 0, 0.5)); /// oooooer

    if( opacity >= 0.999 ) {
        material = new THREE.MeshBasicMaterial( {color:0xffffff} );
        material.transparent = false;
    } else {
        material = new THREE.MeshLambertMaterial( {color:0xffffff} ); // try MeshLambert, MeshPhysical, MeshNormal, MeshPhong, MeshToon
        material.transparent = true;
        material.opacity = opacity;
    }
    instances = new THREE.InstancedMesh( geometry, material, total_cells );
    //instances.instanceMatrix.setUsage( THREE.DynamicDrawUsage ); // will be updated every frame
    //instances.castShadow = instances.receiveShadow = true;
    //updateInstances();

    //instances.instanceMatrix.setUsage( THREE.DynamicDrawUsage ); // will be updated every frame
    scene.add(instances);

    updateAllInstances(true);
}



// Runtime loop:

    let sneakerSomeHow = new Map();

function updateAllInstances(from_scratch=false)
{
    var cube;

    cpu_work = true;

    var i,j,k;
    var n=0;
    var dtn = new Date().getTime()/1000;
    var life, red, green, blue;
    var z, factor;
    let oneframe=fullW*fullH;//qq

    let fill_red = filterBal[0];
    let fill_green = filterBal[1];
    let fill_blue = filterBal[2]; // ultimately we want to have three different color fields: one for neutral, one for positive, one for negative

    let ar=0,ag=0,ab=0;

    let lc_count=0, nc_count=0;
    let additionalAirie = new Array();

    for( i=0; i<fullD; i++ ) {
        for( j=0; j<fullW; j++ ) {
            for( k=0; k<fullH; k++ ) {

                if( cells[i][j][k] === 0 ) {
                    if( posns[i][j][k] === 0 && !from_scratch ) continue;
                    posns[i][j][k] = 0;

                    let key = i + "," + j + "," + k;
                    if( sneakerSomeHow.has(key) ) {
                        let heyNo = sneakerSomeHow.get(key);
                        
                        [red,green,blue] = [Math.max(164, Math.min(255, qRandom(heyNo)*10)), 0, 0];
                        
                        if( qRandom() < 0.1 )
                            sneakerSomeHow.delete(key);
                    } else {
                        [red,green,blue] = groundBal;
                    }
                    instances.setColorAt( i*oneframe + j*fullW + k, new THREE.Color( red/255, green/255, blue/255 ) );
                    instances.setMatrixAt( i*oneframe + j*fullW + k, new THREE.Matrix4().makeTranslation( 0, 0, -10000 ) );
                    continue;
                }


                if( (cells[i][j][k]>0) == (posns[i][j][k]>0) && !from_scratch && qRandom(50) > 40 ) continue;
                factor = posns[i][j][k] = cells[i][j][k];

                life = dtn - lifetime[i][j][k];
                z = life;
                
                z -= parseInt(z/255)*255;
                factor -= parseInt(factor/255)*255;

                red = Math.max(0, z*fill_red + factor*colorBal[0]);
                green = Math.max(0, z*fill_green + factor*colorBal[1]);
                blue = Math.max(0, z*fill_blue + factor*colorBal[2]);
                /*
                red -= parseInt(red/255)*255;
                green -= parseInt(green/255)*255;
                blue -= parseInt(blue/255)*255;
                */

              if( wires !== null ) {
    let p = i + "," + j + "," + k;
    for( var wireno=wires.length-1; wireno>=0; wireno-- ) {
      let wn = 1;//(wireno/wires.length);
      if( wires[wireno].has(p) ) {
        red += 1*wn;
        green -= 0.1*wn;
        blue -= 0.1*wn;
        break;
      }
    }
              }
                /*
                if( reverse_toning ) {
                    let red1 = 128-Math.min(64, green+blue);//128+64+(64-red);
                    let green1 = 128-Math.min(64, red+blue);//128+64+(64-green);
                    let blue1 = 128-Math.min(64, green+red);//128+64+(64-blue);
                }
                */

                if( red > 225 && green > 225 && blue> 225 && sneaker_toning ) {
                    // apply high fade toning:
                    let red1 = Math.min(255, red-(green+blue));
                    let green1 = Math.min(255, green-(red+blue));
                    let blue1 = Math.min(255, blue-(green+red));
                    instances.setColorAt( i*oneframe + j*fullW + k, new THREE.Color( red1/255, green1/255, blue1/255 ) );

                    sneakerSomeHow.set( i + "," + j + "," + k, life ); // oopsy DAISY though, always daisy ok, otherwise no, glitch, you won't stitch()
                } else if( silver_toning && qRandom() < 0.1 && ( red > 164 || green > 164 || blue > 164 ) ) {
                    let tf = red+green+blue; // 64+
                    let white = (3*Math.min(red,green,blue));                    
                    if( white != 0 ) white = tf / white; // 0-1 how close to gray it already was
                    else white = 1;

                    let rf = red/tf;
                    let gf = green/tf;
                    let bf = blue/tf;
                    
                    //white = Math.min( Math.max( 0, white ), 1-Math.max(rf,gf,bf) );
                    white -= qRandom(0.25);
                    rf += 1;
                    gf += 1;
                    bf += 1;
                    let hf = white*((rf+gf)/2);
                    instances.setColorAt( i*oneframe + j*fullW + k, new THREE.Color( Math.min(0.5,white*rf), white*gf, Math.min(0.1,white*bf) ) );

                } else if( red < 128 && green < 128 && blue < 128 ) {
                    // mid-color

                    /* not ready for this: when a small color appears flip it to high color but also flip the color level
                    if( bam_toning ) {
                        let total_light = red+green+blue;
                        if( red <= green && red <= blue ) {
                            red = 255;
                        } else if( green <= red && green <= blue ) {
                            green = 255;
                        } else if( blue <= red && blue <= green ) {
                            blue = 255;
                        }
                    }*/

                    lc_count++;

                    if( fade_toning && red < 32 && green < 32 && blue < 32 ) {
                        sneakerSomeHow.set( i + "," + j + "," + k, life ); // oopsy DAISY though, always daisy ok, otherwise no, glitch, you won't stitch()

                        //console.log("low-color life detected at " + i + ", " + j + ", " + k + ": " + cells[i][j][k] + ", " + life);

                        // apply fade toning: // 0..64| -> |64..128   ... 0=128, 1=127... 64=6

                        var red1=red,green1=green,blue1=blue;
                        if( red > green && red > blue ) {
                            red1=128;
                            green1 = Math.min(32,green);
                            blue = Math.min(32,blue);
                        } else if( green > red && green > blue ) {
                            green1=128;
                            red1 = Math.min(32,red);
                            blue = Math.min(32,blue);
                        } else if( blue > red && blue > green ) {
                            blue1=128;
                            green1 = Math.min(32,green);
                            red = Math.min(32,red);
                        } else {
                            blue1=255;
                            green1=red1=0;
                        }
                        instances.setColorAt( i*oneframe + j*fullW + k, new THREE.Color( red1/255, green1/255, blue1/255 ) );
                    } else {
                        instances.setColorAt( i*oneframe + j*fullW + k, new THREE.Color( red/255, green/255, blue/255 ) );
                    }
                } else {
                    instances.setColorAt( i*oneframe + j*fullW + k, new THREE.Color( red/255, green/255, blue/255 ) );
                    nc_count++;
                }

                instances.setMatrixAt( i*oneframe + j*fullW + k, new THREE.Matrix4().makeTranslation( i*spacing, j*spacing, k*spacing ) );
            }
        }
    }
    // silver toning: switch to silver (fade or not) and rotate axial coordination (j,i,k or k,j,i .. uh, no, obviously it must be j,k,i )
    if( silver_toning && additionalAirie.length > 0 ) {
        for( i=0; i<additionalAirie.length; i++ ) {
            instances.setColorAt( additionalAirie[i][0], additionalAirie[i][1] );
        }
    }
    instances.instanceMatrix.needsUpdate = true;
    instances.instanceColor.needsUpdate = true;

    cpu_work = false;
}

export function start() {
    console.log("start()");
  wires = [];
    neighbors = new Array(fullD);
    cells = new Array(fullD);
    lifetime = new Array(fullD);
    posns = new Array(fullD);

    for( var i=0; i<fullD; i++ ) {
        neighbors[i] = new Array(fullW);
        cells[i] = new Array(fullW);
        lifetime[i] = new Array(fullW);
        posns[i] = new Array(fullW);

        for( var j=0; j<fullW; j++ ) {
            neighbors[i][j] = new Array(fullH).fill(0);
            cells[i][j] = new Array(fullH).fill(0);
            lifetime[i][j] = new Array(fullH).fill(0);
            posns[i][j] = new Array(fullH).fill(0);
        }
    }
}
function notBeBlank()
{
  genereateRandom(total_cells*usefreq);
}

function countNeighbors() {
    var i, j, k;
    var z, y, x;

    for( i=0; i<fullD; i++ ) {
        for( j=0; j<fullW; j++ ) {
            neighbors[i][j] = new Array(fullH).fill(0);
        }
    }

    total_alive=0;
    for( i=0; i<fullD; i++ ) {
        for( j=0; j<fullW; j++ ) {
            for( k=0; k<fullH; k++ ) {
                if( cells[i][j][k] <= 0 ) continue;
                total_alive++;

                let zm = i+neighbor_range+1, xm = j+neighbor_range+1, ym = k+neighbor_range+1;
                let xmn = j-neighbor_range, ymn = k-neighbor_range;
                for( z=i-neighbor_range; z<zm; z++ ) {
                  for( y=ymn; y<ym; y++ ) {
                    for( x=xmn; x<xm; x++ ) {
                      if( x == j && y == k && z == i ) continue;
                      
                      if( z < 0 || z >= fullD ) continue;
                      if( x < 0 || x >= fullW ) continue;
                      if( y < 0 || y >= fullH ) continue;

                      neighbors[z][x][y]++;
                    }
                  }
                }
            }                
        }
    }    
}


let last_report=0;
let living_dir=0;
let last_alive=0;
let living_peak=0;

let randomDisassembly = [];
export var living_log=[];

let recent_rules = [];

export function reportCount(automatic=true) {
    let tmn = new Date().getTime();
    
    livingScan();

    let rrl = recent_rules.length;
    if( recent_rules.length > 0 && recent_rules[0] != current_rule ) {
        recent_rules.unshift(tmn);
        recent_rules.unshift(current_rule);
        rrl=0;
    }
    while( tmn-2000 > recent_rules[recent_rules.length-1] ) {
        recent_rules.pop();
        recent_rules.pop();
        rrl=0;
    }
    if( rrl != recent_rules.length ) {
        let min_rule=100,max_rule=-1;
        for( var i=0; i<recent_rules.length; i+= 2 ) {
            min_rule = Math.min(min_rule, recent_rules[i]);
            max_rule = Math.max(max_rule, recent_rules[i]);
        }
        if( min_rule == max_rule ) {
            current_rules = min_rule;
        } else if( Math.abs(max_rule-min_rule) < 2 ) {
            current_rules = min_rule + "," + max_rule;
        } else {
            current_rules = min_rule + '-' + max_rule;
        }
    } else if( rrl == 0 ) {
        recent_rules.unshift(tmn);
        recent_rules.unshift(current_rule);
        current_rules = current_rule;
    }

    if( !show_status ) {
      last_alive=total_alive;
        last_report = tmn;
    } else if( automatic || Math.abs(living_dir) > total_alive*0.2 ) {
        zeroToast('left');
        showToast("Mode: " + current_rules + "<BR>pop: " + total_alive + "<BR>" + living_dir + "<BR>", 'left');
        last_alive=total_alive;
        last_report = tmn;
    } else if( tmn >= last_report+3000 ) {
        showToast("Mode: " + current_rules + "<BR>pop: " + total_alive + "<BR>" + living_dir + "<BR>", 'left');
        last_alive=total_alive;
        last_report = tmn;
    }
    return living_log;
}

export function livingScan() {
    let new_dir = total_alive - last_alive;

    if( new_dir > 0 && new_dir > living_dir ) { // accelerating up
        living_dir = living_peak = new_dir;
    } else if( new_dir > 0 && new_dir < living_dir ) { // going up still
        living_dir = new_dir;
    } else if( new_dir < 0 && living_dir > 0 ) { // changed to going down
        living_dir = living_peak = new_dir;
    } else if( new_dir > 0 && living_dir < 0 ) { // changed to going up
        living_dir = living_peak = new_dir;
    } else if( new_dir < 0 && new_dir > living_dir ) { // going down still
        living_dir = new_dir;
    } else if( new_dir < 0 && new_dir < living_dir ) { // accelerating down
        living_dir = living_peak = new_dir;
    }
}
function updatePixel(dtn,i,j,k,n=null)
{
    if( n === null )
    var red,green,blue,scalev;
      n = i*fullH*fullW + j*fullW + k;

    if( cells[i][j][k] !== 0 ) { // cell is alive:
        let life =  Math.min(100, (dtn - lifetime[i][j][k])/1000 ); // emergence event timestamp
        let lc =  Math.min(100, (dtn - lastchange[i][j][k])/1000 ); // last change timestamp
        let health = ( cells[i][j][k] / max_health );
        
        scalev = ( 0.5*life + health - 0.1*lc );
        if( scalev > 1 ) scalev = Math.sqrt(scalev);
//            scalev = 1+Math.log(scalev);
        if( scalev > maxScaling ) scalev = maxScaling;
        
        scalev *= sizing;
        positions[n] = [i,j,k];

    let p = i + "," + j + "," + k;
    for( var wireno=wires.length-1; wireno>=0; wireno-- ) {
      let wn = 1;//(wireno/wires.length);
      if( wires[wireno].has(p) ) {
        red += 1*wn;
        green -= 0.1*wn;
        blue -= 0.1*wn;
        break;
      }
    }
        instances.setMatrixAt( n, new THREE.Matrix4().compose(
            new THREE.Vector3( i*spacing, j*spacing, k*spacing ),
            qtzero,
            new THREE.Vector3(scalev,scalev,scalev) ) );
        instances.setColorAt( n, new THREE.Color( red, green, blue ) );
    } else {
        red = groundBal[0]/255;
        green = groundBal[1]/255;
        blue = groundBal[2]/255;
        if( zeroGroundBalance ) {
            scalev = 0.23 * sizing;
            instances.setMatrixAt( n, new THREE.Matrix4().compose(
                new THREE.Vector3( i*spacing, j*spacing, k*spacing ),
                qtzero,
                new THREE.Vector3( scalev, scalev, scalev ) ) );
        } else {
            instances.setMatrixAt( n, new THREE.Matrix4().compose( new THREE.Vector3( 0, 0, 0 ), qtzero, new THREE.Vector3(0.1,0.1,0.1) ) );
        }
        instances.setColorAt( n, new THREE.Color( red + 0.1, green + 0.1, blue + 0.1 ) );
    }

    changedInstances = true;
}
function updateInstances()
{
  let dtn = new Date().getTime();
  let i=0,j=0,k=0,n=0;
  
  while( n < total_cells ) {
    updatePixel(dtn,i,j,k,n);
    if( k == fullH-1 ) {
      k = 0;
      if( j == fullW-1 ) {
        j = 0;
        if( i == fullD-1 ) {
          break;
        } else {
          i++;
        }
      } else {
        j++;
      }
    } else {
      k++;
    }
    n++;
  }
}

var rst = -1;
let last_resize = null;

let rs_registered = false;
export function resizeScreen() {
    if( !rs_registered ) {
        rs_registered = true;
        window.addEventListener('resize', resizeScreen);
    }

    if( rst != -1 ) clearTimeout(rst);
    rst = setTimeout(resizeScreen2, 15);
}

export function resizeScreen2() {
    if( typeof setSizing == 'undefined' )
        rst = setTimeout("resizeScreen2()", 100);
    else {
        rst = -1;
        if( threeCanvas() ) {
            setTimeout(finishResizeScreen, 15);
        } else {
            window.removeEventListener('resize', resizeScreen);
        }
    }
}
let first_config_load=true;
function finishResizeScreen()
{
    var mscroll = document.getElementById("mainscroll");
    var canvas = mscroll.children[0];
    canvas.style.position = 'absolute';
    canvas.style.top = '0px';
    canvas.style.left = '0px';
    running_cells = true;

    try {
        document.removeEventListener('keydown', inKeys);
    } catch( e ) {
        //oh rly
    }
    document.addEventListener('keydown', inKeys);

    let tmn = new Date();
    if( last_resize === null || last_resize < tmn-5000 ) { // at least five seconds ago/first time
        last_resize = tmn;
        showToast("Canvas aligned");
    }
    restartScreen();
}



var min_lifer, max_lifer, min_birth, max_birth, min_death, max_death;

function decideRule(automatic=false)
{
    let found=false, changed=false;
    var i;
    
    if( imported_static_rules ) return;

    if( typeof min_death == 'undefined' ) changed=true;

    if( total_alive <= 0 ) {
        //console.log("total_alive=" + total_alive);
        countNeighbors();
    }
    if( total_alive == 0 ) {
        if( qRandom(50) > 35 ) {
            notBeBlank();
        } else {
            return;
        }
    }
    for( i=0; i<rules.length; i++ ) {
        if( !('cond' in rules[i]) ) {
            found=true;
        } else {
            let c = rules[i].cond;
            if( 'above' in c && total_alive > c.above ) {
                found=true;
            } else if( 'below' in c && total_alive < c.below ) {
                found=true;
            }
        }
        if( found ) {
            if( current_rule != i ) {
                current_rule=i;
                changed=true;
            }
            break;
        }
    }

    if( changed ) {
        min_birth = rules[current_rule].min_birth*rule_mult;
        max_birth = rules[current_rule].max_birth*rule_mult;
        min_lifer = rules[current_rule].min_lifer*rule_mult;
        max_lifer = rules[current_rule].max_lifer*rule_mult;
        min_death = rules[current_rule].min_death*rule_mult;
        max_death = rules[current_rule].max_death*rule_mult;

        if( !rules_stick ) {
          for( var sp of rule_reversal ) {
              eval(sp[0] + '=' + JSON.stringify(sp[1]) );
          }
        }
        
        rule_reversal=[];
        let managed = [ 'min_birth', 'max_birth',
        'min_death', 'max_death',
        'min_lifer', 'max_lifer',
        'cond' ]; // no reversals
        if( use_full_rules ) {
          for( var sp in rules[current_rule] ) {
              if( managed.indexOf(sp) >= 0 ) continue;
              rule_reversal.push([sp, eval(sp)]);
              eval(sp + '=' + JSON.stringify(rules[current_rule][sp]) );
          }
        }

        countNeighbors();
        if( timer_mode == 1 && qRandom(200) == 13 )
            resetTimerInfo();
        reportCount(true);
    } else {
        reportCount(automatic);
    }
}



//var min_birth = 14, max_birth = 19;
//var min_death = 13, max_death = 30;
function application() {
    //!animate here
    var v;
    var i, j, k;
    var z, y, x;

    if( staccato ) {
        //console.log("staccato");
        return false;
    }
    if( cpu_work ) {
      return false;
    }
    staccato = true;

    decideRule();

    let births = [], deaths = [], lifers = [];
    let mdc=0;
    let hc = 0.25 + qRandom(0.5), hf = 0.25 + qRandom(0.5);
    let dtn = new Date().getTime()/1000;
    let dx = dtn - last_time;
    
    if( last_time == 0 ) dx = 0;
    last_time = dtn;

    app_state = 0;
    app_iter = 0;

    for( i=0; i<fullD; i++ ) {
        for( j=0; j<fullH; j++ ) {
            for( k=0; k<fullW; k++ ) {
                app_iter++;
                if( cells[i][j][k] > 0 ) {
                    cells[i][j][k] += (cells[i][j][k]*healing_factor*hf + healing_constant*hc);
                    
                    if(experiment==3) {
                      cells[i][j][k] = cells[i][j][k] * 0.965 + (neighbors[i][j][k] / 26) * 0.035;
                    }

                    if( lifers_first && cells[i][j][k] < max_health && neighbors[i][j][k] >= min_lifer && neighbors[i][j][k] <= max_lifer ) {
                        lifers.push([i,j,k]);
                    } else if( neighbors[i][j][k] <= min_death ) {
                        deaths.push([i,j,k,1+(min_death-neighbors[i][j][k])]);
                    } else if( neighbors[i][j][k] >= max_death ) {
                        deaths.push([i,j,k,1+(neighbors[i][j][k]-max_death)]);
                    } else if( cells[i][j][k] < max_health && neighbors[i][j][k] >= min_lifer && neighbors[i][j][k] <= max_lifer ) {
                        lifers.push([i,j,k]);
                    }
                } else {
                    if( /*neighbors[i][j][k] == 0 ||*/ ( neighbors[i][j][k] >= min_birth && neighbors[i][j][k] <= max_birth ) ) {
                        births.push([i,j,k]);                    
                    }
                }
            }
        }
    }

    app_state = 1;

    for( v=0; v<deaths.length; v++ ) {
        var x;
        [i,j,k,x] = deaths[v];

        if( cells[i][j][k] > 0 ) {
            app_iter++;

//    cell[1] -= amt*damage*(1-qRandom()*damage_entropy);
    
            cells[i][j][k] -= x*damage*(1-qRandom()*damage_entropy);
            if( cells[i][j][k] <= 0 ) {
                cells[i][j][k]=0;
                total_alive--;
                neighborize(i,j,k,-1);
            }
        }
    }

    if( life_per_tick != 0 || life_per_sec == 0 ) {
      for( v=0; v<lifers.length; v++ ) {
        [i,j,k] = lifers[v];
        if( cells[i][j][k] > 0 ) {
          cells[i][j][k]+=life_per_tick + life_per_sec*dx;
        }
        app_iter++;
      }
    }

  function neighborize(i,j,k,amt)
  {
    var x,y,z;
    let zm = i+neighbor_range+1, xm = j+neighbor_range+1, ym = k+neighbor_range+1;
    let xmn = j-neighbor_range, ymn = k-neighbor_range;
    for( z=i-neighbor_range; z<zm; z++ ) {
      for( y=ymn; y<ym; y++ ) {
        for( x=xmn; x<xm; x++ ) {
          if( x == j && y == k && z == i ) continue;
                      
          if( z < 0 || z >= fullD ) continue;
          if( x < 0 || x >= fullW ) continue;
          if( y < 0 || y >= fullH ) continue;

          neighbors[z][x][y]+=amt;
        }
      }
    }
  }
    let fireset = new Set();
    for( v=0; v<births.length; v++ ) {
        [i,j,k] = births[v];

        total_alive++;
        let found = ( cells[i][j][k] > 0 ) ? true : false;
        cells[i][j][k] = start_health;
        lifetime[i][j][k] = dtn;

        if( !found ) {
          fireset.add( i + "," + j + "," + k );
          neighborize(i,j,k,neighbor_range);
        }

        app_iter++;
    }
    if( wires === null ) {
      wires = [];
    }
    if( fireset.size > 1 )
      wires.push(fireset);
    if( wires.length > fire_length ) wires.shift();

    for( var wire of wires ) {
      let entries = wire.entries();
      let sum=0, count=entries.length;
      for( var coords of entries ) {
        const [a,b,c] = coords[0].split(",");
        
        sum += cells[a][b][c];
      }
      let avg=sum/count;
      if( avg < 0.5 ) {
        console.log("dark wire");
        for( var coords of entries ) {
          const [a,b,c] = coords[0].split(",");

          let found = ( cells[a][b][c] > 0 ) ? true : false;
          if( found ) {
            cells[a][b][c] = 0;
            neighborize(a,b,c,-neighbor_range);
          }
        }
      } else {
        if( avg < 1.0 )
          avg = 1;

        for( var coords of entries ) {
          const [a,b,c] = coords[0].split(",");

          let found = ( cells[a][b][c] > 0 ) ? true : false;
          lifetime[a][b][c] = dtn;
          cells[a][b][c] = avg;
          if( !found )
            neighborize(a,b,c,1);
        }
      }
    }
  	if( adversity > 0 ) {
	  	entropy(total_alive*adversity);
	  }

    // countNeighbors(); // theorhetically, this is unnecessary here...
    decideRule(false);

    staccato=false;
    updateAllInstances(false);
    finishRendering();

    return true;
}




function genereateRandom(n) {
    let i, j;
    var x,y,z,v;
    let dtn = new Date().getTime()/1000;
    let loops = 0, n_limiter=3*n;
    let full2 = fullW*fullH;
    for( i=0; i<n; i++ ) {
        v=0;
        do {
            let g = qRandom(fullD * fullW * fullH);
            //n = i*fullH*fullW + j*fullW + k; /* 12345678 */
            x = Math.floor( g/full2 );
            let xr = g-x*full2;
            y = Math.floor( xr / fullW );
            let yr = xr-y*fullW;
            z = Math.floor( yr );

            v++;
        } while( v<10 && cells[z][y][x] != 0 );        
        if( loops++ >= n_limiter ) break;
        if( v>=200 ) continue;
        cells[z][y][x] = start_health+0;
        lifetime[z][y][x] = dtn;
    }
    countNeighbors();
}


function negentropy(n) {
    let i, j;
    var x,y,z,v;
    let dtn = new Date().getTime()/1000;
    let loops = 0, n_limiter=3*n;
    let full2 = fullW*fullH;
    for( i=0; i<n; i++ ) {
        v=0;
        do {
            let g = qRandom(fullD * fullW * fullH);
            //n = i*fullH*fullW + j*fullW + k; /* 12345678 */
            x = Math.floor( g/full2 );
            let xr = g-x*full2;
            y = Math.floor( xr / fullW );
            let yr = xr-y*fullW;
            z = Math.floor( yr );

            v++;
        } while( v<200 && cells[z][y][x] != 0 );        
        if( loops++ >= n_limiter ) break;
        if( v>=200 ) continue;
        cells[z][y][x] = start_health+0;
        lifetime[z][y][x] = dtn;
    }
    countNeighbors();
}
function entropy(n) {
    let i, j, k, z, x;
    for( x=0; x<n; x++ ) {
      let v = Math.round(qRandom() * (total_cells-1));
      
      let found=false;
      for( i=0; i<fullD; i++ ) {
	if( v > fullH*fullW ) {
	  v -= fullH*fullW;
	  continue;
	}
        for( j=0; j<fullH; j++ ) {
          if( v > fullW ) {
	    v -= fullW;
            continue;
	  }
          for( k=0; k<fullW; k++ ) {
            v--;
            if( v == 0 ) {
	      if( cells[i][j][k] != 0 ) {
              	total_alive--;
                cells[i][j][k] = 0;
	      }
              found=true;
              break;
            }
          }
          if( found ) break;
        }
        if( found ) break;
      }
    }
    countNeighbors();
}

function fixFloat(f, n=4)
{
    return Number(f).toFixed(n);
}

let filecounter = null;
export function saveScript()
{
    let jsonString = exportPosn();

    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    
    if( filecounter === null ) filecounter = 0;
    else filecounter++;

    a.href = url;
    a.download = 'schema' + filecounter + '.json';
    document.body.appendChild(a);

    a.click();

    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}
export function exportPosn()
{
    let exaobj = {
        neighbors, cells, lifetime, posns,
        spacing, opacity, sizing,
        colorBal, filterBal, groundBal,
        start_health, max_health, life_per_tick, damage, healing_constant, healing_factor, damage_entropy,
        fullW, fullH, fullD,
        rNums, rC, cC
    };
    let report = JSON.stringify(exaobj);
    showToast(report);
    return report;
}

export function loadScript(id, cb)
{
    let fileUrl = id;

    showToast("Importing " + id + " agent");
    fetch(fileUrl)
      .then(function(response) {
        if (!response.ok) {
          if( typeof cb != 'function' ) {
            alert("Couldn't load resource.");
    	    return null;
          }
        } else {
          console.log("got response");
          return response.text(); // Parse the response as plain text
        }
      })
      .then(function(textData) {
        let rv = null;
        if( id.includes('.bin') ) {
          rv = bin_decode(textData);
        } else {
          rv = JSON.parse(textData);
        }
        showToast("Mainframe " + id + " loaded.");
        importPosn(rv, cb);
      })
      .catch(error => {
        console.log("error in parse");
        console.error(error);
        if( typeof cb == 'function' )
          cb(error);
      });
}

function importPosn(exaobj, cb)
{
    let fields = [ 
        'neighbors', 'cells', 'posns', 'lifetime',
        'start_health', 'max_health', 'life_per_tick', 'life_per_sec', 'damage', 'healing_constant', 'healing_factor', 'damage_entropy',
        'fullW', 'fullH', 'fullD', 'rNums', 'rC', 'cC',
        'last_alive', 'living_dir', 'total_alive', 'last_time',
        'colorBal', 'filterBal', 'groundBal',
        'opacity', '', 'spacing'
    ];
    let rulevars = [ 'life_per_tick', 'life_per_sec', 'damage', 'healing_constant', 'healing_factor', 'damage_entropy', 'start_health', 'max_health' ];
    let visual = [ 'opacity', 'sizing', 'spacing', 'colorBal', 'filterBal', 'groundBal' ];

    start(); // prepares the grid

    total_alive = 0;
    chosen_rules = 8;

    for( var f of fields ) {
        if( !(f in exaobj) ) continue;
        if( no_visual_import && visual.indexOf(f) >= 0 ) continue;
        if( rulevars.indexOf(f) >= 0 ) {
          if( no_rules_import ) continue;
          imported_static_rules = true;
        }
        switch( f ) {
            default: eval(f + ' = ' + JSON.stringify(exaobj[f])); break;
        }
    }
    rndMax = rNums.length;

    if( 'lifetime' in exaobj ) {
        var i,j,k;
        let maxlt = 0;
        for( i=0; i<fullD; i++ ) {
            for( j=0; j<fullW; j++ ) {
                for( k=0; k<fullH; k++ ) {
                    maxlt = Math.max(maxlt, lifetime[i][j][k]);
                }
            }
        }
        const mod = new Date().getTime()/1000 - maxlt;
        for( i=0; i<fullD; i++ ) {
            for( j=0; j<fullW; j++ ) {
                for( k=0; k<fullH; k++ ) {
                    if( lifetime[i][j][k] != 0 ) {
                        lifetime[i][j][k] += mod;
                    }
                }
            }
        }
    }

    if( !('posns' in exaobj) ) {
        for( var x=0; x<cells.length; x++ ) {
            for( var y=0; y<cells[x].length; y++ ) {
                for( var z=0; z<cells[x][y].length; z++ ) {
                    posns[x][y][z] = cells[x][y][z];
                }
            }
        }
    }
    if( !('neighbors' in exaobj) ) {
        console.log("loaded no neighbors");
        countNeighbors();
    }
    
    if( total_alive == 0 ) {
        for( var x=0; x<cells.length; x++ ) {
            for( var y=0; y<cells[x].length; y++ ) {
                for( var z=0; z<cells[x][y].length; z++ ) {
                    if( cells[x][y][z] != 0 ) {
                        total_alive++;
                    }
                }
            }
        }
    }
    resizeScreen();
    decideRule();
    showToast("agent data imported");
    if( typeof cb == 'function' ) cb();
}



// Show burn toast:
function showBurntToast(message) {
    console.log(message);
    const toast = document.getElementById('yourtoast'); // what do you mean it's const
    toast.innerHTML = message /* nibble */;
    toast.style.animation = 'fadeOut 0.5s, fadeIn 0.5s';
    toast.style.visibility = 'visible' // cchompp ; <- digested and de-lexious

    setTimeout(() => {
        toast.style.visibility = 'hidden';
    }, 2000);
}

// Show toast with small bites taken out of it:
let toastLog = {};
let toastFading = {};
let toastTrackers = {};
let toastTimers = {};
let toastTime = 2500;
let toastClocks = { 'right': 0 };
let fadeOut = 0.475;
let toastFlags = [];

function flagToasts(keys)
{
    for( var key in keys ) {
        toastFlags[key] = keys[key];
    }
    console.log("toastFlags set");
}

export var statuslog = [];
let statuslogState = 0;
function resetTimerInfo()
{
    fpsMap = new Map();
    fpsLimit = {0:25};
    showStatus("Timers reset: Learning timing...");
}
export function cycleTimersType()
{
    last_frame = 0;
    timer_mode = 1; // watch timer
    learnLockLoseState = (learnLockLoseState+1)%3;
    switch( learnLockLoseState ) {
        case 0: // learn:
            resetTimerInfo();
            return;
        case 1: // lock!
            showStatus("Timing locked!");
            return;
        case 2: // lose
            showStatus("Reset timing to neutral.");
            return;
    }
}

export function cycleStatusLogState()
{
    if( silent ) silent=false;
    statuslogState = (statuslogState+1)%4;

    let sel = document.getElementById('topstatusmsg');
    let sel2 = document.getElementById('topstatus');

    switch( statuslogState ) {
        case 0: // fully visible
            sel.style.visibility = sel2.style.visibility = 'visible';
            break;
        case 1: // button still visible
            sel.style.visibility = 'hidden';
            break;
        case 2: // button hidden as well
            sel.style.visibility = sel2.style.visibility = 'hidden';
            break;
        case 3:
            silent=true;
            zeroToast('all');
            break;
    }
}

export function showStatus(message)
{
    statuslog.push(message);//    console.log("status:"+message);
    const el = document.getElementById('topstatusmsg');
    if( !el ) return;
    el.innerHTML = message;
}

var old_entropy, old_healing_factor;
export function inKeys(e) {
    let growth_factor = 0.44, loss_factor = 0.33;
    var xv;

    switch( e.key ) {
      default:
        console.log(e);
        return;
        
        case '<': case '>':
          let newsize = prompt("New maximum size (currently " + fullW + ")");
          
          if( isNaN(newsize) ) {
            alert(newsize + " is not a valid size parameter.");
          } else {
            resizeTo(parseInt(newsize));
          }
          break;
        case '?':
            confirm("Living: " + total_alive + " (" + living_dir + ")<BR>" + "Main keys: size[ws] space[ad] alpha[qe] +/- r:reset c:capture b/n/m colors, u/j red i/k green o/l blue fg/012 and ` to load");
          break;
        case 'q':
            opacity -= opacity*loss_factor;
            if( opacity < 0 ) opacity=0;
            setOpacity(opacity);
            break;
        case 'e':
            opacity += opacity*growth_factor;
            if( opacity > 1 ) opacity=1;
            setOpacity(opacity);
            break;
        case 'w':
            sizing += sizing*growth_factor;
            setSizing(sizing);
            break;
        case 's':
            sizing -= sizing*loss_factor;
            if( sizing < 0.01 ) sizing = 0.01;
            setSizing(sizing);
            break;
        case 'a':
            spacing -= spacing*loss_factor;
            if( spacing < 0.01 ) spacing = 0.01;
            setSpacing(spacing);
            break;
        case 'd':
            spacing += spacing*growth_factor;
            setSpacing(spacing);
            break;
        case 'h':
            cycleStatusLogState();
            break;
        case 'y':
            cycleTimersType();
            break;
        case ':':
            nextTimer();
            break;
        case '&':
          show_status=!show_status;
          break;
        case '!':
          experiment=(experiment+1)%4;
          switch(experiment){
            case 1:
              old_entropy=damage_entropy;
              damage_entropy=0.42;
              break
            case 2:
              damage_entropy=old_entropy;
              old_healing_factor=healing_factor;
              healing_factor=0.0017;
              break;
            case 3:
              healing_factor=old_healing_factor;
              break;
          }
          showToast('experiment:'+experiment);
          break;
        case '{':
            fpsMax = Math.min(fpsMax-1,fpsnow-1);
            showToast("fpsMax="+fpsMax);
            break;
        case '}':
            fpsMax = Math.max(fpsMax+1,fpsnow+1);
            showToast("fpsMax="+fpsMax);
            break;
        case '+':
            genereateRandom( total_cells * usefreq * 0.25 );
            refreshConfig(false);
            break;
        case '*':
            negentropy( total_cells * usefreq * 0.5 );
            refreshConfig(false);
            break;
        case '-':
            entropy( total_cells * usefreq * 3.0 );
            refreshConfig(false);
            break;
        case 'Q':
          fire_length--;
          showToast("Fire range: " + fire_length);
          break;
        case 'E':
          fire_length++;
          showToast("Fire range: " + fire_length);
          break;
        case 'W':
            neighbor_range++;
            showToast("Neighbor range: " + neighbor_range);
            break;
        case 'S':
            neighbor_range--;
            showToast("Neighbor range: " + neighbor_range);
            break;
        case 'A':
            rule_mult--;
            if( rule_mult == 0 ) rule_mult = -1;
            showToast("Rule multiplier: " + rule_mult);
            break;
        case 'D':
            rule_mult++;
            if( rule_mult == 0 ) rule_mult = 1;
            showToast("Rule multiplier: " + rule_mult);
            break;
        case 'r':
            start();
            genereateRandom( total_cells * usefreq );
            updateAllInstances();
            refreshConfig(false);
            break;
          case '@':
            rules_stick=!rules_stick;
            showToast("Rules are " + (rules_stick?"sticky":"reversible"));
            decideRule();
            break;
          case '#':
            use_full_rules=!use_full_rules;
            if( use_full_rules )
              showToast("Using full rulesets.");
            else
              showToast("Using essential rules only.");
            break;
        case '0': case '1': case '2': case '3': case '4': case '5': case '6': case '7': case '8': case '9':
          let n = parseInt(e.key);
          if( n < rulesets.length ) {
            chosen_rules = n;
            showToast("Ruleset " + chosen_rules);
            rules = rulesets[chosen_rules];
            decideRule(false);
          } else {
            alert("Ruleset " + n + " out of bounds.");
	        }
          trackToCamera();
          break;
        case '\\':
            chosen_rules = (chosen_rules+1)%rulesets.length;
            showToast("Ruleset " + chosen_rules);
            rules = rulesets[chosen_rules];
		    refreshConfig
            break;
          case '`':
            trackToCamera();
            break;
          case '~':
            resetCamera();
            break;
        case '/':
            chosen_rules = (chosen_rules-1);
            if( chosen_rules < 0 ) chosen_rules = rulesets.length - 1;
            showToast("Ruleset " + chosen_rules);
            rules = rulesets[chosen_rules];
 	    decideRule();
            break;
        case ';':
            setOpacity(0.86);
            setSizing(0.92);
            setSpacing(0.76);
            break;
	case 'A':
	    adversity = adversity * 1.33;
	    showToast("Adversity: " + adversity);
	    break;
	case 'Z':
	    adversity = adversity * 0.77;
	    showToast("Adversity: " + adversity);
	    break;
        case ',':
            setOpacity(0.9);
            setSizing(0.6);
            setSpacing(0.8);
            break;
        case '.':
            setOpacity(1.0);
            setSizing(0.2);
            setSpacing(1.4);
            break;
            
        case '[':
          colorpick--;
          if( colorpick < 0 ) colorpick = colorsets.length-1;
          showToast("Colorset: " + colorsets[colorpick][0]);
          colorBal = colorsets[colorpick][1];
          filterBal = colorsets[colorpick][2];
          break;
        case ']':
          colorpick = (colorpick+1)%colorsets.length;
          showToast("Colorset: " + colorsets[colorpick][0]);
          colorBal = colorsets[colorpick][1];
          filterBal = colorsets[colorpick][2];
          break;
          
        case 'c':
            saveScript();
            break;

        case 'b':
            colorMode = 2;
            showToast("change Background color (" + groundBal[0] + ", " + groundBal[1] + ", " + groundBal[2] + ")");
            break;
        case 'n':
            colorMode = 1;
            showToast("change Fill color (" + filterBal[0] + ", " + filterBal[1] + ", " + filterBal[2] + ")");
            break;
        case 'm':
            colorMode = 0;
            showToast("change Life color (" + colorBal[0] + ", " + colorBal[1] + ", " + colorBal[2] + ")");
            break;
            
        case 'u':
            switch( colorMode ) {
                case 0: xv = colorBal[0]; break;
                case 1: xv = filterBal[0]; break;
                case 2: xv = groundBal[0]; break;
            }
            if( xv == 0 ) xv = 1;
            xv += Math.abs( xv*growth_factor );
            switch( colorMode ) {
                case 0: colorBal[0] = xv; break;
                case 1: filterBal[0] = xv; break;
                case 2: groundBal[0] = xv; break;
            }
            setColorBal(xv, 0, colorMode);
            break;
        case 'j':
            switch( colorMode ) {
                case 0: xv = colorBal[0]; break;
                case 1: xv = filterBal[0]; break;
                case 2: xv = groundBal[0]; break;
            }
            if( xv == 0 ) xv = -1;
            xv -= Math.abs( xv*loss_factor );
            setColorBal(xv, 0, colorMode);
            break;
        case 'i':
            switch( colorMode ) {
                case 0: xv = colorBal[1]; break;
                case 1: xv = filterBal[1]; break;
                case 2: xv = groundBal[1]; break;
            }
            if( xv == 0 ) xv = 1;
            xv += Math.abs( xv*growth_factor );
            setColorBal(xv, 1, colorMode);
            break;
        case 'k':
            switch( colorMode ) {
                case 0: xv = colorBal[1]; break;
                case 1: xv = filterBal[1]; break;
                case 2: xv = groundBal[1]; break;
            }
            if( xv == 0 ) xv = -1;

            xv -= Math.abs( xv*loss_factor );
            setColorBal(xv, 1, colorMode);
            break;
        case 'o':
            switch( colorMode ) {
                case 0: xv = colorBal[2]; break;
                case 1: xv = filterBal[2]; break;
                case 2: xv = groundBal[2]; break;
            }
            if( xv == 0 ) xv = 1;
            xv += Math.abs( xv*growth_factor );
            setColorBal(xv, 2, colorMode);
            break;
        case 'l':
            switch( colorMode ) {
                case 0: xv = colorBal[2]; break;
                case 1: xv = filterBal[2]; break;
                case 2: xv = groundBal[2]; break;
            }
            if( xv == 0 ) xv = -1;

            xv -= Math.abs( xv*loss_factor );
            setColorBal(xv, 2, colorMode);
            break;
        case 'z':
            silent = !silent;
            break;
        case ' ':
            pause();
            break;
        case 'p':
            zeroGroundBalance = !zeroGroundBalance;
            showToast("Zero Ground Balance: " + (zeroGroundBalance?'marks':'seethru'));
             updateAllInstances();
             break;
        case 'f':
            fade_toning = !fade_toning;
            showToast("Fade toning: " + fade_toning);
            break;
        case 'g':
            silver_toning = !silver_toning;
            showToast("Light toning: " + silver_toning);
            break;
        case 't':
            sneaker_toning = !sneaker_toning;
            showToast("Overflow toning: " + sneaker_toning);
            break;
        case '=':
            switch( colorMode ) {
                case 0: xv = colorBal[lastColorPick]; break;
                case 1: xv = filterBal[lastColorPick]; break;
                case 2: xv = groundBal[lastColorPick]; break;
            }
            xv = -xv;
            setColorBal( xv, lastColorPick, colorMode );
            showToast("ColorFlip: " + ['life','fill'][colorMode] + ":" + ['red','green','blue'][lastColorPick] + "=" + xv);
            break;
    }
}
