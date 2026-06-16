/** @param {NS} ns **/
var last_invested = 0;

function startup(ns) {
	ns.disableLog("ALL");
}
function sellStock(ns, stox, symbol, factor) {
	var price = parseFloat(ns.stock.getBidPrice(symbol));
	if( !(symbol in stox) || stox[symbol].amt <= 0 ) {
		return stox;
	}
	if( stox[symbol].amt*factor < 100 ) {
		factor = 1;
	}
	var profit = parseFloat( stox[symbol].amt*factor*price - stox[symbol].amt*factor*stox[symbol].price );
	if( profit <= 100000 ) {
		return stox;
	}
	var pp = 100.0 * ( profit / (price*stox[symbol].amt*factor) );
	if( pp < 10 ) {
		return stox;
	}
	ns.stock.sell(symbol, stox[symbol].amt*factor);

	profit = printHuman(profit);
	ns.tprint("Sold " + stox[symbol].amt*factor + "*" + symbol + "@" + price + "=" + printHuman(stox[symbol].amt*factor*price) + ", profit=" + profit + ", pp=" + pp + "%" );
	if( factor == 1 )
		delete stox[symbol];
	else
		stox[symbol].amt *= factor;
	return stox;
}
function buyStock(ns, stox, symbol, factor) {
	if( ns.stock.getVolatility(symbol) < 0.07 ) {
		var price = ns.stock.getAskPrice(symbol);
		if( symbol in stox && stox[symbol].price*0.98 < price ) {
			return stox;
		}
		var money = ns.getServerMoneyAvailable('home');
		if( last_invested > money ) return stox; // freeze buys after 50%
		money = money * factor;
		if( money < 1000000 ) return stox; // require ~10 million to start
		var shares = Math.min( money/price, ns.stock.getMaxShares(symbol) );

		ns.stock.buy(symbol, shares);

		var stock = ns.stock.getPosition(symbol);
		stox[symbol] = { symbol: symbol, amt: parseFloat(stock[0]), price: parseFloat(stock[1]) };
		ns.tprint("Bought " + shares + "*" + symbol + "@" + price + "=$" + printHuman(shares*price));
	}
	return stox;
}
function stockReport(ns, stox, symbol) {
	var price = ns.stock.getBidPrice(symbol);
	var profit = stox[symbol].amt*price - stox[symbol].amt*stox[symbol].price;
	var pp = 100.0 * ( profit / (price*stox[symbol].amt) );
	profit = printHuman(profit);
	ns.tprint(stox[symbol].amt + "*" + symbol + "@" + price + "=" + printHuman(stox[symbol].amt*price) + ", profit=" + profit + "(" + pp + "%)" );
}
function chartReport(ns, charts, symbol) {
	ns.tprint(symbol + ": price " + charts[symbol].ticks[ charts[symbol].ticks.length-1 ].close +
			", avg5=" + charts[symbol].avg5 + "(" + charts[symbol].dev5 + ", " + charts[symbol].ed5 + ")" +
			", avg14=" + charts[symbol].avg14 + "(" + charts[symbol].dev14 + ", " + charts[symbol].ed14 + ")");
	//ns.tprint(symbol + ": " + charts[symbol].c5 + ", " + charts[symbol].c14);
}
function printHuman(m) {
	var str = ''; var n = m;
	if( n < 0 ) {
		n = n * -1;
		str = '-';
	}

	if( n > 1000000000 ) {
		n /= 1000000000;
		str += parseInt(n) + "B";
		return str;
	}
	if( n > 1000000 ) {
		n /= 1000000;
		str += parseInt(n) + "M";
		return str;
	} else if( n > 1000 ) {
		n /= 1000;
		str += parseInt(n) + "K";
		return str;
	}
	str += parseInt(n);
	return str;
}

