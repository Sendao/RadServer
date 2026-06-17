import * as THREE from 'three';
import { TrackballControls } from 'three/addons/controls/TrackballControls.js';

var neighbors = null, cells = null, lifetime = null;
let instances = null, rainbow = null;
var usefreq=0.2;
let silent=false;
let opacity = 0.9; // 0.86;
let sizing = 0.6; // 0.92;
let spacing = 0.8; // 1.65;
let running_cells = false;

var start_health = 1; // max neighbors is 18+8=26
let max_health = 600;
let life_per_sec = 0.003;
let damage = 30;
let healing_constant = 0.01;
let healing_factor = 0.05;
let damage_entropy = 1.11; // there's a small chance that attacking will actually help the enemy
let fade_toning = false;
let silver_toning = false;

var posns;
var scene, renderer;
var mywidth, myheight, mydepth;
var material, geometry;
let immortals = false;

var controls, camera;
//var colorBal = [64,32,255];//[128, 2273.605, 14077.56669226713]; // sorry for the magic numbers <3
export var colorBal = [-50,0,120];
export var filterBal = [250,0,-50];
export var groundBal = [0,0,0];

// overrides:
let zColorBal = colorBal.slice();
let zFilterBal = filterBal.slice();

var fullW=0, fullH=0, fullD=0;
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

    return x;
};
function startRandoms() {
    while( rNums.length < rndMax ) {
        rNums.push( Math.random() );
    }
}


function setOpacity(o) {
    opacity = o;
    console.log("Opacity: " + opacity);
    if( material == null ) return;
    buildInstances();
}
export function setSpacing(s) {
    spacing = s;
    console.log("Spacing: " + spacing);
    if( material == null ) return;
    buildInstances();
    camera.position.set( mywidth*spacing*0.5, myheight*spacing*0.5, -mydepth*spacing*0.4 );
    camera.lookAt(new THREE.Vector3(mywidth*spacing*0.5, myheight*spacing*0.5, mydepth*spacing) );//mywidth*spacing*0.5, myheight*spacing*0.5, mydepth*spacing*0.5));
    controls.target = new THREE.Vector3(mywidth*spacing*0.5, myheight*spacing*0.5, mydepth*spacing*0.5);
    controls.update();
}
export function getSizing() {
    return sizing;
}
export function getSpacing() {
    return spacing;
}
export function setSizing(s) {
    sizing = s;
    console.log("Sizing: " + sizing);
    if( material == null ) return;
    buildInstances();
}
function toggleImmortals(s) {
    immortals = s;
    console.log("Immortals: " + s);
}
function setColorBal(value, rgb, cm)
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
    if( xv < 0 ) xv = 0;
    showToast(rgbColor + xv);

    switch( cm ) {
    case 0: colorBal[rgb] = xv; break;
    case 1: filterBal[rgb] = xv; break;
    case 2: groundBal[rgb] = xv; break;
    }
}

function rain(fullW, fullH) {
    var i, j;
    var r, b;

    rainbow = new Array(fullH);
    for( i=0; i<fullH; i++ ) {
        rainbow[i] = new Array(fullW);
        r = ((fullH-i)/fullH)*0.66;
        for( j=0; j<fullW; j++ ) {
            b = ((fullW-(j*0.5))/fullW);
            rainbow[i][j] = [r,b];
        }
    }
    return rainbow;
}

function threeReCanvas( el, wid, hgt )
{
    renderer.setSize( window.innerWidth, window.innerHeight );
    el.appendChild( renderer.domElement );
}
function getCameraControls()
{
    return [camera,controls];
}
function threeCanvas(el, wid, hgt)
{
    if( rainbow != null ) {
        return threeReCanvas(el,wid,hgt);
    }
    rain(wid,hgt);

    scene = new THREE.Scene();
    scene.background = new THREE.Color( groundBal[0]/255, groundBal[1]/255, groundBal[2]/255 );

    camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 0.1, 10000 );
    renderer = new THREE.WebGLRenderer({
        antialias: false,
        alpha: true
    });
    renderer.setPixelRatio( window.devicePixelRatio );
    //renderer.shadowMap.enabled = true;
    renderer.setSize( window.innerWidth, window.innerHeight );
    el.appendChild( renderer.domElement );
   
    controls = new TrackballControls( camera, renderer.domElement );
  controls.rotateSpeed = 12.0;
  controls.zoomSpeed = 1.0;
  controls.panSpeed = 6;
  controls.staticMoving = true;
  controls.keys = [ 'KeyA', 'KeyS', 'KeyD' ];

    var light3 = new THREE.AmbientLight(0xffffff, 4.0);
    scene.add(light3);
