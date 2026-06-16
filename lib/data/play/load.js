var ObjectID = require('mongoose').Schema.Types.ObjectId;

module.exports = function PlayData() {
  this.loadSystem = function(cbfinalize)
  {
    this.objs.Cultures.find({}, function(e, cultures) {
      var i;
      var culture;
      var dist;

      this.cultures = [];
      this.cultureids = {};
      for( i=0; i<cultures.length; ++i ) {
        culture = cultures[i].toObject();
        culture.planets = [];
        culture.ships = [];
        culture.starbases = [];
        culture.techs = [];
        this.cultures.push(culture);
        this.cultureids[culture._id] = this.cultures.length-1;
      }

      this.objs.Stars.find({}, function(e, stars) {
        var i, star;

        this.stars = [];
        this.starlinks = [];
        this.stardists = [];
        this.starids = {};
        for( i=0; i<stars.length; ++i ) {
          star = stars[i].toObject();
          star.planets = [];
          star.items = [];
          star.ships = [];
          this.stars.push(star);
          this.starids[ star._id ] = this.stars.length-1;
          this.starlinks.push([]);
          this.stardists.push([]);
        }

        this.objs.Starlinks.find({}, function(e, starlinks) {
          var i, link;
          var n,m;

          for( i=0; i<starlinks.length; ++i ) {
            link = starlinks[i];
            n = this.findStar(link.star1);
            m = this.findStar(link.star2);
            dist = this.starDist(n,m);
            this.starlinks[n].push(m);
            this.stardists[n].push(dist);
            this.starlinks[m].push(n);
            this.stardists[m].push(dist);
          }

          this.objs.Planets.find({}, function(e, planets) {
            var i, planet;
            var n, cno;

            this.planets = {};
            for( i=0; i<planets.length; ++i ) {
              planet = planets[i].toObject();
              if( planet.cultureid != '' ) {
                cno = this.findCulture(planet.cultureid);
                this.cultures[cno].planets.push(planet._id);
              }
              planet.ships = [];
              planet.buildings = [];
              planet.builds = [];
              planet.items = [];
              planet.markets = [];
              this.planets[ planet._id ] = planet;
              n = this.findStar(planet.starid);
              this.stars[n].planets.push( planet._id );
            }

            this.objs.Ships.find({}, function(e, ships) {
              var i, ship, n;

              this.ships = {};
              for( i=0; i<ships.length; ++i ) {
                ship = ships[i].toObject();
                if( ship.cultureid != '' ) {
                  cno = this.findCulture(ship.cultureid);
                  this.cultures[cno].ships.push(ship._id);
                }
                ship.builds = [];
                ship.buildings = [];
                ship.items = [];
                this.ships[ ship._id ] = ship;
                switch( ship.loctype ) {
                  case 0: // star
                    n = this.findStar(ship.locid);
                    this.stars[n].ships.push( ship._id );
                    break;
                  case 1: // planet
                    this.planets[ ship.locid ].ships.push( ship._id );
                    break;
                  case 2: // ship
                    break;
                  case 3: // starbase
                    break;
                }
              }

              this.items = {};
              this.objs.Items.find({}, function(e, items) {
                var i, item, n;

                for( i=0; i<items.length; ++i ) {
                  item = items[i].toObject();
                  this.items[ item._id ] = item;
                  switch( item.loctype ) {
                    case 0: // star
                      n = this.findStar(item.locid);
                      this.stars[n].items.push( item._id );
                      break;
                    case 1: // planet
                      this.planets[ item.locid ].items.push( item._id );
                      break;
                    case 2: // ship
                      this.ships[ item.locid ].items.push( item._id );
                      break;
                    case 3: // starbase
                      break;
                  };
                }

                this.markets = {};
                this.objs.Markets.find({}, function(e, markets) {
                  var i, market, n;

                  for( i=0; i<markets.length; ++i ) {
                    market = markets[i].toObject();
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
                    this.markets[ market._id ] = market;
                  }

                  this.buildings = {};
                  this.objs.Buildings.find({}, function(e, buildings) {
                    var i, building;

                    for( i=0; i<buildings.length; ++i ) {
                      building = buildings[i].toObject();

                      switch( building.loctype ) {
                        case 0: // star
                          break;
                        case 1: // planet
                          this.planets[ building.locid ].buildings.push( building._id );
                          break;
                        case 2: // ship
                          this.ships[ building.locid ].buildings.push( building._id );
                          break;
                        case 3: // starbase
                          break;
                      };

                      this.buildings[ building._id ] = building;
                    }

                    this.builds = {};
                    this.objs.Builds.find({}, function(e, builds) {
                      var i, build;

                      for( i=0; i<builds.length; ++i ) {
                        build = builds[i].toObject();

                        switch( build.loctype ) {
                          case 0: // star
                            break;
                          case 1: // planet
                            this.planets[ build.locid ].builds.push( build._id );
                            break;
                          case 2: // ship
                            this.ships[ build.locid ].builds.push( build._id );
                            break;
                          case 3: // starbase
                            break;
                        };
                        this.builds[ build._id ] = build;
                      }

                      this.techs = {};
                      this.objs.Techs.find({}, function(e, techs) {
                        var i, tech, cno;

                        for( i=0; i<techs.length; ++i ) {
                          tech = techs[i].toObject();
                          cno = this.findCulture(tech.cultureid);
                          this.cultures[ cno ].techs.push( tech._id );
                          this.techs[ tech._id ] = tech;
                        }

                        this.players = {};
                        this.userids = {};
                        this.objs.Players.find({}, function(e, players) {
                          var i, player, cno;

                          for( i=0; i<players.length; ++i ) {
                            player = players[i].toObject();
                            this.players[ player._id ] = player;
                            this.userids[ player.userid ] = player._id;
                          }

                          this.agents = {};
                          this.agentlocs = {};
                          this.agentships = {};
                          this.objs.Agents.find({}, function(e, agents) {
                            var i, agent;

                            for( i=0; i<agents.length; ++i ) {
                              agent = agents[i].toObject();
                              if( agent.locid in this.agentlocs )
                                this.agentlocs[agent.locid].push(agent._id);
                              else
                                this.agentlocs[agent.locid] = [agent._id];
                              if( agent.shipid != 'new' )
                                this.agentships[agent.shipid] = agent._id;
                              this.agents[ agent._id ] = agent;
                            }
                            console.log("Done loading everything in playdata");
                            this.loaded = true;
                            if( cbfinalize ) cbfinalize();
                          }.bind(this));
                        }.bind(this));
                      }.bind(this));
                    }.bind(this));
                  }.bind(this));
                }.bind(this));
              }.bind(this));
            }.bind(this));
          }.bind(this));
        }.bind(this));
      }.bind(this));
    }.bind(this));
  };
};
