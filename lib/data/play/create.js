var ObjectID = require('mongoose').Schema.Types.ObjectId;

module.exports = function PlayData() {
  this.createSyllable = function()
  {
    var str = "";
    var n = this.app.util.randomInt(0,108);
    var cons = [ "b", "c", "d", "f", "g", "h", "j", "k", "l", "m", "n", "p", "r", "s", "t", "v", "w", "x", "z" ];
    var vowels = [ "a", "e", "i", "o", "u" ];

    if( n < 3 ) {
      str += "th";
      str += vowels[ this.app.util.randomInt(0,vowels.length) ];
    } else if( n < 6 ) {
      str += "sh";
      str += vowels[ this.app.util.randomInt(0,vowels.length) ];
    } else if( n < 7 ) {
      str += "qu";
    } else if( n < 10 ) {
      str += vowels[ this.app.util.randomInt(0,vowels.length) ];
      str += "th";
    } else if( n < 13 ) {
      str += vowels[ this.app.util.randomInt(0,vowels.length) ];
      str += "sh";
    } else if( n < 60 ) {
      str += cons[this.app.util.randomInt(0,cons.length)];
      str += vowels[this.app.util.randomInt(0,vowels.length)];
    } else {
      str += vowels[this.app.util.randomInt(0,vowels.length)];
      str += cons[this.app.util.randomInt(0,cons.length)];
    }

    return str;
  };

  this.createName = function(namelen)
  {
    var i;
    var str = "";
    for( i=0;i<namelen;++i ) {
      str += this.createSyllable();
    }
    return str;
  };


  this.createPlanet = function(starid, basedist) {
    var planet = new this.objs.Planets();
    planet.starid = starid;
    planet.name = this.createName(5);
    planet.devlevel = 0;
    planet.cultureid = '';
    planet.stardist = basedist + Math.random() * 100.0 - 50.0;
    planet.type = this.app.util.randomInt(0,this.planettypes.length);
    planet.size = Math.random() * ( this.planetsizemax[planet.type] - this.planetsizemin[planet.type] ) + this.planetsizemin[planet.type];
    //this.app.tools.Mongoose.save(planet);
    this.planetobjs.push(planet);

    return planet;
  };

  this.savePlanets = function(cb) {
    if( this.planetobjs.length > 0 ) {
      var slo = this.planetobjs.splice(0,1000);
      this.objs.Planets.insertMany( slo, function(e, docs) {
        if( e ) {
          console.log("Error creating planets: " + e);
        } else {
          console.log("Saved planets - " + docs.length);
          this.savePlanets(cb);
        }
      }.bind(this));
    } else {
      console.log("Done saving planets " + this.loadsaved);
      this.loadsaved++;
      if( this.loadsaved == 3 ) cb();
    }
  };

  this.createStar = function() {
    var i, dx, dy, dist, mindist=100;
    var star = new this.objs.Stars();
    star.name = this.createName(4);
    do {
      star.x = Math.random() * 1000.0;
      star.y = Math.random() * 1000.0;
      mindist=100;
      for( i=0; i<this.starobjs.length; ++i ) {
        dx = star.x - this.starobjs[i].x;
        dy = star.y - this.starobjs[i].y;
        dist = Math.sqrt(dx*dx + dy*dy);
        if( dist<mindist ) mindist=dist;
      }
    } while( mindist<30 );

    var max_planets = 8;
    var min_planets = 3;
    var dist, planets = this.app.util.randomInt(min_planets,max_planets);
    for( dist=100; dist<10000; dist += 200 )
    {
      planets--;
      if( planets <= 0 ) break;
      this.createPlanet( star._id, dist );
    }
    mindist=500;
    for( i=0; i<this.starobjs.length; ++i ) {
      dx = star.x - this.starobjs[i].x;
      dy = star.y - this.starobjs[i].y;
      dist = Math.sqrt(dx*dx + dy*dy);
      if( dist<mindist ) mindist=dist;
      if( dist<110 ) {
        this.createStarlink(star, this.starobjs[i]);
      }
    }

    this.starobjs.push(star);
    return star;
  };
  this.saveStars = function(cb, n) {
    if( typeof n == 'undefined' ) n = 0;

    if( this.starobjs.length > 0 ) {
      var slo = this.starobjs.splice(0,1000);
      this.objs.Stars.insertMany(slo, function(e, docs) {
        if( e ) {
          console.log("saveStars Error - ", e);
        } else {
          console.log("Saved " + docs.length + " stars");
          this.saveStars(cb, n+docs.length);
        }
      }.bind(this));
    } else {
      console.log("Done saving stars (" + n + ") " + this.loadsaved);
      this.loadsaved++;
      if( this.loadsaved == 3 ) cb();
    }
  };

  this.starlinkobjs = [];
  this.createStarlink = function(star1, star2) {
    var starlink = new this.objs.Starlinks();
    starlink.star1 = star1._id;
    starlink.star2 = star2._id;
    this.starlinkobjs.push(starlink);
  };
  this.saveStarlinks = function(cb, n) {
    if( typeof n == 'undefined' ) n = 0;

    if( this.starlinkobjs.length > 0 ) {
      var slo = this.starlinkobjs.splice(0,1000);
      this.objs.Starlinks.insertMany( slo, function(e, docs) {
        if( e ) {
          console.log("saveStarlinks Error - ", e);
        } else {
          console.log("Saved " + docs.length + " starlinks.");
          this.saveStarlinks(cb,n+docs.length);
        }
      }.bind(this));
    } else {
      console.log("Done saving starlinks (" + n + ") " + this.loadsaved);
      this.loadsaved++;
      if( this.loadsaved == 3 ) cb();
    }
  };

  this.marketobjs = [];
  this.createMarket = function(pid, itemtype, pop, amount) {
    var market = new this.objs.Markets();
    market.loctype = 1;
    market.locid = pid;
    market.resource = itemtype;
    var buy, sell;
    [buy,sell] = this.calculateMarket(itemtype,pop,amount);
    market.buy = buy;
    market.sell = sell;
    switch( market.loctype ) {
      case 0:
        break;
      case 1:
        this.planets[ market.locid ].markets.push( market._id );
        break;
      case 2:
        break;
      case 3:
        //! starbase
        break;
    }
    this.marketobjs.push(market);

    this.markets[ market._id ] = market.toObject();
    return market._id;
  };
  this.saveMarkets = function(cb) {
    if( this.marketobjs.length > 0 ) {
      var slo = this.marketobjs.splice(0,1000);
      this.objs.Markets.insertMany( slo, function(e, docs) {
        if( e ) {
          console.log("saveMarkets Error - ", e);
        } else {
          console.log("Saved " + docs.length + " markets.");
          this.saveMarkets(cb);
        }
      }.bind(this));
    } else {
      console.log("Done saving markets");
      if( typeof cb != 'undefined' )
        cb();
    }
  };

  this.cultureobjs = [];
  this.createCulture = function(usegold, useplayer=false, cb) {
    var culture = new this.objs.Cultures();
    culture.name = this.createName(5);
    culture.gold = typeof usegold != 'undefined' ? usegold : 100;
    culture.isplayer = useplayer;
    var i;
    var mindist_n=-1;
    var mindist=150;
    var x,y,dx,dy,dist;
    var starnum, planetnum, planetid;

    // Locate the closest star for this culture

    x=Math.random()*1000;
    y=Math.random()*1000;
    planetid = this.findNearestPlanet(x,y,['terran'],[]);
    if( planetid == '' ) {
      console.log("Error: Cannot find a planet!");
      return;
    }

    // update the planet
    this.planets[planetid].cultureid = culture._id;
    this.planets[planetid].pop = 1;

    var bld, bnew;
    if( this.planets[planetid].builds.length > 0 ) {
      bld = this.builds[ this.planets[planetid].builds[0] ];
      bnew=false;
    } else {
      bld = new this.objs.Builds();
      bld.loctype = 1;
      bld.locid = planetid;
      bnew=true;
    }
    bld.done = 1;
    bld.work = 0;
    bld.paid = 0;
    if( bnew ) {
      this.planets[planetid].builds.push( bld._id );
      this.builds[ bld._id ] = bld.toObject();
      bld.save( function(e,doc) {
        if( e ) {
          console.log("Create build: failed");
        }
      });
    } else {
      this.objs.Builds.updateOne({_id: bld._id}, this.builds[bld._id], function(e,doc) {
        if( e) {
          console.log("Set build: failed");
        }
      });
    }
    this.sendUpdate( 'builds', bld._id, this.builds[bld._id] );

    //this.planetupds.push(planetid);
    this.objs.Planets.updateOne({_id: planetid}, { cultureid: culture._id, pop: 1 }, function(e,doc){
      if( e ) {
        console.log("Set culture: failed");
      }
    });
    this.sendUpdate( 'planets', planetid, this.planets[planetid] );

    for( i in this.resources ) {
      this.createMarket(planetid, i, 1, 0);
    }

    var co = culture.toObject();
    co.planets = [ planetid ];
    co.ships = [];
    co.starbases = [];
    co.techs = [];

    this.cultures.push(co);
    this.cultureids[culture._id] = this.cultures.length-1;
    this.cultureobjs.push(culture);
    this.saveMarkets(cb);

    return culture._id;
  };

  this.saveCultures = function(cb, n) {
    if( typeof n == 'undefined' ) n = 0;

    if( this.cultureobjs.length > 0 ) {
      var slo = this.cultureobjs.splice(0,1000);
      this.objs.Cultures.insertMany(slo, function(e, docs) {
        if( e ) {
          console.log("saveCultures Error - ", e);
        } else {
          console.log("Saved " + docs.length + " cultures.");
          this.saveCultures(cb,n+docs.length);
        }
      }.bind(this));
    } else {
      console.log("Done saving cultures (" + n + ")");
      cb();
    }
  };


  this.deleteSystem = function(cb) {
    this.loadstate = 0;
    this.loadunits = 11;
    this.objs.Stars.deleteMany({}, function(e) {
      if( e ) console.log(e);
      this.loadstate++;
      if( this.loadstate == this.loadunits ) cb();
    }.bind(this));
    this.objs.Starlinks.deleteMany({}, function(e) {
      if( e ) console.log(e);
      this.loadstate++;
      if( this.loadstate == this.loadunits ) cb();
    }.bind(this));
    this.objs.Planets.deleteMany({}, function(e) {
      if( e ) console.log(e);
      this.loadstate++;
      if( this.loadstate == this.loadunits ) cb();
    }.bind(this));
    this.objs.Cultures.deleteMany({}, function(e) {
      if( e ) console.log(e);
      this.loadstate++;
      if( this.loadstate == this.loadunits ) cb();
    }.bind(this));
    this.objs.Techs.deleteMany({}, function(e) {
      if( e ) console.log(e);
      this.loadstate++;
      if( this.loadstate == this.loadunits ) cb();
    }.bind(this));
    this.objs.Ships.deleteMany({}, function(e) {
      if( e ) console.log(e);
      this.loadstate++;
      if( this.loadstate == this.loadunits ) cb();
    }.bind(this));
    this.objs.Items.deleteMany({}, function(e) {
      if( e ) console.log(e);
      this.loadstate++;
      if( this.loadstate == this.loadunits ) cb();
    }.bind(this));
    this.objs.Players.deleteMany({}, function(e) {
      if( e ) console.log(e);
      this.loadstate++;
      if( this.loadstate == this.loadunits ) cb();
    }.bind(this));
    this.objs.Builds.deleteMany({}, function(e) {
      if( e ) console.log(e);
      this.loadstate++;
      if( this.loadstate == this.loadunits ) cb();
    }.bind(this));
    this.objs.Buildings.deleteMany({}, function(e) {
      if( e ) console.log(e);
      this.loadstate++;
      if( this.loadstate == this.loadunits ) cb();
    }.bind(this));
    this.objs.Markets.deleteMany({}, function(e) {
      if( e ) console.log(e);
      this.loadstate++;
      if( this.loadstate == this.loadunits ) cb();
    }.bind(this));
  };
  this.createSystem = function(finalcb) {
    var i, j, n, m;
    var starcount = 150;

    this.planetobjs = [];
    this.starlinkobjs = [];
    this.starobjs = [];

    for( i=0; i<starcount; ++i ) {
      this.createStar();
    }
    console.log("Created stars");

    this.loadsaved=0;
    var cb = function() {
      this.loadSystem( function() {
        var culture_count=30;
        var newcultures=0;

        console.log("Creating cultures");
        this.cultureobjs = [];
        for( i=0;i<culture_count; ++i ) {
          this.createCulture(1000, false, function() {
            newcultures++;
            if( newcultures == culture_count ) {
              console.log("Done creating cultures");
              this.saveCultures( function() {
                console.log("Done saving cultures");
                this.loadSystem( function() {
                  console.log("Done reloading system");
                  finalcb();
                }.bind(this) );
              }.bind(this) );
            }
          }.bind(this));
        }
      }.bind(this) );
    }.bind(this);
    this.saveStars(cb);
    this.savePlanets(cb);
    this.saveStarlinks(cb);

  };
};
