var canvas;

function createCanvas()
{
	canvas = document.createElement("canvas");
	canvas.style.position = "absolute";
	canvas.style.left = canvas.style.top = "0px";
	canvas.style.zIndex = "0";
	canvas.style.cursor = "default";

	return canvas;
}

var canvas_items = [];

function drawCanvas(x,y,w,h)
{
	var i;
	var ctx = canvas.getContext("2d");

	ctx.clearRect(0,0,canvas.width,canvas.height);
	for( i=0; i<canvas_items.length; i++ ) {
		drawCanvasItem(canvas_items[i]);
	}
}
function drawCanvasItem(item)
{
	var ctx = canvas.getContext("2d");
	var i;

	
	ctx.lineWidth = 5;
	ctx.strokeStyle = ctx.fillStyle = "white";
	ctx.lineCap = ctx.lineJoin = "round";

	switch( item.type ) {
		case 'brush':
			break;
		case 'line':
			ctx.beginPath();
			ctx.moveTo(item.points[0][0], item.points[0][1]);

			for( i=1; i<item.points.length; i++ ) {
				ctx.lineTo(item.points[i][0], item.points[i][1]);
			}
			ctx.stroke();
			break;
	}
}

class CanvasLines {
	constructor() {
		this.type = 'line';
		this.points = [];
		this.left = this.top = 0;
		this.width = this.height = 0;
		this.right = this.bottom = 0;
	}
	add( x, y ) {
		if( this.points.length > 0 ) {
			var lastpt = this.points[this.points.length-1];
			if( lastpt[0] == x && lastpt[1] == y )
				return;
		}
		
		this.points.push([x, y]);
		
		if( x < this.left ) this.left = x;
		if( y < this.top ) this.top = y;
		if( x > this.right ) this.right = x;
		if( y > this.bottom ) this.bottom = y;

		this.width = this.right - this.left;
		this.height = this.bottom - this.top;
	}
}

function buildCanvasItem(type)
{
	var item;
	switch( type ) {
		case 'Line':
			item = new CanvasLines();
			break;
	}
	canvas_items.push(item);
	return item;
}
