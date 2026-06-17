import { GLTFLoader } from 'https://unpkg.com/three@0.123.0/examples/jsm/loaders/GLTFLoader.js';

var GameLoader = function(_game)
{
  this.game = _game;

  this.requestScript = function()
  {
    var e = document.createElement("script");
    e.onload = this.gotScript.bind(this);
    e.src = "/plex/compile?id="+this.game.id;
    document.getElementsByTagName('head')[0].appendChild(e);
  };

  this.gotScript = function()
  {
    console.log("Got script data");
  }

  this.objects = {};
  this.objdats = {};
  this.getObjectData = function(objid)
  {
    if( objid in this.objdats ) return;
    HtmlRequestGet("/plex/objdat",buildArgString({id:objid}),this.loadObjdata.bind(this));
  }
  this.loadObjdata = function(data)
  {
    var od, objs;
    //console.log("loadObjdata(" + data + ")");
    od = JSON.parse(data);
    objs = od.data.objs;
    var obj, odat, i, objid;

    if( objs.length <= 0 ) {
      this.objdats[objid] = [];
      return;
    }
    objid = objs[0].objid;
    var allObjects = this.game.controls.getObjects();

    for( i=0; i<objs.length; ++i ) {
      obj = objs[i];
      obj.data = JSON.parse(obj.data);
    }
    this.objdats[objid] = objs;
    for( i=0; i<allObjects.length; ++i ) {
      obj = allObjects[i];
      if( typeof obj.body != 'undefined' ) continue;
      if( obj.myid == objid ) {
        this.game.physics.ammoBody( obj, objs, 0.0 );
        this.game.physics.ammoAdd( obj );
      }
    }
    if( this.game.mychar != null && this.game.mychar.myid == objid ) {
      obj = this.game.mychar;
      var body = this.game.physics.ammoBody( obj, objs, 1.0 );
      body.setAngularFactor( 0, 1, 0 );
      body.setFriction( 0.05 );
      body.setGravity( new Ammo.btVector3(0,0,0) );
      //body.setCollisionFlags( 2 );
      body.setActivationState( 4 );
      this.game.physics.ammoAdd( obj );
    }
  };

  this.requestObjects = function()
  {
    HtmlRequestGet("/plex/mapobj", buildArgString({"id":this.game.id}), this.gotObjects.bind(this));
  };

  this.registerObject = function(objid, obj)
  {
    this.objects[objid] = obj;
  };

  this.instanceObject = function(mapobj, objno, scene)
  {
    scene.name = scene.myname = objno;
    console.log("Add obj " + objno);
    scene.position.copy( new THREE.Vector3(mapobj.x,mapobj.y,mapobj.z) );
    scene.rotation.copy( new THREE.Euler(mapobj.rotX,mapobj.rotY,mapobj.rotZ,'XYZ') );
    scene.rotation.reorder('YXZ');
    scene.myid = mapobj.objid;
    scene.myobj = objno;

    if( mapobj._id in moscripts ) {
      scene.script = new moscripts[mapobj._id](this.game,THREE);
      if( 'idle' in scene.script )
        this.game.idlers.push(scene);
    } else
      scene.script = null;
    scene.updateMatrixWorld();

    if( mapobj.objid in this.objdats ) {
      this.game.physics.ammoBody(scene,this.objdats[mapobj.objid], 0.0);
      this.game.physics.ammoAdd(scene);
    }

    var box = this.game.physics.getBoxFor(scene);
    this.game.spatialidx.add( box, scene );

    scene.traverse(function(node) {
      if( node.isMesh ) {
        if( this.game.environs.envmap != null ) {
          node.material.envMap = this.game.environs.envmap;
        }
        node.castShadow = true;
        node.receiveShadow = true;
      }
      if( node instanceof THREE.DirectionalLight ) {
        this.game.util.castShadowsFrom(node, false);
      }
    }.bind(this));

    this.game.scene.add( scene );
    this.game.controls.addObject( scene );

    if( scene.script && 'load' in scene.script )
      scene.script.load(scene, objno);
  };

  this.finishLoading = function()
  {
    var i;
    var obj, objno, sceneobj;

    console.log("Instantiate " + this.game.mapobjs.length + " items.");
    for( i=0; i<this.game.mapobjs.length; ++i ) {
      obj = this.game.mapobjs[i];
      objno = i;

      if( obj.objid in this.objects ) {
        sceneobj = this.objects[obj.objid].clone();
        this.instanceObject(obj,objno,sceneobj);
      }
    }
    radStore("mapobjs", this.game.mapobjs);
    this.game.mapRender();
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
      this.game.environs.addOrbital(sat);
    }

    var obj, count=odata.data.objects.length;
    var objno, sceneobj;
    var objlookups = {};
    var count = 0;

    for( i=0; i < odata.data.objects.length; ++i ) {
      obj = odata.data.objects[i];
      this.game.mapobjs.push( obj );
      if( obj.objid in objlookups ) continue;
      objlookups[obj.objid] = obj;
      count++;
    }

    console.log("Lookup " + count + " items.");
    for( i in objlookups ) {
      obj = objlookups[i];
      this.getObjectData(obj.objid);
      var loader = new GLTFLoader().setPath( "https://spiritshare.org/plex/res?id=" + obj.objid + "/" + this.game.useres );

      loader.load( 'basis', function(obj, gltf) {
        this.registerObject(obj.objid, gltf.scene);

        count--;
        if( count == 0 ) {
          console.log("Done loading items");
          this.finishLoading();
        }
      }.bind(this, obj), function(){}, function(error) {
        console.log("Error loading item");
        count--;
        if( count == 0 ) {
          console.log("Done loading items");
          this.finishLoading();
        }
      }.bind(this));
    }

  };

};

export { GameLoader };
