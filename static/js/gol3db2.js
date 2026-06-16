import * as THREE from 'three';

import { TrackballControls } from 'three/addons/controls/TrackballControls.js';
//const controls = new TrackballControls( camera, renderer.domElement );

var scene, renderer;
export var controls, camera;

var mywidth, myheight, mydepth;
var instances = null;

var posns;
let spacing = 2.0;//3.33;
let opacity = 0.25;
let sizing = 0.1;
var rainbow = null;
let immortals = false;
var material, geometry;
export var colorBal = [128, 255, 255];
export var filterBal = [0, 0, 0];
export var groundBal = [0, 0, 0];

export function setOpacity(o) {
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
    controls.target = new THREE.Vector3(mywidth*spacing*0.5, myheight*spacing*0.5, mydepth*spacing*0.5);
    controls.update();
}
export function setSizing(s) {
    sizing = s;
    console.log("Sizing: " + sizing);
    if( material == null ) return;
    buildInstances();
}
export function toggleImmortals(s) {
    immortals = s;
    console.log("Immortals: " + s);
}
export function setColorBal(i, v, mn)
{
    let xv = 0.03339;
    switch( mn ) {
    case 0:
        xv = v;
        if( xv < 0 ) xv = 0;
        colorBal[i] = xv;
        break;
    case 1:
        xv = v;
        if( xv < 0 ) xv = 0;
        colorBal[i] = xv;
        break;
    case 2:
        xv = v;
        if( xv < 0 ) xv = 0;
        colorBal[i] = xv;
        break;
    }
    console.log("colorBal(" + i + ")=" + xv);
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
export function getCameraControls()
{
    return [camera,controls];
}
export function threeCanvas(el, wid, hgt)
{
    if( rainbow != null ) {
        return threeReCanvas(el,wid,hgt);
    }
    rain(wid,hgt);

    scene = new THREE.Scene();
    scene.background = new THREE.Color( 0x000000 );

    camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 0.1, 10000 );
    renderer = new THREE.WebGLRenderer({
        antialias: true,
        alpha: true
    });
    renderer.setPixelRatio( window.devicePixelRatio );
    renderer.shadowMap.enabled = true;
    renderer.setSize( window.innerWidth, window.innerHeight );
    el.appendChild( renderer.domElement );
   
    controls = new TrackballControls( camera, renderer.domElement );

    var light3 = new THREE.AmbientLight(0xffffff, 5.0);
    scene.add(light3);


    mywidth = wid;
    myheight = hgt;
    mydepth = Math.floor( (wid+hgt)/2 );
    
    //material.wireframe = true;
    buildInstances();

    camera.position.set( mywidth*spacing*0.5, myheight*spacing*0.5, -mydepth*spacing*0.3 );
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


export function threeRender()
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

    for( i=0; i<mydepth; i++ ) {
        for( j=0; j<myheight; j++ ) {
            for( k=0; k<mywidth; k++ ) {

                if( cells[i][j][k] === 0 ) {
                    if( posns[i][j][k] === 0 ) continue;
                    posns[i][j][k] = 0;
                    instances.setMatrixAt( i*oneframe + j*mywidth + k, new THREE.Matrix4().makeTranslation( 0, 0, -10000 ) );
                    continue;
                }

                life = dtn - lifetime[i][j][k];
                z = life/5 > 255 ? 255 : life/5;
                factor = cells[i][j][k]/2;
                
                red = factor * colorBal[0] * z;
                green = factor * colorBal[1] * z;
                blue = factor * colorBal[2] * z;

                if( immortals && factor > 128 ) {
                    blue = 255;
                }
                red = Math.max(0, fill_red + red);
                green = Math.max(0, fill_green + green);
                blue = Math.max(0, fill_blue + blue);

                if( red > 128 && green > 128 && blue> 128 ) {
                    red=green=blue=128;
                }


                instances.setColorAt( i*oneframe + j*mywidth + k, new THREE.Color( red/255, green/255, blue/255 ) );

                
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
    instances.instanceMatrix.needsUpdate = true;
    instances.instanceColor.needsUpdate = true;
    //instances.computeBoundingSphere();

    renderer.render( scene, camera );
}