/*
    var lightA = new THREE.DirectionalLight(0xffffff, 1.0);
    var lightB = new THREE.DirectionalLight(0xffffff, 1.0);
    var lightC = new THREE.DirectionalLight(0xffffff, 1.0);
    var lightD = new THREE.DirectionalLight(0xffffff, 1.0);
    lightA.position.set( 1, 0, 0 ).normalize();
    lightB.position.set( -1, 0, 0 ).normalize();
    lightC.position.set( 0, 1, 0 ).normalize();
    lightD.position.set( 0, -1, 0 ).normalize();
    scene.add(lightA);
    scene.add(lightB);
    scene.add(lightC);
    scene.add(lightD);
*/

    mywidth = wid;
    myheight = hgt;
    mydepth = Math.floor( (wid+hgt)/2 );
    
    //material.wireframe = true;
    buildInstances();

    camera.position.set( mywidth*spacing*0.5, myheight*spacing*0.5, -mydepth*spacing*0.4 );
    camera.lookAt(new THREE.Vector3(mywidth*spacing*0.5, myheight*spacing*0.5, mydepth*spacing) );//mywidth*spacing*0.5, myheight*spacing*0.5, mydepth*spacing*0.5));
    controls.target = new THREE.Vector3(mywidth*spacing*0.5, myheight*spacing*0.5, mydepth*spacing*0.5);
    controls.update();
}

function buildInstances()
{
    if( instances != null )
        scene.remove(instances);
    geometry = new THREE.BoxGeometry( sizing, sizing, sizing );
    material = new THREE.MeshLambertMaterial( {color: 0xffffff} );
    material.opacity = opacity;
    material.transparent = true;
    instances = new THREE.InstancedMesh( geometry, material, mywidth*myheight*mydepth );
    instances.instanceMatrix.setUsage( THREE.DynamicDrawUsage ); // will be updated every frame
    let oneframe = mywidth*myheight;
    var i,j,k;
    posns = new Array(mydepth);
    for( i=0; i<mydepth; i++ ) {
        posns[i] = new Array(myheight);
        for( j=0; j<myheight; j++ ) {
            posns[i][j] = new Array(mywidth).fill(0);
        }
    }
    for( i=0; i<mydepth; i++ ) {
        for( j=0; j<myheight; j++ ) {
            for( k=0; k<mywidth; k++ ) {
                instances.setColorAt( i*oneframe + j*mywidth + k, new THREE.Color( .5,.5,.5 ) );
                instances.setMatrixAt( i*oneframe + j*mywidth + k, new THREE.Matrix4().makeTranslation( 0, 0, -10000 ) );
            }
        }
    }
    instances.instanceColor.needsUpdate = true;
    //instances.castShadow = instances.receiveShadow = true;
    scene.add(instances);
}


