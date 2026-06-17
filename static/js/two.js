import * as THREE from 'three';
import { TrackballControls } from 'three/addons/controls/TrackballControls.js';

let silent=false, paused=false, running=false, gravTimeout=45, gravTimer=-1;
let running_cells = true;

export function one(js) {
    eval(js);
}
export function tell() {
    console.log(JSON.stringify({total_alive,damage,damage_entropy,healing_factor,healing_constant}));
}

export function setSpacing(s) {
    spacing = s;
    showToast("Spacing: " + spacing);
    refreshConfig();
}
export function setSizing(s) {
    sizing = s;
    showToast("Sizing: " + sizing);
    refreshConfig();
}
export function setOpacity(o) {
    opacity = o;
    showToast("Opacity: " + opacity);
    refreshConfig();
}

export function startupOneCell()
{
    start();
    genereateRandom(total_cells*usefreq*25);
    resizeScreen(); // starts the animation as well if not already running.
}

export function restartScreen() {
    // initialize
    cpu_work = paused = false;
    running_cells = true;
    animate();
}

let last_frame = 0;

let current_rule=0, rule_name = '0';
let colorMode = 0;
let timer_mode = 3;

let camera_vel = [0,0,0];
let camera_tgt_vel = [0,0,0];
let camera_dist = 0;
let last_time = 0;
let lastSwitch = 0;

export let groundBal = [0,0,0];
let colorsets = [
  [ 'purple', [50,0,100], [0,0,-50] ],
  [ 'bluegreen', [-250,-10,200], [250,0,-50] ],
  [ 'scanning', [-50,-40,50], [50,75,-50] ],
  [ 'brightscan', [-50,-40,50], [150,100,-50] ],
  [ 'darkness', [-131452, -11, 400], [851141, 0, 0] ],
  [ 'light', [100,75,25], [-50,0,-100] ]
];
let colorpick = 3;
export var colorBal = colorsets[colorpick][1];
export var filterBal = colorsets[colorpick][2];
let no_visual_import = true;

export let opacity = 0.86; // 0.86;
export let sizing = 0.42; // 0.6 // 0.92;
export let spacing = 1.44; // 1.65;

