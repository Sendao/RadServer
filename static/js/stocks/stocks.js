
var selected_tab = 'newsapi';
var tab_symbol = null;
function setTab()
{
  selected_tab='newsapi';
}

function pickTab(symbol,tab)
{
  var e;
  var stock = radVar("stocks." + symbol);
  switch(tab){
    case 'google':
      window.open("https://google.com/search?q=" + stock.name + "(" + symbol + ")", "fantasygoogle" + symbol);
      return;
    case 'reddit':
      window.open("https://reddit.com/search/?q=" + stock.name + "(" + symbol + ")", "fantasyreddit" + symbol);
      return;
    case 'yahoo':
      window.open("https://search.yahoo.com/search?p=" + stock.name + "(" + symbol + ")", "fantasyyahoo" + symbol);
      return;
  }
  if( tab != selected_tab ) {
    e = gE(selected_tab + symbol);
    e.style.display='none';
  }
  e=gE(tab + symbol);
  e.style.display='block';
  e.style.height='0px';
  selected_tab=tab;
  tab_symbol=symbol;
  setTimeout(openTab,50,20);

  var loaded, tgt;
}
function openTab(iter)
{
  var e = gE(selected_tab + tab_symbol);
  e.style.height=iter+'px';
  if( iter < 300 ) {
    setTimeout(openTab,50,iter+20);
  }
}

function updateStockPrice(symbol)
{
  var e = gE("price" + symbol);
  var f = radVar("buy." + symbol);
  var q = parseFloat(radVar("quote." + symbol));

  var price = q * parseInt(f.amount);

  e.innerHTML = printPrice(price);
}
function buyStock(symbol)
{
  var f = radVar("buy." + symbol);

  HtmlRequest("/stox/buy.js",buildArgString({stock:symbol,amount:f.amount}),gotPurchase);
}
function gotPurchase(data)
{
  console.log("GotPurchase",data);
  var obj = JSON.parse(data);
  var stat = obj.data.status;
  var hist = obj.data.history;
  var amt = hist.money;
  var player = radVar("player");
  var history = radVar("history");

  history.unshift( hist );
  player.money -= amt;

  radStore("player", player);
  radStore("history", history);
  alert("Purchase completed.");
  var e = gE("myfunds");
  e.innerHTML = printPrice(player.money);
}


var currentsort=false;
function doSort(by)
{
  if( typeof by == 'object' ) {
    by = '-employees';
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
  HtmlRequestGet("/stox/stocks.js",buildArgString({page:0,perpage:12,sort:by}),gotSort);
}
function nextStockPage()
{
  var page = parseInt(radVar("page"));
  page++;
  radStore("page",page);
  HtmlRequestGet("/stox/stocks.js",buildArgString({page:page,perpage:12,sort:currentsort}),gotSort);
}
function previousStockPage()
{
  var page = parseInt(radVar("page"));
  page--;
  if(page<0)page=0;
  radStore("page",page);
  HtmlRequestGet("/stox/stocks.js",buildArgString({page:page,perpage:12,sort:currentsort}),gotSort);
}
function gotSort(data)
{
  var res = JSON.parse(data);
  var i, o, stocks = radVar("stocks");
  if( stocks == null ) stocks = {};
  for( i=0; i<res.data.data.length; ++i ) {
    o = res.data.data[i];
    stocks[o.symbol]=o;
  }
  if( res.data.data.length < 12 ) {
    radStore("nextpage",false);
  } else {
    radStore("nextpage",true);
  }
  radStore("stocks",stocks);
  radCStore("results2", res.data.data);
}

function drawChart()
{
  var symb = radVar("stock.symbol");
  drawChartFor(symb);
}

function drawChartFor(symb)
{
  var data = radVar("data." + symb);
  var e = gE("chart" + symb);

  if( e == null ) return;
  clearNode(e);
  if( data == null ) return;

  var margin = {top: 20, right: 30, bottom: 30, left: 40};
  var height = 200, width = 800;

  var dvalues = data.map(d=>d.value);
  var ddates = data.map(d=>d.date);
  var tx = d3.extent(ddates);
  console.log("TX: ", tx);
  var d1 = new Date(tx[0]), d2 = new Date(tx[1]);
  d1.setHours(0); d1.setMinutes(0); d1.setSeconds(0);
  d2.setHours(23); d2.setMinutes(59); d2.setSeconds(59);
  /*
  var ddaterange = [];
  var i, count = data.length;
  var width = (width-margin.right)-margin.left;

  for( i=0; i<ddates.length; ++i ) {
    ddaterange.push( margin.left + ((i/count) * width) );
  }
  */
  console.log("RX: ", d3.extent(dvalues));

  var x = d3.scaleTime()
    .domain(d3.extent(ddates))
    //.domain(ddates)
    .range([margin.left, width - margin.right]);
    //.range(ddaterange)

  var y = d3.scaleLinear()
    .domain(d3.extent(dvalues))
    .range([height - margin.bottom, margin.top]);

  var xAxis = g => g
    .attr("transform", `translate(0,${height - margin.bottom})`)
    .call(d3.axisBottom(x).ticks(width/80));

  var yAxis = g => g
    .attr("transform", `translate(${margin.left},0)`)
    .call(d3.axisLeft(y))
    .call(g => g.select(".domain").remove())
    .call(g => g.select(".tick:last-of-type text").clone()
        .attr("x", 3)
        .attr("text-anchor", "start")
        .attr("font-weight", "bold")
        .text(data.y));

  var line = d3.line()
    .defined(d => !isNaN(d.value))
    .x(d => x(d.date))
    .y(d => y(d.value));

  const svg = d3.create("svg")
      .attr("viewBox", [0, 0, width, height]);

  svg.append("g")
      .call(xAxis);

  svg.append("g")
      .call(yAxis);

  svg.append("path")
      .datum(data)
      .attr("fill", "none")
      .attr("stroke", "steelblue")
      .attr("stroke-width", 1.5)
      .attr("stroke-linejoin", "round")
      .attr("stroke-linecap", "round")
      .attr("d", line);

  e.appendChild( svg.node() );

  return;
}

function loadListingsResults( n )
{
  var stockdata = radVar("results2." +n);
  var stocknews = radVar("news." + stockdata.symbol);
  //if( stocknews === null ) {
    HtmlRequestGet("/stox/readchart.js",buildArgString({ticker:stockdata.symbol}),gotListingsChart,stockdata.symbol);
    HtmlRequestGet("/stox/readnews.js",buildArgString({ticker:stockdata.symbol}),gotListingsNews,stockdata.symbol);
    HtmlRequestGet("/stox/readnyt.js",buildArgString({ticker:stockdata.symbol}),gotListingsNYT,stockdata.symbol);
    HtmlRequestGet("/stox/readprice.js",buildArgString({ticker:stockdata.symbol}),gotListingsPrice,stockdata.symbol);
  //}
  templateParams({stock: stockdata});
  var e = gE("listingsview");
  blitzTemplate(e,"stockview");
}
function gotListingsChart( data, symbol )
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
    vx = readings[i].values.split(",");
    if( isNaN(vx[0]) || vx[0] == '' ) {
      readings.splice(i,1);
      --i;
      continue;
    }
    readings[i].value = vx[0];
    readings[i].date = new Date(readings[i].time).getTime();
  }
  radCStore("data." + symbol, readings);
  drawChartFor(symbol);
}
function gotListingsNews( data, symbol )
{
  var obj = JSON.parse(safeJSON(data));
  var news = obj.data.news;
  radCStore("news." + symbol, news);
}
function gotListingsNYT( data, symbol )
{
  var obj = JSON.parse(safeJSON(data));
  var nyt = obj.data.nyt;
  radCStore("nyt." + symbol, nyt);
}
function gotListingsPrice( data, symbol )
{
  var obj = JSON.parse(safeJSON(data));
  radStore("quote." + symbol, obj.data.quote);
}


