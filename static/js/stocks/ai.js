
function requestWax(symbol)
{
    HtmlRequestGet("/stox/wax.js", buildArgString({ticker: symbol}), gotWax, symbol);
}
var waxfor = {};
var dirfor = {};
function gotWax(data, symbol)
{
    let obj = JSON.parse(data);
    let candles = obj.data.candles;
    let wax = obj.data.wax;
    var i, min, dt;
    var fullmins = {};
    let minmin = Infinity, minmax = -Infinity;
    let avgmin = Infinity, avgmax = -Infinity;
    var zerodate = new Date(wax[0].time);
    let waxvals = [ 'perf', 'decl', 'smperf', 'smdecl', 'perfd', 'decld', 'smperfd', 'smdecld', 'distup', 'distdn', 'avg' ];
    let items = [];

    for( i=0; i<wax.length; i++ ){
        min = parseInt( (new Date(wax[i].time) - zerodate)/60000 );
        fullmins[min] = wax[i];
        minmin = Math.min(minmin, min);
        minmax = Math.max(minmax, min);
    }
    // let's extract the current perf/decl
    radStore("waxperf." + symbol, wax[wax.length-1].smperf);
    radStore("waxdecl." + symbol, wax[wax.length-1].smdecl);

    for( i=0; i<candles.length; i++ ) {
        avgmin = Math.min(avgmin, candles[i].avg);
        avgmax = Math.max(avgmax, candles[i].avg);
    }
    let avgrange = avgmax-avgmin;
    for( i=0; i<candles.length; i++ ){
        min = parseInt( (new Date(candles[i].time) - zerodate)/60000 );
        if( min in fullmins ) {
            for( var j in candles[i] ) {
                if( j in fullmins[min] ) continue;
                if( j == 'avg' ) {
                    fullmins[min].avg = (candles[i].avg-avgmin)/(avgrange);
                } else {
                    fullmins[min][j] = candles[i][j];
                }
            }
        }
    }

    console.log("Fullmins:",fullmins);

    for( i=minmin; i<=minmax; i++ ) {
        if( !(i in fullmins) ) continue;
        let w = fullmins[i];
        let item = [];
        for( var j in waxvals ) {
            item.push( w[waxvals[j]] );
        }
        items.push(item);
    }

    console.log("Items:",items);

    let data2 = [];
    let data3 = [];

    for( i=0; i+1<items.length; i++ ) {
        data2.push( { input: [items[i][10]], output: [items[i+1][10]] } );
        data3.push( items[i][10] );
    }


    waxfor[symbol] = data2;
    dirfor[symbol] = data3;
    radStore("wax_min." + symbol, avgmin);
    radStore("wax_range." + symbol, avgrange);

    //trainSymbol(symbol);
}

var seqsfor = {};
function requestSeries(symbol)
{
    var high = -Infinity, low = Infinity;
    var i;
    var data = radVar("dir." + symbol);
    let seqs = [];
    let seq = [];
    let perf = radVar("waxperf." + symbol)/100;
    let decl = radVar("waxdecl." + symbol)/100;
    let state = 0; // "flat", "incrementing", "decrementing"
    var diff;
    var modif = 0.25;

    for( i=0; i<data.length; i++ ) {
        if( data[i] > high ) {
            high = data[i];
        } else if( data[i] < low ) {
            low = data[i];
        }
        seq.push(data[i]);
        if( state == 0 || state == 2 ) {
            diff = (data[i] - low) / high;
            if( diff > perf*modif ) {
                high = data[i];
                state = 1;
                if( seq.length > 1 )
                    seqs.push(seq);
                seq=[data[i]];
                continue;
            }
        }
        if( state == 0 || state == 1 ) {
            diff = (high - data[i]) / high;
            if( diff > decl*modif ) {
                low = data[i];
                state = 2;
                if( seq.length > 1 )
                    seqs.push(seq);
                seq=[data[i]];
                continue;
            }
        }
    }
    if( seq.length > 1 )
        seqs.push(seq);
    seqsfor[symbol] = seqs;
}

let nets = {};

function neatSymbol( symbol )
{
    let wax = waxfor[symbol];
    let net = new neataptic.architect.LSTM(1, 6, 1);

    net.train(wax, {
        log: 500,
        iterations: 6000,
        error: 0.0001,
        clear: true,
        rate: 0.0025
        });
    nets[symbol] = net;

    neatPredict(symbol);
}
function neatPredict( symbol )
{
    let net = nets[symbol];
    let avgmin = radVar("wax_min." + symbol);
    let avgrange = radVar("wax_range." + symbol);

    var i;
    let price = (radVar("cask." + symbol)+radVar("cbid." + symbol))/2;
    let waxobj = [(price-avgmin)/avgrange];
    let futures = [price];
    var future;

    for( i=0; i<14; i++ ) {
        future = net.activate( waxobj );
        futures.push( future[0]*avgrange + avgmin );
        waxobj[0] = future[0];
    }
    console.log("The future is bright!", futures);
    console.log("min " + avgmin + ", range " + avgrange);
}

function brainSymbol( symbol )
{
    let wax = radVar("wax." + symbol);
    let wax2 = seqsfor[symbol];

    let cv = new brain.CrossValidate(() => new brain.recurrent.LSTMTimeStep());
    //cv.train(data, trainingOptions, k); //note k (or KFolds) is optional

    let res = cv.train(wax2, {
        log: true,
        logPeriod: 50,
        iterations: 250,
        errorThresh: 0.001
        });
    let net = cv.toNeuralNetwork();
    nets[symbol] = net;
    console.log("Training result: ", res);

    brainPredict(symbol);
}
function bNormal(symbol, value)
{
    let avgmin = radVar("wax_min." + symbol);
    let avgrange = radVar("wax_range." + symbol);
    let price = (value-avgmin)/avgrange;
    return price;
}
function brainPredict( symbol )
{
    let net = nets[symbol];
    let avgmin = radVar("wax_min." + symbol);
    let avgrange = radVar("wax_range." + symbol);

    var i;
    let price = (radVar("cask." + symbol)+radVar("cbid." + symbol))/2;
    let waxobj = [(price-avgmin)/avgrange];
    let futures = [price];
    var future;

    for( i=0; i<14; i++ ) {
        future = net.run( waxobj );
        futures.push( future*avgrange + avgmin );
        waxobj[0] = future;
    }
    console.log("The future is bright!", futures);
    console.log("min " + avgmin + ", range " + avgrange);
}
