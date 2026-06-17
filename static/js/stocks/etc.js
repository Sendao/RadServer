
function doSearch1()
{
  var query = document.forms['search1'].symbol.value;
  HtmlRequestGet("/stox/search.js",buildArgString({query:query}),gotSearch);
}
function gotSearch(data)
{
  var obj = JSON.parse(data);
  var i, o, stocks = radVar("stocks");
  if( stocks == null ) stocks = {};
  for( i=0; i<obj.data.data.length; ++i ) {
    o = obj.data.data[i];
    stocks[o.symbol]=o;
  }
  radStore("stocks",stocks);
  radCStore("results1", obj.data.data);
}
function loadSearchResults( n )
{
  var stockdata = radVar("results1." +n);

    HtmlRequestGet("/stox/readchart.js",buildArgString({ticker:stockdata.symbol}),gotSearchChart,stockdata.symbol);
    HtmlRequestGet("/stox/readnews.js",buildArgString({ticker:stockdata.symbol}),gotSearchNews,stockdata.symbol);
    HtmlRequestGet("/stox/readnyt.js",buildArgString({ticker:stockdata.symbol}),gotSearchNYT,stockdata.symbol);
    HtmlRequestGet("/stox/readprice.js",buildArgString({ticker:stockdata.symbol}),gotSearchPrice,stockdata.symbol);

  templateParams({stock: stockdata});
  var e = gE("searchview");
  blitzTemplate(e,"stockview");
}
function gotSearchChart( data, symbol )
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
  radStore("data." + symbol, readings);
  drawChartFor(symbol);
}
function gotSearchNews( data, symbol )
{
  var obj = JSON.parse(safeJSON(data));
  var news = obj.data.news;
  radStore("news." + symbol, news);
}
function gotSearchNYT( data, symbol )
{
  var obj = JSON.parse(safeJSON(data));
  var nyt = obj.data.nyt;
  radStore("nyt." + symbol, nyt);
}
function gotSearchPrice( data, symbol )
{
  var obj = JSON.parse(safeJSON(data));
  radStore("quote." + symbol, obj.data.quote);
}


function printPrice(amt)
{
  var s = "" + amt;
  var t = s.split(".");
  var p1, p2;
  p1 = parseInt(t[0]);
  if( t.length > 1 ) {
    if( amt < 1 ) {
      p2 = parseFloat("0." + t[1]).toFixed(5);
    } else {
      p2 = parseFloat("0." + t[1]).toFixed(3);
    }
    s = "" + p2;
    t = s.split(".");
    p2 = t[1];
    return "$" + (p1 + parseInt(t[0])).toLocaleString() + "." + p2;
  }
  return "$" + p1.toLocaleString();
}
function printPrice2(amt)
{
  var s = "" + amt;
  var isneg = s.indexOf("-")!=-1;
  var t = s.split(".");
  var p1, p2;
  p1 = Math.abs(parseInt(t[0]));
  if( t.length > 1 ) {
    if( amt < 1 ) {
      p2 = parseFloat("0." + t[1]).toFixed(5);
    } else {
      p2 = parseFloat("0." + t[1]).toFixed(3);
    }
    s = "" + p2;
    t = s.split(".");
    p2 = t[1];
    if( isneg )
      return "$-" + (p1+parseInt(t[0])).toLocaleString() + "." + p2;
    else
      return "$+" + (p1+parseInt(t[0])).toLocaleString() + "." + p2;
  }
  if( p1 == 0 )
    return "$0";
  else if( isneg )
    return "$-" + p1.toLocaleString();
  else
    return "$+" + p1.toLocaleString();
}
function printAmount(amt)
{
  if( amt < 10000 ) return amt;
  return amt.toLocaleString();
}

function printDec(tm,n)
{
  return tm.toFixed(n);
}

function printDecChg(tm,n)
{
  return (tm>0?"+":"") + tm.toFixed(n);
}

function printTime(tm)
{
  var n = new Date();
  var d = (n-tm)/1000;
  var res="";
  var dt, mon;
  var hrs, mins, secs;

  dt = tm.getDate();
  mon = tm.getMonth()+1;
  hrs = tm.getHours();
  mins = tm.getMinutes();
  secs = tm.getSeconds();

  if( dt < 10 ) dt = "0" + dt;
  if( mon < 10 ) mon = "0" + mon;
  if( hrs < 10 ) hrs = "0" + hrs;
  if( mins < 10 ) mins = "0" + mins;
  if( secs < 10 ) secs = "0" + secs;

  if( d > 3600*24 ) {
    res += dt + "/" + mon + " ";
  }
  res += hrs + ":" + mins + ":" + secs;

  return res;
}
function printDateTime(tm)
{
  var res="";
  var dt, mon;
  var hrs, mins, secs;
  var mnx = [ "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec" ];

  dt = tm.getDate();
  mon = mnx[tm.getMonth()];
  hrs = tm.getHours();
  mins = tm.getMinutes();
  secs = tm.getSeconds();

  if( dt == 11 || dt == 12 || dt == 13 ) dt = dt + "th";
  else if( dt%10 == 1 ) dt = dt + "st";
  else if( dt%10 == 2 ) dt = dt + "nd";
  else if( dt%10 == 3 ) dt = dt + "rd";
  else  dt = dt + "th";

  if( hrs < 10 ) hrs = "0" + hrs;
  if( mins < 10 ) mins = "0" + mins;
  if( secs < 10 ) secs = "0" + secs;

  res +=  mon + " " + dt + " " + hrs + ":" + mins + ":" + secs;
  return res;
}
function fetchGroups()
{
  HtmlRequestGet("/stox/readgroups.js", "", gotGroups);
}

var dg_data=null;
function deferedGroups()
{
  gotGroups(dg_data);
}

function gotGroups(data)
{
  var groups = JSON.parse(data).data;
  var coins = radVar("coins");
  var show = radVar("showgroup") ?? {};
  var i, sym;

  if( coins == null ) {
    dg_data=data;
    setTimeout("deferedGroups()", 1000);
    return;
  }

  for( i in groups ) {
    groups[i].symbols = groups[i].members.split(" ");
    if( groups[i].symbols.length < 3 ) {
      delete groups[i];
      continue;
    }
    if( !(i in show) )
      show[i] = 'none';
    for( sym of groups[i].symbols ) {
      if( sym in coins ) {
        if( !('groups' in coins[sym]) ) coins[sym].groups = [];
        if( !coins[sym].groups.includes(i) )
          coins[sym].groups.push(i);
      }
    }
  }
  console.log("groups",groups);
  if( radVar("showgrouphead") != "block" )
    radStore("showgrouphead", "none");
  radCStore("groups", groups);
  radCStore("showgroup", show);
  radCStore("show", show);
}
function openGroup(sym)
{
  var bg = radVar("showgroup." + sym);
  if( bg == "block" )
    bg = "none";
  else
    bg = "block";
  radStore("showgroup." + sym, bg);
  radStore("showgrouphead", "block");
}
function hideAllGroups()
{
  var show = radVar("showgroup");
  var i;
  for( i in show ) {
    show[i] = 'none';
  }
  radStore("showgroup", show);
  radStore("show", show);
  radStore("showgrouphead", "none");
}