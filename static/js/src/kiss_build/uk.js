var fft = require('kissfft-js');


function scaleTransform( trans, size ) {
	return trans.map( (x) => { return x/size; });
/*
	var i=0, b = 1.0/size;
	while( i < t.length ) {
		t[i] *= b;
		++i;
	}
	return t; */
}


function scanNoise(source)
{
  var ch = source.getChannelData();
  if( ch.length % 2 == 1 ) {
    console.log("Invalid noise.");
    return;
  }
	var fftr = new fft.FFTR( ch.length );
	var txf = fftr.forward( ch );
	var tsc = scaleTransform(txf, ch.length);
	//var inv = fftr.inverse( tsc );
	fftr.dispose();
	return tsc;
}
