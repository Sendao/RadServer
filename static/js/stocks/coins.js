function updateCoinPriceSymbol(symbol)
{
  var e = gE("cprice" + symbol);
  var f = radVar("cbuy." + symbol);
  var q = parseFloat(radVar("cquote." + symbol));

  var price = q * parseFloat(f.amount);

  e.innerHTML = printPrice(price);
}
function liquidateCoins()
{
  if( !confirm("Are you sure you want to sell all coins?") ) return;
  HtmlRequest("/stox/liquidate.js","",gotLiquidate);
}
function gotLiquidate()
{
  alert("All coins sold.");
}
function sellCoin(symbol)
{
  var f = radVar("csell." + symbol);

  HtmlRequest("/stox/sellcoin.js",buildArgString({coin:symbol,amount:f.amount}),gotCoinSale);
}
function sellCoinAll(symbol)
{
  if( !confirm("Do you want to sell all of " + symbol + "?") )
    return;
  var amt = radVar("pcoin." + symbol + ".amount");

  HtmlRequest("/stox/sellcoin.js",buildArgString({coin:symbol,amount:amt}),gotCoinSale);
}
function gotCoinSale(data)
{
  console.log("GotSale",data);
  //var obj = JSON.parse(data);
  //var stat = obj.data.status;
  //var hist = obj.data.history;
  //var amt = hist.money;
  alert("Sale completed.");
}
function buyCoin(symbol)
{
  var f = radVar("cbuy." + symbol);

  HtmlRequest("/stox/buycoin.js",buildArgString({coin:symbol,amount:f.amount}),gotCoinPurchase);
}
function gotCoinPurchase(data)
{
  console.log("GotPurchase",data);
  //var obj = JSON.parse(data);
  //var stat = obj.data.status;
  //var hist = obj.data.history;
  //var amt = hist.money;
  alert("Purchase completed.");
}

function deleteCoin(coinid)
{
  if( !confirm("Are you sure you want to delete the coin?") ) return;

  HtmlRequest("/stox/delcoin.js",buildArgString({id:coinid}),gotDeletedCoin);
}
function gotDeletedCoin(data)
{
  alert("Deleted coin.");
}


var currentsort=false;
function doCoinSort(by)
{
  if( typeof by == 'object' ) {
    by = 'rank';
  } else if( by == currentsort ) {
    if( currentsort[0] == '-' ) {
      by = by.substr(1);
    } else {
      by = '-' + by;
    }
  }
  currentsort=by;
  radStore("page", 0);
  radStore("nextpage", true);
  HtmlRequestGet("/stox/coins.js",buildArgString({page:0,perpage:12,sort:by}),gotCoinSort);
}
function nextCoinPage()
{
  var page = parseInt(radVar("page"));
  page++;
  radStore("page",page);
  HtmlRequestGet("/stox/coins.js",buildArgString({page:page,perpage:12,sort:currentsort}),gotCoinSort);
}
function previousCoinPage()
{
  var page = parseInt(radVar("page"));
  page--;
  if(page<0)page=0;
  radStore("page",page);
  HtmlRequestGet("/stox/coins.js",buildArgString({page:page,perpage:12,sort:currentsort}),gotCoinSort);
}
function runFinder()
{
  var srch = radVar("finder.search");
  HtmlRequestGet("/stox/search.js",buildArgString({find:srch}),gotCoinFind);
}