function threeRender()
{
    var cube;

    var i,j,k;
    var n=0;
    var oneframe = mywidth*myheight;
    var dtn = new Date().getTime()/1000;
    var life, red, green, blue;
    var z, factor;

    let fill_red = filterBal[0];
    let fill_green = filterBal[1];
    let fill_blue = filterBal[2]; // ultimately we want to have three different color fields: one for neutral, one for positive, one for negative

    controls.update();

    let ar=0,ag=0,ab=0;

    let lc_count=0, nc_count=0;
    let sneakers = new Map();

    for( i=0; i<mydepth; i++ ) {
        for( j=0; j<myheight; j++ ) {
            for( k=0; k<mywidth; k++ ) {

                if( cells[i][j][k] === 0 ) {
                    if( posns[i][j][k] === 0 ) continue;
                    posns[i][j][k] = 0;
                    instances.setColorAt( i*oneframe + j*mywidth + k, new THREE.Color( groundBal[0], groundBal[1], groundBal[2] ) );
                    instances.setMatrixAt( i*oneframe + j*mywidth + k, new THREE.Matrix4().makeTranslation( 0, 0, -10000 ) );
                    continue;
                }

                life = dtn - lifetime[i][j][k];
                z = life > 255 ? 255 : life;
                factor = cells[i][j][k];
                
                red = (z+0.1*factor) * colorBal[0];
                green = (z+0.1*factor) * colorBal[1];
                blue = (z+0.1*factor) * colorBal[2];

                if( immortals && factor > 128 ) {
                    blue = 255;
                }
                red = Math.max(0, z*fill_red + factor*colorBal[0]);
                green = Math.max(0, z*fill_green + factor*colorBal[1]);
                blue = Math.max(0, z*fill_blue + factor*colorBal[2]);

                if( red > 255 && green > 255 && blue> 255 ) {
                    console.log("high-color life detected at " + i + ", " + j + ", " + k + ": " + cells[i][j][k] + ", " + life);
                }

                if( red < 128 && green < 128 && blue < 128 ) {
                    //console.log("low-color life detected at " + i + ", " + j + ", " + k + ": " + cells[i][j][k] + ", " + life);
                    // apply fade toning:
                    sneakers.set( i + "," + j + "," + k, life ); // oopsy DAISY though, always daisy ok, otherwise no, glitch, you won't stitch()
                    if( fade_toning ) {
                        red = Math.log(red);
                        green = Math.log(green);
                        blue = Math.log(blue);
                        
                        instances.setColorAt( i*oneframe + j*mywidth + k, new THREE.Color( red, green, blue ) );
                    } else if( !silver_toning ) {
                        instances.setColorAt( i*oneframe + j*mywidth + k, new THREE.Color( red/255, green/255, blue/255 ) );
                    }

                    // silver toning: switch to silver (fade or not) and rotate axial coordination (j,i,k or k,j,i .. uh, no, obviously it must be j,k,i )
                    let white = (red+green+blue)/255;
                    if( white > 1 ) white=1;
                    if( silver_toning )
                        instances.setColorAt( j*oneframe + k*mywidth + i, new THREE.Color( white, white, white ) );

                    lc_count++;
                } else {
                    nc_count++;
                    instances.setColorAt( i*oneframe + j*mywidth + k, new THREE.Color( red/255, green/255, blue/255 ) );
                }

                if( (cells[i][j][k]>0) == (posns[i][j][k]>0) ) continue;
                posns[i][j][k] = cells[i][j][k];

                if( cells[i][j][k] > 0 ) {
                    instances.setMatrixAt( i*oneframe + j*mywidth + k, new THREE.Matrix4().makeTranslation( i*spacing, j*spacing, k*spacing ) );
                } else {
                    instances.setMatrixAt( i*oneframe + j*mywidth + k, new THREE.Matrix4().makeTranslation( 0, 0, -10000 ) );
                }
            }
        }
    }
    if( lc_count > 0 ) {
        //console.log("lc: " + lc_count + " vs " + nc_count);
    }

    instances.instanceMatrix.needsUpdate = true;
    instances.instanceColor.needsUpdate = true;
    //instances.computeBoundingSphere();

    renderer.render( scene, camera );
}

function importPosn(exaobj)
{
    let fields = [ 
        'neighbors', 'cells', 'lifetime', 'usefreq', 'start_health', 'max_health', 'life_per_sec', 'damage', 'healing_constant', 'healing_factor',
        'damage_entropy', 'fullW', 'fullH', 'fullD', 'rNums', 'rC', 'cC', 'last_report', 'living_dir', 'last_alive', 'total_alive', 'current_rule', 'camera_vel', 'camera_tgt_vel',
        'camera_dist', 'last_time'
    ];

    for( var f of fields ) {
        if( !(f in exaobj) ) continue;
        switch( f ) {
            default: eval(f + ' = ' + JSON.stringify(exaobj[f])); break;
        }
    }

    total_alive=0;
    for( var x=0; x<cells.length; x++ ) {
        for( var y=0; y<cells[x].length; y++ ) {
            for( var z=0; z<cells[x][y].length; z++ ) {
                if( cells[x][y][z] != 0 ) {
                    total_alive++;
                }
            }
        }
    }
    rndMax = rNums.length;
}




var canvas, ctx, img;
var paused=false;
var running=false;
var gravTimeout=45;


function pause() {
    paused=!paused;
}
export function animate() {
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
    //showToast(td, tn.getSeconds(), tx.getSeconds());
    running=false;
}

