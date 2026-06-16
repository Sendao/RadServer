var ObjectID = require('mongoose').Schema.Types.ObjectId;

module.exports = function PlayData() {
  this.resources = {
    'food': { name: "food", cost: 100, demand: 10 },
    'fuel': { name: "fuel", cost: 100, demand: 10 },
    'water': { name: "water", cost: 100, demand: 10 },
    'research': { name: "research", cost: 0, demand: 0 },
    'gems': { name: "gems", cost: 200, demand: 5 },
    'medicine': { name: "medicine", cost: 300, demand: 2 },
    'metal': { name: "metal", cost: 300, demand: 5 },
    'nanites': { name: "nanites", cost: 500, demand: 2 },
    'biotech': { name: "biotech", cost: 500, demand: 2 }
  };

  this.poplevels = [
    { min: 0, max: 10, resources: {
      'food': { percap: 10 },
      'water': { percap: 10 }
    } },
    { min: 10, max: 20, resources: {
      'food': { percap: 10 },
      'water': { percap: 10 },
      'fuel': { percap: 1 }
    } },
    { min: 20, max: 50, resources: {
      'food': { percap: 10 },
      'water': { percap: 10 },
      'fuel': { percap: 1 },
      'medicine': { percap: 2 }
    } }
  ];

  this.buildingtypes = {
    farm: { name: "farm", cost: 200, techs: [], product: 'food', prodAmount: 20 },
    mine: { name: "mine", cost: 500, techs: [], product: [ 'metal', 'gold' ], prodAmount: [ 10, 10 ] },
    aquaduct: { name: "aquaduct", cost: 200, techs: [], product: 'water', prodAmount: 20 },
    drill: { name: "drill", cost: 700, techs: [], product: 'fuel', prodAmount: 10 },
    library: { name: "library", cost: 200, techs: [], product: 'research', prodAmount: 5 },
    university: { name: "university", cost: 1000, techs: [], product: 'research', prodAmount: 10 },
    hospital: { name: "hospital", cost: 1000, techs: [], product: ['medicine','nanites','biotech'], prodAmount: [5,1,1] },
    factory: { name: "factory", cost: 1000, techs: [] },
    turret: { name: "turret", cost: 500, techs: [ "space weapons" ] },
  };

  this.goldperpop = 10;
  this.player_research_rate = 1;
  this.player_build_rate = 2;
  this.build_rate = 25;
  this.player_tax_rate = 1;
  this.building_maintenance = 3;

  this.buildrate = {
    farm: { rate: 3.0 },
    mine: { rate: 2.0 },
    aquaduct: { rate: 3.0 },
    drill: { rate: 1.0 },
    library: { rate: 1.0 },
    university: { rate: 0.1 },
    hospital: { rate: 0.1 },
    factory: { rate: 0.2 },
    turret: { rate: 0.2 }
  };

  this.shipbuildings = [ "turret" ];

  this.shipspeed_planets = 25.0;
  this.shipspeed_stars = 10.0;

  this.shiptypes = {
    'scout': { name: "scout", cost: 500, hullsize: 50, armor: 100, energy: 100, energyrate: 10, cargo: 100 },
    'colony ship': { name: "colony ship", cost: 1000, hullsize: 250, armor: 100, energy: 100, energyrate: 10, cargo: 250 },
    'freighter': { name: "freighter", cost: 800, hullsize: 250, armor: 250, energy: 100, energyrate: 10, cargo: 1000 }
  };

  this.technologies = {
    'advanced agriculture': { name: "advanced agriculture", cost: 100, prereqs: [] },
    'space weapons': { name: "space weapons", cost: 100, prereqs: [] },
    'space armor': { name: "space armor", cost: 200, prereqs: ["space weapons"] },
    'advanced weapons': { name: "advanced weapons", cost: 250, prereqs: ["space weapons"] },
    'advanced armor': { name: "advanced armor", cost: 500, prereqs: ["space armor"] },
    'space mining': { name: "space mining", cost: 100, prereqs: [] },
    'colonization': { name: "colonization", cost: 100, prereqs: [] },
    'biotechnology': { name: "biotechnology", cost: 500, prereqs: [] },
    'shielding': { name: "shielding", cost: 500, prereqs: ["space mining"] },
    'rock colonization': { name: "rock colonization", cost: 500, prereqs: ["colonization"] },
    'ice colonization': { name: "ice colonization", cost: 1000, prereqs: ["colonization","shielding"] },
    'lava colonization': { name: "lava colonization", cost: 2000, prereqs: ["colonization","space armor"] },
    'gas colonization': { name: "gas colonization", cost: 10000, prereqs: ["colonization","advanced armor","shielding"] },
    'rock fertilizer': { name: "rock fertilizer", cost: 1000, prereqs: ["rock colonization","advanced agriculture"] },
    'ice fertilizer': { name: "ice fertilizer", cost: 2000, prereqs: ["ice colonization","advanced agriculture"] },
    'lava fertilizer': { name: "lava fertilizer", cost: 4000, prereqs: ["lava colonization","advanced agriculture"] },
    'gas fertilizer': { name: "gas fertilizer", cost: 8000, prereqs: ["gas colonization","advanced agriculture"] },
    'rock terraforming': { name: "rock terraforming", cost: 1000, prereqs: ["rock fertilizer"] },
    'ice terraforming': { name: "ice terraforming", cost: 2000, prereqs: ["ice fertilizer"] },
    'lava terraforming': { name: "lava terraforming", cost: 4000, prereqs: ["lava fertilizer"] },
    'gas terraforming': { name: "gas terraforming", cost: 10000, prereqs: ["gas fertilizer"] }
  };
  this.planettypes = [ "terran", "rocky", "gas giant", "ice", "lava" ];
  this.planetresearch = [ 'colonization', 'rock colonization', 'gas colonization', 'ice colonization', 'lava colonization' ];
  this.planetsizemin = [ 45, 45, 100, 45, 45 ];
  this.planetsizemax = [ 80, 80, 200, 80, 80 ];
};