var stcurrentsort=false;
function doStocksSort(by)
{
  if( typeof by == 'object' ) {
    by = 'rank';
  } else if( by == currentsort ) {
    if( currentsort[0] == '-' ) {
      by = by.substr(1);
    } else {
      by = '-' + by;
    }
  }
  stcurrentsort=by;
  radStore("stpage", 0);
  radStore("nextpage", true);
  HtmlRequestGet("/stox/stocks.js",buildArgString({page:0,perpage:12,sort:by}),gotStocksSort);
}
function nextStocksPage()
{
  var page = parseInt(radVar("stpage"));
  page++;
  radStore("page",page);
  HtmlRequestGet("/stox/stocks.js",buildArgString({page:page,perpage:12,sort:stcurrentsort}),gotCoinSort);
}
function previousStocksPage()
{
  var page = parseInt(radVar("stpage"));
  page--;
  if(page<0)page=0;
  radStore("page",page);
  HtmlRequestGet("/stox/stocks.js",buildArgString({page:page,perpage:12,sort:stcurrentsort}),gotCoinSort);
}
function runFinder2()
{
  var srch = radVar("finder2.search");
  HtmlRequestGet("/stox/searchstocks.js",buildArgString({find:srch}),gotStocksFind);
}
function storeCoinData(o)
{
  radStore("cquote." + o.symbol, o.lastprice);
  radStore("cask." + o.symbol, o.lastask);
  radStore("cbid." + o.symbol, o.lastbid);
  radStore("cbar."+o.symbol, o.barscore);
  radStore("rsi."+o.symbol, o.rsi);
  radStore("dsi."+o.symbol, o.dsi);
  radStore("longrsi."+o.symbol, o.longrsi);
  radStore("longdsi."+o.symbol, o.longdsi);
  radStore("vup."+o.symbol, o.vup);
  radStore("vupdir."+o.symbol, o.vupdir);
  radStore("vdown."+o.symbol, o.vdown);
  radStore("vdowndir."+o.symbol, o.vdowndir);
  radStore("slope."+o.symbol, o.slope);
  radStore("factor."+o.symbol, o.factor);
  radStore("crp."+o.symbol, o.crp);
  radStore("sarr."+o.symbol, o.sarr);
  radStore("sar2."+o.symbol, o.sar2);
  radStore("con."+o.symbol, o.con);
  radStore("above."+o.symbol, o.avgabove);
  radStore("below."+o.symbol, o.avgbelow);
  radStore("devabove."+o.symbol, o.devabove);
  radStore("devbelow."+o.symbol, o.devbelow);
  radStore("statestr."+o.symbol, o.state==0?"above":"below");
  radStore("statetime."+o.symbol, o.state==0?o.tmabove:o.tmbelow);
  radStore("ratings."+o.symbol, o.ratings);
  radStore("askratings."+o.symbol, o.askratings);
  radStore("bidratings."+o.symbol, o.bidratings);
  radStore("metarank."+o.symbol, o.meta);
  radStore("cpercent."+o.symbol, o.per);
  radStore("simincr."+o.symbol, o.simincr);
  radStore("simdecr."+o.symbol, o.simdecr);
  radStore("patupema."+o.symbol, o.patternUpEMA);
  radStore("patupdev."+o.symbol, o.patternUpDev);
  radStore("patdnema."+o.symbol, o.patternDnEMA);
  radStore("patdndev."+o.symbol, o.patternDnDev);

  radStore("midpctdelta."+o.symbol, o.midpctdelta);
  radStore("mphighema."+o.symbol, o.mphighema);
  radStore("mphighdev."+o.symbol, o.mphighdev);
  radStore("mplowema."+o.symbol, o.mplowema);
  radStore("mplowdev."+o.symbol, o.mplowdev);

  radStore("emaabove."+o.symbol, o.emaabove);
  radStore("emabelow."+o.symbol, o.emabelow);
  radStore("emadevabove."+o.symbol, o.emadevabove);
  radStore("emadevbelow."+o.symbol, o.emadevbelow);
  radStore("emastr."+o.symbol, o.emastate==0?"above":"below");
  radStore("ematime."+o.symbol, o.emastate==0?o.ematmabove:o.ematmbelow);

  radStore("macd."+o.symbol, o.macd);
  radStore("emacd."+o.symbol, o.emacd);
  radStore("cdailies."+o.symbol, o.dailies);
  if( o.dailies )
    radStore("daily."+o.symbol, o.dailies[  o.dailies.length-1 ]);
  radStore("tspeed."+o.symbol, o.tspeed);
  radStore("tdelta."+o.symbol, o.tdelta);
  radStore("textreme."+o.symbol, o.textreme);
  radStore("perf."+o.symbol, o.perf);
  radStore("decl."+o.symbol, o.decl);
  radStore("perfd."+o.symbol, o.perfd);
  radStore("decld."+o.symbol, o.decld);
  radStore("perft."+o.symbol, o.perft);
  radStore("declt."+o.symbol, o.declt);
  radStore("smperf."+o.symbol, o.smperf);
  radStore("smdecl."+o.symbol, o.smdecl);
  radStore("smperfd."+o.symbol, o.smperfd);
  radStore("smdecld."+o.symbol, o.smdecld);
  radStore("lnperf."+o.symbol, o.lnperf);
  radStore("lndecl."+o.symbol, o.lndecl);
  radStore("lnperfd."+o.symbol, o.lnperfd);
  radStore("lndecld."+o.symbol, o.lndecld);
  radStore("distup."+o.symbol, o.distup);
  radStore("distdn."+o.symbol, o.distdn);
  radStore("support."+o.symbol, o.support);

  radStore("plowema."+o.symbol, o.plowema);
  radStore("phighema."+o.symbol, o.phighema);

  radStore("smupema."+o.symbol, o.psmupema);
  radStore("smupdev."+o.symbol, o.psmupdev);
  radStore("smdnema."+o.symbol, o.psmdnema);
  radStore("smdndev."+o.symbol, o.psmdndev);

  radStore("lgupema."+o.symbol, o.plgupema);
  radStore("lgupdev."+o.symbol, o.plgupdev);
  radStore("lgdnema."+o.symbol, o.plgdnema);
  radStore("lgdndev."+o.symbol, o.plgdndev);

  radStore("shorttrend."+o.symbol, o.shtr);
  radStore("shorttrendema."+o.symbol, o.shtrema);
  radStore("longtrend."+o.symbol, o.lntr);
  radStore("longtrendema."+o.symbol, o.lntrema);

  radStore("trend6."+o.symbol, o.trend6);
  radStore("volume."+o.symbol, o.volume);
  radStore("scores." + o.symbol, o.scores);
  if( o.guardreasons != 'none' ) o.voidreasons = o.guardreasons;
  else if( o.cancelreasons != 'none' ) o.voidreasons = o.cancelreasons;
  radStore("voidreasons." + o.symbol, o.voidreasons);
  radStore("cancelreasons." + o.symbol, o.cancelreasons);
    
  radStore("hr_tspeed."+o.symbol, o.hr_trendSpeed);
  radStore("hr_tdelta."+o.symbol, o.hr_trendDelta);
  radStore("hr_textreme."+o.symbol, o.hr_trendExtreme);
  radStore("hr_support."+o.symbol, o.hr_support);
  radStore("hr_plowema."+o.symbol, o.hr_patLowEMA);
  radStore("hr_phighema."+o.symbol, o.hr_patHighEMA);
  radStore("hr_perf."+o.symbol, o.hr_perfrat);
  radStore("hr_decl."+o.symbol, o.hr_declrat);
  radStore("hr_perfd."+o.symbol, o.hr_perfDeltaRat);
  radStore("hr_decld."+o.symbol, o.hr_declDeltaRat);
  radStore("hr_perft."+o.symbol, o.hr_perftime);
  radStore("hr_declt."+o.symbol, o.hr_decltime);
  radStore("hr_distup."+o.symbol, o.hr_distUpRat);
  radStore("hr_distdn."+o.symbol, o.hr_distDnRat);
  radStore("hr_blue."+o.symbol, o.hr_isBlue);

  radStore("day_tspeed."+o.symbol, o.day_trendSpeed);
  radStore("day_tdelta."+o.symbol, o.day_trendDelta);
  radStore("day_textreme."+o.symbol, o.day_trendExtreme);
  radStore("day_support."+o.symbol, o.day_support);
  radStore("day_plowema."+o.symbol, o.day_patLowEMA);
  radStore("day_phighema."+o.symbol, o.day_patHighEMA);
  radStore("day_perf."+o.symbol, o.day_perfrat);
  radStore("day_decl."+o.symbol, o.day_declrat);
  radStore("day_perfd."+o.symbol, o.day_perfDeltaRat);
  radStore("day_decld."+o.symbol, o.day_declDeltaRat);
  radStore("day_perft."+o.symbol, o.day_perftime);
  radStore("day_declt."+o.symbol, o.day_decltime);
  radStore("day_distup."+o.symbol, o.day_distUpRat);
  radStore("day_distdn."+o.symbol, o.day_distDnRat);
  radStore("day_blue."+o.symbol, o.day_isBlue);

  radStore("maxupdraw."+o.symbol, o.maxupdraw);
  radStore("maxdowndraw."+o.symbol, o.maxdowndraw);
  radStore("qdupdraw."+o.symbol, o.qdupdraw);
  radStore("qddowndraw."+o.symbol, o.qddowndraw);  
  radStore("updraw."+o.symbol, o.updraw);
  radStore("downdraw."+o.symbol, o.downdraw);
}
function gotCoinFind(data)
{
  var res = JSON.parse(data);
  var i, o, coins = radVar("coins");
  if( coins == null ) coins = {};
  for( i=0; i<res.data.data.length; ++i ) {
    o = res.data.data[i];
    coins[o.symbol]=o;
    storeCoinData(o);
  }
  radStore("nextpage",false);
  radStore("coins",coins);
  radCStore("results3", res.data.data);
}
function gotCoinSort(data)
{
  var res = JSON.parse(data);
  var i, o, coins = radVar("coins");
  if( coins == null ) coins = {};
  for( i=0; i<res.data.data.length; ++i ) {
    o = res.data.data[i];
    coins[o.symbol]=o;
    storeCoinData(o);
  }
  let coinvars = [];
  let ignore = [ 'assetid', 'lastnews', 'lastnyt', 'lastprice', 'lastpriced', 'logo', 'updated', 'kassetid', 
        'sellpoint', 'lastask', 'lastbid', 'banned', 'active', 'createdate', 'askdate', 'biddate', 'closedate',
        '_id', 'name', 'symbol', '__v', 'lastweighted', 'type', 'voidpoint', 'profitpoint', 'ratings', 'askratings',
        'bidratings', 'nratings', 'macd', 'emacd', 'support', 'isBlue', 'dailies', 'todays', 'coinups', 'coindowns',
        'scores', 'voidreasons', 'cancelreasons', 'candle' ];
  for( var sym in coins ) {
    for( var key in coins[sym] ) {
      if( ignore.indexOf(key) == -1 )
        coinvars.push(key);
    }
    break;
  }
  radStore("coinvars",coinvars);
  if( res.data.data.length < 12 ) {
    radStore("nextpage",false);
  } else {
    radStore("nextpage",true);
  }
  radStore("coins",coins);
  radCStore("results3", res.data.data);
}
function gotCoinSortCont(data)
{
  gotCoinSort(data);
  if( radVar("nextpage") == true ) {
    coinpage++;
    HtmlRequestGet("/stox/coins.js",buildArgString({page:coinpage,perpage:12,sort:'rank'}),gotCoinSortCont);
  }
}


