import * as THREE from 'three';
import { TrackballControls } from 'three/addons/controls/TrackballControls.js';
//import { ArcballControls } from 'three/addons/controls/ArcballControls.js';

export default function ProWay()
{
    /**/


this.started=false;

this.canvas=null;
this.ctx=null;
this.img=null;

this.busy=false;
this.gravTimeout=45;
this.run_cells=false;

this.lastConfig = {};
this.deltaList = {};

this.fpsHist = [];
this.fpsMin = 4;
this.fpsTarget = 25;
this.gt_fps_target = parseInt( 1000/this.fpsTarget );
this.currentFps = 0;
this.lastFrames = []; // max 2 seconds

// Runtime loop:
this.animate = function() {
    if( !this.started || this.busy )    return;
    
    this.busy = true;

    let tn = new Date().getTime(), fpsnow=0;
    var i;

    // measure fps and try to be polite:
    if( this.lastFrames.length > 0 ) {
        if( this.lastFrames[0] <= tn-1000 ) {
            while( this.lastFrames[0] < tn-1000 )    this.lastFrames.shift();
            this.fpsHist.push( this.lastFrames.length ); // fps
        }
        while( this.fpsHist.length > 100 )  this.fpsHist.shift();

        let len = this.fpsHist.length;
        let v = 0;
        for( var z=1; z<7; z++ ) {
            if( len < z ) break;
            v += this.fpsHist[len-z];
        }
        fpsnow = v / z ;
        //console.log("fpsnow: " + fpsnow);

        // fps limiter:
        if( fpsnow > this.fpsTarget ) {
            // slow down processing
            this.gravTimeout = this.gt_fps_target + Math.abs(this.gt_fps_target - parseInt(1000/fpsnow) );
        } else if( fpsnow <= this.fpsMin ) {
            // slow down processing
            this.fpsMin--;
            if( this.fpsMin <= 2 ) {
                this.fpsMin = 2 + ( this.qRandom() * 8 );
            }
            this.gravTimeout = parseInt(1000/this.fpsMin);
        } else {
            // speed up
            this.gravTimeout = this.gt_fps_target - Math.abs(this.gt_fps_Target - parseInt(1000/fpsnow) );
        }
    }    

    this.lastFrames.push(tn);

    if( fpsnow > 0 )
        this.application();

    this.busy=false;
    setTimeout( this.animate.bind(this), this.gravTimeout );
    if( this.gravTimeout > 6000 )
        this.showToast("gt="+this.gravTimeout);
}

this.pause = function() {
    this.run_cells = !this.run_cells;
    this.showToast(this.run_cells ? "../Resumed\\.." : "pause!");
}

this.fullW=68;
this.fullH=68;
this.fullD=68;
this.colorMode = 0;

this.last_time = 0;
this.last_report=0;
this.last_alive=0;
this.living_dir=0;
this.total_alive=0;
this.current_rule=0;


this.neighbors = [];
this.cells = [];
this.frozen = new Set();
this.lifetime = [];
this.posns = [];
this.instances = null;
this.rainbow = null;

this.scene=null;
this.renderer=null;
this.camera=null;
this.controls=null;
this.material=null;
this.geometry=null;


//this.colorBal = [64,32,255];//[128, 2273.605, 14077.56669226713]; // sorry for the magic numbers <3
this.colorBal = [.33,60,0.03];
this.hypnoBal = [.88,0,.88];
//this.filterBal = [0,1,0];
this.filterBal = [.22,0.017,54];
this.groundBal = [0,0,0];
this.rNums = [];
this.rC = 0;
this.cC = 0;
this.rndMax=2000;

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


this.usefreq = 0.1;
this.immortals = false;
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


this.fixFloat = function(f, n=4)
{
    return Number(f).toFixed(n);
}


this.hitting_keys = {};
this.rules = null;
this.config = null;
this.defaults = {
    neighbors: [],
    cells: [],
    lifetime: [],
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

this.qRandom = function() {
    if( this.rNums.length < this.rndMax ) {
        this.startRandoms();
    }
    this.rC++;
    if( this.rC >= this.rNums.length ) this.rC -= this.rNums.length;
    this.cC += Math.floor( this.rNums[this.rC] * 50 );
    while( this.cC >= this.rNums.length ) this.cC -= this.rNums.length;
    let x = (this.rNums[this.rC]*0.1 + this.rNums[this.cC]*0.9);

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



this.toggleImmortals = function(s) {
    immortals = s;
    this.showToast("Immortals: " + s);
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

this.useTrackball = function()
{
    this.controls = new TrackballControls( this.camera, this.renderer.domElement );
    this.controls.rotateSpeed = 12.0;
    this.controls.zoomSpeed = 1.0;
    this.controls.panSpeed = 6;
    this.controls.staticMoving = true;
    this.controls.keys = [ 'KeyA', 'KeyS', 'KeyD' ];
    this.cameraType = 'track';
}
/*this.useArcball = function()
{
    this.controls = new ArcballControls( this.camera, this.renderer.domElement );
    this.controls.addEventListener( 'change', function () {
        this.renderer.render( this.scene, this.camera );
    }.bind(this) );
    this.cameraType = 'arc';
}*/

this.threeReCanvas = function( el )
{
    for( var i=0; i<el.children.length; i++ ) {
        if( el.children[i].nodeName.toLowerCase() == 'canvas' ) {
            el.removeChild( el.children[i] );
            --i;
        }
    }
    
    this.renderer.setSize( window.innerWidth, window.innerHeight );
    el.appendChild( this.renderer.domElement );
}
this.threeCanvas = function(el)
{
    if( this.rainbow != null ) {
        return this.threeReCanvas(el);
    }
    this.rain();

    showToast("threeCanvas()");
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color( this.groundBal[0]/255, this.groundBal[1]/255, this.groundBal[2]/255 );

    this.camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 0.1, 10000 );
    this.renderer = new THREE.WebGLRenderer({
        antialias: false,
        alpha: true,
        premultipliedAlpha: true,
        preserveDrawingBuffer: true,
        logarithmicDepthBuffer: true
    });
    this.renderer.setPixelRatio( window.devicePixelRatio );
    //renderer.shadowMap.enabled = true;

    this.renderer.setSize( window.innerWidth, window.innerHeight );
    el.appendChild( this.renderer.domElement );


    var light3 = new THREE.AmbientLight(0xffffff, 0.5);
    this.scene.add(light3);

    var lightA = new THREE.DirectionalLight(0xffffff, 1.0);
    var lightB = new THREE.DirectionalLight(0xffffff, 1.0);
    var lightC = new THREE.DirectionalLight(0xffffff, 1.0);
    var lightD = new THREE.DirectionalLight(0xffffff, 1.0);
    lightA.position.set(  1,  0,  0.1 ).normalize();
    lightB.position.set( -1,  0,  0.1 ).normalize();
    lightC.position.set(  0,  1, -0.1 ).normalize();
    lightD.position.set(  0, -1, -0.1 ).normalize();
    lightC.position.set( -0.1, 0.1,  1 ).normalize();
    lightD.position.set( -0.1, 0.1, -1 ).normalize();
    this.scene.add(lightA);
    this.scene.add(lightB);
    this.scene.add(lightC);
    this.scene.add(lightD);

    this.showToast("threeCanvas() complete");
    this.buildInstances();
    this.useTrackball();
    this.updateCamera();
}

this.updateCamera = function() {
    this.camera.position.set( this.fullW*this.spacing*0.5, this.fullH*this.spacing*0.5, -this.fullD*this.spacing*0.3 );
    this.camera.lookAt(new THREE.Vector3(this.fullW*this.spacing*0.5, this.fullH*this.spacing*0.5, this.fullD*this.spacing) );//fullW*spacing*0.5, fullH*spacing*0.5, this.fullD*spacing*0.5));
    this.controls.target = new THREE.Vector3(this.fullW*this.spacing*0.5, this.fullH*this.spacing*0.5, this.fullD*this.spacing*0.5);
    this.controls.update();
}

this.countNeighbors = function() {
    var i, j, k;
    var z, y, x;

    for( i=0; i<this.fullD; i++ ) {
        for( j=0; j<this.fullH; j++ ) {
            this.neighbors[i][j] = new Array(this.fullW).fill(0);
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

    this.showToast("Neighbor Count: Total alive: " + this.total_alive);

    this.last_alive = this.total_alive;
}

this.buildInstances = function()
{
    let newInstances=false;

    let len = this.fullW*this.fullH*this.fullD;        

    if( this.instances === null ) {
        this.showToast("new instance geom");
        newInstances=true;
        this.geometry = new THREE.BoxGeometry( 1.0, 1.0, 1.0 );
        // ? this.geometry.applyMatrix4(new THREE.Matrix4().makeTranslation(0, 0, 0.5)); /// oooooer

        //this.material = new THREE.MeshBasicMaterial({ vertexColors: true });
        this.material = new THREE.MeshLambertMaterial( {color:0xffffff} ); // try MeshLambert, MeshPhysical, MeshNormal, MeshPhong, MeshToon
        this.material.opacity = this.opacity;
        this.material.transparent = true;
        this.instances = new THREE.InstancedMesh( this.geometry, this.material, len );
        this.instances.instanceMatrix.setUsage( THREE.DynamicDrawUsage ); // will be updated every frame
        //this.instances.castShadow = this.instances.receiveShadow = true;
        this.updateInstances();
        this.scene.add(this.instances);
    } else {
        this.showToast("rebuilding instance geom");
        this.scene.remove(this.instances);
        //this.geometry = this.instances.geometry = new THREE.BoxGeometry( 1.0, 1.0, 1.0 );
        this.instances.material.opacity = this.opacity;
        this.updateInstances();
        this.scene.add(this.instances);
    }
    this.showToast("Built visual overlay");
}
this.updateBackgroundInstances = function()
{
    var i=0,j=0,k=0,n;
    let instmax = this.fullW*this.fullH*this.fullD;

    for( n=0; n<instmax; n++ ) {
        if( k == this.fullW-1 ) {
            k = 0;
            if( j == this.fullH-1 ) {
                j = 0;
                if( i == this.fullD-1 ) {
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

        if( this.cells[i][j][k] !== 0 ) continue;

        let scalev = this.maxScaling*0.5*this.sizing;
        if( this.zeroGroundBalance ) {
            this.instances.setMatrixAt( n, new THREE.Matrix4().compose( new THREE.Vector3( i*this.spacing, j*this.spacing, k*this.spacing ), new THREE.Quaternion(), new THREE.Vector3(scalev,scalev,scalev) ) );
            this.instances.setColorAt( n, new THREE.Color( this.groundBal[0]/255, this.groundBal[1]/255, this.groundBal[2]/255 ) );
        } else {
            this.instances.setMatrixAt( n, new THREE.Matrix4().compose( new THREE.Vector3( 0, 0, -100000 ), new THREE.Quaternion(), new THREE.Vector3(scalev,scalev,scalev)) );
            this.instances.setColorAt( n, new THREE.Color( 1.0, 1.0, 1.0 ) );
        }
    }
    this.instances.instanceMatrix.needsUpdate = true;
    this.instances.instanceColor.needsUpdate = true;

    //this.showToast(" instance geometry");
}

this.updateInstances = function()
{
    if( this.material === null )
        this.buildInstances();

    this.material.opacity = this.opacity;

    var i,j,k,n;
    let instmax = this.fullD*this.fullW*this.fullH;

    let dtn = new Date().getTime()/1000;
    var life, red, green, blue;
    var z, health, scalev;

    let fill_red = this.filterBal[0];
    let fill_green = this.filterBal[1];
    let fill_blue = this.filterBal[2]; // ultimately we want to have three different color fields: one for neutral, one for positive, one for negative

    let gnd_red = this.groundBal[0]/255;
    let gnd_green = this.groundBal[1]/255;
    let gnd_blue = this.groundBal[2]/255;

    let qtzero = new THREE.Quaternion();

    let changed_rows = new Array(68).fill(false);
    j=k=i=0;
    for( n=0; n<instmax; n++ ) {

        if( this.cells[i][j][k] !== 0 ) { // cell is alive:
            life =  Math.min(100, (dtn - this.lifetime[i][j][k])/1000 ); // lifetime length
            health = 100 * ( this.cells[i][j][k] / this.max_health ); // total hp

            scalev = life/5 + health;
            if( scalev > 1 ) {
                scalev = 1+Math.log(scalev);
            }
            if( scalev > this.maxScaling ) scalev = this.maxScaling;

            scalev *= this.sizing;
            
            red = Math.min(255, Math.max(0, fill_red + this.colorBal[0]*scalev));
            green = Math.min(255, Math.max(0, fill_green + this.colorBal[1]*scalev));
            blue = Math.min(255, Math.max(0, fill_blue + this.colorBal[2]*scalev));

        
            if( this.posns[i][j][k] != this.cells[i][j][k] ) { // changed state
                changed_rows[i] = true;
                this.posns[i][j][k] = this.cells[i][j][k];
                scalev += 1.5 * this.sizing;
                this.instances.setMatrixAt( n, new THREE.Matrix4().compose( new THREE.Vector3( i*this.spacing, j*this.spacing, k*this.spacing ), qtzero, new THREE.Vector3(scalev,scalev,scalev) ) );
                this.instances.setColorAt( n, new THREE.Color( red/255, green/255, blue/255 ) );
            }
            // maybe occasionally update without change?
            if( this.qRandom() > 0.1 ) {
                this.instances.setMatrixAt( n, new THREE.Matrix4().compose( new THREE.Vector3( i*this.spacing, j*this.spacing, k*this.spacing ), qtzero, new THREE.Vector3(scalev,scalev,scalev) ) );
                this.instances.setColorAt( n, new THREE.Color( red/255, green/255, blue/255 ) );
            }
        } else if( this.posns[i][j][k] !== 0 ) { // cell died:
            this.posns[i][j][k] = 0;
            changed_rows[i] = true;

            if( this.zeroGroundBalance ) {
                scalev = this.maxScaling * 0.5 * this.sizing;
                this.instances.setMatrixAt( n, new THREE.Matrix4().compose( new THREE.Vector3( i*this.spacing, j*this.spacing, k*this.spacing ), qtzero, new THREE.Vector3(scalev,scalev,scalev) ) );
                this.instances.setColorAt( n, new THREE.Color( gnd_red, gnd_green, gnd_blue ) );
            } else {
                this.instances.setMatrixAt( n, new THREE.Matrix4().compose( new THREE.Vector3( 0, 0, -10000 ), new THREE.Quaternion(), new THREE.Vector3(1.0,1.0,1.0) ) );
                this.instances.setColorAt( n, new THREE.Color( 1.0,1.0,1.0 ) );
            }
        }

        if( k == this.fullW-1 ) {
            k = 0;
            if( j == this.fullH-1 ) {
                j = 0;
                if( i == this.fullD-1 ) {
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
    }
    /*
    for( n=0; n<68; n++ ) {
        if( changed_rows[n] ) {
            this.deltaAdd( 'p', n, JSON.stringify( this.posns[n] ) );
        }
    }
    */

    this.updateBackgroundInstances();
    this.instances.instanceMatrix.needsUpdate = true;
    this.instances.instanceColor.needsUpdate = true;

    //window.localStorage['p_p_'] = JSON.stringify( this.posns );
    //window.localStorage['p_c_'] = JSON.stringify( this.cells );

}
this.threeRender = function()
{
    if( !this.started ) return;

    this.updateInstances();
    this.renderer.render(this.scene, this.camera);
    if( this.cameraType == 'track' )
        this.controls.update();
}


this.importPosn = function(exaobj)
{
    let fields = [ 
        'neighbors', 'cells', 'lifetime', 'usefreq', 'silent', 'spacing', 'opacity', 'sizing', 'start_health', 'max_health', 'life_per_sec', 'damage', 'healing_constant', 'healing_factor',
        'damage_entropy', 'fullW', 'fullH', 'fullD', 'rNums', 'rC', 'cC', 'last_report', 'living_dir', 'last_alive', 'total_alive', 'current_rule', 'antidamage'
    ];
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
}




this.application = function() {

    if( !this.started ) return;

    var v;
    var i, j, k;
    var z, y, x;
    let growth_factor = 0.44, loss_factor = 0.33;
    let xv = 0.03339;
    let colormin = 2;

    for( var k in this.hitting_keys ) {
        switch( k ) { // qew sad :D it's the only way my friend
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
            this.updateBackgroundInstances();
            this.saveChanges();
            break;

        case 'q':
            this.opacity -= this.opacity*loss_factor;
            if( this.opacity < 0 ) this.opacity=0;
            this.saveChanges();
            this.updateInstances();
            this.showToast("Opacity: " + this.opacity);
            break;
        case 'e':
            this.opacity += this.opacity*growth_factor;
            if( this.opacity > 1 ) this.opacity=1;
            this.saveChanges();
            this.updateInstances();
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
            this.showToast("change Background color");
            break;
        case 'n':
            this.colorMode = 1;
            this.showToast("change Fill color");
            break;
        case 'm':
            this.colorMode = 0;
            this.showToast("change Life color");
            break;

        case 'u':
            switch( this.colorMode ) {
                case 0: xv = this.colorBal[0]; break;
                case 1: xv = this.filterBal[0]; break;
                case 2: xv = this.groundBal[0]; break;
            }
            if( xv == 0 ) xv = 1;
            xv += xv*growth_factor;
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
            if( xv == 0 ) break;

            xv -= xv*loss_factor;
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
            xv += xv*growth_factor;
            this.setColorBal(xv, 1, this.colorMode);
            this.saveChanges();
            break;
        case 'k':
            switch( this.colorMode ) {
                case 0: xv = this.colorBal[1]; break;
                case 1: xv = this.filterBal[1]; break;
                case 2: xv = this.groundBal[1]; break;
            }
            if( xv == 0 ) break;

            xv -= xv*loss_factor;
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
            xv += xv*growth_factor;
            this.setColorBal(xv, 2, this.colorMode);
            this.saveChanges();
            break;
        case 'l':
            switch( this.colorMode ) {
                case 0: xv = this.colorBal[2]; break;
                case 1: xv = this.filterBal[2]; break;
                case 2: xv = this.groundBal[2]; break;
            }
            if( xv == 0 ) break;

            xv -= xv*loss_factor;
            this.setColorBal(xv, 2, this.colorMode);
            this.saveChanges();
            break;
        }
    }
    this.hitting_keys={};
        
    if( this.run_cells ) {
        let births = [], deaths = [], lifers = [];
        let found=false;

        for( i=0; i<this.rules.length; i++ ) {
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
                    /*if( !silent ) {
                       this.showToast("switch: rule " + i + ": total_alive=" + total_alive);
                    }*/
                }
                break;
            }
        }

        let min_birth = this.rules[this.current_rule].min_birth;
        let max_birth = this.rules[this.current_rule].max_birth;
        let min_death = this.rules[this.current_rule].min_death;
        let max_death = this.rules[this.current_rule].max_death;
        let min_lifer = this.rules[this.current_rule].min_lifer;
        let max_lifer = this.rules[this.current_rule].max_lifer;

        let hc = this.qRandom(), hf = this.qRandom();
        let dtn = new Date().getTime()/1000;
        let dx = dtn - this.last_time;
        
        if( this.last_time == 0 ) dx = 0;
        
        this.last_time = dtn;

        let changed_rows = new Array(68).fill(false);

        for( i=0; i<this.fullD; i++ ) {
            for( j=0; j<this.fullH; j++ ) {
                for( k=0; k<this.fullW; k++ ) {
                    if( this.cells[i][j][k] > 0 ) {
                        this.cells[i][j][k] += (this.cells[i][j][k]*this.healing_factor*hf + this.healing_constant*hc)*dx;
                        changed_rows[i] = true;
                        if( this.cells[i][j][k] > this.health_limit )
                            this.cells[i][j][k] = this.health_limit;
                        if( this.cells[i][j][k] < this.max_health && this.neighbors[i][j][k] >= min_lifer && this.neighbors[i][j][k] <= max_lifer ) {
                            lifers.push([i,j,k]);
                        } else if( this.neighbors[i][j][k] <= min_death ) {
                            deaths.push([i,j,k,1+(min_death-this.neighbors[i][j][k])]);
                        } else if( this.neighbors[i][j][k] >= max_death ) {
                            deaths.push([i,j,k,1+(this.neighbors[i][j][k]-max_death)]);
                        }
                    } else {
                        if( /*this.neighbors[i][j][k] == 0 ||*/ ( this.neighbors[i][j][k] >= min_birth && this.neighbors[i][j][k] <= max_birth ) ) {
                            births.push([i,j,k]);                    
                        }
                    }
                }
            }
        }

        for( v=0; v<deaths.length; v++ ) {
            var x;
            [i,j,k,x] = deaths[v];

            if( this.cells[i][j][k] > 0 ) {
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

                this.cells[i][j][k] -= dx * ( x*this.damage + antiforce*this.antidamage ) * ( this.qRandom() * this.damage_entropy );
                changed_rows[i] = true;
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
            }
        }

        for( v=0; v<lifers.length; v++ ) {
            [i,j,k] = lifers[v];

            this.cells[i][j][k]+=(this.life_per_sec*0.75 + this.life_per_sec*this.qRandom())*dx;
            changed_rows[i] = true;
        }


        for( v=0; v<births.length; v++ ) {
            [i,j,k] = births[v];

            this.cells[i][j][k] = this.start_health;
            this.total_alive++;
            this.lifetime[i][j][k] = dtn;
            changed_rows[i] = true;

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
        for( v=0; v<68; v++ ) {
            if( changed_rows[i] ) {
                this.deltaAdd('c', v, JSON.stringify( this.cells[v] ) );
            }
        }
        let dt2 = new Date().getTime()/1000.0;
        let new_dir = this.total_alive - this.last_alive;

        let reported=false;
        if( !reported && Math.abs(new_dir) > 1000 && Math.abs(new_dir - this.living_dir) > (Math.abs(new_dir)+Math.abs(this.living_dir))*2 ) {
            reported=true;
            last_report = dt2;
            this.showToast("Large shift: " + this.total_alive + "+" + new_dir + " ( " + (new_dir-this.living_dir) + " )");
        }
        if( this.last_report+30 < dt2 ) {
            this.last_report = dt2;
            this.showToast("Living: " + this.total_alive + " ( " + new_dir + " )");
        }
        this.last_alive = this.total_alive;
        this.living_dir = new_dir;
    }
    this.threeRender();
}


this.saveChanges = function()
{
    let exaobj = {
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

this.deltaAdd = function( target, x, newval )
{
    return;
    try {
        window.localStorage['p_' + target + '_' + x] = newval;
    } catch( e ) {
        let keys = [], srch = 'p_' + target;
        for( var i=0; i<window.localStorage.length; i++ ) {
            let k = window.localStorage.key(i);
            if( k.startsWith(srch) ) keys.push(k);
        }
        for( var key of keys ) {
            window.localStorage.removeItem(key);
        }
        switch( target ) {
            case 'p':
                window.localStorage['p_p_'] = JSON.stringify( this.posns );
                break;
            case 'c':
                window.localStorage['p_c_'] = JSON.stringify( this.cells );
                break;
        }
    }
}



this.setConfig = function(inConfig, toaster) {
    this.showToast = toaster;
    this.bk_config = this.cloneObject(inConfig);
    this.config = this.cloneObject(inConfig);
    this.pickConfig(0);
}

this.pickConfig = function(n, ndata=false)
{
    var en,el;
    if( typeof n == 'number' ) {
        en = this.config[n];
        el = (n+1);
    } else {
        en = n;
        el = "reloaded from your host. x to reset setup.";
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


    if( ndata !== false ) {
        this.cells = ndata.c;
        this.posns = ndata.p;
        for( var i=0; i<68; i++ ) {
            this.lifetime[i] = [];
            for( var j=0; j<68; j++ ) {
                this.lifetime[i][j] = [];
                for( var k=0; k<68; k++ ) {
                    if( this.cells[i][j][k] != 0 ) {
                        this.lifetime[i][j][k] = new Date().getTime();
                    } else {
                        this.lifetime[i][j][k] = 0;
                    }
                }
            }
        }
    }
    if( this.instances !== null )
        this.updateInstances();
    this.showToast("Setup " + el);
}


this.resizeScreen = function(cb) {
    this.busy=true;
    this.threeCanvas(document.getElementById("mainscroll"));
    setTimeout(this.finishResizeScreen.bind(this,cb), 15);
}

this.finishResizeScreen = function(cb)
{
    var mscroll = document.getElementById("mainscroll");

    if( mscroll.children.length == 0 ) {
        console.log("waiting for graphics context");
        setTimeout(this.finishResizeScreen.bind(this,cb), 30);
        return;
    }    

    var canvas = mscroll.children[0];
    canvas.style.position = 'absolute';
    canvas.style.top = '0px';
    canvas.style.left = '0px';
    this.busy = false;

    if( typeof cb == 'function' )
        cb();
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
        this.execute();
    }
}

// Add this method to the ProWay class in proway.js
this.lockpick = function(x, y, z, heatIntensity = 1.0) {
    if (!this.started || this.frozen.has(`${x}_${y}_${z}`)) {
        this.showToast("Lockpick failed: System frozen or not started!");
        return;
    }

    // The Needle: Target a specific cell
    const targetX = Math.floor(x) % this.fullW;
    const targetY = Math.floor(y) % this.fullH;
    const targetZ = Math.floor(z) % this.fullD;

    // The Heat Source: Melt the cell into a new state
    this.cells[targetZ][targetY][targetX] = this.max_health * heatIntensity;
    this.lifetime[targetZ][targetY][targetX] = new Date().getTime() / 1000;
    this.posns[targetZ][targetY][targetX] = this.cells[targetZ][targetY][targetX];
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
                        this.lifetime[nz][ny][nx] = new Date().getTime() / 1000;
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

    // Visual Feedback: Hypnotic color burst (rainbow shrink wrap)
    const n = targetZ * this.fullW * this.fullH + targetY * this.fullW + targetX;
    const scalev = this.maxScaling * heatIntensity;
    const red = Math.min(255, this.hypnoBal[0] * heatIntensity + this.groundBal[0]*this.qRandom() * 100);
    const green = Math.min(255, this.hypnoBal[1] * heatIntensity + this.groundBal[1]*this.qRandom() * 100);
    const blue = Math.min(255, this.hypnoBal[2] * heatIntensity + this.groundBal[2]*this.qRandom() * 100);

    this.instances.setColorAt(n, new THREE.Color(red / 255, green / 255, blue / 255));
    this.instances.setMatrixAt(n, new THREE.Matrix4().compose(
        new THREE.Vector3(targetX * this.spacing, targetY * this.spacing, targetZ * this.spacing),
        new THREE.Quaternion(),
        new THREE.Vector3(scalev, scalev, scalev)
    ));
    this.instances.instanceColor.needsUpdate = true;
    this.instances.instanceMatrix.needsUpdate = true;

    // Glitch Protection: Prevent reversion
    const glitchTrigger = () => {
        if (this.cells[targetZ][targetY][targetX] <= 0) {
            this.showToast("Lockpick glitched: Security betrayed!");
            this.damage_entropy *= 1.11115; // Amplify chaos
            this.hypnoBal[0] = this.hypnoBal[0]*0.5 + this.qRandom()*128;
            this.hypnoBal[1] = this.hypnoBal[1]*0.5 + this.qRandom()*128;
            this.hypnoBal[2] = this.hypnoBal[2]*0.5 + this.qRandom()*128;

            this.rules[11] = this.cloneObject(originalRule); // Revert rule but keep chaos
            this.pickConfig(11);
            this.updateInstances();
        }
    };

    // Bind glitch trigger to cell changes
    this.deltaAdd('c', targetZ, JSON.stringify(this.cells[targetZ]));
    setTimeout(glitchTrigger, 1000); // Check for tampering after 1 second

    this.showToast(`Lockpick applied at (${targetX}, ${targetY}, ${targetZ}): Truth unlocked!`);
};

this.loadScript = function(id)
{
    fetch('./' + id)
      .then(this.handleScriptResource.bind(this))
      .then(this.handleScript.bind(this))
      .catch(error => {
        console.error('Error loading the text file:', error);
      });
}


this.generateRandom = function(n) {
    let i, j;
    var x,y,z,v;
    let dtn = new Date().getTime();
    let changed_rows = new Array(68);
    for( i=0; i<n; i++ ) {
        v=0;
        do {
            x = Math.floor(this.qRandom() * this.fullW);
            y = Math.floor(this.qRandom() * this.fullH);
            z = Math.floor(this.qRandom() * this.fullD);
            v++;
        } while( v<100 && this.cells[z][y][x] != 0 );
        if( v>=100 ) {
            this.showToast("I think that's enough life for now " + i + ": " + x + ", " + y + ", " + z);
            break;
        }
        this.posns[z][y][x] = this.cells[z][y][x] = this.start_health;
        this.lifetime[z][y][x] = dtn;
        changed_rows[z] = true;
    }
    for( i=0; i<68; i++ ) {
        if( !changed_rows[i] ) continue;

        this.deltaAdd( 'c', z, JSON.stringify( this.cells[z] ) );
        this.deltaAdd( 'p', z, JSON.stringify( this.posns[z] ) );
    }
    this.countNeighbors();
}
this.clearBoard = function() {
    this.neighbors = []; // zero out the cell map:
    this.cells = [];
    this.lifetime = [];
    this.deltaList = {};
    this.posns = [];
    this.frozen = new Set();

    for( var i=0; i<this.fullD; i++ ) {
        this.neighbors.push(new Array(this.fullH));
        this.cells.push(new Array(this.fullH));
        this.lifetime.push(new Array(this.fullH));
        this.posns.push(new Array(this.fullH));
        for( var j=0; j<this.fullH; j++ ) {
            this.neighbors[i][j] = new Array(this.fullW).fill(0);
            this.cells[i][j] = new Array(this.fullW).fill(0);
            this.lifetime[i][j] = new Array(this.fullW).fill(0);
            this.posns[i][j] = new Array(this.fullW).fill(0);
        }
    }
}

this.clearRandom = function(n) {
    let i, j, k, z;

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
}



this.saveScript = function()
{
    let exaobj = {
        neighbors: this.neighbors,
        cells: this.cells,
        lifetime: this.lifetime,
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
        last_report: this.last_report,
        living_dir: this.living_dir,
        last_alive: this.last_alive,
        total_alive: this.total_alive,
        current_rule: this.current_rule,
        last_time: this.last_time
    };
    // from Grok:
    // Step 1: Convert to string if it's an object
    const jsonString = typeof jsonData === 'string' ? jsonData : JSON.stringify(exaobj, null, 2); // Pretty-print with indentation

    console.log(jsonString);
    this.showToast("Copy made.");
    // Step 2: Create a Blob (file-like object)
    const blob = new Blob([jsonString], { type: 'application/json' });

    // Step 3: Create a temporary download link
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    if( !('filecounter' in this) ) {
        this.filecounter = 0;
    } else this.filecounter++;
    a.download = 'schema' + this.filecounter + '.json'; // Filename (change as needed)
    document.body.appendChild(a); // Add to DOM temporarily

    // Step 4: Trigger the download
    a.click();

    // Step 5: Clean up
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

}
this.gizmos = false;

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



this.inKeys = function(e) {
    //this.showToast(e);
    if (e.key === 'm') {
//        this.proSystemMenu(); // Call the HTML menu function
//        this.showToast("Menu summoned!");
    } else if( e.key == ' ' ) {
        this.pause();
    } else if( e.key == 'c' ) {
//        this.saveScript();
    } else if( e.key == '[' ) {
        /*
        this.controls.cursorZoom = !this.controls.cursorZoom;
        this.showToast("Cursor Zoom: " + this.controls.cursorZoom);
        */
    } else if( e.key == ']' ) {
        /*
        this.gizmos = !this.gizmos;
        this.showToast("Gizmos: " + this.gizmos);
        this.controls.activateGizmos( this.gizmos );
        */
    } else if( e.key == '\\' ) {
        // splash physics
    } else if( e.key == 'Tab' ) {
//        this.showToast("Attempting heatpick");
//        this.lockpick(parseInt(this.qRandom()*68), parseInt(this.qRandom()*68), parseInt(this.qRandom()*68));
    }
    //console.log(e.key,e);
    if( e.key == '+' ) {
        this.generateRandom(this.fullD*this.fullW*this.fullH*this.usefreq*0.33);
    } else if( e.key == '-' ) {
        this.clearRandom(this.fullD*this.fullW*this.fullH*this.usefreq*0.33);
    } else if( e.key == '1' ) {
        this.pickConfig(0);
        this.saveChanges();
    } else if( e.key == '2' ) {
        this.pickConfig(1);
        this.saveChanges();
    } else if( e.key == '3' ) {
        this.pickConfig(2);
        this.saveChanges();
    } else if( e.key == '4' ) {
        this.pickConfig(3);
        this.saveChanges();
    } else if( e.key == '5' ) {
        this.pickConfig(4);
        this.saveChanges();
    } else if( e.key == '6' ) {
        this.pickConfig(5);
        this.saveChanges();
    } else if( e.key == '7' ) {
        this.pickConfig(6);
        this.saveChanges();
    } else if( e.key == '8' ) {
        this.pickConfig(7);
        this.saveChanges();
    } else if( e.key == '9' ) {
        this.pickConfig(8);
        this.saveChanges();
    } else if( e.key == 'r' ) {
        this.clearBoard();
        this.generateRandom(this.fullD*this.fullW*this.fullH*this.usefreq);
    } else if( e.key == 'x' ) {
        this.clearBoard();
        this.config = this.cloneObject(this.bk_config);
        this.pickConfig(0);
        this.generateRandom(this.fullD*this.fullW*this.fullH*this.usefreq);
    } else if( e.key == 'z' ) {
        if( silent ) {
            silent = false;
            this.showToast("Silent mode: " + (silent?"on":"off"));
        } else {
            this.showToast("Silent mode: " + (silent?"on":"off"));
            silent = true;
        }
    //} else if( e.key == '.' ) {
        //this.toggleImmortals(immortals=!immortals);
    } else {
        this.hitting_keys[e.key] = true;
    }
}


this.initialize = function(emptyBoard=false) {
    this.startRandoms();
    this.clearBoard();
    if( !emptyBoard )
        this.generateRandom(this.fullD*this.fullW*this.fullH*this.usefreq);
}
this.execute = function() {
    this.resizeScreen(function(){
        this.started = true;
        this.run_cells = true;
        setTimeout( this.animate.bind(this), this.gravTimeout );
   }.bind(this) );
}


return this;
}