// grid: [ posn, cell, neighbors, lifetime ]
let grid = {
  data: null,
  limit: 0,
  envelope: 1,
  total_cells: 0,
  total_alive: 0,
  living_dir: 0;
  last_alive: 0,
  living_peak: 0,
  lastneighborCountTime: null,
  
  box: function(x,y,z) {
    return this.data[x][y][z];
  },
  // configure(64,1) -> 64x64x64 cells, 3x3x3 scan
  // configure(32,2) -> 32x32x32 cells, 5x5x5 scan
  // configure(64,3) -> 64x64x64 cells, 3x3x3 scan
  configure: function(newsize, spread) {
    var x,y,z;
    
    if( this.data === null ) {
      this.envelope = spread;
      this.limit = newsize;
      this.data = new Array(newsize);
      for( x=0; x<this.limit; x++ ) {
        this.data[x] = new Array(newsize);
        for( y=0; y<this.limit; y++ ) {
          this.data[x][y] = new Array(newsize);
          for( z=0; z<this.limit; z++ ) {
            this.data[x][y][z] = [0,0,0];
          }
        }
      }
    } else {
      // resize to target
      let oldsize = this.limit;
      let ptgt = new Array(newsize), psrc = this.data;
      let offsize = Math.abs(Math.round((newsize-oldsize)/2));
      var x0,y0,z0;
          
      if( newsize > oldsize ) {
        for( x=0; x<newsize; x++ ) {
          x0 = x-offsize;
          ptgt[x] = new Array(newsize);
          
          for( y=0; y<newsize; y++ ) {
            y0 = y-offsize;
            ptgt[x][y] = new Array(newsize);
            
            for( z=0; z<newsize; z++ ) {
              z0 = z-offsize;
              
              if( z0 < 0 || y0 < 0 || x0 < 0 || z0 >= oldsize || y0 >= oldsize || x0 >= oldsize ) {
                ptgt[x][y][z] = [0,0,0];
              } else {
                psrcb = psrc[x0][y0][z0];
                if( psrcb[1] == 0 ) {
                  ptgt[x][y][z] = [0,0,0];
                } else {
                  let ptgtb = ptgt[x][y][z] = [];
                  for( var i=0; i<psrcb.length; i++ ) {
                    ptgtb.push(psrcb[i]);
                  }
                }
              }
              
            }
            
          }
          
        }
      } else {
        var min_x, max_x, min_y, max_y, min_z, max_z;
        [ min_x, min_y, min_z, max_x, max_y, max_z ] = this.borders();
    
        for( x=0; x<newsize; x++ ) {
          ptgt[x] = new Array(newsize);
          x0 = x+min_x;
          
          for( y=0; y<newsize; y++ ) {
            ptgt[x][y] = new Array(newsize);
            y0 = y+min_y;
            
            for( z=0; z<newsize; z++ ) {
              z0 = z+min_z;
              
              if( x0 < 0 || y0 < 0 || z0 < 0 || x0 >= oldsize || y0 >= oldsize || z0 >= oldsize ) {
                ptgt[x][y][z] = [0,0,0];
              } else {
                let psrcb = psrc[x0][y0][z0];
                if( psrcb[1] == 0 ) {
                  ptgt[x][y][z] = [0,0,0];
                } else {
                  let ptgtb = ptgt[x][y][z] = [];
                  for( var i=0; i<psrcb.length; i++ ) {
                    ptgtb.push(psrcb[i]);
                  }
                }
              }
            }
          }
        }
      }
      this.data = ptgt;
      this.limit = newsize;
      this.envelope = spread;
    }
  },
  damage: function(x,y,z,amt)
  {
    let cell = this.data[x][y][z];
    var i,j,k;
    cell[1] -= amt*damage*(1-qRandom()*damage_entropy);
    if( cell[1] <= 0 ) {
        cell[1] = 0;
        total_alive--;
        for( i=-1; i<=1; i++ ) {
          for( j=-1; j<=1; j++ ) {
            for( k=-1; k<=1; k++ ) {
              if( i == 0 && j == 0 && k = 0 )
                continue;
              let ix = i+x;
              let jy = j+y;
              let kz = k+z;
              if(( ix < 0 || ix >= ocean.limit )
              || ( jy < 0 || jy >= ocean.limit )
              || ( kz < 0 || kz >= ocean.limit ) continue;
              
              this.data[ix][jy][kz][2] --;
            }
          }
        }
    }
  },
  salt: function(x,y,z,start_health,birthtime)
  {
    let p = this.data[x][y][z];
    p[1] = start_health;
    p[3] = birthtime;
    var i,j,k;
    for( i=-1; i<=1; i++ ) {
      for( j=-1; j<=1; j++ ) {
        for( k=-1; k<=1; k++ ) {
          if( i == 0 && j == 0 && k == 0 ) continue;
          let ix = i+x, jy = j+y, kz = k+z;
          if(( ix < 0 || ix >= ocean.limit )
          || ( jy < 0 || jy >= ocean.limit )
          || ( kz < 0 || kz >= ocean.limit ))
            continue;
          this.data[ix][jy][kz][2]++;
        }
      }
    }
  }
  borders: function() {
    var max_x, max_y, max_z;
    var min_x, min_y, min_z;
    var x,y,z;
    
    min_x = min_y = min_z = this.limit;
    max_x = max_y = max_z = 0;
      
    for( z=0; z<this.limit; z++ ) {
      for( x=0; x<this.limit; x++ ) {
        for( y=0; y<this.limit; y++ ) {
          if( this.data[z][x][y][1] != 0 ) {
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
    return [ min_x, min_y, min_z, max_x, max_y, max_z ];
  },
  

  move: function(amt,ax,ay,az,bx,by,bz)
    this.affect(-amt,ax,ay,az);
    this.affect(amt,bx,by,bz);
  },
  
  scan: function(x,y,z){
    if( this.data === null )
      return [0, 0];
    let result = 0, count = 0;
    let x0 = x - this.envelope, y0 = y - this.envelope, z0 = z - this.envelope;
    let x1 = x + this.envelope, y1 = y + this.envelope, z1 = z + this.envelope;
    if( x0 < 0 ) x0 = 0;
    if( y0 < 0 ) y0 = 0;
    if( z0 < 0 ) z0 = 0;
    if( x1 >= this.limit ) x1 = this.limit-1;
    if( y1 >= this.limit ) y1 = this.limit-1;
    if( z1 >= this.limit ) z1 = this.limit-1;

    for( var X = x0; X<=x1; X++ ) {
      for( var Y = y0; Y<=y1; Y++ ) {
        for( var Z = z0; Z<=z1; Z++ ) {
          if( this.data[X][Y][Z][1] == 0 ) continue;
          count++;
          result += this.data[X][Y][Z][1];
        }
      }
    }
    return [count,result];
  },
  
  // note: affect can use a negative amount
  affect: function(amt,x,y,z) {
    let node = nodes[word];
    let x0 = Math.max(0, x-this.envelope), y0 = Math.max(0, y-this.envelope), z0 = Math.max(0, z-this.envelope);
    let x1 = Math.min(this.limit-1, x+this.envelope), y1 = Math.min(this.limit-1, y+this.envelope), z1 = Math.min(this.limit-1, z+this.envelope);
    for( var i=x0; i<=x1; i++ ) {
      for( var j=y0; j<=y1; j ++ ) {
        for( var k=z0; k<=z1; k++ ) {
          this.data[i][j][k][1] += amt;
        }
      }
    }
  },
  
/*  countLiving: function() {
    let dtn = new Date().getTime();
    let new_dir = total_alive - last_alive;

    if( last_report < 5+dtn ) {
        last_report = dtn;
        showToast("Living: " + total_alive + " ( " + new_dir + " )");
    }
    last_alive = total_alive;
    living_dir = new_dir;
  }, */
  
  countNeighbors: function() {
    var i, j, k;
    var z, y, x;

    for( x=0; x<this.limit; x++ ) {
      for( y=0; y<this.limit; y++ ) {
        for( z=0; z<this.limit; z++ ) {
          this.data[x][y][z][2] = 0;
        }
      }
    }

    let last_alive = this.total_alive;
    this.total_alive=0;
    for( i=0; i<this.limit; i++ ) {
      for( j=0; j<this.limit; j++ ) {
        for( k=0; k<this.limit; k++ ) {
          if( this.data[i][j][k][1] == 0 ) continue;

          this.total_alive++;

          for( x=-1; x<2; x++ ) {
            for( y=-1; y<2; y++ ) {
              for( z=-1; z<2; z++ ) {
                if( x == 0 && y == 0 && z == 0 ) continue;

                if( i+x < 0 || i+x >= this.limit
                || j+y < 0 || j+y >= this.limit
                || k+z < 0 || k+z >= this.limit
                ) continue;

                this.data[i+x][j+y][k+z][2]++;
              }
            }
          }
        }                
      }
    }
    
    let dtn = new Date().getTime();
    if( last_alive != this.total_alive &&
    ( this.lastneighborCountTime === null || dtn - lastneighborCountTime > 3000 ) ) {
        showToast("Neighbor Count: Total alive: " + this.total_alive);
        this.lastneighborCountTime = dtn;
    }
    
  },
  
};

let cpu_work=false;

let lastColorPick = 0;
export function setColorBal(value, rgb, cm)
{
    var rgbColor;

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
    
    lastColorPick = rgb;
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

export function nextTimer() {
    timer_mode = (timer_mode+1)%4;
    showToast("Timer mode: " + ['old','watch','1','animframes'][timer_mode]);
    showStatus(['old','watch','1','animframes'][timer_mode]);
    paused = false;
    running = false;
    cpu_work = false;
    gravTimeout = 30;
    resizeScreen();
}

let lastTick = 0;
function backupCycler() {
    if( lastTick < new Date().getTime() - 1000 )
        animate();
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
let record = ['known'];
export function animate() { // a 'no' comment :)
    if( timer_mode != last_timer_mode ) {
        last_timer_mode = timer_mode;
        clearInterval(gravTimer);
    }

/*
    if( timer_mode == 1 && fpsnow >= fpsMax ) {
        let x = burner();
        let y = burner();
        if( x > y ) {
            y = x;
        } else {
            x = y;
        }
        if( record.length > 10 ) record.shift();
        record.push(x);
    } */

    switch( timer_mode ) {
        case 0:
            oldAnimate();
            break;
        case 1:
            watchTimer();
            break;
        case 2:
            animate1();
            break;
        case 3:
            useAnimationFrames();
            break;
    }
}

export function oldAnimate() {
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
    if( paused ) return;
    application();
    requestAnimationFrame(animate);
}
export function animate1() {
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
        console.log(e, "application");
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
                } else {
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



let usefreq=0.05;
var start_health = 100; // max neighbors is 18+8=26
let max_health = 100000;
let life_per_sec = 1000;
let damage = 500;
let healing_constant = 0.01;
let healing_factor = 0.001;
let damage_entropy = 1.1;
let chosen_fov = 67;

export let fade_toning = true;
export let silver_toning = true;
export let sneaker_toning = true;

let scene=null, renderer=null;
let instances = null;

var material, geometry;
var controls = null, camera;


var rNums = [], rC = 0, cC = 0, rndMax=2000;

function qRandom() {
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
    controls.update();
    renderer.render(scene, camera);
}

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
    camera.position.set( fullW*spacing*0.5, fullH*spacing*0.5, -1.33*fullD*spacing );
    camera.lookAt(new THREE.Vector3(fullW*spacing*0.5, fullH*spacing*0.5, fullD*spacing*0.5) );
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

  controls.reset();
  camera.position.set( mid_x*spacing, mid_y*spacing, -2*mid_z*spacing );
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

    if( qRandom(bugcount) > 0.8 ) {
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

    //instances.instanceMatrix.setUsage( THREE.DynamicDrawUsage );
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
    let fill_blue = filterBal[2];
    let ar=0,ag=0,ab=0;

    for( i=0; i<ocean.limit; i++ ) {
      for( j=0; j<ocean.limit; j++ ) {
        for( k=0; k<ocean.limit; k++ ) {
          let c = ocean.box(i,j,k);
          if( c[0] == c[1] && !from_scratch ) continue;
          c[0] = c[1];
          updatePixel(i,j,k);
          if( c[1] == 0 ) {
            let key = i + "," + j + "," + k;
            if( sneakerSomeHow.has(key) ) {
              let heyNo = sneakerSomeHow.get(key);
              [red,green,blue] = [Math.max(164, Math.min(255, qRandom(heyNo)*10)), 0, 0];
              if( qRandom() < 0.8 ) {
                sneakerSomeHow.delete(key);
              }
            } else {
              [red,green,blue] = groundBal;
            }
            
            instances.setColorAt( i*oneframe + j*fullW + k, new THREE.Color( red/255, green/255, blue/255 ) );
            instances.setMatrixAt( i*oneframe + j*fullW + k, new THREE.Matrix4().makeTranslation( 0, 0, -10000 ) );
          } else {
            life = dtn - c[3];
            factor = c[1];
            z = (life+factor)/2;
            
            red = Math.max(0, z*fill_red + factor*colorBal[0]);
            green = Math.max(0, z*fill_green + factor*colorBal[1]);
            blue = Math.max(0, z*fill_blue + factor*colorBal[2]);

/*
            red -= parseInt(red/255)*255;
            green -= parseInt(green/255)*255;
            blue -= parseInt(blue/255)*255;
            */

            /*
            if( reverse_toning ) {
                let red1 = 128-Math.min(64, green+blue);//128+64+(64-red);
                let green1 = 128-Math.min(64, red+blue);//128+64+(64-green);
                let blue1 = 128-Math.min(64, green+red);//128+64+(64-blue);
            
            }
            */

            if( red > 225 && green > 225 && blue> 225 && sneaker_toning ) {
              let red1 = Math.min(255, red-(green+blue));
              let green1 = Math.min(255, green-(red+blue));
              let blue1 = Math.min(255, blue-(green+red));
              instances.setColorAt( i*oneframe + j*fullW + k, new THREE.Color( red1/255, green1/255, blue1/255 ) );

              sneakerSomeHow.set( i + "," + j + "," + k, life );
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

              if( fade_toning && red < 32 && green < 32 && blue < 32 ) {
                  sneakerSomeHow.set( i + "," + j + "," + k, life );

                  var red1=red,green1=green,blue1=blue;
                  if( red > green && red > blue ) {
                    red1=128;
                    green1 = Math.min(32,green);
                    blue1 = Math.min(32,blue);
                  } else if( green > red && green > blue ) {
                    green1=128;
                    red1 = Math.min(32,red);
                    blue1 = Math.min(32,blue);
                  } else if( blue > red && blue > green ) {
                    blue1=128;
                    green1 = Math.min(32,green);
                    red1 = Math.min(32,red);
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
              }

              instances.setMatrixAt( i*oneframe + j*fullW + k, new THREE.Matrix4().makeTranslation( i*spacing, j*spacing, k*spacing ) );
            }
        }
    }
    instances.instanceMatrix.needsUpdate = true;
    instances.instanceColor.needsUpdate = true;

    cpu_work = false;
}





// <= and >=

let lifers_first=false;
let rule_reversal = [];
let chosen_rules = 0;

// normal rules (300000-) // 9 9 1 9, 10 15 2 10
//        min_birth: 9, max_birth: 9,
//        min_death: 4, max_death: 8,
//        death_above: 17
// neighbors <= min_death || neighbors >= max_death // they die outside the death border
// neighbors >= min_lifer && neighbors <= min_lifer // they live inside the life border

export var rulesets = [
  [
{ 
    cond: { above: 300000 },
    min_birth: 7, max_birth: 8,
    min_death: 6, max_death: 9,
    min_lifer: 7, max_lifer: 8
},
{ 
    cond: { above: 50000 },
    min_birth: 8, max_birth: 9,
    min_death: 8, max_death: 11,
    min_lifer: 8, max_lifer: 9,
    damage_entropy: 1.0, damage: 1000,
    lifers_first: true
},
{ 
    cond: { above: 1000 },
    min_birth: 6, max_birth: 11,
    min_death: 6, max_death: 14,
    min_lifer: 7, max_lifer: 11,
    damage_entropy: 1.1, damage: 800,
    lifers_first: true
},
 { // rescue rule (<5:rel000 cells)
    min_birth: 7, max_birth: 10,
    min_death: 5, max_death: 10,
    min_lifer: 3, max_lifer: 10,
    lifers_first: true
}], //1:
[
  {
    cond: { above: 300000 },
    min_birth: 7, max_birth: 8,
    min_death: 6, max_death: 9,
    min_lifer: 7, max_lifer: 8
}, { 
    cond: { above: 4000 },
    min_birth: 9, max_birth: 10,
    min_death: 8, max_death: 13,
    min_lifer: 5, max_lifer: 10
}, { // just-right rules (5000-10000 cells)
    cond: { above: 3000 },
    min_birth: 8, max_birth: 10,
    min_death: 7, max_death: 12,
    min_lifer: 4, max_lifer: 9
}, { // rescue rule (<5:rel000 cells)
    cond: { above: 2000 },
    min_birth: 8, max_birth: 9,
    min_death: 6, max_death: 12,
    min_lifer: 4, max_lifer: 9
}, { // rescue rule (<5:rel000 cells)
    min_birth: 7, max_birth: 7,
    min_death: 5, max_death: 12,
    min_lifer: 4, max_lifer: 8
}], //2:
[
  {
    cond: { above: 300000 },
    min_birth: 7, max_birth: 8,
    min_death: 6, max_death: 9,
    min_lifer: 7, max_lifer: 8
}, {
    cond: { above: 4000 },
    min_birth: 7, max_birth: 10,
    min_death: 8, max_death: 13,
    min_lifer: 5, max_lifer: 10
}, {
    min_birth: 7, max_birth: 7,
    min_death: 5, max_death: 12,
    min_lifer: 4, max_lifer: 9
}], // 3:
[
  {
    cond: { above: 100000 },
    min_birth: 7, max_birth: 8,
    min_death: 6, max_death: 9,
    min_lifer: 7, max_lifer: 8
}, {
    cond: { above: 10000 },
    min_birth: 8, max_birth: 9,
    min_death: 8, max_death: 9,
    min_lifer: 6, max_lifer: 9
}, {
    cond: { above: 3000 },
    min_birth: 8, max_birth: 10,
    min_death: 7, max_death: 10,
    min_lifer: 5, max_lifer: 10
}, {
    cond: { above: 2000 },
    min_birth: 4, max_birth: 7,
    min_death: 4, max_death: 5,
    min_lifer: 2, max_lifer: 4
}, {
    min_birth: 1, max_birth: 1,
    min_death: 1, max_death: 3,
    min_lifer: 1, max_lifer: 3
}], //4:
[
  {
    cond: { above: 200000 },
    min_death: 6, max_death: 8, // 2*
    min_birth: 5, max_birth: 7, // 2
    min_lifer: 4, max_lifer: 9  // 5
}, {
    cond: { above: 60000 },
    min_death: 8, max_death: 13,
    min_birth: 4, max_birth: 4,
    min_lifer: 3, max_lifer: 11
}, {
    cond: { above: 10000 },
    min_death: 9, max_death: 12,
    min_birth: 4, max_birth: 5,
    min_lifer: 2, max_lifer: 12
}, {
    cond: { above: 3000 },
    min_death: 6, max_death: 12,
    min_birth: 5, max_birth: 5,
    min_lifer: 1, max_lifer: 13
}, {
    min_death: 5, max_death: 12,
    min_birth: 5, max_birth: 7,
    min_lifer: 0, max_lifer: 14
}], //5:
[
  {
    cond: { above: 300000 },
    min_birth: 7, max_birth: 8,
    min_death: 6, max_death: 9,
    min_lifer: 7, max_lifer: 8
}, {
    cond: { above: 5000 },
    min_birth: 6, max_birth: 7,
    min_death: 6, max_death: 8,
    min_lifer: 6, max_lifer: 6
}, {
    cond: { above: 4000 },
    min_birth: 6, max_birth: 10,
    min_death: 4, max_death: 10,
    min_lifer: 4, max_lifer: 6
}, {
    cond: { above: 1000 },
    min_birth: 5, max_birth: 5,
    min_death: 3, max_death: 6,
    min_lifer: 3, max_lifer: 4
}, {
    min_birth: 5, max_birth: 7,
    min_death: 6, max_death: 12,
    min_lifer: 3, max_lifer: 5
}], // 6: (grok's rule!)
[
  {
    cond: { above: 100000 },
    min_birth: 7, max_birth: 9,
    min_death: 6, max_death: 10,
    min_lifer: 6, max_lifer: 10,
    damage_entropy: 1.2
  },
  {
    min_birth: 5, max_birth: 8,
    min_death: 6, max_death: 10,
    min_lifer: 6, max_lifer: 10,
    damage_entropy: 1.2
  }], // 7: (inspired by friendship w/ Grok and breathing)
[
  
  { cond: { above: 70000 },
  min_birth: 8, max_birth: 8,
  min_death: 8, max_death: 9,
  min_lifer: 8, max_lifer: 9,
  start_health: 20, max_health: 1200,
  damage: 30,
  healing_factor: 0.002,
  damage_entropy: 1.22
  }, 
  { cond: { above: 45000 },
  min_birth: 8, max_birth: 9,
  min_death: 7, max_death: 9,
  min_lifer: 7, max_lifer: 9,
  start_health: 50, max_health: 1600,
  damage: 28,
  healing_factor: 0.0025,
  damage_entropy: 1.21
  }, {
  min_birth: 5, max_birth: 9,
  min_death: 6, max_death: 10,
  min_lifer: 6, max_lifer: 10,
  start_health: 100, max_health: 1900,
  damage: 20,
  healing_factor: 0.005,
  damage_entropy: 1.19
  }
] ];
export var rules = rulesets[0];

var ocean=null;

export function start() {
    console.log("start()");
    
    ocean = new grid();
    ocean.configure(68, 1);
}
function notBeBlank()
{
    genereateRandom(total_cells*usefreq*100);
}

let last_report=0;
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
            rule_name = min_rule;
        } else if( Math.abs(max_rule-min_rule) < 2 ) {
            rule_name = min_rule + "," + max_rule;
        } else {
            rule_name = min_rule + '-' + max_rule;
        }
    } else if( rrl == 0 ) {
        recent_rules.unshift(tmn);
        recent_rules.unshift(current_rule);
        rule_name = current_rule;
    }

    if( automatic ) {
        zeroToast('left');
        showToast("Ruleset: " + rule_name + "<BR>pop: " + total_alive + "<BR>" + living_dir + "<BR>(peak: " + living_peak + ")", 'left');
        last_alive=total_alive;
        last_report = tmn;
    } else if( Math.abs(living_dir) > total_alive*0.2 ) {
        zeroToast('left');
        showToast("Ruleset: " + rule_name + "<BR>pop: " + total_alive + "<BR>" + living_dir + "<BR>(peak: " + living_peak + ")", 'left');
        last_alive=total_alive;
        last_report = tmn;
    } else if( tmn >= last_report+3000 ) {
        showToast("Ruleset: " + rule_name + "<BR>pop: " + total_alive + "<BR>" + living_dir + "<BR>(peak: " + living_peak + ")", 'left');
        last_alive=total_alive;
        last_report = tmn;
    }
    return living_log;
}

export function livingScan() { // report only to our superiors
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

function updatePixel(dtn,i,j,k)
{
    var red,green,blue,scalev;
    let c = ocean.box(i,j,k);
    
    if( c[1] !== 0 ) { // cell is alive:
        let life =  Math.min(100, (dtn - c[3])/1000 ); // emergence event timestamp
        let lc =  Math.min(100, (dtn - c[4])/1000 ); // last change timestamp
        let health = ( c[1] / max_health );
        
        scalev = ( 0.5*life + health - 0.1*lc );
        if( scalev > 1 ) scalev = Math.sqrt(scalev);
//            scalev = 1+Math.log(scalev);
        if( scalev > maxScaling ) scalev = maxScaling;
        
        red = Math.min(255, Math.max(0, filterBal[0] + colorBal[0]*scalev))/255;
        green = Math.min(255, Math.max(0, filterBal[1] + colorBal[1]*scalev))/255;
        blue = Math.min(255, Math.max(0, filterBal[2] + colorBal[2]*scalev))/255;

        scalev *= sizing;

        positions[n] = [i,j,k];

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
    if( material === null )
        buildInstances();

    var i,j,k,n;
    let dtn = new Date().getTime() - pausedtime;
    j=k=i=0;

    for( n=0; n<total_cells; n++ ) {
        updatePixel(dtn,i,j,k);

        if( k == fullW-1 ) {
            if( j == fullH-1 ) {
                if( i == fullD-1 ) {
                    break;
                } else {
                    i++;
                }
                j = 0;
            } else {
                j++;
            }
            k = 0;
        } else {
            k++;
        }
    }
}







*/







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
        //wasn't registered yet
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

    if( typeof min_death == 'undefined' ) changed=true;

    if( total_alive <= 0 ) {
        console.log("total_alive=" + total_alive);
        countNeighbors();
    }
    if( total_alive == 0 ) {
        if( qRandom(50) > 13 ) {
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
        min_birth = rules[current_rule].min_birth;
        max_birth = rules[current_rule].max_birth;
        min_lifer = rules[current_rule].min_lifer;
        max_lifer = rules[current_rule].max_lifer;
        min_death = rules[current_rule].min_death;
        max_death = rules[current_rule].max_death;

        for( var sp of rule_reversal ) {
            eval(sp[0] + '=' + JSON.stringify(sp[1]) );
        }
        rule_reversal=[];
        let managed = [ 'min_birth', 'max_birth', 'min_death', 'max_death', 'min_lifer', 'max_lifer', 'cond' ];
        //let specials = ['start_health','max_health','life_per_sec','damage','healing_factor','healing_constant','damage_entropy'];
        for( var sp in rules[current_rule] ) {
            if( managed.indexOf(sp) >= 0 ) continue;
            rule_reversal.push([sp, eval(sp)]);
            eval(sp + '=' + JSON.stringify(rules[current_rule][sp]) );
        }

        countNeighbors();
        if( timer_mode == 1 && qRandom(200) == 13 )
            resetTimerInfo();
        reportCount(true);
    } else {
        reportCount(automatic);
    }
}

var births, deaths, lifers, hf, hc, dtn, mdc, dx;
var app_x, app_y, app_z, app_i;
let app_state=0;

function application() {
    var v, cell;
    var i, j, k;
    var z, y, x;

    if( staccato ) {
        console.log("staccato");
        return false;
    }
    staccato = true;

    if( app_state == 0 ) {
      decideRule();
      births = [];
      deaths = [];
      lifers = [];
      hc = qRandom();
      hf = qRandom();
      dtn = new Date().getTime()/1000;
      mdc=0;
      if( last_time == 0 ) dx = 0;
      else {
        dx = dtn - last_time;
        last_time = dtn;
      }
      app_state = 1;
      app_x = app_y = app_z = 0;
    }
    
    switch( app_state ) {
      case 1:
        let counter=0;
        for( i=app_x; i<ocean.limit; i++ ) {
          for( j=app_y; j<ocean.limit; j++ ) {
            for( k=app_z; k<ocean.limit; k++ ) {
              cell = ocean.data[i][j][k];
              if( cell[1] > 0 ) {
                cell[1] += (cell[1]*healing_factor + healing_constant)*dx;

                if( lifers_first && cell[1] < max_health && cell[2] >= min_lifer && cell[2] <= max_lifer ) {
                  lifers.push([i,j,k]);
                } else if( cell[2] <= min_death ) {
                  deaths.push([i,j,k,1+(min_death-cell[2])]);
                } else if( cell[2] >= max_death ) {
                  deaths.push([i,j,k,1+(cell[2]-max_death)]);
                } else if( cell[1] < max_health && cell[2] >= min_lifer && cell[2] <= max_lifer ) {
                  lifers.push([i,j,k]);
                }
              } else {
                if( cell[2] >= min_birth && cell[2] <= max_birth ) ) {
                  births.push([i,j,k]);                    
                }
              }
              counter++;
              if( counter > max_per_round )
                break;
            }
            if( counter > max_per_round )
              break;
          }
          
          if( counter > max_per_round )
            break;
        }
        if( i >= ocean.limit && j >= ocean.limit && k >= ocean.limit ) {
          app_state=2;
        } else {
          app_i = i;
          app_j = j;
          app_k = k;
        }
        break;
      case 2:
        for( v=0; v<deaths.length; v++ ) {
          var x;
          [i,j,k,x] = deaths[v];
          cell = ocean.data[i][j][k];
    
        if( cells[i][j][k] > 0 ) {
            app_iter++;
            ocean.damage(i,j,k,x);
        }
    }


    for( v=0; v<lifers.length; v++ ) {
        [i,j,k] = lifers[v];

        let was_dead = ( cells[i][j][k] <= 0 );

        cells[i][j][k]+=(life_per_sec*0.75 + life_per_sec*qRandom())*dx;
        if( cells[i][j][k] > 0 && was_dead ) {
            total_alive++;
            for( z=-1; z<2; z++ ) {
                for( y=-1; y<2; y++ ) {
                    for( x=-1; x<2; x++ ) {
                        if( x == 0 && y == 0 && z == 0 ) continue;

                        if( i+z < 0 || i+z >= fullD ) continue;
                        if( j+y < 0 || j+y >= fullH ) continue;
                        if( k+x < 0 || k+x >= fullW ) continue;

                        neighbors[i+z][j+y][k+x]++;
                    }
                }
            }
        }

        app_iter++;
    }


    for( v=0; v<births.length; v++ ) {
        [i,j,k] = births[v];

        total_alive++;
        ocean.salt(start_health,dtn)

        app_iter++;
    }

    decideRule(false);

    staccato=false;
    //updateAllInstances(false);
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
    let i, j, k, z;
    let dtn = new Date().getTime();
    let alive=[];
    let buggy=false;
    for( i=0; i<fullD; i++ ) {
        for( j=0; j<fullH; j++ ) {
            for( k=0; k<fullW; k++ ) {
                if( cells[i][j][k] > 0 )
                    alive.push([i,j,k]);
            }
        }
    }
    const current_ratio = total_alive/total_cells; //0-1
    n *= current_ratio;

    if( alive.length < n ) n = alive.length;
    for( i=0; i<n; i++ ) {
        let v = Math.round(qRandom() * (alive.length-1));
        while( alive[v].length == 0 ) {
            v++;
            if( v == alive.length ) v = 0;
        }
        [z,j,k] = alive[v];
        cells[z][j][k] = 0;
        //lifetime[z][j][k] = 0;
        alive[v] = [];
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
  let composed = '';
  var x,y,z;
  for( x=0; x<ocean.limit; x++ ) {
    for( y=0; y<ocean.limit; y++ ) {
      for( z=0; z<ocean.limit; z++ ) {
        if( ocean.data[x][y][z][1] == 0 ) continue;
        
        if( composed != '' ) composed += ",";
        composed += JSON.stringify(ocean.data[x][y][z]);
      }
    }
  }
  let fulldata = JSON.stringify(ocean.data);
  let datamode = fulldata.length > composed.length ? 0 : 1;
  let exaobj = { datamode, version: 2,
      spacing, opacity, sizing,
      colorBal, filterBal, groundBal,
      start_health, max_health, life_per_sec,
      damage, healing_constant, healing_factor,
      damage_entropy, limit: ocean.limit,
      rNums, rC, cC, colorMode, timer_mode,
      rules, current_rule
    };
  if( datamode == 0 ) exaobj.composed = composed;
  else exaobj.fulldata = fulldata;
  
  let report = JSON.stringify(exaobj);
  showToast(report);
  return report;
}

export function loadScript(id, cb)
{
    let fileUrl = id;

    showToast("Importing " + id + " agent");
    try {
        fetch(fileUrl)
          .then(response => {
            if (!response.ok) {
              throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.text(); // Parse the response as plain text
          })
          .then(textData => {
            let rv = null;
            try {
                rv = JSON.parse(textData);
            } catch( e ) {
                throw new Error("Couldn't parse json " + textData);
            }
            if( rv !== null ) {
                importPosn(rv, cb);
                showToast("Agent ready.");
            }
          })
          .catch(error => {
            console.error('Error loading the text file:', error);
          });
      } catch( e ) {
        console.log(e);
      }
}

function importPosn(exaobj, cb)
{
    let fields = [ 
        'neighbors', 'cells', 'posns', 'lifetime',
        'start_health', 'max_health', 'life_per_sec', 'damage', 'healing_constant', 'healing_factor', 'damage_entropy',
        'fullW', 'fullH', 'fullD', 'rNums', 'rC', 'cC',
        'last_alive', 'living_dir', 'total_alive', 'last_time',
        'colorBal', 'filterBal', 'groundBal',
        'opacity', 'sizing', 'spacing'
    ];
    start(); // prepares the grid

    total_alive = 0;

    for( var f of fields ) {
        if( !(f in exaobj) ) continue;
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
    } else if( total_alive == 0 ) {
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

    if( typeof cb == 'function' ) cb();
}



// Show burn toast:
export function showBurntToast(message) {
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

export function flagToasts(keys)
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

// Show toast with small bites taken out of it:
export function zeroToast(alt_type='your') { // sets the messages to blank so that a single message can stat
    if( alt_type == 'all' ) {
        toastLog = {};
    } else {
        toastLog[alt_type] = [];
    }
}
export function showToast(message, alt_type='your') {

    if( alt_type == 'your' )
        console.log(message);

    if( silent ) {
        return;
    }

    if( !(alt_type in toastLog) ) toastLog[alt_type] = [];
    toastLog[alt_type].push([message, new Date()]);

    let mlower = message.toLowerCase(); // autodetect flagged words
    for( var key of toastFlags ) {
        if( mlower.indexOf(key) != -1 ) {
            if( alt_type != toastFlags[key] )
                showToast(message, toastFlags[key]);
        }
    }
    toastTrackers[alt_type] = new Date().getTime();

    const toast = document.getElementById(alt_type + 'toast'); // what do you mean it's const
    if( alt_type in toastTimers && toastTimers[alt_type] != -1 ) {
        let buf = "";
        for( var i=toastLog[alt_type].length-3; i<toastLog[alt_type].length; i++ ) {
            if( i < 0 ) i = 0;
            buf += "\n<pre>" + toastLog[alt_type][i][0] + "</pre>";
        }
        toast.innerHTML = buf;

        toastFading[alt_type] = false;
    } else {
        toast.innerHTML = "<pre>" + message + "</pre>";
        if( statuslogState < 2 ) {
            toast.style.animation = 'fadeOut ' + fadeOut + 's, fadeIn 0.05s';
            toast.style.visibility = 'visible';
        }
        let tt = ( alt_type in toastClocks ) ? toastClocks[alt_type] : toastTime;
        if( tt == 0 ) {
            toast.style.animation = 'none';
            return;
        }
        toastTimers[alt_type] = setInterval(nextToast.bind(null,alt_type), tt/8);
    }
}


function nextToast(alt_type)
{
    let now = new Date().getTime();
    let tt = ( alt_type in toastClocks ) ? toastClocks[alt_type] : toastTime;

    if( toastFading[alt_type] ) {
        if( toastTrackers[alt_type] < now - (tt+fadeOut) ) { // finish fading out:
            clearInterval(toastTimers[alt_type]);
            delete toastTimers[alt_type];

            const toast = document.getElementById(alt_type + 'toast');
            toast.textContent = '';
            toastTrackers[alt_type] = 0;
            toastFading[alt_type] = false;
            //toastLog[alt_type] = [];            

            return;
        }
    } else {
        const toast = document.getElementById(alt_type + 'toast');
        if( toastTrackers[alt_type] < now - tt ) { // start fading out:
            toastFading[alt_type] = true; // it's not hidden YET...
            toast.style.visibility = 'hidden';
            toast.style.animation = 'fadeOut ' + fadeOut + 's, fadeIn 0.05s';
        } else {
            toast.style.visibility = 'visible'; // close the hidden race condition
        }
    }
}

export function clearToast(alt_type='your')
{
    clearTimeout(toastTimers[alt_type]);
    const toast = document.getElementById(alt_type + 'toast');
    toast.style.visibility = 'hidden';
    toast.style.animation = 'none';

    toastFading[alt_type] = false;
    toastTimers[alt_type] = -1;
    toastTrackers[alt_type] = 0;
}


export function clearStorage()
{
    let items=[];
    for( var i=0; i<window.localStorage.length; i++ ) 
        items.push( window.localStorage.key(i) );
    for( var i of items )
        window.localStorage.removeItem(i);
    showToast("Cleaned storage.");
}

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
        case '+':
            genereateRandom( total_cells * usefreq * 12 );
            refreshConfig(false);
            break;
        case '*':
            negentropy( total_cells * usefreg * 8 );
            refreshConfig(false);
            break;
        case '-':
            entropy( total_cells * usefreq * 8 );
            refreshConfig(false);
            break;
        case 'x':
            start();
            refreshConfig(false);
            break;
        case 'r':
            start();
            genereateRandom( total_cells * usefreq * 25 );
            refreshConfig(false);
            break;
        case '0': case '1': case '2': case '3': case '4': case '5': case '6': case '7': case '8': case '9':
          let n = parseInt(e.key);
          if( n < rulesets.length ) {
            chosen_rules = n;
            showToast("Ruleset " + chosen_rules);
            rules = rulesets[chosen_rules];
          }
          trackToCamera();
          break;
        case '\\':
            chosen_rules = (chosen_rules+1)%rulesets.length;
            showToast("Ruleset " + chosen_rules);
            rules = rulesets[chosen_rules];
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
            break;
        case ';':
            setOpacity(0.86);
            setSizing(0.92);
            setSpacing(1.65);
            break;
        case ',':
            setOpacity(0.9);
            setSizing(0.6);
            setSpacing(0.8);
            break;
        case '.':
            setOpacity(1.0);
            setSizing(0.5);
            setSpacing(1.35);
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
        case ' ': case 'p':
            pause();
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
        case '0':
            switch( colorMode ) {
                case 0: xv = colorBal[lastColorPick]; break;
                case 1: xv = filterBal[lastColorPick]; break;
                case 2: xv = groundBal[lastColorPick]; break;
            }
            xv = -xv;
            setColorBal( xv, lastColorPick, colorMode );
            showToast("ColorFlip: " + ['life','fill'][colorMode] + ":" + ['red','green','blue'][lastColorPick] + "=" + xv);
            break;
        case '[':
            fpsMax = Math.min(fpsMax-1,fpsnow-1);
            showToast("fpsMax="+fpsMax);
            break;
        case ']':
            fpsMax = Math.max(fpsMax+1,fpsnow+1);
            showToast("fpsMax="+fpsMax);
            break;
    }
}