function gotStocksFind(data)
{
  var res = JSON.parse(data);
  var i, o, coins = radVar("coins");
  if( coins == null ) coins = {};
  for( i=0; i<res.data.data.length; ++i ) {
    o = res.data.data[i];
    coins[o.symbol]=o;
    storeCoinData(o);
  }
  radStore("nextpage_stocks",false);
  radStore("coins",coins);
  radCStore("results4", res.data.data);
}
function gotStocksSort(data)
{
  var res = JSON.parse(data);
  var i, o, coins = radVar("coins");
  if( coins == null ) coins = {};
  for( i=0; i<res.data.data.length; ++i ) {
    o = res.data.data[i];
    coins[o.symbol]=o;
    storeCoinData(o);
  }
  if( res.data.data.length < 12 ) {
    radStore("nextpage_stocks",false);
  } else {
    radStore("nextpage_stocks",true);
  }
  radStore("coins",coins);
  radCStore("results4", res.data.data);
}
function drawCoinChartFor(symb)
{
  var data = radVar("cdata2." + symb);
  var lights = radVar("clights2." + symb);
  var bars = radVar("cbars2." + symb);
  var longbars = radVar("cbars3." + symb);
  var psars = radVar("cpsars." + symb);
  var cand = radVar("candleslong." + symb);
  var dail = radVar("dailies." + symb);
  var ribbons = radVar("ribbons."+ symb);
  var sup = radVar("suplines." + symb);
  var res = radVar("reslines." + symb);
  var lows = radVar("pemalows." + symb);
  var highs = radVar("pemahighs." + symb);
  var hrlows = radVar("pemalows.\\~" + symb);
  var hrhighs = radVar("pemahighs.\\~" + symb);
  var matches = radVar("matches." + symb);
  var barsize = 2;
  var e = gE("cchart" + symb);

  if( e == null ) return;
  clearNode(e);
  if( data == null ) return;

  if( bars != null ) {
    bars = JSON.parse(JSON.stringify(bars));
  }
  if( longbars != null ) {
    longbars = JSON.parse(JSON.stringify(longbars));
  }
  if( dail != null && show_keltner ) {
    dail = dail.slice();
  }
  if( ribbons != null && show_ribbons ) {
    ribbons = ribbons.slice();
  }

  if( show_windows ) {
    if( lows != null ) lows = lows.slice();
    if( highs != null ) highs = highs.slice();
    if( hrlows != null ) hrlows = hrlows.slice();
    if( hrhighs != null ) hrhighs = hrhighs.slice();
  }

  if( charts.coinchart.type == 'hr' ) {
    lights = radVar("clightshr." + symb);
  } else if( charts.coinchart.type == 'day' ) {
    lights = radVar("clightsday." + symb);
  }

  var margin = {top: 20, right: 30, bottom: 30, left: 40};
  var height = 200, width = 800;

  data = data.slice();
  if( cand != null && charts.coinchart.per>36 ) {
    lights = null;
    bars = null;
    data = null;
    psars = null;
    cand = cand.slice();
  }
  if( lights != null && show_coin_lights )
    lights = lights.slice();

  var i;
  var per = charts.coinchart.per;
  var dRight = new Date( new Date().getTime() - charts.coinchart.n*60*60*1000 );
  var dLeft = new Date( new Date().getTime() - (charts.coinchart.n+charts.coinchart.per)*60*60*1000 );
  if( data != null ) {
    for( i=0; i<data.length; i++ ) {
      if( data[i].date < dLeft || data[i].date > dRight ) {
        data.splice(i,1);
        --i;
      }
    }
  } else if( cand != null ) {
    for( i=0; i<cand.length; i++ ) {
      if( cand[i].date < dLeft || cand[i].date > dRight ) {
        cand.splice(i,1);
        --i;
        continue;
      }
      if( cand[i].avg == 0 ) {
        cand.splice(i,1);
        --i;
      }
    }
  }
  if( lights != null && show_coin_lights ) {
    for( i=0; i<lights.length; i++ ) {
      if( lights[i].datend < dLeft || lights[i].date > dRight ) {
        lights.splice(i,1);
        --i;
      }
    }
  }
  if( bars != null && ( show_coin_bars || show_coin_avgs ) ) {
    var length;
    for( length in bars ) {
      for( i=0; i<bars[length].length; ++i ) {
        if( bars[length][i].date < dLeft || bars[length][i].date > dRight ) {
          bars[length].splice(i,1);
          --i;
          continue;
        }
      }
    }
  }
  if( dail != null && show_keltner ) {
    for( i=0; i<dail.length; ++i ) {
      if( dail[i].date < dLeft || dail[i].date > dRight ) {
        dail.splice(i,1);
        --i;
        continue;
      }
    }
  }
  if( ribbons != null && show_ribbons ) {
    for( i=0; i<ribbons.length; ++i ) {
      if( ribbons[i].date < dLeft || ribbons[i].date > dRight ) {
        ribbons.splice(i,1);
        --i;
        continue;
      }
    }
  }
  if( show_windows ) {
    var news, nextdt;
    if( lows != null ) {
      news = [];
      for( i=0; i<lows.length; i++ ) {
        if( lows[i].date < dLeft || lows[i].date > dRight ) {
        } else {
          news.push(lows[i]);
          if( i+1 < lows.length ) nextdt = lows[i+1].date;
          else nextdt = new Date().getTime();
          news.push({date:nextdt-1,actual:lows[i].actual,ema:lows[i].ema,variance:lows[i].variance});
        }
      }
      lows = news;
    }
    if( highs != null ) {
      news = [];
      for( i=0; i<highs.length; i++ ) {
        if( highs[i].date < dLeft || highs[i].date > dRight ) {
        } else {
          news.push(highs[i]);
          if( i+1 < highs.length ) nextdt = highs[i+1].date;
          else nextdt = new Date().getTime();
          news.push({date:nextdt-1,actual:highs[i].actual,ema:highs[i].ema,variance:highs[i].variance});
        }
      }
      highs = news;
    }
    if( hrlows != null ) {
      news = [];
      for( i=0; i<hrlows.length; i++ ) {
        if( hrlows[i].date < dLeft || hrlows[i].date > dRight ) {
        } else {
          news.push(hrlows[i]);
          if( i+1 < hrlows.length ) nextdt = hrlows[i+1].date;
          else nextdt = new Date().getTime();
          news.push({date:nextdt-1,actual:hrlows[i].actual,ema:hrlows[i].ema,variance:hrlows[i].variance});
        }
      }
      hrlows = news;
    }
    if( hrhighs != null ) {
      news = [];
      for( i=0; i<hrhighs.length; i++ ) {
        if( hrhighs[i].date < dLeft || hrhighs[i].date > dRight ) {
        } else {
          news.push(hrhighs[i]);
          if( i+1 < hrhighs.length ) nextdt = hrhighs[i+1].date;
          else nextdt = new Date().getTime();
          news.push({date:nextdt-1,actual:hrhighs[i].actual,ema:hrhighs[i].ema,variance:hrhighs[i].variance});
        }
      }
      hrhighs = news;
    }
  }
  if( psars != null && show_percent_psar ) {
    var newpsars = [];
    for( i=0; i<psars.length; ++i ) {
      if( i%per == 0 ) {
        newpsars.push( psars[i] );
      }
    }
    psars = newpsars;
  }

  var dvalues, ddates, tx, rvalues;

  if( data != null ) {
    dvalues = data.map(d=>d.value);
    ddates = data.map(d=>d.date);
  } else if( cand != null ) {
    dvalues = cand.map(d=>d.avg);
    ddates = cand.map(d=>d.date);
  }
  tx = d3.extent(ddates);
  let mn = matches[show_matcher].length;
  /*if( matches[show_matcher][mn-1].date > tx[1] ) {
    tx[1] = matches[show_matcher][mn-1].date;
    //console.log("extend to " + tx[1]);
  }*/
  rvalues = d3.extent(dvalues);

  var d0 = tx[0];

  var xincr = ( width - ( margin.left + margin.right ) ) / ( tx[1]-tx[0] );
  var yincr = ( height - ( margin.top + margin.bottom ) ) / ( rvalues[1]-rvalues[0] );
  var dsuplines = [], dreslines = [];

  if( show_coin_lines ) {
    if( sup ) {
      for( i=0; i<sup.length; i++ ) {
        dsuplines.push( [
          { 'date': tx[0], 'level': sup[i].level, power: sup[i].power },
          { 'date': tx[1], 'level': sup[i].level, power: sup[i].power }
        ] );
      }
    }
    if( res ) {
      for( i=0; i<res.length; i++ ) {
        dreslines.push( [
          { 'date': tx[0], 'level': res[i].level, power: res[i].power },
          { 'date': tx[1], 'level': res[i].level, power: res[i].power }
      ] );
      }
    }
  }

  var x = d3.scaleTime()
    .domain(tx)
    //.domain(ddates)
    .range([margin.left, width - margin.right]);
    //.range(ddaterange)

  var y = d3.scaleLinear()
    .domain(rvalues)
    .range([height - margin.bottom, margin.top]);

  var xAxis = g => g
    .attr("transform", `translate(0,${height - margin.bottom})`)
    .call(d3.axisBottom(x).ticks(width/80));

  var yAxis = g => g
    .attr("transform", `translate(${margin.left},0)`)
    .call(d3.axisLeft(y))
    /*.call(g => g.select(".domain").remove())
    .call(g => g.select(".tick:last-of-type text").clone()
        .attr("x", 3)
        .attr("text-anchor", "start")
        .attr("font-weight", "bold");
        .text(data.y))*/
        ;

  var line = d3.line()
    .defined(d => !isNaN(d.value))
    .x(d => x(d.date))
    .y(d => y(d.value));

  var lineCandle = d3.line()
    .defined(d => !isNaN(d.avg))
    .x(d => x(d.date))
    .y(d => y(d.avg));

  var line2 = d3.line()
    .defined(d => !isNaN(d.value))
    .x(d => x(d.date))
    .y(d => y(d.value));

  var lineAvg = d3.line()
    .defined(d => !isNaN(d.mean))
    .x(d => x(d.date))
    .y(d => y(d.mean));

  var line3 = d3.line()
    .defined(d => !isNaN(d.low))
    .x(d => x(d.date))
    .y(d => y(d.low));


  var line4 = d3.line()
    .defined(d => !isNaN(d.high))
    .x(d => x(d.date))
    .y(d => y(d.high));

  var line5 = d3.line()
    .defined(d => !isNaN(d.mean))
    .x(d => x(d.date))
    .y(d => y(d.mean));

  var line6 = d3.line()
    .defined(d => !isNaN(d.low))
    .x(d => x(d.date))
    .y(d => y(d.low));

  var line7 = d3.line()
    .defined(d => !isNaN(d.high))
    .x(d => x(d.date))
    .y(d => y(d.high));


  var ln_matcher = d3.line()
    .defined(d => !isNaN(d.value))
    .x(d => x(d.date))
    .y(d => y(d.value));

  var ln_k14_dn = d3.line()
    .defined(d => !isNaN(d.atr14) && !isNaN(d.ema14))
    .x(d => x(d.date))
    .y( d => y(d.ema14-2*d.atr14));

  var ln_k14_up = d3.line()
    .defined(d => !isNaN(d.atr14) && !isNaN(d.ema14))
    .x(d => x(d.date))
    .y( d => y(d.ema14+2*d.atr14));

  var ln_k20_dn = d3.line()
    .defined(d => !isNaN(d.atr20) && !isNaN(d.ema20))
    .x(d => x(d.date))
    .y( d => y(d.ema20-2*d.atr20));

  var ln_k20_up = d3.line()
    .defined(d => !isNaN(d.atr20) && !isNaN(d.ema20))
    .x(d => x(d.date))
    .y( d => y(d.ema20+2*d.atr20));

  var ln_k14_mid = d3.line()
    .defined(d => !isNaN(d.ema14))
    .x(d => x(d.date))
    .y( d => y(d.ema14));

  var ln_k20_mid = d3.line()
    .defined(d => !isNaN(d.ema20))
    .x(d => x(d.date))
    .y( d => y(d.ema20));


  var debug_ribbons=false;
  var ln_ema14_up = d3.line();
  var ln_ema14_dn = d3.line();
  var ln_ema14_mid = d3.line();
  var ln_ema20_up = d3.line();
  var ln_ema20_dn = d3.line();
  var ln_ema20_mid = d3.line();
  var ln_ema48_up = d3.line();
  var ln_ema48_dn = d3.line();
  var ln_ema48_mid = d3.line();
  var ln_ema96_up = d3.line();
  var ln_ema96_dn = d3.line();
  var ln_ema96_mid = d3.line();
  var ln_ema8d_up = d3.line();
  var ln_ema8d_dn = d3.line();
  var ln_ema8d_mid = d3.line();
  var ln_pema_ema = d3.line();
  var ln_pema_actual = d3.line();

  if( show_windows ) {
    ln_pema_ema
      .defined(d => !isNaN(d.ema))
      .x(d => x(d.date))
      .y(d => y(d.ema));
    ln_pema_actual
      .defined(d => !isNaN(d.ema))
      .x(d => x(d.date))
      .y(d => y(d.actual));
  }
  if( debug_ribbons ) {
    ln_ema14_up
      .defined(d => !isNaN(d.ema14) && !isNaN(d.mtr14))
      .x(d => x(d.date))
      .y( d => y(d.ema14 + d.mtr14));

    ln_ema14_dn
      .defined(d => !isNaN(d.ema14) && !isNaN(d.mtr14))
      .x(d => x(d.date))
      .y( d => y(d.ema14 - d.mtr14));

    ln_ema14_mid
      .defined(d => !isNaN(d.ema14))
      .x(d => x(d.date))
      .y( d => y(d.ema14));

    ln_ema20_up
      .defined(d => !isNaN(d.ema20) && !isNaN(d.mtr20))
      .x(d => x(d.date))
      .y( d => y(d.ema20 + d.mtr20));

    ln_ema20_dn
      .defined(d => !isNaN(d.ema20) && !isNaN(d.mtr20))
      .x(d => x(d.date))
      .y( d => y(d.ema20 - d.mtr20));

    ln_ema20_mid
      .defined(d => !isNaN(d.ema20))
      .x(d => x(d.date))
      .y( d => y(d.ema20));

    ln_ema48_up
      .defined(d => !isNaN(d.ema48) && !isNaN(d.mtr48))
      .x(d => x(d.date))
      .y( d => y(d.ema48 + d.mtr48));

    ln_ema48_dn
      .defined(d => !isNaN(d.ema48) && !isNaN(d.mtr48))
      .x(d => x(d.date))
      .y( d => y(d.ema48 - d.mtr48));

    ln_ema48_mid
      .defined(d => !isNaN(d.ema48))
      .x(d => x(d.date))
      .y( d => y(d.ema48));

    ln_ema96_up
      .defined(d => !isNaN(d.ema96) && !isNaN(d.mtr96))
      .x(d => x(d.date))
      .y( d => y(d.ema96 + d.mtr96));

    ln_ema96_dn
      .defined(d => !isNaN(d.ema96) && !isNaN(d.mtr96))
      .x(d => x(d.date))
      .y( d => y(d.ema96 - d.mtr96));

    ln_ema96_mid
      .defined(d => !isNaN(d.ema96))
      .x(d => x(d.date))
      .y( d => y(d.ema96));

    ln_ema8d_up
      .defined(d => !isNaN(d.ema8d) && !isNaN(d.mtr8d))
      .x(d => x(d.date))
      .y( d => y(d.ema8d + d.mtr8d));

    ln_ema8d_dn
      .defined(d => !isNaN(d.ema8d) && !isNaN(d.mtr8d))
      .x(d => x(d.date))
      .y( d => y(d.ema8d - d.mtr8d));

    ln_ema8d_mid
      .defined(d => !isNaN(d.ema8d))
      .x(d => x(d.date))
      .y( d => y(d.ema8d));
  } else {
    ln_ema14_up
      .defined(d => !isNaN(d.ema14) || !isNaN(d.atr14))
      .x(d => x(d.date))
      .y( d => y(d.ema14 + d.atr14));

    ln_ema14_dn
      .defined(d => !isNaN(d.ema14) || !isNaN(d.atr14))
      .x(d => x(d.date))
      .y( d => y(d.ema14 - d.atr14));

    ln_ema14_mid
      .defined(d => !isNaN(d.ema14))
      .x(d => x(d.date))
      .y( d => y(d.ema14));

    ln_ema20_up
      .defined(d => !isNaN(d.ema20) || !isNaN(d.atr20))
      .x(d => x(d.date))
      .y( d => y(d.ema20 + d.atr20));

    ln_ema20_dn
      .defined(d => !isNaN(d.ema20) || !isNaN(d.atr20))
      .x(d => x(d.date))
      .y( d => y(d.ema20 - d.atr20));

    ln_ema20_mid
      .defined(d => !isNaN(d.ema20))
      .x(d => x(d.date))
      .y( d => y(d.ema20));

    ln_ema48_up
      .defined(d => !isNaN(d.ema48) || !isNaN(d.atr48))
      .x(d => x(d.date))
      .y( d => y(d.ema48 + d.atr48));

    ln_ema48_dn
      .defined(d => !isNaN(d.ema48) || !isNaN(d.atr48))
      .x(d => x(d.date))
      .y( d => y(d.ema48 - d.atr48));

    ln_ema48_mid
      .defined(d => !isNaN(d.ema48))
      .x(d => x(d.date))
      .y( d => y(d.ema48));

    ln_ema96_up
      .defined(d => !isNaN(d.ema96) || !isNaN(d.atr96))
      .x(d => x(d.date))
      .y( d => y(d.ema96 + d.atr96));

    ln_ema96_dn
      .defined(d => !isNaN(d.ema96) || !isNaN(d.atr96))
      .x(d => x(d.date))
      .y( d => y(d.ema96 - d.atr96));

    ln_ema96_mid
      .defined(d => !isNaN(d.ema96))
      .x(d => x(d.date))
      .y( d => y(d.ema96));

    ln_ema8d_up
      .defined(d => !isNaN(d.ema8d) || !isNaN(d.atr8d))
      .x(d => x(d.date))
      .y( d => y(d.ema8d + d.atr8d));

    ln_ema8d_dn
      .defined(d => !isNaN(d.ema8d) || !isNaN(d.atr8d))
      .x(d => x(d.date))
      .y( d => y(d.ema8d - d.atr8d));

    ln_ema8d_mid
      .defined(d => !isNaN(d.ema8d))
      .x(d => x(d.date))
      .y( d => y(d.ema8d));
  }



  const svg = d3.create("svg")
      .attr("viewBox", [0, 0, width, height]);

  if( lights != null && show_coin_lights ) {
    svg.selectAll("group1")
      .data(lights)
      .enter()
      .append("rect")
      .attr( "x", function(d, i) {
          return (d.date - d0) * xincr + 40;
        })
      .attr( "y", 0 )
      .attr( 'width', function(d) {
          return (d.datend - d.date) * xincr;
        })
      .attr( 'height', height-(margin.top+15) )
      .attr( 'fill', function(d) {
          switch( d.type ) {
            case 'up':
              return d3.rgb(0,0,100);
            case 'r_up':
              return d3.rgb(100,0,100);
            case 'dn':
              return d3.rgb(100,0,0);
            case 'r_dn':
              return d3.rgb(100,0,100);
            case 'eq':
              return d3.rgb(0,0,0);
          }
        });
  }

  svg.append("g")
    .call(xAxis);

  svg.append("g")
    .call(yAxis);

  if( ribbons != null && show_ribbons ) {
    svg.append("path")
      .datum( ribbons )
      .attr("fill", "none")
      .attr("stroke", "#00ff00")
      .attr("stroke-width", 0.75)
      .attr("stroke-linejoin", "round")
      .attr("stroke-linecap", "round")
      .attr("d", ln_ema14_up);
    svg.append("path")
      .datum( ribbons )
      .attr("fill", "none")
      .attr("stroke", "#ff0000")
      .attr("stroke-width", 0.75)
      .attr("stroke-linejoin", "round")
      .attr("stroke-linecap", "round")
      .attr("d", ln_ema14_dn);
    svg.append("path")
      .datum( ribbons )
      .attr("fill", "none")
      .attr("stroke", "#0000ff")
      .attr("stroke-width", 0.75)
      .attr("stroke-linejoin", "round")
      .attr("stroke-linecap", "round")
      .attr("d", ln_ema14_mid);

    svg.append("path")
      .datum( ribbons )
      .attr("fill", "none")
      .attr("stroke", "#00ff00")
      .attr("stroke-width", 0.75)
      .attr("stroke-linejoin", "round")
      .attr("stroke-linecap", "round")
      .attr("d", ln_ema20_up);
    svg.append("path")
      .datum( ribbons )
      .attr("fill", "none")
      .attr("stroke", "#ff0000")
      .attr("stroke-width", 0.75)
      .attr("stroke-linejoin", "round")
      .attr("stroke-linecap", "round")
      .attr("d", ln_ema20_dn);
    svg.append("path")
      .datum( ribbons )
      .attr("fill", "none")
      .attr("stroke", "#0000ff")
      .attr("stroke-width", 0.75)
      .attr("stroke-linejoin", "round")
      .attr("stroke-linecap", "round")
      .attr("d", ln_ema20_mid);

    svg.append("path")
      .datum( ribbons )
      .attr("fill", "none")
      .attr("stroke", "#00ff00")
      .attr("stroke-width", 0.75)
      .attr("stroke-linejoin", "round")
      .attr("stroke-linecap", "round")
      .attr("d", ln_ema48_up);
    svg.append("path")
      .datum( ribbons )
      .attr("fill", "none")
      .attr("stroke", "#ff0000")
      .attr("stroke-width", 0.75)
      .attr("stroke-linejoin", "round")
      .attr("stroke-linecap", "round")
      .attr("d", ln_ema48_dn);
    svg.append("path")
      .datum( ribbons )
      .attr("fill", "none")
      .attr("stroke", "#0000ff")
      .attr("stroke-width", 0.75)
      .attr("stroke-linejoin", "round")
      .attr("stroke-linecap", "round")
      .attr("d", ln_ema48_mid);
    
    svg.append("path")
      .datum( ribbons )
      .attr("fill", "none")
      .attr("stroke", "#00ff00")
      .attr("stroke-width", 0.75)
      .attr("stroke-linejoin", "round")
      .attr("stroke-linecap", "round")
      .attr("d", ln_ema96_up);
    svg.append("path")
      .datum( ribbons )
      .attr("fill", "none")
      .attr("stroke", "#ff0000")
      .attr("stroke-width", 0.75)
      .attr("stroke-linejoin", "round")
      .attr("stroke-linecap", "round")
      .attr("d", ln_ema96_dn);
    svg.append("path")
      .datum( ribbons )
      .attr("fill", "none")
      .attr("stroke", "#0000ff")
      .attr("stroke-width", 0.75)
      .attr("stroke-linejoin", "round")
      .attr("stroke-linecap", "round")
      .attr("d", ln_ema96_mid);

    svg.append("path")
      .datum( ribbons )
      .attr("fill", "none")
      .attr("stroke", "#00ff00")
      .attr("stroke-width", 0.75)
      .attr("stroke-linejoin", "round")
      .attr("stroke-linecap", "round")
      .attr("d", ln_ema8d_up);
    svg.append("path")
      .datum( ribbons )
      .attr("fill", "none")
      .attr("stroke", "#ff0000")
      .attr("stroke-width", 0.75)
      .attr("stroke-linejoin", "round")
      .attr("stroke-linecap", "round")
      .attr("d", ln_ema8d_dn);
    svg.append("path")
      .datum( ribbons )
      .attr("fill", "none")
      .attr("stroke", "#0000ff")
      .attr("stroke-width", 0.75)
      .attr("stroke-linejoin", "round")
      .attr("stroke-linecap", "round")
      .attr("d", ln_ema8d_mid);
  }

  if( show_windows ) {
    if( lows != null ) {
      svg.append("path")
        .datum( lows )
        .attr("fill", "none")
        .attr("stroke", "#00ff00")
        .attr("stroke-width", 0.75)
        .attr("stroke-linejoin", "round")
        .attr("stroke-linecap", "round")
        .attr("d", ln_pema_actual);
      svg.append("path")
        .datum( lows )
        .attr("fill", "none")
        .attr("stroke", "#ff0000")
        .attr("stroke-width", 0.75)
        .attr("stroke-linejoin", "round")
        .attr("stroke-linecap", "round")
        .attr("d", ln_pema_ema);
    }
    if( highs != null ) {
      svg.append("path")
        .datum( highs )
        .attr("fill", "none")
        .attr("stroke", "#00ff00")
        .attr("stroke-width", 0.75)
        .attr("stroke-linejoin", "round")
        .attr("stroke-linecap", "round")
        .attr("d", ln_pema_actual);
      svg.append("path")
        .datum( highs )
        .attr("fill", "none")
        .attr("stroke", "#0000ff")
        .attr("stroke-width", 0.75)
        .attr("stroke-linejoin", "round")
        .attr("stroke-linecap", "round")
        .attr("d", ln_pema_ema);
    }
    if( hrlows != null ) {
      svg.append("path")
        .datum( hrlows )
        .attr("fill", "none")
        .attr("stroke", "#00ff00")
        .attr("stroke-width", 1.5)
        .attr("stroke-linejoin", "round")
        .attr("stroke-linecap", "round")
        .attr("d", ln_pema_actual);
      svg.append("path")
        .datum( hrlows )
        .attr("fill", "none")
        .attr("stroke", "#ff0000")
        .attr("stroke-width", 1.5)
        .attr("stroke-linejoin", "round")
        .attr("stroke-linecap", "round")
        .attr("d", ln_pema_ema);
    }
    if( hrhighs != null ) {
      svg.append("path")
        .datum( hrhighs )
        .attr("fill", "none")
        .attr("stroke", "#00ff00")
        .attr("stroke-width", 1.5)
        .attr("stroke-linejoin", "round")
        .attr("stroke-linecap", "round")
        .attr("d", ln_pema_actual);
      svg.append("path")
        .datum( hrhighs )
        .attr("fill", "none")
        .attr("stroke", "#0000ff")
        .attr("stroke-width", 1.5)
        .attr("stroke-linejoin", "round")
        .attr("stroke-linecap", "round")
        .attr("d", ln_pema_ema);
    }
  }

  if( dail != null && show_keltner ) {
    svg.append("path")
      .datum( dail )
      .attr("fill", "none")
      .attr("stroke", "#ff00ff")
      .attr("stroke-width", 0.75)
      .attr("stroke-linejoin", "round")
      .attr("stroke-linecap", "round")
      .attr("d", ln_k14_up);
    svg.append("path")
      .datum( dail )
      .attr("fill", "none")
      .attr("stroke", "#ff00ff")
      .attr("stroke-width", 0.75)
      .attr("stroke-linejoin", "round")
      .attr("stroke-linecap", "round")
      .attr("d", ln_k14_dn);
    svg.append("path")
      .datum( dail )
      .attr("fill", "none")
      .attr("stroke", "#ff00ff")
      .attr("stroke-width", 0.75)
      .attr("stroke-linejoin", "round")
      .attr("stroke-linecap", "round")
      .attr("d", ln_k20_up);
    svg.append("path")
      .datum( dail )
      .attr("fill", "none")
      .attr("stroke", "#ff00ff")
      .attr("stroke-width", 0.75)
      .attr("stroke-linejoin", "round")
      .attr("stroke-linecap", "round")
      .attr("d", ln_k20_dn);
    svg.append("path")
      .datum( dail )
      .attr("fill", "none")
      .attr("stroke", "#00ff00")
      .attr("stroke-width", 0.75)
      .attr("stroke-linejoin", "round")
      .attr("stroke-linecap", "round")
      .attr("d", ln_k14_mid);
    svg.append("path")
      .datum( dail )
      .attr("fill", "none")
      .attr("stroke", "#00ff00")
      .attr("stroke-width", 0.75)
      .attr("stroke-linejoin", "round")
      .attr("stroke-linecap", "round")
      .attr("d", ln_k20_mid);
  }

  if( bars != null && show_coin_avgs ) {
    var length;
    var cols = [ '00', '22', '44', '66', '88', 'aa', 'cc', 'ee' ];
    for( length in bars ) {
      svg.append("path")
        .datum( bars[length] )
        .attr("fill", "none")
        .attr("stroke", "#" + cols[7-length] + "c3c3")
        .attr("stroke-width", 0.75)
        .attr("stroke-linejoin", "round")
        .attr("stroke-linecap", "round")
        .attr("d", lineAvg);
    }
  }

  if( bars != null && show_coin_bars ) {
    var length;
    for( length in bars ) {
      svg.append("path")
        .datum( bars[length] )
        .attr("fill", "none")
        .attr("stroke", "#ff3030")
        .attr("stroke-width", 0.75)
        .attr("stroke-linejoin", "round")
        .attr("stroke-linecap", "round")
        .attr("d", line3);
      svg.append("path")
        .datum( bars[length] )
        .attr("fill", "none")
        .attr("stroke", "#3030ff")
        .attr("stroke-width", 0.75)
        .attr("stroke-linejoin", "round")
        .attr("stroke-linecap", "round")
        .attr("d", line4);
    }
  }
    if( longbars != null && show_coin_long_bars ) {
      var length;
      for( length in longbars ) {
        svg.append("path")
          .datum( longbars[length] )
          .attr("fill", "none")
          .attr("stroke", "#00ff00")
          .attr("stroke-width", 1.25)
          .attr("stroke-linejoin", "round")
          .attr("stroke-linecap", "round")
          .attr("d", line5);
        svg.append("path")
          .datum( longbars[length] )
          .attr("fill", "none")
          .attr("stroke", "#ff3030")
          .attr("stroke-width", 1.0)
          .attr("stroke-linejoin", "round")
          .attr("stroke-linecap", "round")
          .attr("d", line6);
        svg.append("path")
          .datum( longbars[length] )
          .attr("fill", "none")
          .attr("stroke", "#3030ff")
          .attr("stroke-width", 1.0)
          .attr("stroke-linejoin", "round")
          .attr("stroke-linecap", "round")
          .attr("d", line7);
      }
    }


  if( psars != null && show_coin_psar ) {
    svg.selectAll("circle")
      .data(psars)
      .enter()
      .append("circle")
      .attr("fill", "none")
      .attr("r", 1)
      .attr("stroke","#ffffff")
      .attr("cx", function(d, i) {
        return (d.date - d0) * xincr + 40;
      })
      .attr("cy", function(d, i) {
        return 200-((d.psar - rvalues[0]) * yincr + margin.bottom);
      });
  }
  var lineLine = d3.line()
    .defined(d => !isNaN(d.level))
    .x(d => x(d.date))
    .y(d => y(d.level));

  if( show_coin_lines ) {
    for( i=0; i<dsuplines.length; i++ ) {
      svg.append("path")
      .datum(dsuplines[i])
      .attr("fill", "none")
      .attr("stroke", "#008800")
      .attr("stroke-width", dsuplines[i].power/2)
      .attr("stroke-linejoin", "round")
      .attr("stroke-linecap", "round")
      .attr("d", lineLine);
    }
    for( i=0; i<dreslines.length; i++ ) {
      svg.append("path")
      .datum(dreslines[i])
      .attr("fill", "none")
      .attr("stroke", "#880000")
      .attr("stroke-width", dreslines[i].power/2)
      .attr("stroke-linejoin", "round")
      .attr("stroke-linecap", "round")
      .attr("d", lineLine);
    }
  }

  if( data != null ) {
    svg.append("path")
      .datum(data)
      .attr("fill", "none")
      .attr("stroke", "steelblue")
      .attr("stroke-width", 2.0)
      .attr("stroke-linejoin", "round")
      .attr("stroke-linecap", "round")
      .attr("d", line);
  } else {
    svg.append("path")
      .datum(cand)
      .attr("fill", "none")
      .attr("stroke", "steelblue")
      .attr("stroke-width", 2.0)
      .attr("stroke-linejoin", "round")
      .attr("stroke-linecap", "round")
      .attr("d", lineCandle);
  }
  //console.log("show_matcher " + show_matcher + ",", matches[show_matcher]);
  var lastcolor=null;
  var px=[];
  for( var i=0; i<matches[show_matcher].length; i++ ) {
    var m = matches[show_matcher][i];

    if( m === null || lastcolor != m.color ) {
      if( px.length > 0 ) {
        if( m !== null ) {
          px.push(m);
        }
        svg.append("path")
        .datum( px )
        .attr("fill", "none")
        .attr("stroke", lastcolor)
        .attr("stroke-width", 0.75)
        .attr("stroke-linejoin", "round")
        .attr("stroke-linecap", "round")
        .attr("d", ln_matcher);
        px=[];  
      }
      if( m !== null )
        lastcolor = m.color;
      else
        lastcolor = "clear";
    }
    if( m !== null )
      px.push(m);
  }
  if( px.length > 0 ) {
    svg.append("path")
    .datum( px )
    .attr("fill", "none")
    .attr("stroke", lastcolor)
    .attr("stroke-width", 0.75)
    .attr("stroke-linejoin", "round")
    .attr("stroke-linecap", "round")
    .attr("d", ln_matcher);
    px=[];  
  }
  
  e.appendChild( svg.node() );

  return;
}