export var rules = [{ // clearing rules (400000+)
    cond: { above: 300000 },
    min_birth: 7, max_birth: 8,
    min_death: 6, max_death: 9,
    min_lifer: 7, max_lifer: 8
}, { // normal rules (300000-) // 9 9 1 9, 10 15 2 10
//        min_birth: 9, max_birth: 9,
//        min_death: 4, max_death: 8,
//        death_above: 17
    cond: { above: 4000 },
    min_birth: 9, max_birth: 10,
    min_death: 8, max_death: 13,
    min_lifer: 5, max_lifer: 10
}, { // growth rules (0+)
    min_birth: 7, max_birth: 7,
    min_death: 5, max_death: 12,
    min_lifer: 4, max_lifer: 9
}];
var gravTimer=-1;
function start() {

    fullW = 68;
    fullH = 68;
    fullD = 68;    

    var i, j, k;
    var usew=fullW, useh=fullH, used=fullD;

    neighbors = new Array(used);
    cells = new Array(used);
    lifetime = new Array(used);

    showToast("restart() : " + total_alive);

    for( i=0; i<used; i++ ) {
        neighbors[i] = new Array(useh);
        cells[i] = new Array(useh);
        lifetime[i] = new Array(useh);

        for( j=0; j<useh; j++ ) {
            neighbors[i][j] = new Array(usew).fill(0);
            cells[i][j] = new Array(usew).fill(0);
            lifetime[i][j] = new Array(usew).fill(0);
        }
    }

    // initialize
    let dtn = new Date().getTime();
    genereateRandom(used*usew*useh*usefreq);
    countFirstTime();
}

let last_report=0;
let living_dir=0;
let last_alive=0;

function countFirstTime() {
    var usew=fullW, useh=fullH, used=fullD;
    var i, j, k;
    var z, y, x;
    var posns = [ [
        [ [-1,-1,-1], [-1,-1,0], [-1,-1,1] ],
        [ [-1,0,-1], [-1,0,0], [-1,0,1] ],
        [ [-1,1,-1], [-1,1,0], [-1,1,1] ]
            ], [
        [ [0,-1,-1], [0,-1,0], [0,-1,1] ],
        [ [0,0,-1], [0,0,0], [0,0,1] ],
        [ [0,1,-1], [0,1,0], [0,1,1] ]
            ], [
        [ [1,-1,-1], [1,-1,0], [1,-1,1] ],
        [ [1,0,-1], [1,0,0], [1,0,1] ],
        [ [1,1,-1], [1,1,0], [1,1,1] ]
            ] ];
    for( i=0; i<used; i++ ) {
        for( j=0; j<useh; j++ ) {
            neighbors[i][j] = new Array(usew).fill(0);
        }
    }

    total_alive=0;
    for( i=0; i<used; i++ ) {
        for( j=0; j<useh; j++ ) {
            for( k=0; k<usew; k++ ) {

                if( cells[i][j][k] == 0 ) continue;

                total_alive++;

                for( z=-1; z<2; z++ ) {
                    for( y=-1; y<2; y++ ) {
                        for( x=-1; x<2; x++ ) {
                            if( x == 0 && y == 0 && z == 0 ) continue;

                            if( i+z < 0 || i+z >= used ) continue;
                            if( j+y < 0 || j+y >= useh ) continue;
                            if( k+x < 0 || k+x >= usew ) continue;

                            neighbors[i+z][j+y][k+x]++;
                        }
                    }
                }
            }                
        }
    }
    let dtn = new Date().getTime()/1000;
    let new_dir = total_alive - last_alive;

    let reported=false;
    if( (new_dir>=0) != (living_dir>=0) ) {
        if( Math.abs(new_dir) > 20 && Math.abs(living_dir) > 20 ) {
            reported=true;
            last_report = dtn;
            showToast("Move over 0: " + total_alive + " ( " + new_dir + " )");
        }
    }

    if( !reported && Math.abs(new_dir - living_dir) > (Math.abs(new_dir)+Math.abs(living_dir))/2 ) {
        reported=true;
        last_report = dtn;
        showToast("Large shift: " + total_alive + " ( " + new_dir + " )");
    }
    if( last_report < 5+dtn ) {
        last_report = dtn;
        showToast("Living: " + total_alive + " ( " + new_dir + " )");
    }
    last_alive = total_alive;
    living_dir = new_dir;
}

function genereateRandom(n) {
    let i, j;
    let usew=fullW, useh=fullH, used=fullD;
    var x,y,z,v;
    let dtn = new Date().getTime();
    for( i=0; i<n; i++ ) {
        v=0;
        do {
            x = Math.floor(qRandom() * usew);
            y = Math.floor(qRandom() * useh);
            z = Math.floor(qRandom() * used);
            v++;
        } while( v<500 && cells[z][y][x] != 0 );
        
        if( v>=500 )
            break;

        cells[z][y][x] = start_health;
        lifetime[z][y][x] = dtn;
    }
}