var drag_y = null;
var drag_height = null;
var drag_h2 = null;

function dragResults2(ev)
{
  var e = gE("results2");
  drag_height = parseInt( e.style.maxHeight );
  drag_y = ev.clientY;
  document.addEventListener('mousemove', dragResults2Move);
  document.addEventListener('mouseup', dragResults2Up);
  document.addEventListener('selectstart', dragQuiet);
}
function dragQuiet(ev)
{
  ev.preventDefault();
}
function dragResults2Up(ev)
{
  document.removeEventListener('mousemove', dragResults2Move);
  document.removeEventListener('mouseup', dragResults2Up);
  document.removeEventListener('selectstart', dragQuiet);
}

function dragResults2Move(ev)
{
  var move_y = ev.clientY - drag_y;
  var r2 = gE("results2");
  var x;
  var e = gE("stockview");

  x = drag_height + move_y;
  if( x > winH/2 ) return;
  if( e ) {
    var rect = e.getBoundingClientRect();
    if( x > rect.y-60 ) return;
  }
  r2.xStyle['max-height'] = x;
  r2.style.maxHeight = x + "px";
}

function stockEnlarge()
{
  setTimeout(stockEnlargeIter, 100, 0);
}
function stockEnlargeIter(n)
{
  var e = gE("results2");
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

function dragStockNews(ev)
{
  var e = gE("stocknews");
  drag_height = parseInt( e.style.height );
  e = gE("stockview");
  drag_h2 = parseInt( e.style.height );
  drag_y = ev.clientY;
  document.addEventListener('mousemove', dragStockNewsMove);
  document.addEventListener('mouseup', dragStockNewsUp);
  document.addEventListener('selectstart', dragQuiet);
}
function dragStockNewsUp(ev)
{
  document.removeEventListener('mousemove', dragStockNewsMove);
  document.removeEventListener('mouseup', dragStockNewsUp);
  document.removeEventListener('selectstart', dragQuiet);
}


function dragStockNewsMove(ev)
{
  var move_y = ev.clientY - drag_y;
  var r2 = gE("stocknews");
  var r3 = gE("stockview");
  var x, x2;

  x = drag_height - move_y;
  if( x <= 0 ) return;
  if( x >= winH*2/3 ) return;
  x2 = drag_h2 + move_y;

  r2.xStyle['height'] = x;
  r2.style.height = x + "px";
  if( x2 > 308 ) {
    x2 = 308;
  }
  r3.xStyle['height'] = x2;
  r3.style.height = x2 + "px";
  r3.xStyle['bottom'] = x;
  r3.style.bottom = x + "px";
}