function walletCoin( symbol, target="walletview" )
{
  var coindata = radVar("coins." + symbol);

  //HtmlRequestGet("/stox/readcoinchart.js",buildArgString({ticker:coindata.symbol}),gotCoinListingsChart,coindata.symbol);
  HtmlRequestGet("/stox/readcoinmatches.js",buildArgString({ticker:coindata.symbol}),gotCoinListingsMatches,coindata.symbol);
  HtmlRequestGet("/stox/readcoinchartavg.js",buildArgString({ticker:coindata.symbol}),gotCoinListingsChartAvg,coindata.symbol);
  HtmlRequestGet("/stox/readcoinbars.js",buildArgString({ticker:coindata.symbol}),gotCoinListingsChartBars,coindata.symbol);
  HtmlRequestGet("/stox/readcoinlongbars.js",buildArgString({ticker:coindata.symbol}),gotCoinListingsChartLongBars,coindata.symbol);
  HtmlRequestGet("/stox/readcoinribbons.js",buildArgString({ticker:coindata.symbol}),gotCoinListingsChartRibbons,coindata.symbol);
  HtmlRequestGet("/stox/readcoinpsars.js",buildArgString({ticker:coindata.symbol}),gotCoinListingsChartPSARs,coindata.symbol);
  HtmlRequestGet("/stox/readpatterns.js",buildArgString({ticker:coindata.symbol,short:'false'}),gotCoinLights,coindata.symbol);
  HtmlRequestGet("/stox/readpatternemas.js","short=true&ticker="+coindata.symbol,gotCoinPEMAs,coindata.symbol);
  //HtmlRequestGet("/stox/readcoinnews.js",buildArgString({ticker:coindata.symbol}),gotCoinListingsNews,coindata.symbol);
  //HtmlRequestGet("/stox/readcoinnyt.js",buildArgString({ticker:coindata.symbol}),gotCoinListingsNYT,coindata.symbol);
  //HtmlRequestGet("/stox/readcoinprice.js",buildArgString({ticker:coindata.symbol}),gotCoinListingsPrice,coindata.symbol);
  HtmlRequestGet("/stox/readcoindailies.js",buildArgString({ticker:coindata.symbol}),gotCoinDailies,coindata.symbol);
  HtmlRequestGet("/stox/readlines.js",buildArgString({symbol:coindata.symbol}),gotCoinLines,coindata.symbol);

  templateParams({coin: coindata, inwallet: true});
  var e = gE(target);
  blitzTemplate(e,"coinwalletview");

  radStore("coin.symbol", symbol);
}