function clearRandom(n) {
    let i, j, k, z;
    let usew=fullW, useh=fullH, used=fullD;
    let dtn = new Date().getTime();
    let alive=[];
    let buggy=false;
    for( i=0; i<used; i++ ) {
        for( j=0; j<useh; j++ ) {
            for( k=0; k<usew; k++ ) {
                if( cells[i][j][k] > 0 )
                    alive.push([i,j,k]);
            }
        }
    }
    if( alive.length < n ) n = alive.length;
    for( i=0; i<n; i++ ) {
        let v = Math.round(qRandom() * (alive.length-1));
        [z,j,k] = alive[v];
        cells[z][j][k] = 0;

        alive.splice(v,1);
    }
}

let total_alive=0;
let current_rule=0;
let camera_vel = [0,0,0];
let camera_tgt_vel = [0,0,0];
let camera_dist = 0;
let last_time = 0;
let colorMode = 0;

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


//var min_birth = 14, max_birth = 19;
//var min_death = 13, max_death = 30;
function application() {
    //!animate here
    var v;
    var i, j, k;
    var usew=fullW, useh=fullH, used=fullD;
    var z, y, x;
    let growth_factor = 0.44, loss_factor = 0.33;
    let xv = 0.03339;
    let colormin = 2;

    if( !running_cells ) {
        if( renderer )
            renderer.render( scene, camera );
        return;
    }
    
    let births = [], deaths = [], lifers = [];
    let mdc=0;
    var min_birth, max_birth, min_death, max_death, death_above;

    let found=false;
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
                if( !silent )
                    showToast("switch: rule " + i + ": total_alive=" + total_alive);
            }
            break;
        }
    }

    min_birth = rules[current_rule].min_birth;
    max_birth = rules[current_rule].max_birth;
    min_death = rules[current_rule].min_death;
    max_death = rules[current_rule].max_death;

    let min_lifer = rules[current_rule].min_lifer;
    let max_lifer = rules[current_rule].max_lifer;
    
    death_above = rules[current_rule].death_above;

    let hc = qRandom(), hf = qRandom();
    let dtn = new Date().getTime()/1000;
    let dx = dtn - last_time;
    
    if( last_time == 0 ) dx = 0;
    
    last_time = dtn;

    for( i=0; i<used; i++ ) {
        for( j=0; j<useh; j++ ) {
            for( k=0; k<usew; k++ ) {
                if( cells[i][j][k] > 0 ) {
                    cells[i][j][k] += (cells[i][j][k]*healing_factor*hf + healing_constant*hc)*dx;
                    if( neighbors[i][j][k] <= min_death ) {
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

    for( v=0; v<deaths.length; v++ ) {
        var x;
        [i,j,k,x] = deaths[v];

        if( cells[i][j][k] > 0 ) {
            cells[i][j][k]-= x*(damage - damage*qRandom()*damage_entropy)*dx;
            if( cells[i][j][k] <= 0 ) {
                cells[i][j][k]=0;
                total_alive--;
                for( z=-1; z<2; z++ ) {
                    for( y=-1; y<2; y++ ) {
                        for( x=-1; x<2; x++ ) {
                            if( x == 0 && y == 0 && z == 0 ) continue;

                            if( i+z < 0 || i+z >= used ) continue;
                            if( j+y < 0 || j+y >= useh ) continue;
                            if( k+x < 0 || k+x >= usew ) continue;

                            neighbors[i+z][j+y][k+x]--;
                        }
                    }
                }
            }
        }
    }

    for( v=0; v<lifers.length; v++ ) {
        [i,j,k] = lifers[v];

        cells[i][j][k]+=(life_per_sec*0.75 + life_per_sec*qRandom())*dx;
    }


    for( v=0; v<births.length; v++ ) {
        [i,j,k] = births[v];

        cells[i][j][k] = start_health;
        total_alive++;
        lifetime[i][j][k] = dtn;
        for( z=-1; z<2; z++ ) {
            for( y=-1; y<2; y++ ) {
                for( x=-1; x<2; x++ ) {
                    if( x == 0 && y == 0 && z == 0 ) continue;

                    if( i+z < 0 || i+z >= used ) continue;
                    if( j+y < 0 || j+y >= useh ) continue;
                    if( k+x < 0 || k+x >= usew ) continue;

                    neighbors[i+z][j+y][k+x]++;                        
                }
            }
        }
    }
    let dt2 = new Date().getTime()/1000.0;
    let new_dir = total_alive - last_alive;

    let reported=false;
    if( !reported && Math.abs(new_dir) > 1000 && Math.abs(new_dir - living_dir) > (Math.abs(new_dir)+Math.abs(living_dir))*2 ) {
        reported=true;
        last_report = dt2;
        showToast("Large shift: " + total_alive + "+" + new_dir + " ( " + (new_dir-living_dir) + " )");
    }
    if( last_report+10 < dt2 ) {
        last_report = dt2;
        showToast("Living: " + total_alive + " ( " + new_dir + " )");
    }
    last_alive = total_alive;
    living_dir = new_dir;

    if( total_alive < 200 ) {
        start();
    }
    threeRender();
}

let hitting_keys = {};

var rst = -1;

let rs_registered = false;
function resizeScreen() {
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
        var mscroll = document.getElementById("mainscroll");
        threeCanvas(mscroll, fullW, fullH);
        setTimeout(finishResizeScreen, 15);
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
    showToast("finishResizeScreen()");
    restartScreen();
}

function fixFloat(f, n=4)
{
    return Number(f).toFixed(n);
}

let filecounter = null;
function saveScript()
{
    let exaobj = {
        neighbors, cells, lifetime,
        usefreq, silent, spacing, opacity, sizing, start_health, max_health, life_per_sec, damage, healing_constant, healing_factor, damage_entropy,
        fullW, fullH, fullD,
        rNums, rC, cC,
        last_report, living_dir, last_alive, total_alive, current_rule,
        camera_vel, camera_tgt_vel, camera_dist, last_time, rules
    };
    let jsonString = JSON.stringify(exaobj);
    
    showToast("Copy made.");

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
        neighbors, cells, lifetime,
        usefreq, silent, spacing, opacity, sizing, start_health, max_health, life_per_sec, damage, healing_constant, healing_factor, damage_entropy,
        fullW, fullH, fullD,
        rNums, rC, cC,
        last_report, living_dir, last_alive, total_alive, current_rule,
        camera_vel, camera_tgt_vel, camera_dist, last_time
    };
    let report = JSON.stringify(exaobj);
    showToast(report);
}

export function fetchIdent(id, cb)
{
    let fileUrl = './' + id;

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
            showToast("Importing agent...");

            cells = window.cells;
            neighbors = window.neighbors;
            lifetime = window.lifetime;
            start();
            importPosn(rv);
            showToast("Le'E'eMe' a'meIn, G");
            resizeScreen();

            //setSizing(1.0);
            //setSpacing(1.5);

            // 'life' color:
            if( zColorBal !== null )
                colorBal = zColorBal;

            if( zFilterBal !== null )
                filterBal = zFilterBal;

            if( typeof cb == 'function' ) cb();
        }
      })
      .catch(error => {
        console.error('Error loading the text file:', error);
      });
}

