var ObjectID = require('mongoose').Schema.Types.ObjectId;

module.exports = function PlayData() {
  this.findStar = function(id)
  {
    if( !(id in this.starids) ) return -1;
    return this.starids[id];
  };
  this.findCulture = function(id)
  {
    if( !(id in this.cultureids) ) return -1;
    return this.cultureids[id];
  };

  this.starDist = function(i,j)
  {
    var a = Math.abs(this.stars[i].x - this.stars[j].x);
    var b = Math.abs(this.stars[i].y - this.stars[j].y);
    return Math.sqrt( a*a + b*b );
  };

  this.countItems = function(src,type)
  {
    var i, j, count=0;

    for( j=0; j<src.items.length; ++j ) {
      if( this.items[src.items[j]].type == type ) {
        count += this.items[src.items[j]].amount;
      }
    }
    return count;
  };

  this.countCultureItems = function(cno,type)
  {
    var i, j, count=0;
    var src;

    for( i=0; i<this.cultures[cno].planets.length; ++i ) {
      src = this.planets[ this.cultures[cno].planets[i] ];
      for( j=0; j<src.items.length; ++j ) {
        if( this.items[src.items[j]].type == type ) {
          count += this.items[src.items[j]].amount;
        }
      }
    }
    return count;
  };

  this.findItemType = function(source,type)
  {
    var i, iid;

    for( i=0; i<source.items.length; ++i ) {
      iid = source.items[i];
      if( this.items[iid].type == type )
        return iid;
    }

    return '';
  };

  this.createItems = function(source,type,amount,loctype,locid)
  {
    var iid = this.findItemType(source,type);
    var item, isnew;
    if( iid == '' ) {
      isnew = true;
      item = new this.objs.Items();
      item.type = type;
      item.name = type;
      item.amount = amount;
      item.locid = locid;
      item.loctype = loctype;
      iid = item._id;
      source.items.push(iid);
      this.items[ iid ] = item.toObject();
    } else {
      isnew = false;
      item = this.items[iid];
      item.amount += amount;
    }
    return [ isnew, iid ];
  };

  this.pickBuild = function()
  {
    var weight=0;
    var i;

    for( i in this.buildrate ) {
      weight += this.buildrate[i].rate;
    }
    var n = Math.random() * weight;
    for( i in this.buildrate ) {
      n -= this.buildrate[i].rate;
      if( n <= 0 ) {
        return i;
      }
    }
    console.log("pickBuild failed");
    return false;
  };

  this.sortPlanetDists = function(a, b)
  {
    if( a.dist < b.dist ) return -1;
    else if( a.dist > b.dist ) return 1;
    return 0;
  };

  this.getColonyTypes = function(cno)
  {
    var i;
    var types = [];

    for( i=0; i<this.planettypes.length; ++i ) {
      if( this.hasTech(cno, this.planetresearch[i]) ) {
        types.push(this.planettypes[i]);
      }
    }

    return types;
  };

  this.getPlannedColonies = function(cno)
  {
    var i;
    var colonies = [];

    for( i in this.agents ) {
      if( this.agents[i].cultureid == this.cultures[cno]._id ) {
        if( this.agents[i].plantype == 'colonize' ) {
          colonies.push( this.agents[i].target_planet );
        }
      }
    }

    return colonies;
  };

  this.findNearestPlanet = function(x, y, types, used)
  {
    var i, n, pid, sno;
    var stardists = [];
    var dx, dy, dist;

    for( i=0; i<this.stars.length; ++i ) {
      dx = this.stars[i].x - x;
      dy = this.stars[i].y - y;
      dist = Math.sqrt( dx*dx + dy*dy );
      stardists.push( { dist: dist, n: i } );
    }

    stardists.sort( this.sortPlanetDists );

    for( i=0; i<stardists.length; ++i ) {
      sno = stardists[i].n;
      for( n=0; n<this.stars[sno].planets.length; ++n ) {
        pid = this.stars[sno].planets[n];

        if( this.planets[pid].cultureid == '' && types.indexOf( this.planettypes[ this.planets[pid].type ] ) != -1 ) {
          if( used.indexOf( pid ) == -1 ) {
            // valid planet found!
            return pid;
          }
        }
      }
    }

    return '';
  };

  this.getTravelPath = function(star1, star2)
  {
    var linklens = [ { sno: star1, dist: 0, path: '' } ];
    var explored = {};
    var matches = [];
    var i, sno, star, starget = star2;
    var ll, subpath;

    do {
      ll = linklens.pop();
      sno = ll.sno;

      for( i=0; i<this.starlinks[sno].length; ++i ) {
        star = this.starlinks[sno][i];
        if( star in explored ) {
          if( explored[star] < ll.dist+1 ) {
            continue;
          } else {
            explored[star] = ll.dist+1;
          }
        } else {
          explored[star] = ll.dist+1;
        }
        subpath = ll.path + ( ll.path==''?'':',' ) + this.stars[star]._id;
        //console.log("link " + i + ": " + this.starlinks[sno][i]);
        //console.log("subpath " + subpath);
        if( star == starget ) {
          matches.push( { dist: ll.dist+1, path: subpath } );
        } else {
          linklens.push( { sno: star, dist: ll.dist+1, path: subpath } );
        }
      }
    } while( linklens.length > 0 );

    if( matches.length < 0 ) {
      console.log("No travel path found");
      return false;
    }

    var mindist = matches[0].dist;
    var minmatch = 0;

    for( i=0; i<matches.length; ++i ) {
      console.log("Path " + matches[i].dist + ": " + matches[i].path);
      if( matches[i].dist < mindist ) {
        mindist = matches[i].dist;
        minmatch = i;
      }
    }

    return matches[minmatch].path;
  };

  this.availableBuilds = function(cultureid, planetid)
  {
    var cno = this.findCulture(cultureid);
    var builds = [];
    var i, matched;

    for( i in this.buildingtypes ) {
      matched=true;
      for( j=0; j<this.buildingtypes[i].techs; ++j ) {
        if( !(this.buildingtypes[i].techs[j] in this.cultures[cno].techs) ) {
          matched=false;
          break;
        }
      }
      if( matched ) {
        // they have the tech, but do they have the gold?
        if( this.buildingtypes[i].cost <= this.cultures[cno].gold )
          builds.push(i);
      }
    }

    return builds;
  };

  this.hasTech = function(cno, techname)
  {
    var i;

    for( i=0; i<this.cultures[cno].techs.length; ++i ) {
      if( this.techs[ this.cultures[cno].techs[i] ].name == techname )
        return true;
    }
    return false;
  };

  this.availableTechs = function(cultureid)
  {
    var i, j, k;
    var tech, techs=[];
    var cno = this.findCulture(cultureid);
    var matched, found;

    for( i in this.technologies ) {
      if( this.hasTech(cno, i) )
        continue;
      matched=true;
      if( typeof this.technologies[i].prereqs == 'object' ) {
        for( j=0; j<this.technologies[i].prereqs.length; ++j ) {
          tech = this.technologies[i].prereqs[j];
          if( !this.hasTech(cno, tech) ) {
            matched=false;
            break;
          }
        }
      }
      if( matched ) {
        techs.push( i );
      }
    }
    return techs;
  };

  this.removeItems = function(source,type,amount)
  {
    var iid = this.findItemType(source,type);

    if( iid == '' ) {
      return false;
    }
    var item = this.items[iid];
    item.amount -= amount;
    if( item.amount < 0 ) item.amount = 0;

    return iid;
  };
  this.removeCultureItems = function(cno,type,amount)
  {
    var ids=[];
    var i,j,src,itm;

    for( i=0; i<this.cultures[cno].planets.length; ++i ) {
      src = this.planets[ this.cultures[cno].planets[i] ];
      for( j=0; j<src.items.length; ++j ) {
        itm = this.items[ src.items[j] ];
        if( itm.type == type ) {
          if( itm.amount > 0 ) {
            if( itm.amount > amount ) {
              itm.amount -= amount;
              amount = 0;
              ids.push(itm._id);
              break;
            } else {
              amount -= itm.amount;
              itm.amount = 0;
              ids.push(itm._id);
            }
          }
        }
      }
      if( amount == 0 )
        break;
    }

    return ids;
  };

  this.updateMarket = function(item)
  {
    var pid = item.locid;
    var mid, i;

    for( i=0; i<this.planets[pid].markets.length; ++i ) {
      market = this.markets[ this.planets[pid].markets[i] ];
      if( market.resource == item.type ) {
        mid = market._id;

        [ market.buy, market.sell ] = this.calculateMarket( item.type, this.planets[pid].pop, item.amount );
        this.modifyMarket(market);
      }
    }
  };

  this.calculateMarket = function(itemtype,pop,amount)
  {
    var buy, sell;
    var res = this.resources[itemtype];

    if( res.cost == 0 ) return [0,0];

    var baseAmount = res.demand * pop;
    var minCost = res.cost / 5.0;
    var maxCost = res.cost * 10.0;

    var diff = amount - baseAmount;
    if( diff > 0 ) { // we have extra; buy high and sell low
      buy = res.cost * Math.log(diff);
      sell = res.cost / Math.log(diff);
    } else if( diff == 0 ) {
      buy = res.cost;
      sell = res.cost;
    } else { // diff < 0; we require more: buy low and sell high
      buy = res.cost / Math.log(-diff);
      sell = res.cost * Math.log(-diff);
    }
    if( isNaN(buy) ) buy = res.cost;
    if( isNaN(sell) ) sell = res.cost;
    if( buy < minCost ) buy = minCost;
    if( buy > maxCost ) buy = maxCost;
    if( sell < minCost ) sell = minCost;
    if( sell > maxCost ) sell = maxCost;
    return [parseInt(buy), parseInt(sell)];
  };

  this.users = [];

  this.registerPlayer = function(userid,pagekey,cb)
  {
    var user = { key: pagekey, playerid: '', client: this.app.locateUser(pagekey) };
    this.users.push(user);
    this.objs.Players.find({userid: userid}, function(e,docs) {
      var i, player;

      if( docs.length == 0 ) {
        // new player
        player = new this.objs.Players();
        player.name = this.createName(3);
        player.userid = userid;
        player.cultureid = this.createCulture(1000, true);
        this.saveCultures( function() {
          player.save( function(e) {
            if( e ) console.log("Error saving new player ", e);
            user.playerid = player._id;
            this.players[player._id] = player.toObject();
            this.userids[userid] = player._id;
            cb();
          }.bind(this));
        }.bind(this));
      } else {
        player = docs[0].toObject();
        user.playerid = player._id;
        this.players[player._id] = player;
        this.userids[userid] = player._id;
        cb();
      }
    }.bind(this));
  };

  this.sendUpdate = function(table, id, changes)
  {
    var i;
    var message = { t: table, id: id, doc: changes };

    for( i=0; i<this.users.length; ++i ) {
      if( this.users[i].client.closed ) {
        this.users.splice(i,1);
        --i;
        continue;
      }
      this.users[i].client.send(message,null,false);
    }
  };

  this.sendUpdates = function(table, changelist)
  {
    var i;
    var message = { t: table, docs: changelist };

    for( i=0; i<this.users.length; ++i ) {
      if( this.users[i].client.closed ) {
        this.users.splice(i,1);
        --i;
        continue;
      }
      this.users[i].client.send(message,null,false);
    }
  };
};