function loadStockListingsResults( n )
{
  var coindata = radVar("results4." +n);

  HtmlRequestGet("/stox/readcoinchartavg.js",buildArgString({ticker:coindata.symbol}),gotCoinListingsChartAvg,coindata.symbol);
  HtmlRequestGet("/stox/readcoinmatches.js",buildArgString({ticker:coindata.symbol}),gotCoinListingsMatches,coindata.symbol);
  HtmlRequestGet("/stox/readcoinbars.js",buildArgString({ticker:coindata.symbol}),gotCoinListingsChartBars,coindata.symbol);
  HtmlRequestGet("/stox/readcoinlongbars.js",buildArgString({ticker:coindata.symbol}),gotCoinListingsChartLongBars,coindata.symbol);
  HtmlRequestGet("/stox/readcoinribbons.js",buildArgString({ticker:coindata.symbol}),gotCoinListingsChartRibbons,coindata.symbol);
  HtmlRequestGet("/stox/readcoinpsars.js",buildArgString({ticker:coindata.symbol}),gotCoinListingsChartPSARs,coindata.symbol);
  HtmlRequestGet("/stox/readpatterns.js",buildArgString({ticker:coindata.symbol,short:'false'}),gotCoinLights,coindata.symbol);
  HtmlRequestGet("/stox/readpatternemas.js","short=true&ticker="+coindata.symbol,gotCoinPEMAs,coindata.symbol);
  HtmlRequestGet("/stox/readcoinprice.js",buildArgString({ticker:coindata.symbol}),gotCoinListingsPrice,coindata.symbol);
  HtmlRequestGet("/stox/readcoindailies.js",buildArgString({ticker:coindata.symbol}),gotCoinDailies,coindata.symbol);
  HtmlRequestGet("/stox/readlines.js",buildArgString({symbol:coindata.symbol}),gotCoinLines,coindata.symbol);
  
  templateParams({coin: coindata});
  var e = gE("stocklistingsview");
  blitzTemplate(e,"coinview");
  radStore("coin.symbol", coindata.symbol);
}

