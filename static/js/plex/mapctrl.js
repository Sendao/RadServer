import { DDSLoader } from 'https://unpkg.com/three@0.123.0/examples/jsm/loaders/DDSLoader.js';
import { CombinedControls } from 'https://spiritshare.org/js/plex/CombinedControls.js';
import { GLTFLoader } from 'https://unpkg.com/three@0.123.0/examples/jsm/loaders/GLTFLoader.js';
import { Sky } from 'https://unpkg.com/three@0.123.0/examples/jsm/objects/Sky.js';

window.drawMap = function(id)
{
  disposeWindowManager();
  var mapobj = new mapObject(id);
  setWindowManager(mapobj);
};
function updOrbitals()
{
  if( windowmanager instanceof mapObject )
    windowmanager.updOrbitals();
  else
    console.log("Wrong manager - map");
}
window.deleteObject = function(objn)
{
  var mgr = windowmanager;
  if( mgr instanceof mapObject )
    mgr.delObject(objn);
}

window.addToScene = function(mapobj)
{
  var mgr = windowmanager;
  if( mgr instanceof mapObject )
    mgr.addObject(mapobj, true);
}

window.updateMapObject = function(objno)
{
  var mgr = windowmanager;
  if( mgr instanceof mapObject )
    mgr.updateMapObject(objno, true);
}

window.moveObject = function(objn,x,y,z)
{
  var mgr = windowmanager;
  if( mgr instanceof mapObject )
    mgr.moveObject(objn);
}
window.rotateObject = function(objn)
{
  var mgr = windowmanager;
  if( mgr instanceof mapObject )
    mgr.rotateObject(objn);
}
window.scaleObject = function(objn)
{
  var mgr = windowmanager;
  if( mgr instanceof mapObject )
    mgr.scaleObject(objn);
}

window.useCamera = function(orthocam)
{
  var mgr = windowmanager;
  if( mgr instanceof mapObject ) {
    mgr.buildCamera(orthocam);
    mgr.mapRender();
  }
}

window.addGrid = function(unitsize,gridsize)
{
  var mgr = windowmanager;
  if( mgr instanceof mapObject )
    mgr.addGrid(unitsize,gridsize);
}
window.clearGrid = function()
{
  var mgr = windowmanager;
  if( mgr instanceof mapObject )
    mgr.clearGrid();
}

