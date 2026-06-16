const fs = await import('fs');
let jpegjs = await import('jpeg-js');

async function loadjpeg(fn) {
  const buf = await fs.readFileSync(fn);
  const data = jpegjs.decode(buf);
  return data;
}
async function savejpeg(fn, width, height, data) {
  const info = jpegjs.encode({width,height,data});
  await fs.writeFileSync(fn, info.data);
}

async function runtime() {

let args = process;

//console.log(Object.keys(args));
const { width, height, data } = await loadjpeg('input.jpg');
console.log("Info: width " + width + ", height " + height);

function colorDist(source,target)
{
  var red = Math.abs(source[0]-target[0]);
  var green = Math.abs(source[1]-target[1]);
  var blue = Math.abs(source[2]-target[2]);
  return [red,green,blue];
}
function coord(x,y,c)
{
  return y*width*3 + x*3 + c;
}

var r,g,b,i,j,x,y;
var red,green,blue;
const pixelArray = new Uint8ClampedArray(data.buffer);
const output = new Uint8ClampedArray(data.buffer);

for( i=0; i<width; i++ ) {
  for( j=0; j<height; j++ ) {

    const p0 = coord(i,j,0);
    const src = pixelArray.subarray(p0, p0+3);

    red = green = blue = 0;

    for( x=-1; x<2; x++ ) {
      for( y=-1; y<2; y++ ) {
        if( x == 0 && y == 0 ) continue;

        const p1 = coord(i+x,j+y,0);
        const tgt = pixelArray.subarray(p1, p1+3);

        [r,g,b] = colorDist(src,tgt);

        red += r;
        green += g;
        blue += b;
      }
    }

    red = parseInt( red / 8 );
    green = parseInt( green / 8 );
    blue = parseInt( blue / 8 );

    let edge = red+green+blue;

    if( edge < 128 ) {
      output[p0] = output[p0+1] = output[p0+2] = 0;
    } else {
      output[p0] = red;
      output[p0+1] = green;
      output[p0+2] = blue;
    }
  }
}

console.log("Trying output");

await savejpeg('output.jpg', width, height, output);
console.log("Done");


}

await runtime();