function quickViewCoin( symbol, tgt )
{
  var coindata = radVar("coins." + symbol);
  HtmlRequestGet("/stox/readcoinchartavg.js",buildArgString({ticker:symbol}),gotCoinListingsChartAvg,symbol);
  HtmlRequestGet("/stox/readcoinmatches.js",buildArgString({ticker:coindata.symbol}),gotCoinListingsMatches,coindata.symbol);
  HtmlRequestGet("/stox/readcoinbars.js",buildArgString({ticker:symbol}),gotCoinListingsChartBars,symbol);
  HtmlRequestGet("/stox/readcoinlongbars.js",buildArgString({ticker:symbol}),gotCoinListingsChartLongBars,symbol);
  HtmlRequestGet("/stox/readcoinribbons.js",buildArgString({ticker:symbol}),gotCoinListingsChartRibbons,symbol);
  HtmlRequestGet("/stox/readcoinpsars.js",buildArgString({ticker:symbol}),gotCoinListingsChartPSARs,symbol);
  HtmlRequestGet("/stox/readpatterns.js",buildArgString({ticker:symbol,short:'false'}),gotCoinLights,symbol);
  HtmlRequestGet("/stox/readpatternemas.js","short=true&ticker="+symbol,gotCoinPEMAs,symbol);
  HtmlRequestGet("/stox/readcoinprice.js",buildArgString({ticker:symbol}),gotCoinListingsPrice,symbol);
  HtmlRequestGet("/stox/readcoindailies.js",buildArgString({ticker:symbol}),gotCoinDailies,symbol);
  HtmlRequestGet("/stox/readlines.js",buildArgString({symbol:symbol}),gotCoinLines,symbol);
  
  templateParams({coin: coindata});
  var e = gE(tgt);
  blitzTemplate(e,"coinview");
}