// Show toast with small bites taken out of it:
function showToast(message) {
    console.log(message);
    if( message.indexOf("Living") >= 0 ) {
        //return; // in demo mode
        message = message.replaceAll("Living", "Living<a target=_blank href='/one.html?first_visitor_saved'>?</a>");
    }
    const toast = document.getElementById('yourtoast'); // what do you mean it's const
    toast.innerHTML = message /* nibble */;
    toast.style.animation = 'fadeOut 0.5s, fadeIn 0.5s';
    toast.style.visibility = 'visible' // cchompp ; <- digested and de-lexious

    setTimeout(() => {
        toast.style.visibility = 'hidden';
    }, 15000);
}

export function restartScreen() {
    // initialize
    if( gravTimer != -1 )
        clearInterval(gravTimer);

    running_cells = true;

    gravTimer = setInterval('animate()', gravTimeout);
}

export function inKeys(e) {
    switch( k ) { // qew sad :D it's the only way my friend
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
    case '+':
        genereateRandom(64*64); // one full plane
        break;
    case '-':
        clearRandom(64*64);
        break;
    case '2':
        setOpacity(0.86);
        setSizing(0.92);
        setSpacing(1.65);
        break;
    case '1':
        setOpacity(0.9);
        setSizing(0.6);
        setSpacing(0.8);
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
        saveChanges();
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
        saveChanges();
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
        saveChanges();
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
        saveChanges();
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
        saveChanges();
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
        saveChanges();
        break;

    case 'r':
        start();
        break;

    case 'z':
        silent = !silent;
        break;
    case 'p': case ' ':
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
    case '.':
        let name = prompt("you call upon the ancient names of god...");
        fetchIdent(name);
        break;
    }
}
