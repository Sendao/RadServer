import * as THREE from 'three';
import { TrackballControls } from 'three/addons/controls/TrackballControls.js';
import { ArcballControls } from 'three/addons/controls/ArcballControls.js';

let qtzero = new THREE.Quaternion();
const rot0 = new THREE.Euler(0,0,0);
qtzero.setFromEuler(rot0);


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
let fpsMax = 21;
let min_grav_adjust = fpsMax/1000;
let learnLockLoseState = 0;
let lockIsHard = false;
let superslower = 0;
let lastTick = 0;

export function setMaxFPS(v)
{
    fpsMax = parseInt(v);
}

export function getStats()
{
    return [fpsLimit,fpsMap];
}

let zero = null;
function startTimer(mainobj)
{
    zero = mainobj;
    animate();
}

function animate()
{
    lastTick = new Date().getTime();
    renderTimer = -1;

    if( zero.paused ) {
        requestAnimationFrame( finishRendering );
        renderTimer = setTimeout( animate, 200 );
        return;
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
            //showStatus(timerMode[learnLockLoseState] + " @fps=" + fpsnow + "         pS:" + sped_up + "     Sp\\:" + was_greedy + ( slowed_down > 0 ? (" Gr." + slowed_down + "!..") : " __._!.." ));

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
        used_time=0;
    }

    if( fpsnow > fpsMax ) {
        // slow down
        gravAdjust *= 1.1;
        superslower++;
        renderTimer = setTimeout( animate, 100+gravAdjust );
        return;
    }
    
    try {
        zero.cpuWork = true;
        if( zero.frameCycle(tn) ) {
            lastFrames.push(tn);
            let tx = new Date().getTime();
            used_time = tx-tn;
        }
    } catch( e ) {
        used_time=0;
        console.log(e, "appplication");
    }
    zero.cpuWork = false;

    if( zero.paused || ( zero.changedInstances && ( zero.frameProgress < 2 || zero.frameProgress == 4 ) ) ) {
        requestAnimationFrame( zero.finishRendering.bind(zero) ); // not sure we should render here - may be too often
        renderTimer = setTimeout( animate, gravAdjust );
        return;
    }
    
    if( gravAdjust == 0 ) gravAdjust = 1;
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



// deepinstance
/*

- first : this needs to have the rainbow applied to the entire cube as a static scan to resolve issues with placement.


issues: how to update instances when we have many

let's say we update 5% of elements
this requires use of a buffer
however, the elements are dispersed through the other buffers




class DeepInstance {
    DeepInstance(total_elements, min_group_elements=16) {
        this.material = null;
        this.geometry = null;
        this.total_elements = total_elements;
        this.groups = [];
        let used = 0;
        for( var i=min_group_elements; used < total_elements; used += i, i *= 2 ) {

        }
    }
*/

export default function ProWay()
{

this.rain = function() {
    var i, j;
    var r, b;

    this.rainbow = new Array(this.fullH);
    for( i=0; i<this.fullH; i++ ) {
        this.rainbow[i] = new Array(this.fullW);
        r = ((this.fullH-i)/this.fullH)*0.66;
        for( j=0; j<this.fullW; j++ ) {
            b = ((this.fullW-(j*0.5))/this.fullW);
            this.rainbow[i][j] = [r,b];
        }
    }
    return this.rainbow;
}
this.positions = {};

    /**/


this.started=false;
this.paused = false;

this.canvas=null;
this.ctx=null;
this.img=null;

this.gravTimeout=0;

this.lastConfig = {};

this.frameProgress = 0;
this.cycleProgress = 0;
this.frameX = 0;
this.frameY = 0;
this.frameZ = 0;

this.fpsMin = 4;
this.cyclesPerFrame = 5;
this.fpsTarget = 25;
this.fpsMax = 60;
this.fpsMinAdjust = 1000/((5+this.cyclesPerFrame)*this.fpsMax); // ... 550 /60 == 550/6 ~= 9
this.fpsMaxAdjust = 1000/((5+this.cyclesPerFrame)*this.fpsMin); // ... 550 /4 == 5500/4 ~= 140
this.gravAdjust = 5;
this.currentFps = 0;
this.lastFrames = []; // max 2 seconds
this.notice_time = 0;
this.framedrops = 0;
this.fpslags = 0;
this.fpsnow = 0;
this.fpsRegulate = false;
this.animTimer = -1;
this.userWork = false;
this.lastChart = null;

this.fullW=68;
this.fullH=68;
this.fullD=68;
this.total_cells = this.fullW * this.fullH * this.fullD;
this.cells_per_cycle = Math.ceil( this.total_cells / this.cyclesPerFrame );

this.colorMode = 0;

this.last_time = 0;
this.last_report=0;
this.last_alive=0;
this.living_dir=0;
this.total_alive=0;
this.current_rule=0;


this.neighbors = [];
this.cells = [];
this.lifetime = [];
this.lastchange = [];
this.frozen = new Set();
this.instances = null;
this.rainbow = null;
this.pausedtime = 0;
this.lastPause = null;

this.scene=null;
this.renderer=null;
this.camera=null;
this.controls=null;
this.rules = null;
this.config = null;


this.pickBal = [.88,0,.88]; // for the lockpick (tab) only. otherwise, unused

// gold to blue:
this.colorBal = [-30,-22,45];
this.filterBal = [45,33,0];

// chasing shadow out of darkness:
//this.colorBal = [45,33,0];
//this.filterBal = [-15,-22,0];

// ocean mint:
//this.colorBal = [30,45,0];
//this.filterBal = [-30,0,45];

// flowing -> growing:
//this.colorBal = [50,100,-50];
//this.filterBal = [-50,0,150];

// purple -> blue:
//this.colorBal = [50,1,-50];
//this.filterBal = [-50,1,150];

//this.colorBal = [-25,0,-100];
//this.filterBal = [50,25,100];

//this.colorBal = [.33,60,0.03];
//this.filterBal = [.22,0.017,54];
// input: .33 red, 60 green, .03 blue   +++   .22 red, 0.017 green, 54 blue
// seems: green+blue=cyan, blue=blue
// outputs: cyan+blue (washing back of head view)
// interrupt: ? (cyan->red->gold?) + purple? it seems like this equation must be reliant on random association. so ... by exploring you can recognize safety. which may be hazardous but should be still safe if explored (seen)
// an idea: gold+blue (instruction to the front)
// let's try: blue+gold (sparkling the front view)
// so 
// ??+gold=blue, gold=gold
// problem is, gold = red+green, so... uh... a negative number plus a positive blue value
// x=negative gold + positive blue
// x+gold=blue, gold=gold


//this.colorBal = [64,32,255];
//this.colorBal = [128, 2273.605, 14077.56669226713];
//this.filterBal = [0,1,0];


this.groundBal = [0,0,0];
this.rNums = [];
this.rC = 0;
this.cC = 0;
this.rndMax=2000;

this.usefreq = 0.1;
this.silent = false;
this.spacing = 1.4;
this.opacity = 0.8;
this.sizing = 0.9;
this.maxScaling = 2;

this.start_health = 1; // max neighbors is 18+8=26
this.max_health = 1200;
this.health_limit = 1199;
this.life_per_sec = 0.001;
this.opacity_per_health = 0.001;
this.opacity_power = 1;
this.damage = 30;
this.antidamage = 10;
this.healing_constant = 0.01;
this.healing_factor = 0.05;
this.damage_entropy = 1.02; // there's a small chance that attacking will actually help the enemy


/** Default Configuration **/

this.defaults = {
    neighbors: [],
    cells: [],
    lifetime: [],
    lastchange: [],
    usefreq: 0.1,
    silent: false,
    opacity: 0.8,
    sizing: 0.9,
    start_health: 1,
    max_health: 1200,
    life_per_sec: 0.001,
    damage: 30,
    antidamage: 0,
    healing_constant: 0.01,
    healing_factor: 0.05,
    damage_entropy: 1.02,
    fullW: 68,
    fullH: 68,
    fullD: 68,
    rNums: [],
    rC: 0,
    cC: 0,
    zeroGroundBalance: false,
    living_dir: 0,
    last_alive: 0,
    total_alive: 0,
    current_rule: 0
};




/* soon

this.quickMap = []; // maps n -> i,j,k

// let's upgrade the instance into multiple instances [small | small | small | small | large] since updates are portional
this.mDelta = new Set();
this.mChangingCubes = []; // time,cubeid sorted by time
this.mStaticCells = [];


this.mStartCube = function(n,i,j,k) {
    let c = this.cells[i][j][k];
    let dtn = new Date().getTime();
    this.mChangingCubes.unshift([dtn,n]);
}

this.updateCubes = function() {
    for( var i=0; i<this.mChangingCubes.length; i++ ) {
        let [dtn,n] = m.mChangingCubes[i];
        

    }
    this.mChangingCubes.sort((a,b) => (a[0]-b[0]));
}

*/

/** Utility Functions **/

this.fixFloat = function(f, n=4)
{
    return Number(f).toFixed(n);
}

this.qRandom = function() {
    if( this.rNums.length < this.rndMax )
        this.startRandoms();
    this.rC++;
    if( this.rC >= this.rNums.length ) this.rC -= this.rNums.length;
    this.cC += Math.floor( this.rNums[this.rC] * 2 );
    while( this.cC >= this.rNums.length ) this.cC -= this.rNums.length;
    let x = (this.rNums[this.rC]*0.4 + this.rNums[this.cC]*0.6);

    return x;
};
this.startRandoms = function() {
    while( this.rNums.length < this.rndMax ) {
        this.rNums.push( Math.random() );
    }
}

this.cloneObject = function(o) {
    switch( typeof o ) {
    case 'string':
        return "" + o;
    case 'number':
        return 0 + o;
    default:
        if( Array.isArray(o) ) {
            let v=[];
            for( var i=0; i<o.length; i++ ) {
                v.push(this.cloneObject(o[i]));
            }
            return v;
        }
        let v = {};
        for( var i in o ) {
            v[i] = this.cloneObject(o[i]);
        }
        return v;
    }
    this.showToast("Unhandled clone");
    throw "clone war";
}

this.chartFps = function() {
    let diffs = [];
    for( var i=0; i<lastFrames.length-1; i++ ) {
        diffs.push( lastFrames[i+1] - lastFrames[i] );
    }
    console.log(new Date().getSeconds() + ": " + diffs.join("->"));
    //console.log("fps: " + lastFrames.length)
}



this.finishRendering = function() // out of band i guess, kind of a primitive way to do it
{
    //this.instances.computeBoundingBox();
    this.instances.instanceMatrix.needsUpdate = true;
    this.instances.instanceColor.needsUpdate = true;
    if( this.cameraType == 'track' )
        this.controls.update();
    this.renderer.render(this.scene, this.camera);

    this.changedInstances = false;
    if( this.renderTimer != -1 ) {
        clearTimeout( this.renderTimer );
        this.renderTimer = -1;
        this.animate();
    }
}






this.initialize = function(emptyBoard=false) {
    this.clearBoard();
    if( !emptyBoard )
        this.generateRandom(this.total_cells*this.usefreq);
    this.winW = window.innerWidth;
    this.winH = window.innerHeight;
}



this.buildInstances = function() {
    if( this.instances === null ) {
        this.geometry = new THREE.BoxGeometry( 1.0, 1.0, 1.0 );
        // ? this.geometry.applyMatrix4(new THREE.Matrix4().makeTranslation(0, 0, 0.5)); /// oooooer

        if( this.opacity >= 0.999 ) {
            this.material = new THREE.MeshBasicMaterial( {color:0xffffff} );
            this.material.transparent = false;
        } else {
            this.material = new THREE.MeshLambertMaterial( {color:0xffffff} ); // try MeshLambert, MeshPhysical, MeshNormal, MeshPhong, MeshToon
            this.material.transparent = true;
            this.material.opacity = this.opacity;
        }
        this.instances = new THREE.InstancedMesh( this.geometry, this.material, this.total_cells );
        this.instances.instanceMatrix.setUsage( THREE.DynamicDrawUsage ); // will be updated every frame
        //this.instances.castShadow = this.instances.receiveShadow = true;
        this.updateInstances();
        this.scene.add(this.instances);
    } else {
        this.geometry = this.instances.geometry = new THREE.BoxGeometry( 1.0, 1.0, 1.0 );

        if( this.opacity >= 0.999 ) {
            if( this.instances.material.transparent == true ) {
                this.material = this.instances.material = new THREE.MeshBasicMaterial( {color:0xffffff} );
                this.material.transparent = false;
            }
        } else {
            if( this.instances.material.transparent == false ) {
                this.material = this.instances.material = new THREE.MeshLambertMaterial( {color:0xffffff} ); // try MeshLambert, MeshPhysical, MeshNormal, MeshPhong, MeshToon
                this.material.transparent = true;
            }
        }
        this.material.opacity = this.opacity;

        this.scene.remove(this.instances);

        this.instances = new THREE.InstancedMesh( this.geometry, this.material, this.total_cells );
        this.instances.instanceMatrix.setUsage( THREE.DynamicDrawUsage ); // will be updated every frame

        this.updateInstances();
        this.scene.add(this.instances);
    }
    this.showToast("Built visual overlay");
}


// Runtime loop:

this.animate = function() {
    startTimer(this);
};
/*
    this.lastTick = new Date().getTime();
    this.renderTimer = -1;

    if( this.paused ) {
        requestAnimationFrame( this.finishRendering.bind(this) );
        this.renderTimer = setTimeout( this.animate.bind(this), 200 );
        return;
    }

    if( !this.started ) {
        setTimeout( this.animate.bind(this), 200 );
        return;
    }

    let tn = new Date().getTime();

    // measure fps
    if( this.lastFrames.length > 0 ) {

        while( this.lastFrames.length > 0 && this.lastFrames[0] < tn-1000 )
            this.lastFrames.shift();
        this.fpsnow = this.lastFrames.length;

        if( this.lastChart === null || this.lastChart < tn - 1000 ) {
            this.chartFps();
            this.lastChart = tn;
        }

        if( this.fpsnow < this.fpsMin ) {
            if( this.gravAdjust == 0 ) this.gravAdjust = 1;
            this.gravAdjust = this.gravAdjust*3.00;

            if( this.gravAdjust > this.fpsMaxAdjust ) this.gravAdjust = this.fpsMaxAdjust;
        } else if( this.gravAdjust > this.fpsMinAdjust ) {
            this.gravAdjust *= 0.8;
        }
    }

    if( !this.userWork && ( this.fpsnow < this.fpsMax || !this.fpsRegulate ) ) {
        try {
            this.cpuWork = true;
            if( this.frameCycle(tn) === true )
                this.lastFrames.push(tn);
        } catch( e ) {
            console.warn('error using app', e);
            this.pause();
        }
        this.cpuWork = false;
    }


    if( this.paused || ( this.changedInstances && ( this.frameProgress < 2 || this.frameProgress == 4 ) ) ) {
        requestAnimationFrame( this.finishRendering.bind(this) ); // not sure we should render here - may be too often
        this.renderTimer = setTimeout( this.animate.bind(this), this.gravAdjust );
        return;
    }
    
    if( this.gravAdjust == 0 ) this.gravAdjust = 1;
    setTimeout( this.animate.bind(this), this.gravAdjust );
}

this.chartFps = function() {
    var i;
    var diffs = [];
    for( var i=0; i<this.lastFrames.length-1; i++ ) {
        diffs.push( this.lastFrames[i+1] - this.lastFrames[i] );
    }
    console.log(new Date().getSeconds() + ": " + diffs.join("->"));
}
*/

this.threeCanvas = function()
{
    if( this.rainbow !== null ) { // clean up
        this.removeCanvas();
    } else {
        this.rain();

        // scene never gets cleaned up:
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color( this.groundBal[0]/255, this.groundBal[1]/255, this.groundBal[2]/255 );
        let light3 = new THREE.AmbientLight(0xffffff, 1.0);
        this.scene.add(light3);

        this.buildInstances();
    }

    this.threeCamera();
    this.buildCanvas();
    this.useTrackball();
    this.updateCamera();
}

this.threeCamera = function()
{
    this.camera = new THREE.PerspectiveCamera( 60, window.innerWidth / window.innerHeight, 0.1, 10000 );
}

this.useTrackball = function()
{
    this.controls = new TrackballControls( this.camera, this.renderer.domElement );
    this.controls.rotateSpeed = 20.0;
    this.controls.zoomSpeed = 4.5;
    this.controls.panSpeed = 1.0;
    this.controls.staticMoving= true;
    this.controls.keys = []; // [ 'KeyA', 'KeyS', 'KeyD' ];
    this.cameraType = 'track';
}
this.removeCanvas = function()
{
    const el = document.getElementById('mainscroll');

    for( var i=0; i<el.children.length; i++ ) {
        if( el.children[i].nodeName.toLowerCase() == 'canvas' ) {
            el.removeChild( el.children[i] );
            --i;
        }
    }
    delete this.renderer;
}
this.buildCanvas = function()
{    
    const el = document.getElementById('mainscroll');

    this.renderer = new THREE.WebGLRenderer({
        antialias: true,
        alpha: false,
        premultipliedAlpha: true,
        preserveDrawingBuffer: false,
        logarithmicDepthBuffer: false,
        reverseDepthBuffer: true
    });
    this.renderer.setPixelRatio( window.devicePixelRatio );
    this.renderer.setSize( window.innerWidth, window.innerHeight );

    el.appendChild( ( this.canvas = this.renderer.domElement ) );
    el.style.position = 'absolute';
    el.style.top = '0px';
    el.style.left = '0px';
}
this.useArcball = function()
{
    this.controls = new ArcballControls( this.camera, this.renderer.domElement );
    this.controls.addEventListener( 'change', function () {
        this.finishRendering();
        //this.renderer.render( this.scene, this.camera );
    }.bind(this) );
    this.cameraType = 'arc';
}

this.updateCamera = function() {
    this.camera.position.set( this.fullW*this.spacing*0.5, this.fullH*this.spacing*0.5, -0.2*this.fullD*this.spacing );
    this.camera.lookAt(new THREE.Vector3(this.fullW*this.spacing*0.5, this.fullH*this.spacing*0.5, this.fullD*this.spacing*0.5) );//fullW*spacing*0.5, fullH*spacing*0.5, this.fullD*spacing*0.5));
    this.controls.target = new THREE.Vector3(this.fullW*this.spacing*0.5, this.fullH*this.spacing*0.5, this.fullD*this.spacing*0.5);
    this.controls.update();
}

this.shuttlePixels = function(n)
{
    while( n > 0 ) {
        n--;

        this.sh_pixel_n++;
        if( this.sh_pixel_n >= this.sh_pixels.length ) {
            this.sh_pixel_n=-1;
            this.sh_pixels=[];
            return;
        }

        


    }
}

this.updatePixel = function(n,dtn=null)
{
    var red,green,blue,scalev;

    let cell = this.cells[n];
    // cells[x] = [ matrix4, color ]
    //if( n === null )
        n = i*this.fullH*this.fullW + j*this.fullW + k;

    if( this.cells[i][j][k] !== 0 ) { // cell is alive:
        let life =  Math.min(100, (dtn - this.lifetime[i][j][k])/1000 ); // emergence event timestamp
        let lc =  Math.min(100, (dtn - this.lastchange[i][j][k])/1000 ); // last change timestamp
        let health = ( this.cells[i][j][k] / this.max_health );
        
        scalev = ( 0.5*life + health - 0.1*lc );
        if( scalev > 1 ) scalev = Math.sqrt(scalev);
//            scalev = 1+Math.log(scalev);
        if( scalev > this.maxScaling ) scalev = this.maxScaling;
        
        red = Math.min(255, Math.max(0, this.filterBal[0] + this.colorBal[0]*scalev))/255;
        green = Math.min(255, Math.max(0, this.filterBal[1] + this.colorBal[1]*scalev))/255;
        blue = Math.min(255, Math.max(0, this.filterBal[2] + this.colorBal[2]*scalev))/255;

        scalev *= this.sizing;

        this.positions[n] = [i,j,k];

        this.instances.setMatrixAt( n, new THREE.Matrix4().compose(
            new THREE.Vector3( i*this.spacing, j*this.spacing, k*this.spacing ),
            qtzero,
            new THREE.Vector3(scalev,scalev,scalev) ) );
        this.instances.setColorAt( n, new THREE.Color( red, green, blue ) );
    } else {
        red = this.groundBal[0]/255;
        green = this.groundBal[1]/255;
        blue = this.groundBal[2]/255;
        if( this.zeroGroundBalance ) {
            scalev = 0.23 * this.sizing;
            this.instances.setMatrixAt( n, new THREE.Matrix4().compose(
                new THREE.Vector3( i*this.spacing, j*this.spacing, k*this.spacing ),
                qtzero,
                new THREE.Vector3( scalev, scalev, scalev ) ) );
        } else {
            this.instances.setMatrixAt( n, new THREE.Matrix4().compose( new THREE.Vector3( 0, 0, 0 ), qtzero, new THREE.Vector3(0.1,0.1,0.1) ) );
        }
        this.instances.setColorAt( n, new THREE.Color( red + 0.1, green + 0.1, blue + 0.1 ) );
    }

    this.changedInstances = true;
}
this.updateInstances = function()
{
    if( this.material === null )
        this.buildInstances();

    var i,j,k,n;
    let dtn = new Date().getTime() - this.pausedtime;
    j=k=i=0;

    for( n=0; n<this.total_cells; n++ ) {

        this.updatePixel(dtn,i,j,k,n);

        if( k == this.fullW-1 ) {
            if( j == this.fullH-1 ) {
                if( i == this.fullD-1 ) {
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

this.lastneighborCount = null;


this.countNeighbors = function() {
    var i, j, k;
    var z, y, x;

    for( i=0; i<this.fullD; i++ ) {
        if( i >= this.neighbors.length ) this.neighbors.push([]);
        for( j=0; j<this.fullH; j++ ) {
            if( j >= this.neighbors[i].length ) this.neighbors.push( new Array(this.fullW).fill(0) );
            else this.neighbors[i][j] = new Array(this.fullW).fill(0);
        }
    }

    this.total_alive=0;
    for( i=0; i<this.fullD; i++ ) {
        for( j=0; j<this.fullH; j++ ) {
            for( k=0; k<this.fullW; k++ ) {

                if( this.cells[i][j][k] == 0 ) continue;

                this.total_alive++;

                for( z=-1; z<2; z++ ) {
                    for( y=-1; y<2; y++ ) {
                        for( x=-1; x<2; x++ ) {
                            if( x == 0 && y == 0 && z == 0 ) continue;

                            if( i+z < 0 || i+z >= this.fullD ) continue;
                            if( j+y < 0 || j+y >= this.fullH ) continue;
                            if( k+x < 0 || k+x >= this.fullW ) continue;

                            this.neighbors[i+z][j+y][k+x]++;
                        }
                    }
                }
            }                
        }
    }
    
    let dtn = new Date().getTime();
    if( this.last_alive != this.total_alive && ( this.lastneighborCount === null || dtn - this.lastneighborCount > 3000 ) ) {
        this.showToast("Neighbor Count: Total alive: " + this.total_alive);
        this.lastneighborCount = dtn;
    }

    this.last_alive = this.total_alive;
}



this.frameCycle = function(tn) {

    let dtn = tn - this.pausedtime;
    var z, y, x, i, j, k, v, n;

    if( this.frameProgress == 0 ) {
        // start frame:
        this.frameDx = this.last_time === 0 ? 0 : (dtn - this.last_time);
        this.last_time = dtn;

        // adjust ruleframe:
        for( i=0; i<this.rules.length; i++ ) {
            let found = false;
            if( !('cond' in this.rules[i]) ) {
                found=true;
            } else {
                let c = this.rules[i].cond;
                if( 'above' in c && this.total_alive > c.above ) {
                    found=true;
                } else if( 'below' in c && this.total_alive < c.below ) {
                    found=true;
                }
            }
            if( found ) {
                if( this.current_rule != i ) {
                    this.current_rule=i;
                 }
                break;
            }
        }

        this.min_birth = this.rules[this.current_rule].min_birth;
        this.max_birth = this.rules[this.current_rule].max_birth;
        this.min_death = this.rules[this.current_rule].min_death;
        this.max_death = this.rules[this.current_rule].max_death;
        this.min_lifer = this.rules[this.current_rule].min_lifer;
        this.max_lifer = this.rules[this.current_rule].max_lifer;

        this.frameX = 0;
        this.frameY = 0;
        this.frameZ = 0;
        this.cycleProgress = 0;
        this.lifers = [];
        this.births = [];
        this.deaths = [];

        this.frameProgress++;
        return;
    }

    if( this.frameProgress == 1 ) { // 100 units, 1=0-10

        let cells_run=0;

        if( this.cycleProgress < this.cyclesPerFrame ) {

            i = this.frameX; j = this.frameY; k = this.frameZ;
            n = i*this.fullH*this.fullW + j*this.fullW + k;

            for( cells_run = 0; n<this.total_cells && cells_run < this.cells_per_cycle; n++, cells_run++ ) {
                if( this.cells[i][j][k] > 0 ) {
                    this.cells[i][j][k] += (this.cells[i][j][k]*this.healing_factor*this.qRandom() + this.healing_constant*this.qRandom())*this.frameDx;
                    this.lastchange[i][j][k] = dtn;
                    if( this.cells[i][j][k] > this.health_limit )
                        this.cells[i][j][k] = this.health_limit;
                    if( this.cells[i][j][k] < this.max_health && this.neighbors[i][j][k] >= this.min_lifer && this.neighbors[i][j][k] <= this.max_lifer ) {
                        this.lifers.push([i,j,k]);
                    } else if( this.neighbors[i][j][k] <= this.min_death ) {
                        this.deaths.push([i,j,k,1+(this.min_death-this.neighbors[i][j][k])]);
                    } else if( this.neighbors[i][j][k] >= this.max_death ) {
                        this.deaths.push([i,j,k,1+(this.neighbors[i][j][k]-this.max_death)]);
                    }
                } else {
                    if( /*this.neighbors[i][j][k] == 0 ||*/ ( this.neighbors[i][j][k] >= this.min_birth && this.neighbors[i][j][k] <= this.max_birth ) ) {
                        this.births.push([i,j,k]);                    
                    }
                }

                if( k == this.fullW-1 ) {
                    if( j == this.fullH-1 ) {
                        if( i == this.fullD-1 ) {
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
            this.frameX = i;
            this.frameY = j;
            this.frameZ = k;

            this.cycleProgress++;
        } else {
            if( this.changedInstances ) return; // wait for rendering to finish
            this.cycleProgress = 0;
            this.frameProgress++;
        }
        return;
    }

    if( this.frameProgress == 2 ) {
        for( v=0; v<this.deaths.length; v++ ) {
            var x;
            [i,j,k,x] = this.deaths[v];

            if( this.cells[i][j][k] <= 0 )
                continue;

            let antiforce = 0;
            for( var i2 = i-1; i2 <= i+1; i2++ ) {
                if( i2 == i ) continue;
                if( i2 < 0 || i2 >= this.fullD ) continue;
                for( var j2 = j-1; j2 <= j+1; j2++ ) {
                    if( j2 == j ) continue;
                    if( j2 < 0 || j2 >= this.fullH ) continue;
                    for( var k2 = k-1; k2 <= k+1; k2++ ) {
                        if( k2 == k ) continue;
                        if( k2 < 0 || k2 >= this.fullW ) continue;

                        antiforce += this.cells[i2][j2][k2];
                    }
                }
            }

            this.cells[i][j][k] -= this.frameDx * ( x*this.damage + antiforce*this.antidamage ) * ( this.qRandom() * this.damage_entropy );
            if( this.cells[i][j][k] <= 0 ) {
                this.cells[i][j][k]=0;
                this.total_alive--;
                for( z=-1; z<2; z++ ) {
                    for( y=-1; y<2; y++ ) {
                        for( x=-1; x<2; x++ ) {
                            if( x == 0 && y == 0 && z == 0 ) continue;

                            if( i+z < 0 || i+z >= this.fullD ) continue;
                            if( j+y < 0 || j+y >= this.fullH ) continue;
                            if( k+x < 0 || k+x >= this.fullW ) continue;

                            this.neighbors[i+z][j+y][k+x]--;
                        }
                    }
                }
            }
            this.updatePixel(dtn,i,j,k);
        }

        this.frameProgress++;
        return;
    }

    if( this.frameProgress == 3 ) {

        for( v=0; v<this.lifers.length; v++ ) {
            [i,j,k] = this.lifers[v];

            if( this.cells[i][j][k] <= 0 ) continue;

            this.cells[i][j][k]+=(this.life_per_sec*0.75 + this.life_per_sec*this.qRandom())*this.frameDx;
            this.lastchange[i][j][k] = dtn;
            if( this.qRandom() > 0.5 )
                this.updatePixel(dtn,i,j,k);
        }


        for( v=0; v<this.births.length; v++ ) {
            [i,j,k] = this.births[v];

            this.cells[i][j][k] = this.start_health;
            this.lifetime[i][j][k] = dtn;
            this.lastchange[i][j][k] = dtn;

            this.updatePixel(dtn,i,j,k);

            for( z=-1; z<2; z++ ) {
                for( y=-1; y<2; y++ ) {
                    for( x=-1; x<2; x++ ) {
                        if( x == 0 && y == 0 && z == 0 ) continue;

                        if( i+z < 0 || i+z >= this.fullD ) continue;
                        if( j+y < 0 || j+y >= this.fullH ) continue;
                        if( k+x < 0 || k+x >= this.fullW ) continue;

                        this.neighbors[i+z][j+y][k+x]++;
                    }
                }
            }
        }
        this.total_alive += this.births.length;

        this.frameProgress++;
        return;
        
    }

    if( this.frameProgress == 4 ) {

        let dt2 = new Date().getTime();
        let new_dir = this.total_alive - this.last_alive;

        if( this.last_report+30000 < dt2 ) {
            if( Math.abs(new_dir) > 1000 && Math.abs(new_dir - this.living_dir) > (Math.abs(new_dir)+Math.abs(this.living_dir))*2 ) {
                this.showToast("Large shift: " + this.total_alive + "+" + new_dir + " ( " + (new_dir-this.living_dir) + " )");
            } else {
                this.showToast("Living: " + this.total_alive + " ( " + new_dir + " )");
            }

            this.last_report = dt2;
        }
        this.last_alive = this.total_alive;

        //if( qRandom(10) > 2 ) {
            this.updateInstances();
        //}
        this.living_dir = new_dir;

        this.frameProgress = 0;
        return true;
    }
}


this.saveChanges = function()
{
    let exaobj = {
        colorBal: this.colorBal,
        groundBal: this.groundBal,
        filterBal: this.filterBal,
        usefreq: this.usefreq,
        silent: this.silent,
        spacing: this.spacing,
        opacity: this.opacity,
        sizing: this.sizing,
        start_health: this.start_health,
        max_health: this.max_health,
        life_per_sec: this.life_per_sec,
        damage: this.damage,
        healing_constant: this.healing_constant,
        healing_factor: this.healing_factor,
        damage_entropy: this.damage_entropy,
        fullW: this.fullW,
        fullH: this.fullH,
        fullD: this.fullD,
        zeroGroundBalance: this.zeroGroundBalance,
        last_report: this.last_report,
        living_dir: this.living_dir,
        last_alive: this.last_alive,
        total_alive: this.total_alive,
        current_rule: this.current_rule,
        last_time: this.last_time,
        rNums: this.rNums,
        rC: this.rC,
        cC: this.cC
    };
    this.lastConfig = this.cloneObject(exaobj);
    const jsonString1 = typeof jsonData === 'string' ? jsonData : JSON.stringify(exaobj, null, 2); // Pretty-print with indentation
    window.localStorage['proway_cfg'] = jsonString1;
}


this.saveScript = function()
{
    this.userWork = true;

    let exaobj = {
        neighbors: this.neighbors,
        cells: this.cells,
        lifetime: this.lifetime,
        pausedtime: this.pausedtime,
        lastchange: this.lastchange,
        colorBal: this.colorBal,
        groundBal: this.groundBal,
        filterBal: this.filterBal,
        usefreq: this.usefreq,
        silent: this.silent,
        spacing: this.spacing,
        opacity: this.opacity,
        sizing: this.sizing,
        start_health: this.start_health,
        max_health: this.max_health,
        life_per_sec: this.life_per_sec,
        damage: this.damage,
        healing_constant: this.healing_constant,
        healing_factor: this.healing_factor,
        damage_entropy: this.damage_entropy,
        fullW: this.fullW,
        fullH: this.fullH,
        fullD: this.fullD,
        rNums: this.rNums,
        rC: this.rC,
        cC: this.cC,
        current_rule: this.current_rule
    };
    const jsonString = JSON.stringify(exaobj, null, 2);
    console.log(jsonString);
    this.showToast("Copy made.");

    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    
    if( !('filecounter' in this) ) this.filecounter = 0;
    else this.filecounter++;

    a.href = url;
    a.download = 'schema' + this.filecounter + '.json';
    document.body.appendChild(a);

    a.click();

    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    this.userWork = false;    
}

this.setConfig = function(inConfig, toaster) {
    if( typeof toaster == 'function' )
        this.showToast = toaster;
    this.config = this.cloneObject(inConfig);
}

this.pickConfig = function(n)
{
    var en,el;

    if( typeof n == 'number' ) {
        en = this.config[n-1];
        el = n;
    } else {
        en = n;
        el = "reloaded from your host. press x to reset to defaults.";
    }

    for( var i in en ) {
        if( i == 'zeroGroundBalance' ) continue; // nah
        
        if( !(i in this.defaults) ) {
            if( !(i in this) ) {
                this.defaults[i] = null;
            } else {
                this.defaults[i] = this[i];
            }
        }
        this[i] = this.cloneObject(en[i]);
    }

    if( this.instances !== null )
        this.updateInstances();
    this.showToast("Setup " + el);
}

this.importScript = function(exaobj)
{
    this.userWork = true;
    
    let fields = [ 
        'cells',
        'neighbors',
        'lifetime',
        'lastchange',
        'colorBal', 'filterBal', 'groundBal',
        'usefreq', 'silent',
        'spacing', 'opacity', 'sizing', 'start_health', 'max_health', 'life_per_sec', 'healing_constant', 'healing_factor',
        'fullW', 'fullH', 'fullD',
        'rNums', 'rC', 'cC',
        'current_rule',
        'antidamage', 'damage', 'damage_entropy',
    ];
        //current_rule: this.current_rule,
        //last_time: this.last_time
    let foundNeighbors = false;

    for( var f of fields ) {
        if( f in exaobj ) {
            if( f == 'neighbors' ) foundNeighbors = true;
            this[f] = this.cloneObject(exaobj[f]);
        } else if( f in defaults ) {
            this[f] = this.defaults[f];
        }
    }
    this.rndMax = this.rNums.length;
    if( !foundNeighbors )
        this.countNeighbors();

    this.userWork = false;
    
}
this.handleScriptResource = function(resource)
{
    if( !resource.ok ) {
        throw new Error("HTTP[fail] ${response.status}");
    }
    return resource.text();
}
this.handleScript = function(scriptbody)
{
    let rv = null;
    try {
        rv = JSON.parse(scriptbody);
    } catch( e ) {
        throw new Error("Couldn't parse json " + scriptbody);
    }
    if( rv !== null ) {
        this.showToast("Importing agent...");
        this.importPosn(rv);
        this.showToast("Posn loaded.");
        this.threeCanvas();
    }
}
this.loadScript = function(id)
{
    fetch('./' + id)
      .then(this.handleScriptResource.bind(this))
      .then(this.handleScript.bind(this))
      .catch(error => {
        console.error('Error loading the text file:', error);
      });
}

// Add this method to the ProWay class in proway.js
this.lockpick = function(x, y, z, heatIntensity = 1.0) {
    if ( this.frozen.has(`${x}_${y}_${z}`)) {
        this.showToast("Lockpick failed: System frozen!");
        return;
    }

    this.userWork = true;

    // The Needle: Target a specific cell
    const targetX = Math.floor(x) % this.fullW;
    const targetY = Math.floor(y) % this.fullH;
    const targetZ = Math.floor(z) % this.fullD;

    let dtn = new Date().getTime()  - this.pausedtime;
    // The Heat Source: Melt the cell into a new state
    this.cells[targetZ][targetY][targetX] = this.max_health * heatIntensity;
    this.lifetime[targetZ][targetY][targetX] = dtn;
    this.lastchange[targetZ][targetY][targetX] = dtn;
    this.frozen.add(`${targetX}_${targetY}_${targetZ}`); // Mark as immutable
    this.total_alive++;

    // Update neighbors to reflect the new cell
    for (let dz = -1; dz <= 1; dz++) {
        for (let dy = -1; dy <= 1; dy++) {
            for (let dx = -1; dx <= 1; dx++) {
                if (dx === 0 && dy === 0 && dz === 0) continue;
                const nz = targetZ + dz;
                const ny = targetY + dy;
                const nx = targetX + dx;
                if (nz >= 0 && nz < this.fullD && ny >= 0 && ny < this.fullH && nx >= 0 && nx < this.fullW) {
                    if (this.qRandom() < 0.1 && this.cells[nx][ny][nz] > 0 ) {
                        this.cells[nz][ny][nx] += this.start_health * this.qRandom();
                        this.lifetime[nz][ny][nx] = dtn;
                        this.lastchange[nz][ny][nx] = dtn;
                    }
                    this.neighbors[nz][ny][nx]++;
                }
            }
        }
    }

    // Glitch Trigger: Modify rules to destabilize if tampered
    const originalRule = this.cloneObject(this.rules[this.current_rule]);
    this.rules[this.current_rule].min_birth += this.qRandom() * heatIntensity;
    this.rules[this.current_rule].max_birth += this.qRandom() * heatIntensity;
    this.rules[this.current_rule].min_death -= this.qRandom() * heatIntensity * 0.5;
    this.rules[this.current_rule].max_death += this.qRandom() * heatIntensity * 0.5;

    const n = targetZ * this.fullW * this.fullH + targetY * this.fullW + targetX;
    const scalev = this.maxScaling * heatIntensity;
    const red = Math.min(255, this.pickBal[0] * heatIntensity + this.groundBal[0]*this.qRandom() * 100);
    const green = Math.min(255, this.pickBal[1] * heatIntensity + this.groundBal[1]*this.qRandom() * 100);
    const blue = Math.min(255, this.pickBal[2] * heatIntensity + this.groundBal[2]*this.qRandom() * 100);

    this.instances.setColorAt(n, new THREE.Color(red / 255, green / 255, blue / 255));
    this.instances.setMatrixAt(n, new THREE.Matrix4().compose(
        new THREE.Vector3(targetX * this.spacing, targetY * this.spacing, targetZ * this.spacing),
        qtzero,
        new THREE.Vector3(scalev, scalev, scalev)
    ));
    this.changedInstances = true;

    // Glitch Protection: Prevent reversion
    const glitchTrigger = () => {
        if (this.cells[targetZ][targetY][targetX] <= 0) {
            this.showToast("Lockpick glitched: Security betrayed!");
            this.damage_entropy *= 1.11115; // Amplify chaos
            this.pickBal[0] = this.pickBal[0]*0.5 + this.qRandom()*128;
            this.pickBal[1] = this.pickBal[1]*0.5 + this.qRandom()*128;
            this.pickBal[2] = this.pickBal[2]*0.5 + this.qRandom()*128;

            this.rules[11] = this.cloneObject(originalRule); // Revert rule but keep chaos
            this.pickConfig(11);
            this.updateInstances();
        }
    };

    // Bind glitch trigger to cell changes
    setInterval(glitchTrigger, 1000); // Check for tampering after 1 second

    this.showToast(`Lockpick applied at (${targetX}, ${targetY}, ${targetZ}): Truth unlocked!`);
    this.userWork = false;
};

this.generateRandom = function(n) {
    let i, j;
    var x,y,z,v;
    let dtn = new Date().getTime() - this.pausedtime;
    for( i=0; i<n; i++ ) {
        v=0;
        do {
            x = Math.floor(this.qRandom() * this.fullW);
            y = Math.floor(this.qRandom() * this.fullH);
            z = Math.floor(this.qRandom() * this.fullD);
            v++;
        } while( v<50 && this.cells[z][y][x] != 0 );
        
        if( v>=100 )
            continue;

        this.cells[z][y][x] = this.start_health;
        this.lastchange[z][y][x] = this.lifetime[z][y][x] = dtn;
    }
    this.countNeighbors();
}

this.clearBoard = function() {
    this.neighbors = []; // zero out the cell map:
    this.cells = [];
    this.lifetime = [];
    this.lastchange = [];
    this.frozen = new Set();

    for( var i=0; i<this.fullD; i++ ) {
        this.neighbors.push(new Array(this.fullH));
        this.cells.push(new Array(this.fullH));
        this.lifetime.push(new Array(this.fullH));
        this.lastchange.push(new Array(this.fullH));
        for( var j=0; j<this.fullH; j++ ) {
            this.neighbors[i][j] = new Array(this.fullW).fill(0);
            this.cells[i][j] = new Array(this.fullW).fill(0);
            this.lifetime[i][j] = new Array(this.fullW).fill(0);
            this.lastchange[i][j] = new Array(this.fullW).fill(0);
        }
    }
}

this.clearRandom = function(n) {
    let i, j, k, z;

    this.userWork = true;

    let alive=[];
    let buggy=false;
    for( i=0; i<this.fullD; i++ ) {
        for( j=0; j<this.fullH; j++ ) {
            for( k=0; k<this.fullW; k++ ) {
                if( this.cells[i][j][k] > 0 )
                    alive.push([i,j,k]);
            }
        }
    }
    for( i=0; i<n && alive.length > 0; i++ ) {

        let v = Math.round(this.qRandom() * (alive.length-1));
        if( buggy ) {
            [i,j,k] = alive[v];
            this.cells[i][j][k] = 0;
        } else {
            [z,j,k] = alive[v];
            this.cells[z][j][k] = 0;
        }
        alive.splice(v,1);

    }
    this.updateInstances();
    this.userWork = false;
}



// interrupt keys: (other keys are evaluated per-frame)
this.inKeys = function(e) {
    e.stopPropagation();
    let k = e.key;

    let growth_factor = 0.4;
    let loss_factor = 0.3;

    var xv;

    switch( k ) { // qew sad :D it's the only way my friend
    case ' ':
        this.pause();
        break;
    case '/':
        this.showToast(this.fpsMin + " - " + this.fpsMax + ": FPS=" + this.fpsnow);
        break;
    case 'c':
        this.saveScript();
        break;

    case 'Tab':
        this.showToast("Attempting heatpick");
        this.lockpick(parseInt(this.qRandom()*68), parseInt(this.qRandom()*68), parseInt(this.qRandom()*68));
        break;

    case '+':
        this.userWork = true;
        this.generateRandom(this.fullD*this.fullW*this.fullH*this.usefreq*0.33);
        this.userWork = false;
        this.updateInstances();
        break;
    case '-':
        this.clearRandom(this.fullD*this.fullW*this.fullH*this.usefreq*0.33);
        break;
    case '1':
        this.pickConfig(0);
        this.saveChanges();
        break;
    case '2':
        this.pickConfig(1);
        this.saveChanges();
        break;
    case '3':
        this.pickConfig(2);
        this.saveChanges();
        break;
    case '4':
        this.pickConfig(3);
        this.saveChanges();
        break;
    case '5':
        this.pickConfig(4);
        this.saveChanges();
        break;
    case '6':
        this.pickConfig(5);
        this.saveChanges();
        break;
    case '7':
        this.pickConfig(6);
        this.saveChanges();
        break;
    case '8':
        this.pickConfig(7);
        this.saveChanges();
        break;
    case '9':
        this.pickConfig(8);
        this.saveChanges();
        break;
    case 'r':
        this.userWork=true;
        this.clearBoard();
        this.generateRandom(this.fullD*this.fullW*this.fullH*this.usefreq);
        this.userWork = false;
        this.updateInstances();
        break;
    case 'z':
        this.silent = !this.silent;
        this.showToast("Silent mode: " + (this.silent?"on":"off"));
        break;
    case '[':
        this.fpsTarget -= this.fpsTarget*loss_factor;
        this.showToast("FPS target: " + this.fpsTarget);
        break;
    case ']':
        this.fpsTarget += this.fpsTarget*growth_factor;
        this.showToast("FPS target: " + this.fpsTarget);
        break;
    case '\\':
        this.fpsMin = this.fpsTarget;
        this.showToast("FPS Min set to Target=" + this.fpsTarget);
        break;
    case ':':
        this.fpsRegulate = !this.fpsRegulate;
        this.showToast("FPS auto-Regulation: " + this.fpsRegulate);
        break;
    case '=':
        this.fpsMax = this.fpsTarget;
        this.showToast("FPS Max set to Target=" + this.fpsTarget);
        break;
    case 'x':
        this.damage -= this.damage*loss_factor;
        this.saveChanges();
        this.showToast("Damage: " + this.damage);
        break;
    case 'c':
        this.damage += this.damage*growth_factor;
        this.saveChanges();
        this.showToast("Damage: " + this.damage);
        break;

    case 'f':
        this.antidamage -= this.antidamage*loss_factor;
        this.saveChanges();
        this.showToast("antidamage: " + this.antidamage);
        break;
    case 'v':
        this.antidamage += this.antidamage*growth_factor;
        this.saveChanges();
        this.showToast("antidamage: " + this.antidamage);
        break;

    case 't':
        this.start_health += this.start_health*growth_factor;
        this.saveChanges();
        this.showToast("Start: " + this.start_health + ", Max: " + this.max_health);
        break;
    case 'g':
        this.start_health -= this.start_health*loss_factor;
        if( this.start_health < 1 ) this.start_health=1;
        this.saveChanges();
        this.showToast("Start: " + this.start_health + ", Max: " + this.max_health);
        break;

    case 'y':
        this.max_health += this.max_health*growth_factor;
        this.saveChanges();
        this.showToast("Start: " + this.start_health + ", Max: " + this.max_health);
        break;
    case 'h':
        this.max_health -= this.max_health*loss_factor;
        if( this.max_health < 2 ) this.max_health=2;
        this.saveChanges();
        this.showToast("Start: " + this.start_health + ", Max: " + this.max_health);
        break;

    case 'p':
        this.zeroGroundBalance = !this.zeroGroundBalance;
        this.showToast("Show zero elements: " + this.zeroGroundBalance);
        this.updateInstances();
        this.saveChanges();
        break;

    case 'q':
        this.opacity -= this.opacity*loss_factor;
        if( this.opacity < 0 ) this.opacity=0;
        this.saveChanges();
        this.buildInstances();
        this.showToast("Opacity: " + this.opacity);
        break;
    case 'e':
        this.opacity += this.opacity*growth_factor;
        if( this.opacity > 1 ) this.opacity=1;
        this.saveChanges();
        this.buildInstances();
        this.showToast("Opacity: " + this.opacity);
        break;

    case 'w':
        this.sizingChanged = true;
        this.sizing += this.sizing*growth_factor;
        this.updateCamera();
        this.saveChanges();
        this.updateInstances();
        this.showToast("Sizing: " + this.sizing);
        break;
    case 's':
        this.sizingChanged = true;
        this.sizing -= this.sizing*loss_factor;
        if( this.sizing < 0.01 ) this.sizing = 0.01;
        this.updateCamera();
        this.saveChanges();
        this.updateInstances();
        this.showToast("Sizing: " + this.sizing);
        break;
    case 'a':
        this.sizingChanged = true;
        this.spacing -= this.spacing*loss_factor;
        if( this.spacing < 0.01 ) this.spacing = 0.01;
        this.updateCamera();
        this.saveChanges();
        this.updateInstances();
        this.showToast("Spacing: " + this.spacing);
        break;
    case 'd':
        this.sizingChanged = true;
        this.spacing += this.spacing*growth_factor;
        this.updateCamera();
        this.saveChanges();
        this.updateInstances();
        this.showToast("Spacing: " + this.spacing);
        break;

    case 'b':
        this.colorMode = 2;
        this.showToast("change Background color (" + this.groundBal[0] + ", " + this.groundBal[1] + ", " + this.groundBal[2] + ")");
        break;
    case 'n':
        this.colorMode = 1;
        this.showToast("change Fill color (" + this.filterBal[0] + ", " + this.filterBal[1] + ", " + this.filterBal[2] + ")");
        break;
    case 'm':
        this.colorMode = 0;
        this.showToast("change Life color (" + this.colorBal[0] + ", " + this.colorBal[1] + ", " + this.colorBal[2] + ")");
        break;
        
    case 'u':
        switch( this.colorMode ) {
            case 0: xv = this.colorBal[0]; break;
            case 1: xv = this.filterBal[0]; break;
            case 2: xv = this.groundBal[0]; break;
        }
        if( xv == 0 ) xv = 1;
        xv += Math.abs( xv*growth_factor );
        switch( this.colorMode ) {
            case 0: this.colorBal[0] = xv; break;
            case 1: this.filterBal[0] = xv; break;
            case 2: this.groundBal[0] = xv; break;
        }
        this.setColorBal(xv, 0, this.colorMode);
        this.saveChanges();
        break;
    case 'j':
        switch( this.colorMode ) {
            case 0: xv = this.colorBal[0]; break;
            case 1: xv = this.filterBal[0]; break;
            case 2: xv = this.groundBal[0]; break;
        }
        if( xv == 0 ) xv = -1;

        xv -= Math.abs( xv*loss_factor );
        this.setColorBal(xv, 0, this.colorMode);
        this.saveChanges();
        break;
    case 'i':
        switch( this.colorMode ) {
            case 0: xv = this.colorBal[1]; break;
            case 1: xv = this.filterBal[1]; break;
            case 2: xv = this.groundBal[1]; break;
        }
        if( xv == 0 ) xv = 1;
        xv += Math.abs( xv*growth_factor );
        this.setColorBal(xv, 1, this.colorMode);
        this.saveChanges();
        break;
    case 'k':
        switch( this.colorMode ) {
            case 0: xv = this.colorBal[1]; break;
            case 1: xv = this.filterBal[1]; break;
            case 2: xv = this.groundBal[1]; break;
        }
        if( xv == 0 ) xv = -1;

        xv -= Math.abs( xv*loss_factor );
        this.setColorBal(xv, 1, this.colorMode);
        this.saveChanges();
        break;
    case 'o':
        switch( this.colorMode ) {
            case 0: xv = this.colorBal[2]; break;
            case 1: xv = this.filterBal[2]; break;
            case 2: xv = this.groundBal[2]; break;
        }
        if( xv == 0 ) xv = 1;
        xv += Math.abs( xv*growth_factor );
        this.setColorBal(xv, 2, this.colorMode);
        this.saveChanges();
        break;
    case 'l':
        switch( this.colorMode ) {
            case 0: xv = this.colorBal[2]; break;
            case 1: xv = this.filterBal[2]; break;
            case 2: xv = this.groundBal[2]; break;
        }
        if( xv == 0 ) xv = -1;

        xv -= Math.abs( xv*loss_factor );
        this.setColorBal(xv, 2, this.colorMode);
        this.saveChanges();
        break;

    case ';':
        this.updateInstances();
        this.finishRendering(true);
        break;
    }
}


this.pause = function() {
    this.showToast(this.paused ? "../Resumed\\.." : "pause!");
    if( this.paused ) {
        this.lastPause = new Date().getTime();
        this.paused = false;
    } else {
        this.pausedtime += new Date().getTime() - this.lastPause;
        this.paused = true;
    }
}

// Show toast with small bites taken out of it:
this.showToast = function(message) {
    console.log(message);
    if( this.silent ) return;
    
    if( typeof this.toaster == 'function' ) {
        this.toaster(message);
        return;
    }

    alert(message);
}


this.setColorBal = function(value, rgb, cm)
{
    let xv = 0.03339;
    var rgbColor;
    switch( rgb ) {
    case 0:
        xv = value;
        rgbColor = 'Red: ';
        break;
    case 1:
        xv = value;
        rgbColor = 'Green: ';
        break;
    case 2:
        xv = value;
        rgbColor = 'Blue: ';
        break;
    }
    if( isNaN(xv) ) {
        switch( cm ) {
        case 0: xv=this.colorBal[rgb]; break;
        case 1: xv=this.filterBal[rgb]; break;
        case 2: xv=this.groundBal[rgb]; break;
        }
    }
    if( xv < 0 ) xv = 0;
    this.showToast(rgbColor + xv);

    switch( cm ) {
    case 0: this.colorBal[rgb] = xv; break;
    case 1: this.filterBal[rgb] = xv; break;
    case 2: 
        this.groundBal[rgb] = xv;
        this.scene.background = new THREE.Color( this.groundBal[0]/255, this.groundBal[1]/255, this.groundBal[2]/255 );
        break;
    }
}

this.resizeScreen = function(cb) {
    if( window.innerWidth != this.winW || window.innerHeight != this.winH ) {
        this.winH = window.innerHeight;
        this.winW = window.innerWidth;
        this.threeCanvas();
    }
    return true;
}

/** Under Construction **/

this.upVar = function(handle)
{
    this[handle] -= this[handle]*0.44;
}
this.downVar = function(handle)
{
    this[handle] += this[handle]*0.33;
}

this.buildR = function(handle, varname)
{
    let d = document.createElement('div');

    let hd = document.createElement('div');
    hd.style.float = hd.style.clear = 'left';
    hd.innerText = varname;

    d.appendChild(hd);
    
    hd = document.createElement('button');
    hd.style.float = hd.style.clear = 'left';
    hd.id = 'down' + handle;
    hd.innerText = 'v';
    hd.addEventListener('onclick', this.downVar.bind(this,handle));
    d.appendChild(hd);

    var ti = document.createElement('input');
    ti.type = 'text';
    ti.name = handle;
    d.appendChild(ti);

    hd = document.createElement('button');
    hd.style.float = hd.style.clear = 'left';
    hd.id = 'up' + handle;
    hd.innerText = '^';
    hd.addEventListener('onclick', this.upVar.bind(this,handle));
    d.appendChild(hd);

    return d;
}
this.proSystemMenu = function()
{
    let bufs = '';

    let vars = [ 'damage', 'antidamage', 'start_health', 'max_health', 'opacity', 'sizing', 'spacing' ];
    let handles = { damage: "Damage", antidamage: "Anti-damage", 'start_health': "Start health", 'max_health': "Max health", 'opacity': "Opacity", sizing: "Sizing", spacing: "Spacing" };

    let el = document.getElementById('proMenu');
    el.innerHTML = '';
    for( var v of vars ) {
        let d = this.buildR(v, handles[v]);
        el.appendChild(d);
    }
    el.innerHTML = bufs;
    el.style.display = 'block';
    el.style.zIndex = 9999;

    var mscroll = document.getElementById("mainscroll");
    mscroll.addEventListener('onclick', this.removeSystemMenu.bind(this));

    document.getElementById('controls').display = 'block';
}

this.removeSystemMenu = function()
{
    document.getElementById('controls').display = 'none';
    var mscroll = document.getElementById("mainscroll");
    mscroll.removeEventListener('onclick', this.removeSystemMenu.bind(this));
}
/** Under Construction **/

return this;
}