function loadCoinListingsResults( n )
{
  var coindata = radVar("results3." +n);
  var news = radVar("news." + coindata.symbol);
  //if( coinnews === null ) {
    //HtmlRequestGet("/stox/readcoinchart.js",buildArgString({ticker:coindata.symbol}),gotCoinListingsChart,coindata.symbol);
    HtmlRequestGet("/stox/readcoinchartavg.js",buildArgString({ticker:coindata.symbol}),gotCoinListingsChartAvg,coindata.symbol);
    HtmlRequestGet("/stox/readcoinmatches.js",buildArgString({ticker:coindata.symbol}),gotCoinListingsMatches,coindata.symbol);
    HtmlRequestGet("/stox/readcoinbars.js",buildArgString({ticker:coindata.symbol}),gotCoinListingsChartBars,coindata.symbol);
    HtmlRequestGet("/stox/readcoinlongbars.js",buildArgString({ticker:coindata.symbol}),gotCoinListingsChartLongBars,coindata.symbol);
    HtmlRequestGet("/stox/readcoinribbons.js",buildArgString({ticker:coindata.symbol}),gotCoinListingsChartRibbons,coindata.symbol);
    HtmlRequestGet("/stox/readcoinpsars.js",buildArgString({ticker:coindata.symbol}),gotCoinListingsChartPSARs,coindata.symbol);
    HtmlRequestGet("/stox/readpatterns.js",buildArgString({ticker:coindata.symbol,short:'false'}),gotCoinLights,coindata.symbol);
    HtmlRequestGet("/stox/readpatternemas.js","short=true&ticker="+coindata.symbol,gotCoinPEMAs,coindata.symbol);
    //HtmlRequestGet("/stox/readcoinnews.js",buildArgString({ticker:coindata.symbol}),gotCoinListingsNews,coindata.symbol);
    //HtmlRequestGet("/stox/readcoinnyt.js",buildArgString({ticker:coindata.symbol}),gotCoinListingsNYT,coindata.symbol);
    HtmlRequestGet("/stox/readcoinprice.js",buildArgString({ticker:coindata.symbol}),gotCoinListingsPrice,coindata.symbol);
    HtmlRequestGet("/stox/readcoindailies.js",buildArgString({ticker:coindata.symbol}),gotCoinDailies,coindata.symbol);
    HtmlRequestGet("/stox/readlines.js",buildArgString({symbol:coindata.symbol}),gotCoinLines,coindata.symbol);
  
  templateParams({coin: coindata});
  var e = gE("coinlistingsview");
  blitzTemplate(e,"coinview");

  radStore("coin.symbol", coindata.symbol);
}
function gotCoinListingsChart( data, symbol )
{
  var obj = JSON.parse(safeJSON(data));
  var readings = obj.data.data;
  var i, vx;

  for( i=0; i<readings.length; ++i ) {
    if( Array.isArray(readings[i]) ) {
      readings.splice(i,1);
      --i;
      continue;
    }
    if( isNaN(readings[i].values) || readings[i].values == '' ) {
      readings.splice(i,1);
      --i;
      continue;
    }
    readings[i].value = parseFloat(readings[i].values);
    readings[i].date = new Date(readings[i].time).getTime();
  }
  radCStore("cdata." + symbol, readings);
  drawCoinChartFor(symbol);
}

function gotCoinLines(data, symbol)
{
  var obj = JSON.parse(safeJSON(data));
  var res = obj.data.res, sup = obj.data.sup;
  var i;

  if( res ) {
    for( i=0; i<res.length; ++i ) {
      if( Array.isArray(res[i]) ) {
        res.splice(i,1);
        --i;
        continue;
      }
      res[i].date = new Date(res[i].time).getTime();
    }
  }
  if( sup ) {
    for( i=0; i<sup.length; ++i ) {
      if( Array.isArray(sup[i]) ) {
        sup.splice(i,1);
        --i;
        continue;
      }
      sup[i].date = new Date(sup[i].time).getTime();
    }
  }
  radCStore("suplines." + symbol, sup);
  radCStore("reslines." + symbol, res);
  drawCoinChartFor(symbol);
}
function gotCoinPEMAs(data, symbol)
{
  var obj = JSON.parse(safeJSON(data));
  var lows = obj.data.lows;
  var highs = obj.data.highs;
  var hrlows = obj.data.hrlows;
  var hrhighs = obj.data.hrhighs;
  var i;

  for( i=0; i<lows.length; i++ ) {
    lows[i].date = new Date(lows[i].time).getTime();
  }
  for( i=0; i<highs.length; i++ ) {
    highs[i].date = new Date(highs[i].time).getTime();
  }
  for( i=0; i<hrlows.length; i++ ) {
    hrlows[i].date = new Date(hrlows[i].time).getTime();
  }
  for( i=0; i<hrhighs.length; i++ ) {
    hrhighs[i].date = new Date(hrhighs[i].time).getTime();
  }
  radCStore("pemalows." + symbol, lows);
  radCStore("pemahighs." + symbol, highs);
  radCStore("pemalows.~" + symbol, hrlows);
  radCStore("pemahighs.~" + symbol, hrhighs);
}
function gotCoinLights(data, symbol)
{
  var obj = JSON.parse(safeJSON(data));
  var readings = obj.data.data.min;
  var i;

  for( i=0; i<readings.length; ++i ) {
    if( Array.isArray(readings[i]) ) {
      readings.splice(i,1);
      --i;
      continue;
    }
    //readings[i].vals = readings[i].values.split(",");
    readings[i].date = new Date(readings[i].time).getTime();
    readings[i].datend = new Date(readings[i].end).getTime();
  }
  radCStore("clights2." + symbol, readings);

  readings = obj.data.data.hr;
  for( i=0; i<readings.length; ++i ) {
    if( Array.isArray(readings[i]) ) {
      readings.splice(i,1);
      --i;
      continue;
    }
    //readings[i].vals = readings[i].values.split(",");
    readings[i].date = new Date(readings[i].time).getTime();
    readings[i].datend = new Date(readings[i].end).getTime();
  }
  radCStore("clightshr." + symbol, readings);

  readings = obj.data.data.day;
  for( i=0; i<readings.length; ++i ) {
    if( Array.isArray(readings[i]) ) {
      readings.splice(i,1);
      --i;
      continue;
    }
    //readings[i].vals = readings[i].values.split(",");
    readings[i].date = new Date(readings[i].time).getTime();
    readings[i].datend = new Date(readings[i].end).getTime();
  }
  radCStore("clightsday." + symbol, readings);

  drawCoinChartFor(symbol);
}

function gotCoinCandles(data, symbol)
{
  var obj = JSON.parse(safeJSON(data));
  var readings = obj.data.data;
  var i;

  for( i=0; i<readings.length; ++i ) {
    if( Array.isArray(readings[i]) ) {
      readings.splice(i,1);
      --i;
      continue;
    }
    //readings[i].vals = readings[i].values.split(",");
    readings[i].date = new Date(readings[i].time).getTime();
  }
  radCStore("candleslong." + symbol, readings);
  drawCoinChartFor(symbol);
}

function gotCoinListingsChartPSARs(data, symbol)
{
  var obj = JSON.parse(safeJSON(data));
  var readings = obj.data.data;
  var i;

  for( i=0; i<readings.length; ++i ) {
    if( Array.isArray(readings[i]) ) {
      readings.splice(i,1);
      --i;
      continue;
    }
    //readings[i].vals = readings[i].values.split(",");
    readings[i].date = new Date(readings[i].time).getTime();
  }
  radCStore("cpsars." + symbol, readings);
  drawCoinChartFor(symbol);
}
let predict_size = 3.0;