export async function main(ns) {
	var charts = {};
	var breakouts = {}, bustouts = {};
	var breakouts2 = {}, bustouts2 = {};
	var breakouts3 = {}, bustouts3 = {};
	var breakouts4 = {}, bustouts4 = {};
	var stox = {}, symbols = ns.stock.getSymbols();
	var i, stock, symbol, price, fc, chart, tick;
	var dtStart = new Date(), dtNow, timePassed;
	var cycle = 0;
	const maxTicks = 15;
	const showLog = false;
	const showReport = false;
	const showSummary = true;

	startup(ns);

	ns.tprint("Symbols:",symbols);
	for( i=0; i<symbols.length; i++ ) {
		symbol = symbols[i];
		stock = ns.stock.getPosition(symbol);
		if( parseFloat(stock[0]) != 0 ) {
			stox[symbols[i]] = { symbol: symbol, amt: parseFloat(stock[0]), price: parseFloat(stock[1]) };
			if( showReport )
				stockReport(ns, stox, symbol);
		}
		tick = { time: new Date(),
			ask: ns.stock.getAskPrice(symbol),
			bid: ns.stock.getBidPrice(symbol),
			close: ns.stock.getPrice(symbol)
		};

		chart = { symbol: symbol,
			ticks: [ tick ],
			close: tick.close,
			avg5: tick.close,
			avg14: tick.close,
			dev5: 0,
			dev14: 0,
			ed5: 0,
			ed14: 0			
			};
		charts[symbol] = chart;
		breakouts[symbol] = false;
		bustouts[symbol] = false;
		breakouts2[symbol] = false;
		bustouts2[symbol] = false;
		breakouts3[symbol] = false;
		bustouts3[symbol] = false;
		breakouts4[symbol] = false;
		bustouts4[symbol] = false;
	}

	while( true ) {
		dtNow = new Date();
		timePassed = ( dtNow - dtStart ) / ( 1000*60 ); // minutes
		cycle++;
		if( cycle > 59 ) { // once a minute
			if( showReport ) {
				for( symbol in stox ) {
					stockReport(ns, stox, symbol);
				}
			}
			if( showSummary ) {
				var total_invested=0, total_profit=0, count=0, bid;
				for( symbol in stox ) {
					bid = ns.stock.getBidPrice(symbol);
					total_invested += stox[symbol].amt * bid;
					total_profit += stox[symbol].amt * bid - stox[symbol].amt * stox[symbol].price;
					count++;
				}
				last_invested = total_invested;
				ns.tprint("Total invested: " + printHuman(total_invested) + "(profit " + printHuman(total_profit) + ") in " + count + " stocks.");
			}
			cycle=0;
		}
		for( symbol in charts ) {
			tick = { time: dtNow,
				ask: ns.stock.getAskPrice(symbol),
				bid: ns.stock.getBidPrice(symbol),
				close: ns.stock.getPrice(symbol)
			};
			var dtMax = new Date( dtNow - 1000*60*15 ); 
			while( charts[symbol].ticks.length > maxTicks || charts[symbol].ticks[0].time < dtMax ) {
				charts[symbol].ticks.shift();
			}
			charts[symbol].ticks.push(tick);
			charts[symbol].close = tick.close;
			var dev5=0, total5=0, dev14=0, total14=0, count5=0, count14=0;
			var dt5 = new Date( dtNow - 1000*60*5 );
			var dt14 = new Date( dtNow - 1000*60*14 );
			for( i=0; i<charts[symbol].ticks.length; i++ ) {
				if( charts[symbol].ticks[i].time > dt14 ) {
					dev14 = Math.abs( charts[symbol].ticks[i].close - charts[symbol].avg14 );
					total14 += dev14*dev14;
					count14 ++;
				}
				if( charts[symbol].ticks[i].time > dt5 ) {
					dev5 = Math.abs( charts[symbol].ticks[i].close - charts[symbol].avg5 );
					total5 += dev5*dev5;
					count5 ++;
				}
			}
			charts[symbol].avg5 = tick.close * (2/(count5+1)) + charts[symbol].avg5 * ( 1 - 2/(count5+1) );
			charts[symbol].avg14 = tick.close * (2/(count14+1)) + charts[symbol].avg14 * ( 1 - 2/(count14+1) );
			var ed5 = Math.abs( charts[symbol].avg5 - tick.close );
			var ed14 = Math.abs( charts[symbol].avg14 - tick.close );
			charts[symbol].ed5 = ed5 * (2/(count5+1)) + charts[symbol].ed5 * ( 1 - 2/(count5+1) );
			charts[symbol].ed14 = ed14 * (2/(count14+1)) + charts[symbol].ed14 * ( 1 - 2/(count14+1) );
			charts[symbol].c5 = count5;
			charts[symbol].c14 = count14;

			if( count5 == 0 ) {
				charts[symbol].dev5 = 0;
			} else {
				charts[symbol].dev5 = Math.sqrt( total5/count5 );
			}
			if( count14 == 0 ) {
				charts[symbol].dev14 = 0;
			} else {
				charts[symbol].dev14 = Math.sqrt( total14/count14 );
			}
			if( cycle == 0 && symbol == 'FSIG' && showLog ) {
				chartReport(ns, charts, symbol);
			}
			var breakout, bustout, breakout2, bustout2;
			var breakout3, bustout3, breakout4, bustout4;
			if( timePassed > 5 ) {
				breakout = ( charts[symbol].close > charts[symbol].avg5 + charts[symbol].dev5 );
				bustout = ( charts[symbol].close < charts[symbol].avg5 - charts[symbol].dev5 );
				breakout2 = ( charts[symbol].close > charts[symbol].avg5 + 1.8*charts[symbol].ed5 );
				bustout2 = ( charts[symbol].close < charts[symbol].avg5 - 1.8*charts[symbol].ed5 );
				if( breakouts[symbol] ) {
					if( !breakout ) {
						if( symbol == 'FSIG' && showLog )
							ns.tprint(symbol + " end breakout >bb5 @" + charts[symbol].close);
						sellStock(ns, stox, symbol, 0.1);
					}
				} else if( breakout ) {
					if( symbol == 'FSIG' && showLog )
						ns.tprint(symbol + " start breakout >bb5");
				}
				if( bustouts[symbol] ) {
					if( !bustout ) {
						if( symbol == 'FSIG' && showLog )
							ns.tprint(symbol + " end bustout <bb5 @" + charts[symbol].close);
						buyStock(ns, stox, symbol, 0.0001);
					}
				} else if( bustout ) {
					if( symbol == 'FSIG' && showLog )
						ns.tprint(symbol + " start bustout <bb5");
				}
				breakouts[symbol] = breakout;
				bustouts[symbol] = bustout;

				if( breakouts2[symbol] ) {
					if( !breakout2 ) {
						if( symbol == 'FSIG' && showLog )
							ns.tprint(symbol + " end breakout2 >bb5 @" + charts[symbol].close);
						sellStock(ns, stox, symbol, 0.1);
					}
				} else if( breakout2 ) {
					if( symbol == 'FSIG' && showLog )
						ns.tprint(symbol + " start breakout2 >bb5");
				}
				if( bustouts2[symbol] ) {
					if( !bustout2 ) {
						if( symbol == 'FSIG' && showLog )
							ns.tprint(symbol + " end bustout2 <bb5 @" + charts[symbol].close);
						buyStock(ns, stox, symbol, 0.0001);
					}
				} else if( bustout2 ) {
					if( symbol == 'FSIG' && showLog )
						ns.tprint(symbol + " start bustout2 <bb5");
				}

				breakouts2[symbol] = breakout2;
				bustouts2[symbol] = bustout2;
			}
			if( timePassed > 14 ) {
				breakout3 = ( charts[symbol].close > charts[symbol].avg14 + charts[symbol].dev14 );
				bustout3 = ( charts[symbol].close < charts[symbol].avg14 - charts[symbol].dev14 );
				breakout4 = ( charts[symbol].close > charts[symbol].avg14 + 1.8*charts[symbol].ed14 );
				bustout4 = ( charts[symbol].close < charts[symbol].avg14 - 1.8*charts[symbol].ed14 );
				if( breakouts3[symbol] ) {
					if( !breakout3 ) {
						if( symbol == 'FSIG' && showLog )
							ns.tprint(symbol + " end breakout3 >bb14 @" + charts[symbol].close);
						sellStock(ns, stox, symbol, 1);
					}
				} else if( breakout3 ) {
					if( symbol == 'FSIG' && showLog )
						ns.tprint(symbol + " start breakout3 >bb14");
				}
				if( bustouts3[symbol] ) {
					if( !bustout3 ) {
						if( symbol == 'FSIG' && showLog )
							ns.tprint(symbol + " end bustout3 <bb14 @" + charts[symbol].close);
						buyStock(ns, stox, symbol, 0.1);
					}
				} else if( bustout3 ) {
					if( symbol == 'FSIG' && showLog )
						ns.tprint(symbol + " start bustout3 <bb14");
				}
				breakouts3[symbol] = breakout3;
				bustouts3[symbol] = bustout3;

				if( breakouts4[symbol] ) {
					if( !breakout4 ) {
						if( symbol == 'FSIG' && showLog )
							ns.tprint(symbol + " end breakout4 >bb14 @" + charts[symbol].close);
						sellStock(ns, stox, symbol, 1);
					}
				} else if( breakout4 ) {
					if( symbol == 'FSIG' && showLog )
						ns.tprint(symbol + " start breakout4 >bb14");
				}
				if( bustouts4[symbol] ) {
					if( !bustout4 ) {
						if( symbol == 'FSIG' && showLog )
							ns.tprint(symbol + " end bustout4 <bb14 @" + charts[symbol].close);
						buyStock(ns, stox, symbol, 0.1);
					}
				} else if( bustout4 ) {
					if( symbol == 'FSIG' && showLog )
						ns.tprint(symbol + " start bustout4 <bb14");
				}

				breakouts4[symbol] = breakout4;
				bustouts4[symbol] = bustout4;
			}
		}
		await ns.sleep(1000);
	}
}