var mapObject = function(id)
{
  var i;
  for( i=0; i<maps.length; ++i ) {
    if( maps[i]._id == id ) {
      break;
    }
  }
  this.map = maps[i];
  console.log("MapId: " + id + ":",this.map);
  var mapobjs = [];

  this.id = id;
  this.controls = null;
  this.gridobj = null;

  var e = gE("mapviewer");

  this.clearGrid = function(userender)
  {
    if( this.gridobj ) {
      console.log("Clearing gridobj");
      this.scene.remove(this.gridobj);
      this.gridobj=null;
    }
    if( userender !== false )
      this.mapRender();
  };

  this.addGrid = function(unitsize, gridsize)
  {
    unitsize = parseFloat(unitsize);
    gridsize = parseInt(gridsize);
    if( this.gridobj ) {
      clearGrid(false);
    }
    console.log("Drawing grid " + unitsize + "*" + gridsize);
    var i=0, j=0;
    var grp = new THREE.Group();
    grp.name = grp.myname = 'grid';
    var line, mat, pts, geom;
    var end = gridsize*unitsize/2;

    mat = new THREE.LineBasicMaterial({color: 0xc3c3c3});

    for( i=-end; i<=end; i+=unitsize ) {
      pts=[];
      pts.push( new THREE.Vector3( i, 0, -end ) );
      pts.push( new THREE.Vector3( i, 0, end ) );
      geom = new THREE.BufferGeometry().setFromPoints(pts);
      line = new THREE.Line(geom,mat);
      grp.add(line);

      pts=[];
      pts.push( new THREE.Vector3( -end, 0, i ) );
      pts.push( new THREE.Vector3( end, 0, i ) );
      geom = new THREE.BufferGeometry().setFromPoints(pts);
      line = new THREE.Line(geom,mat);
      grp.add(line);
    }

    this.gridobj = grp;
    this.scene.add(this.gridobj);
    console.log("Done");
    this.mapRender();
  };

  // Get objects
  this.requestObjects = function()
  {
    // get this.id mapobjects
    HtmlRequestGet("/plex/mapobj", buildArgString({"id":this.id}), this.gotObjects.bind(this));
  };

  this.gotObjects = function(data)
  {
    //! process objects and add to scene
    var odata = JSON.parse(data);

    console.log("Got objects data", odata);
    radStore("mapsats", odata.data.sats);
    var i, sat;

    for( i=0; i< odata.data.sats.length; ++i ) {
      sat = odata.data.sats[i];
      this.addOrbital(sat);
    }

    var obj, count=odata.data.objects.length;

    radClear("mapobjs");
    mapobjs = [];

    for( i=0; i<odata.data.objects.length; ++i ) {
      obj = odata.data.objects[i];
      mapobjs.push( obj );
      console.log("Load obj " + obj._id);
      this.getObjectData(obj.objid);
      var loader = new GLTFLoader().setPath( "https://spiritshare.org/plex/res?id=" + obj.objid + "/" );
      loader.load( 'basis', function(objno, obj, gltf) {
        gltf.scene.name = gltf.scene.myname = objno;
        console.log("Add obj " + objno);
        gltf.scene.traverse(function(node) {
          if( node.name == 'lblue' || node.name == 'lred' || node.name == 'lgreen' )
            return;
          if( node.name == 'cblue' || node.name == 'cred' || node.name == 'cgreen' )
            return;
          if( node.name == 'grid' || node.name == 'skybox' || node.name == 'orbital_sphere' || node.name == 'selbox' )
            return;
          if( node.isMesh ) {
            if( this.envmap != null ) {
              node.material.envMap = this.envmap;
            }
            node.castShadow = true;
            node.receiveShadow = true;
            console.log("Node " + node.name + " is mesh and should cast shadows");
          }
          if( node instanceof THREE.DirectionalLight ) {
            this.castShadowsFrom(node);
            console.log("Found light");
          }
        }.bind(this));
        this.scene.add( gltf.scene );
        this.controls.addObject( gltf.scene );
        gltf.scene.position.copy( new THREE.Vector3(obj.x,obj.y,obj.z) );
        gltf.scene.rotation.copy( new THREE.Euler(obj.rotX,obj.rotY,obj.rotZ,'XYZ') );
        gltf.scene.scale.set( obj.sclX, obj.sclY, obj.sclZ );
        count--;
        if( count == 0 ) {
          console.log("Done loading items");
          this.mapRender();
        }
      }.bind(this, i, obj));
    }
    if( count == 0 ) {
      this.mapRender();
    }
    radStore("mapobjs", mapobjs);
  };

  this.delObject = function(objn)
  {
    var i;
    var objs = this.controls.getObjects();
    var obj = null;
    for( i=0; i < objs.length; ++i ) {
      if( parseInt(objs[i].myname) == objn ) {
        obj = objs[i];
        break;
      }
    }
    if( obj != null ) {
      this.scene.remove( obj );
      this.controls.delObject( obj );
      this.mapRender();
    }
  };

  this.objdats = {};
  this.getObjectData = function(objid)
  {
    if( objid in this.objdats ) {
      this.loadObjdata(false,this.objdats[objid]);
      return;
    }
    HtmlRequestGet("/plex/objdat",buildArgString({id:objid}),this.loadObjdata.bind(this));
  }
  this.loadObjdata = function(data, data_obj)
  {
    var od, objs;
    if( data === false ) {
      objs = data_obj;
      return;
    } else {
      console.log("loadObjdata(" + data + ")");
      od = JSON.parse(data);
      objs = od.data.objs;
    }
    var obj, odat, i, objid;

    if( objs.length <= 0 ) return;
    objid = objs[0].objid;

    for( i=0; i<objs.length; ++i ) {
      obj = objs[i];
      obj.data = JSON.parse(obj.data);
    }
    this.objdats[objid] = objs;
  };

  this.addObject = function(obj, do_record_undo)
  {
    var objno = mapobjs.length;
    mapobjs.push(obj);
    radStore("mapobjs", mapobjs);
    if( do_record_undo === true )
      record_undo("created",objno);

    var loader = new GLTFLoader().setPath( "https://spiritshare.org/plex/res?id=" + obj.objid + "/" );
    this.getObjectData(obj.objid);
    loader.load( 'basis', function(gltf) {
      gltf.scene.name = gltf.scene.myname = objno;
      console.log("Add obj " + objno);
      gltf.scene.traverse(function(node) {
        if( node.name == 'lblue' || node.name == 'lred' || node.name == 'lgreen' )
          return;
        if( node.name == 'cblue' || node.name == 'cred' || node.name == 'cgreen' )
          return;
        if( node.name == 'grid' || node.name == 'skybox' )
          return;
        if( node.isMesh ) {
          if( this.envmap != null ) {
            node.material.envMap = this.envmap;
          }
          node.castShadow = true;
          node.receiveShadow = true;
          console.log("Node " + node.name + " is mesh and should cast shadows");
        }
        if( node instanceof THREE.Light ) {
          this.castShadowsFrom(node);
          console.log("Found light");
        }
      }.bind(this));
      this.scene.add( gltf.scene );
      this.controls.addObject( gltf.scene );
      gltf.scene.position.copy( new THREE.Vector3(obj.x,obj.y,obj.z) );
      gltf.scene.rotation.copy( new THREE.Euler(obj.rotX,obj.rotY,obj.rotZ,'XYZ') );
      this.mapRender();
    }.bind(this));
  };



  this.updateMapObject = function(objno)
  {
    var obj = radVar("mapobjs." + objno);
    this.scene.traverse(function(node) {
      if( node.myname == objno ) {
        console.log("updateMO found target");
        node.position.set( obj.x, obj.y, obj.z );
        node.rotation.x = obj.rotX;
        node.rotation.y = obj.rotY;
        node.rotation.z = obj.rotZ;
      }
    }.bind(this));
  };

  this.moveObject = function(objno)
  {
    var obj = radVar("mapobjs." + objno);
    this.scene.traverse(function(node) {
      if( node.myname == objno ) {
        console.log("moveObject found target");
        node.position.x = obj.x;
        node.position.y = obj.y;
        node.position.z = obj.z;
        this.mapRender();
      }
    }.bind(this));
  }
  this.rotateObject = function(objno)
  {
    var obj = radVar("mapobjs." + objno);
    this.scene.traverse(function(node) {
      if( node.myname == objno ) {
        console.log("moveObject found target");
        node.rotation.x = obj.rotX;
        node.rotation.y = obj.rotY;
        node.rotation.z = obj.rotZ;
        this.mapRender();
      }
    }.bind(this));
  }
  this.scaleObject = function(objno)
  {
    var obj = radVar("mapobjs." + objno);
    this.scene.traverse(function(node) {
      if( node.myname == objno ) {
        console.log("scaleObject found target");
        node.scale.x = obj.sclX;
        node.scale.y = obj.sclY;
        node.scale.z = obj.sclZ;
        this.mapRender();
      }
    }.bind(this));
  }

  this.collideBox = function(a,b)
  {
    var box1 = new THREE.Box3().setFromObject(a);
    var box2 = new THREE.Box3().setFromObject(b);
    return box1.intersectsBox(box2);
  };

  this.collideList = function(obj,list)
  {
    var i;
    var obj2, objs=[];

    for( i=0; i<list.length; ++i ) {
      if( obj == list[i] ) {
        continue;
      }
      if( list[i] instanceof THREE.Group ) {
        obj2 = this.collideList(obj, list[i].children);
        if( obj2.length != 0 ) {
          objs.push(...obj2);
        }
        continue;
      }
      obj2 = list[i];
      if( this.collideBox(obj,obj2) ) {
        objs.push(obj2);
      }
    }
    return objs;
  };

  this.collider = function(obj)
  {
    var objs = this.controls.getObjects();
    var list = this.collideList(obj,objs);
    if( list.length > 0 ) return list[0];
    return false;
  };

  this.dragUpdate = function(object)
  {
    var obj = object.object;
    var selobj = radVar("selectedobj");
    var mapobj = mapobjs[selobj];//radVar("mapobjs." + selobj);
    var roundby = 0.2;

    //! Snap to grid
    var s2g = document.forms['ctrl'].snaptogrid.checked;
    //! Snap to objects
    var s2o = document.forms['ctrl'].snaptomesh.checked;

    if( s2g ) {
      obj.position.x = roundBy(obj.position.x, roundby);
      obj.position.y = roundBy(obj.position.y, roundby);
      obj.position.z = roundBy(obj.position.z, roundby);
      this.controls.moveCursorTo(obj.position);
    }

    if ( s2o ) {
      // Test for collisions
      var obj2 = this.collider(obj);
      if( obj2 != null ) {
        // get box geometries
        var box1 = new THREE.Box3().setFromObject(obj);
        var box2 = new THREE.Box3().setFromObject(obj2);
        var lefts=false, rights=false, tops=false, bottoms=false;
        var fronts=false, backs=false;
        var wid,hgt,dep;

        wid = box1.max.x - box1.min.x;
        hgt = box1.max.y - box1.min.y;
        dep = box1.max.z - box1.min.z;

        // resolve side
        if( box1.max.x > box2.min.x && box1.min.x < box2.min.x )
          lefts=true;
        if( box1.min.x < box2.max.x && box1.max.x > box2.max.x )
          rights=true;
        if( box1.max.y > box2.min.y && box1.min.y < box2.min.y )
          tops=true;
        if( box1.min.y < box2.max.y && box1.max.y > box2.max.y )
          bottoms=true;
        if( box1.max.z > box2.min.z && box1.min.z < box2.min.z )
          fronts=true;
        if( box1.min.z < box2.max.z && box1.max.z > box2.max.z )
          backs=true;

        //! update position
        if( lefts )
          obj.position.x = box2.min.x - wid/2;
        if( rights )
          obj.position.x = box2.max.x + wid/2;
        if( tops )
          obj.position.y = box2.min.y - hgt/2;
        if( bottoms )
          obj.position.y = box2.max.y + hgt/2;
        if( fronts )
          obj.position.z = box2.min.z - dep/2;
        if( backs )
          obj.position.z = box2.max.z + dep/2;
        this.controls.moveCursorTo(obj.position);
      }
    }

    //! Update mapobjs
    var pos = obj.position;
    mapobj.x = pos.x;
    mapobj.y = pos.y;
    mapobj.z = pos.z;
    var rot = obj.rotation;
    mapobj.rotX = rot.x;
    mapobj.rotY = rot.y;
    mapobj.rotZ = rot.z;
    var scl = obj.scale;
    mapobj.sclX = scl.x;
    mapobj.sclY = scl.y;
    mapobj.sclZ = scl.z;
    radStore("mapobjs." + selobj, mapobj);
  }


  // Setup scene
  this.camera = null;
  this.scene = null;
  this.renderer = null;
  this.controls = null;

  this.mapRender = function()
  {
    if( this.renderer == null ) return;
    this.renderer.render(this.scene,this.camera);
  }

  this.scene = new THREE.Scene();
  this.scene.background = new THREE.Color(0x232323);
  {
    const intensity = 5;
    //const light = new THREE.HemisphereLight(skyColor, groundColor, intensity);
    const light = new THREE.AmbientLight( 0x404040, intensity ); // soft white light
    this.scene.add(light);
  }



  this.castShadowsFrom = function(light)
  {
    light.castShadow = true;
    var d = 15;
    light.shadow.camera.left = -d;
    light.shadow.camera.right = d;
    light.shadow.camera.top = d;
    light.shadow.camera.bottom = -d;
        //Set up shadow properties for the light
    light.shadow.mapSize.width = 512; // default
    light.shadow.mapSize.height = 512; // default
    light.shadow.camera.near = 0.1; // default
    light.shadow.camera.far = 1000; // default
  };

  var mainlight;

  {
    const color = 0xFFFFFF;
    const intensity = 1;
    const light = new THREE.DirectionalLight(color, intensity);
    light.position.set( 0, 500, 0 );
    this.castShadowsFrom(light);
    this.scene.add(light);
    mainlight = light;
  }

  this.orbitals = [];
  this.addOrbital = function(sat)
  {
    var grp, obj;

    grp = new THREE.Group();
    grp.name = 'orbital_group';
    grp.rotation.y = sat.zangle * Math.PI / 180;
    grp.rotation.x = 0;
    grp.rotation.z = 0;

    if( sat.intensity != 0 ) {
      obj = new THREE.DirectionalLight( eval(sat.color), parseFloat(sat.intensity) );
      obj.name = 'orbital_light';
      this.castShadowsFrom(obj);
      obj.position.set(0,0,-500);
      grp.add(obj);
      if( mainlight != null ) {
        this.scene.remove(mainlight);
        mainlight = null;
      }
    }

    var mydata = [sat,0,grp,obj];
    var obj2;
    if( sat.texture == '' || typeof sat.texture == 'undefined' ) {
      console.log("Create basic material sphere");
      var mat = new THREE.MeshBasicMaterial( { color: eval(sat.color), side: THREE.FrontSide } );
      obj2 = new THREE.Mesh(new THREE.SphereGeometry(sat.size, 30, 30), mat);
      obj2.position.set(0,0,-sat.distance);
      obj2.name = 'orbital_sphere';
      if( sat.intensity < 1 )
        grp.add(obj2);
      mydata.push(obj2);
      this.scene.add(grp);
      this.orbitals.push( mydata );
    } else {
      new THREE.TextureLoader().load(sat.texture, function(grp, texture) {
        console.log("Create textured material sphere");
        var geom,mat;
        var mat = new THREE.MeshBasicMaterial( { map: texture, side: THREE.FrontSide } );
        var obj2 = new THREE.Mesh(new THREE.SphereGeometry(sat.size, 30, 30), mat);
        obj2.position.set(0,0,-sat.distance);
        obj2.name = 'orbital_sphere';
        if( sat.intensity < 1 )
          grp.add(obj2);
        mydata.push(obj2);
        this.scene.add(grp);
        this.orbitals.push( mydata );
      }.bind(this,grp));
    }

    console.log("Built orbital");
  };

  this.updOrbitals = function()
  {
    var i,sat,grp;

    for( i=0; i<this.orbitals.length; ++i ) {
      sat = this.orbitals[i][0];
      grp = this.orbitals[i][2];
      this.orbitals[i][1] += parseFloat(sat.speed)/10;
      if( this.orbitals[i][1] > Math.PI * 4 ) {
        this.orbitals[i][1] -= Math.PI * 4;
      }
      grp.rotation.x = this.orbitals[i][1];
      if( sat.intensity == 1 ) {
        this.updSkydome(this.orbitals[i][1], sat.zangle*Math.PI/180, this.orbitals[i][3], this.orbitals[i][4]);
      }
    }
    if( this.orbitals.length > 0 )
      this.mapRender();
  };

  this.orbitint = setInterval( updOrbitals, 100 );

  this.getMap = function()
  {
    var i, maps=radVar("maps");

    for( i=0; i<maps.length; ++i ) {
      if( maps[i]._id == this.id )
        return i;
    }
    alert("Invalid map - not stored locally");
    return -1;
  }

  this.envmap = null;
  this.skyBox = null;

  this.buildEnvmap = function()
  {
    var map = radVar("maps." + this.getMap());

    if( map.envmap == '' ) return;
    return;

    var ddsl = new DDSLoader();
    ddsl.load('https://spiritshare.org/plex/mres?id=' + this.id + map.envmap, function(img){
      console.log("Textures found: ", img);
      /*
      img.mapping = THREE.CubeReflectionMapping;

      var mat = new THREE.MeshBasicMaterial( { envMap: img, side: THREE.BackSide, depthWrite: false } );
      var geom = new THREE.BoxBufferGeometry( 5000, 5000, 5000 );
      var mesh = new THREE.Mesh(geom,mat);
      this.scene.add(mesh);
      */

//      this.scene.background = img;
      this.envmap = img;
      this.scene.traverse(function(node) {
        if( node.name == 'skybox' || node.name == 'grid' || node.name == 'orbital_sphere' || node.name == 'selbox' )
          return;
        if( node.isMesh ) {
          node.material.envMap = this.envmap;
          node.castShadow = true;
          node.receiveShadow = true;
          console.log("Node " + node.name + " is mesh and should cast shadows");
        }
      }.bind(this));
      console.log("Set envmap");
    }.bind(this), function(){}, function(err){
      console.log(err);
      alert("Environment map - error");
    });
  }

  this.currentPhase = function(sunAngle)
  {
  	if( Math.sin(sunAngle) > Math.sin(0) ) {
  		return 'day';
  	} else if( Math.sin(sunAngle) > Math.sin(-Math.PI/6) ) {
  		return 'twilight';
  	} else {
  		return 'night';
  	}
  };


  var mysky=null, skyUniforms;
  var pmremGenerator;

  this.buildSkydome = function()
  {
    var map = radVar("maps." + this.getMap());

    mysky = new Sky();
    mysky.scale.setScalar(750);

    skyUniforms = mysky.material.uniforms;

		skyUniforms[ 'turbidity' ].value = 2.0;
		skyUniforms[ 'rayleigh' ].value = 1.813;
		skyUniforms[ 'mieCoefficient' ].value = 0.004;
		skyUniforms[ 'mieDirectionalG' ].value = 0.9;

    this.scene.add(mysky);

    if( false && map.skydome != '' ) {
      new THREE.TextureLoader().load('https://spiritshare.org/plex/mres?id=' + this.id + map.skydome, function(texture) {
        var mat2 = new THREE.MeshBasicMaterial( { map: texture, side: THREE.BackSide, opacity: 0.5, transparent: true } );
        this.skyBox2 = new THREE.Mesh(new THREE.SphereGeometry(600, 60, 40), mat2);
        this.skyBox2.name = 'skybox';
        this.skyBox2.scale.set(-1,1,1);
        this.scene.add(this.skyBox2);
        console.log("Added skydome texture");
      }.bind(this));
    }
  };

  this.updateEnvironment = function()
  {
    this.scene.traverse( function(node) {
      if( node.name == 'lblue' || node.name == 'lred' || node.name == 'lgreen' )
        return;
      if( node.name == 'cblue' || node.name == 'cred' || node.name == 'cgreen' )
        return;
      if( node.name == 'grid' || node.name == 'skybox' || node.name == 'orbital_sphere' )
        return;
      if( node.isMesh ) {
        node.material.envMap = this.envmap;
        node.castShadow = true;
        node.receiveShadow = true;
      }
    }.bind(this));
  };

  this.updSkydome = function(sunAngle, sunAngle2, sunlight, sunsphere)
  {
    var phase	= this.currentPhase(sunAngle);
    var sunpos = new THREE.Vector3(0,0,-1);
    sunpos.applyAxisAngle( new THREE.Vector3(1,0,0), sunAngle );
    sunpos.applyAxisAngle( new THREE.Vector3(0,1,0), sunAngle2 );
    //console.log("Angles " + sunAngle + "," + sunAngle2);

    if( mysky == null ) return; // haven't loaded the sky yet
    //if( typeof sunsphere == 'undefined' ) return;

    mysky.material.uniforms[ 'sunPosition' ].value.copy( sunpos );
		this.envmap = pmremGenerator.fromScene( mysky ).texture;
    this.updateEnvironment();

    if( phase === 'day' ){
			//sunsphere.material.color.set("rgb(255,"+ (Math.floor(Math.sin(sunAngle)*200)+55) + "," + (Math.floor(Math.sin(sunAngle)*200)+5) +")");
      sunlight.color.set("rgb(255,"+ (Math.floor(Math.sin(sunAngle)*200)+55) + "," + (Math.floor(Math.sin(sunAngle)*200)) +")");
      //this.skyUni.topColor.value.set("rgb(0,120,255)");
      //this.skyUni.bottomColor.value.set("rgb(255,"+ (Math.floor(Math.sin(sunAngle)*200)+55) + "," + (Math.floor(Math.sin(sunAngle)*200)) +")");
    } else if( phase === 'twilight' ){
      sunlight.intensity = 1;
			//sunsphere.material.color.set("rgb(255,55,5)");
      sunlight.color.set("rgb(" + (255-Math.floor(Math.sin(sunAngle)*510*-1)) + "," + (55-Math.floor(Math.sin(sunAngle)*110*-1)) + ",0)");
      //this.skyUni.topColor.value.set("rgb(0," + (120-Math.floor(Math.sin(sunAngle)*240*-1)) + "," + (255-Math.floor(Math.sin(sunAngle)*510*-1)) +")");
      //this.skyUni.bottomColor.value.set("rgb(" + (255-Math.floor(Math.sin(sunAngle)*510*-1)) + "," + (55-Math.floor(Math.sin(sunAngle)*110*-1)) + ",0)");
    } else {
      sunlight.intensity	= 0;
      //this.skyUni.topColor.value.set('black')
      //this.skyUni.bottomColor.value.set('black');
    }

  };

  this.buildSkydome2 = function()
  {
    var map = radVar("maps." + this.getMap());

    var shader = {
      uniforms	: {
        topColor	: { type: "c", value: new THREE.Color().setHSL( 0.6, 1, 0.75 ) },
        bottomColor	: { type: "c", value: new THREE.Color( 0xffffff ) },
        offset		: { type: "f", value: 400 },
        exponent	: { type: "f", value: 0.6 },
      },
      vertexShader	: [
        'varying vec3 vWorldPosition;',
        'void main() {',
        '	vec4 worldPosition = modelMatrix * vec4( position, 1.0 );',
        '	vWorldPosition = worldPosition.xyz;',
        '	gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );',
        '}',
      ].join('\n'),
      fragmentShader	: [
        'uniform vec3 topColor;',
        'uniform vec3 bottomColor;',
        'uniform float offset;',
        'uniform float exponent;',

        'varying vec3 vWorldPosition;',

        'void main() {',
        '	float h = normalize( vWorldPosition + offset ).y;',
        '	gl_FragColor = vec4( mix( bottomColor, topColor, max( pow( h, exponent ), 0.0 ) ), 1.0 );',
        '}',
      ].join('\n'),
    };
    var uni = THREE.UniformsUtils.clone(shader.uniforms);
    var mat = new THREE.ShaderMaterial({
      vertexShader: shader.vertexShader,
      fragmentShader: shader.fragmentShader,
      uniforms: uni,
      side: THREE.BackSide
    });
    this.skyUni = uni;
    this.skyBox = new THREE.Mesh(new THREE.SphereGeometry(750, 60, 40), mat);
    this.skyBox.name = 'skybox';
    this.skyBox.scale.set(-1,1,1);
    this.scene.add(this.skyBox);

    if( map.skydome == '' ) return;
/*
    new THREE.TextureLoader().load('https://spiritshare.org/plex/mres?id=' + this.id + map.skydome, function(texture) {
      var mat2 = new THREE.MeshBasicMaterial( { map: texture, side: THREE.BackSide, opacity: 0.5, transparent: true } );
      this.skyBox2 = new THREE.Mesh(new THREE.SphereGeometry(700, 60, 40), mat2);
      this.skyBox2.name = 'skybox';
      this.skyBox2.scale.set(-1,1,1);
      this.scene.add(this.skyBox2);
    }.bind(this));
    */
  }

  console.log("Window presize: " + e.clientWidth + ", " + e.clientHeight);

  this.buildCamera = function(orthocam)
  {
    console.log("Updating camera");
    if( orthocam ) {
      this.camera = new THREE.OrthographicCamera( e.clientWidth / -2, e.clientWidth / 2, e.clientHeight / 2, e.clientHeight / -2, 0.1, 10000 );
      this.camera.position.set( 0, 10, -10 );
      if( this.controls ) {
        this.controls.setCamera(this.camera);
        this.controls.zoom0 = 40;
        this.controls.reset();
        this.mapRender();
      }
    } else {
      this.camera = new THREE.PerspectiveCamera( 45, e.clientWidth / e.clientHeight, 0.1, 10000 );
      this.camera.position.set( 0, 10, -20 );
      if( this.controls ) {
        this.controls.setCamera(this.camera);
        this.controls.zoom0 = 1;
        this.controls.reset();
        this.mapRender();
      }
    }
  }

  //this.buildEnvmap();
  this.buildSkydome();
  this.buildCamera(false);

  this.renderer = new THREE.WebGLRenderer( { antialias: true } );
  this.renderer.setPixelRatio( window.devicePixelRatio );
  this.renderer.setSize( e.clientWidth, e.clientHeight );
  this.renderer.shadowMap.enabled = true;
  this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
  this.renderer.toneMappingExposure = 0.25;
  this.renderer.outputEncoding = THREE.sRGBEncoding;
  e.appendChild( this.renderer.domElement );

  pmremGenerator = new THREE.PMREMGenerator( this.renderer );

	this.controls = new CombinedControls( [], this.camera, this.renderer.domElement, this.scene );
	this.controls.addEventListener( 'change', this.mapRender.bind(this) ); // use if there is no animation loop
	this.controls.addEventListener( 'drag', this.dragUpdate.bind(this) ); // use if there is no animation loop
	this.controls.minDistance = 0.1;
	this.controls.maxDistance = 100;
	this.controls.target.set( 0, 0, 0 );
	this.controls.update();

  this.requestObjects();
  this.mapRender();

  this.dispose = function()
  {
    clearInterval(this.orbitint);
    this.controls.deactivate();
  }
}
