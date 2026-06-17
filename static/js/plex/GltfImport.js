import * as THREE from 'https://unpkg.com/three@0.123.0/build/three.module.js';
import { GLTFLoader } from 'https://unpkg.com/three@0.123.0/examples/jsm/loaders/GLTFLoader.js';
import { GLTFExporter } from 'https://unpkg.com/three@0.123.0/examples/jsm/exporters/GLTFExporter.js';

var importer = null;

window.importMap = function(mapid)
{
  radStore("mapimporter", {'mapid': mapid});
  newWindow("mapimporter","mapimporter");
  window.importer = importer = new mapImporter(mapid);
};


window.chooseCategory = function(e)
{
  console.log("chooseCategory",e);
  var catid = e.value;
  importer.setCat(catid);
}


window.gotMap = function(data)
{
  radStore("importer_msg", "Uploaded. Parsing...");
  console.log("Data from import: " + data);
  var o  = JSON.parse(data);
  importer.loadup(o.data.path);
  //! loadup(datapath)
}

window.loadupMap = function(datapath)
{
  importer.loadup(datapath);
}


var mapImporter = function(mapid)
{
  var i;

  this.scene = null;
  this.sceneobjs = [];
  this.newobjects = [];
  this.catid = '';

  this.setCat = function(id)
  {
    this.catid = id;
  };

  this.loadup = function(datapath)
  {
    //! import the gltf asset
    var loader = new GLTFLoader().setPath( "https://spiritshare.org/plex/mres?id=" + mapid + "/" );
    loader.load( datapath, function(gltf) {
      this.scene = gltf.scene;
      radStore("importer_msg", "Parsed. Analyzing...");
      console.log("Loaded. Analyzing...");
      this.analyze();
    }.bind(this));
    //! start analysis
  };

  this.geometries = {};
  this.getGeometryOf = function(obj)
  {
    if( obj.id in this.geometries )
      return this.geometries[obj.id];
    var verts = [];
    var pts = [];
    var trv = [obj];
    var o;
    var i, j, vtx = new THREE.Vector3();

    while( trv.length > 0 ) {
      o = trv.shift();
      if( o.geometry instanceof THREE.BufferGeometry ) {
        pts = o.geometry.getAttribute('position');
        for( i=0; i< pts.count; ++i ) {
          vtx.fromBufferAttribute( pts, i );
          verts.push(vtx.clone());
        }
      } else if( o.geometry && o.geometry.vertices && o.geometry.vertices.length > 0 ) {
        for( i=0; i< o.geometry.vertices.length; ++i ) {
          verts.push( o.geometry.vertices[i] );
        }
      }
      for( i=0; i< o.children.length; ++i ) {
        trv.push( o.children[i] );
      }
    }
    this.geometries[obj.id] = verts;
    return verts;
  };

  this.fixName = function(str)
  {
    var pname;
    var px = str.indexOf("_(");
    if( px != -1 ) {
      pname = str.substr(0,px);
    } else {
      pname = str;
    }
    var i = pname.length-1;
    var c, ci, notone=false;
    var found=false;
    do {
      c = pname[i];
      ci = parseInt(c);
      if( isNaN(ci) ) {
        if( c == '_' ) {
          found=true;
        }
        break;
      } else if( ci != 1 ) {
        notone=true;
      }
      i--;
    } while(i>0);

    if( found ) {
      if( notone )
        return '';
      pname = pname.substr(0,i);
    }

    return pname;
  }

  this.isSame = function(obj1,obj2)
  {
    var g1 = this.getGeometryOf(obj1);
    var g2 = this.getGeometryOf(obj2);

    var pname1, pname2;

    pname1 = this.fixName(obj1.name);
    pname2 = this.fixName(obj2.name);

    if( pname1 == '' || pname2 == '' )
      return false;

    if( pname1 == pname2 && g1.length == g2.length ) {
      return true;
    } else if( pname1 == pname2 ) {
      console.warn("Objects have same name but different geometries");
    }
    return false;
  };

  this.analyze = function()
  {
    var ix = [this.scene];
    var irow, i, found;
    var named;

    do {
      irow = ix.shift();
      if( irow.isMesh && irow.name != '' ) {
        named = this.fixName(irow.name);
        if( named == '' ) continue;
        found=false;
        for( i=0; i<this.newobjects.length; ++i ) {
          if( this.isSame( irow, this.newobjects[i] ) ) {
            console.log("isSame - assign tempid " + this.newobjects[i].tempid);
            irow.tempid = this.newobjects[i].tempid;
            found=true;
            break;
          }
        }
        if( !found ) {
          console.log("!isSame - new tempid for " + irow.name);
          irow.tempid = randStr(10);
          this.newobjects.push(irow);
        }
        this.sceneobjs.push(irow);
      } else {
        ix.push(...irow.children);
      }
    } while( ix.length > 0 );
    //! separate objects into sceneobjs
    //! assign tempids
    //! start upload

    this.uploadOne();
  };


  this.uploadOne = function()
  {
    var obj = this.newobjects.shift();

    const exporter = new GLTFExporter();

    var oclone = obj.clone();
    oclone.position.set(0,0,0);
    oclone.rotation.set(0,0,0,'XYZ');
    oclone.updateMatrixWorld();
    var fn = this.fixName(obj.name);
    obj.name = fn;

    console.log("Uploading object " + obj.tempid + ":" + obj.name + ", " + this.newobjects.length + " items left.");
    radStore("importer_msg", "Uploading object " + obj.tempid + ":" + obj.name + ", " + this.newobjects.length + " items left.");

    exporter.parse( oclone, function(gltfdata) {
      var gd = JSON.stringify(gltfdata);
      console.log("GLTF data acquired, length: " + gd.length + ", cat: " + this.catid );
      HtmlRequestEncode('/plex/importobj',{'name':obj.name,'catid':this.catid},{'gltf':gd},this.uploaded.bind(this),obj.tempid);
    }.bind(this));
  };

  this.uploaded = function(data, objtemp)
  {
    var i;
    var objid;

    //console.log("Got data: " + objtemp + ":" + data);
    var o = JSON.parse(data);

    objid = o.data._id;

    for( i=0; i<this.sceneobjs.length; ++i ) {
      if( this.sceneobjs[i].tempid == objtemp ) {
        console.log("Found objid " + objid);
        this.sceneobjs[i].objid = objid;
      }
    }

    if( this.newobjects.length > 0 ) {
      this.uploadOne();
    } else {
      this.uploadObjects();
    }
  };

  var mapobjs = [];
  this.uploadObjects = function()
  {
    mapobjs = [];
    var mo, so;
    var i;
    var pos, quat, eul;

    for( i=0; i < this.sceneobjs.length; ++i ) {
      so = this.sceneobjs[i];
      pos = new THREE.Vector3();
      quat = new THREE.Quaternion();
      so.getWorldPosition(pos);
      so.getWorldQuaternion(quat);
      eul = new THREE.Euler();
      eul.setFromQuaternion(quat);
      mo = {
        name: so.name,
        mapid: mapid,
        _id: '',
        objid: so.objid,
        /*
        x: so.position.x,
        y: so.position.y,
        z: so.position.z,
        rotX: so.rotation.x,
        rotY: so.rotation.y,
        rotZ: so.rotation.z,
        */
        x: pos.x,
        y: pos.y,
        z: pos.z,
        rotX: eul.x,
        rotY: eul.y,
        rotZ: eul.z,
        sclX: so.scale.x,
        sclY: so.scale.y,
        sclZ: so.scale.z
      };
      mapobjs.push(mo);
    }

    var mapobj = { 'objs': mapobjs };
    var mapobjs2 = radVar("mapobjs");
    if( mapobjs2 == null ) mapobjs2=[];
    mapobjs2.push(...mapobjs);
    radStore("mapobjs",mapobjs2);
    var args = buildArgString(mapobj);
    HtmlRequest('/plex/mapobjs',args,this.savedObjects.bind(this));
  };

  this.savedObjects = function(data)
  {
    savedObjects(data);
    var i;

    for( i=0; i<mapobjs.length; ++i ) {
      window.addToScene(mapobjs[i], false);
    }
    radStore("importer_msg", "All done!");
  };
};