function gotCoinListingsMatches(data, symbol)
{
  var obj = JSON.parse(safeJSON(data));
  var objdata = obj.data.data;
  var readings;
  var writings = new Array(8);
  var litdata = new Array(8);
  var i, j, k;
  var bar_size = 2;


  for( j=0; j<8; j++ ) {
    readings = objdata[j];
    if( readings === null ) {
      litdata[j] = [];
      continue;
    }

    writings[j] = [];
    litdata[j] = [];

    for( i=0; i<readings.length; ++i ) {
      if( Array.isArray(readings[i]) ) {
        readings.splice(i,1);
        --i;
        continue;
      }
      writings[ j ].push( readings[i] );
    }

    writings[j].sort( (a,b) => (new Date(a.tmend) - new Date(b.tmend)) );
    radStore("match." + symbol + "." + j, writings[j]);

    let p = 1 << j;
  
    for( i=0; i<writings[j].length; i++ ) {
      let basemins = ( new Date(writings[j][i].tmend).getTime() - new Date(writings[j][i].tmstart).getTime() ) / (60*1000);
      let minutes = basemins;
      let val = writings[j][i].posstart;
      let vel = writings[j][i].velstart/100.0;
      let acc = writings[j][i].accel;
      if( i == writings[j].length-1 ) {
        minutes+=p;
      }

      let dttarget = new Date(writings[j][i].tmstart).getTime();
      for( k=litdata[j].length-1; k>=0; k-- ) {
        if( litdata[j][k] === null || litdata[j][k].date > dttarget ) {
          litdata[j].splice(k,1);
        } else break;
      }

      if( litdata[j][ litdata[j].length-1 ] !== null )
        litdata[j].push(null);

      for( k=0; k<=minutes; k++ ) {
        litdata[j].push({date: new Date(writings[j][i].tmstart).getTime() + k*60*1000, value: val, predict: k > basemins, color: (k==0?"#ff0000":(k>basemins?"#00ff00":"#c3c3c3")) });
        val += val*(vel);
        vel += acc/100.0;
        acc += writings[j][i].jerk;
      }
    }
  }
  radCStore("matches." + symbol, {});
  for( i=0; i<8; i++ ) {
    radCStore("matches." + symbol + "." + i, litdata[i]);
  }
  if( symbol != 'gindex' ) {
    drawCoinChartFor(symbol);
  } else {
    if( gindex_showing )
      drawChart('gindex');
  }
}
function gotCoinListingsChartBars(data, symbol)
{
  var obj = JSON.parse(safeJSON(data));
  var readings = obj.data.data;
  var writings = {};
  var i, j;
  var bar_size = 2;

  for( i=0; i<readings.length; ++i ) {
    if( Array.isArray(readings[i]) ) {
      readings.splice(i,1);
      --i;
      continue;
    }
    //readings[i].vals = readings[i].values.split(",");
    readings[i].date = new Date(readings[i].time).getTime();
    readings[i].low = readings[i].mean - bar_size*readings[i].stddev;
    readings[i].high = readings[i].mean + bar_size*readings[i].stddev;

    if( !(readings[i].length in writings) ) writings[ readings[i].length ] = [];
    writings[ readings[i].length ].push( readings[i] );
  }
  radCStore("cbars2." + symbol, {});
  for( i in writings ) {
    radCStore("cbars2." + symbol + "." + i, writings[i]);
  }
  drawCoinChartFor(symbol);
}
function gotCoinListingsChartLongBars(data, symbol)
{
  var obj = JSON.parse(safeJSON(data));
  var readings = obj.data.data;
  var writings = {};
  var i, j;
  var bar_size = 1.5;

  for( i=0; i<readings.length; ++i ) {
    if( Array.isArray(readings[i]) ) {
      readings.splice(i,1);
      --i;
      continue;
    }
    //readings[i].vals = readings[i].values.split(",");
    readings[i].date = new Date(readings[i].time).getTime();
    readings[i].low = readings[i].mean - bar_size*readings[i].stddev;
    readings[i].high = readings[i].mean + bar_size*readings[i].stddev;

    if( !(readings[i].length in writings) ) writings[ readings[i].length ] = [];
    writings[ readings[i].length ].push( readings[i] );
  }
  radCStore("cbars3." + symbol, writings);
  drawCoinChartFor(symbol);
}
function gotCoinListingsChartRibbons(data, symbol)
{
  var obj = JSON.parse(safeJSON(data));
  var readings = obj.data.data;
  var writings = [];
  var i, j;

  for( i=0; i<readings.length; ++i ) {
    if( Array.isArray(readings[i]) ) {
      readings.splice(i,1);
      --i;
      continue;
    }
    //readings[i].vals = readings[i].values.split(",");
    readings[i].date = new Date(readings[i].time).getTime();
    writings.push( readings[i] );
  }
  radCStore("ribbons." + symbol, writings);
  drawCoinChartFor(symbol);
}
function gotCoinListingsChartAvg( data, symbol )
{
  var obj = JSON.parse(safeJSON(data));
  var readings = obj.data.data;
  var i, vx;

  for( i=0; i<readings.length; ++i ) {
    if( Array.isArray(readings[i]) ) {
      readings.splice(i,1);
      --i;
      continue;
    }
    if( isNaN(readings[i].avg) || readings[i].avg == '' ) {
      readings.splice(i,1);
      --i;
      continue;
    }
    readings[i].value = parseFloat(readings[i].avg);
    readings[i].date = new Date(readings[i].time).getTime();
  }
  radCStore("cdata2." + symbol, readings);
  drawCoinChartFor(symbol);
}
function gotCoinListingsNews( data, symbol )
{
  var obj = JSON.parse(safeJSON(data));
  var news = obj.data.news;
  radCStore("news." + symbol, news);
}
function gotCoinListingsNYT( data, symbol )
{
  var obj = JSON.parse(safeJSON(data));
  var nyt = obj.data.nyt;
  radCStore("nyt." + symbol, nyt);
}
function gotCoinListingsPrice( data, symbol )
{
  var obj = JSON.parse(safeJSON(data));
  radStore("cquote." + symbol, obj.data.quote);
}

function gotCoinDailies( data, symbol )
{
  var objdata = JSON.parse(safeJSON(data));
  var i, results = [], data = objdata.data.data;
  var obj;
  for( i=0; i<data.length; i++ ) {
    obj = data[i];
    obj.date = new Date(obj.time).getTime();
    results.push(obj);
  }
  radCStore("dailies." + symbol, results);
}


var drag_y = null;
var drag_height = null;
var drag_h2 = null;
function dragResults3(ev)
{
  var e = gE("results3");
  drag_height = parseInt( e.style.maxHeight );
  drag_y = ev.clientY;
  document.addEventListener('mousemove', dragResults3Move);
  document.addEventListener('mouseup', dragResults3Up);
  document.addEventListener('selectstart', dragQuiet);
}
function dragQuiet(ev)
{
  ev.preventDefault();
}
function dragResults3Up(ev)
{
  document.removeEventListener('mousemove', dragResults3Move);
  document.removeEventListener('mouseup', dragResults3Up);
  document.removeEventListener('selectstart', dragQuiet);
}

function dragResults3Move(ev)
{
  var move_y = ev.clientY - drag_y;
  var r2 = gE("results3");
  var x;
  var e = gE("coinview");

  x = drag_height + move_y;
  if( e ) {
    var rect = e.getBoundingClientRect();
    if( x > rect.y-60 ) return;
  }
  if( x > winH/2 ) return;
  r2.xStyle['max-height'] = x;
  r2.style.maxHeight = x + "px";
}

function coinEnlarge(inwallet)
{
  if( inwallet ) return;
  setTimeout(coinEnlargeIter, 100, 0);
}
function coinEnlargeIter(n)
{
  var e = gE("results3");
  var h0 = winH/3+60;
  var h1 = parseInt(e.style.maxHeight);
  if( h1 < h0 ) {
    n += h0-h1;
  }
  if( n > 160 ) return;
  e.xStyle['max-height'] = h0 - n;
  e.style.maxHeight = (h0-n) + "px";
  setTimeout(coinEnlargeIter, 100, n+10);
}

function stockEnlarge(inwallet)
{
  if( inwallet ) return;
  setTimeout(stockEnlargeIter, 100, 0);
}
function stockEnlargeIter(n)
{
  var e = gE("results4");
  var h0 = winH/3+60;
  var h1 = parseInt(e.style.maxHeight);
  if( h1 < h0 ) {
    n += h0-h1;
  }
  if( n > 160 ) return;
  e.xStyle['max-height'] = h0 - n;
  e.style.maxHeight = (h0-n) + "px";
  setTimeout(stockEnlargeIter, 100, n+10);
}
