var myapp;
export function startup(app)
{
  myapp = app;
  app.Abiosys = Abiosys;
}
export async function init()
{
}
export class Abiosys {
  constructor()
  {
    this.levels = new Map();
    this.sorted = new myapp.util.SortedList();
  }

  push_level( level, amount )
  {
    let b = this.levels.get(level);
    let isnew = false;
    if( typeof b == 'undefined' ) {
      b = 0;
    } else {
      let g = this.sorted.findAllSpec(b);
      for( var h=0; h<g[0].length; h++ ) {
        if( g[1][h] === level ) {
          this.sorted.removeAt(h, 1);
        }
      }
    }
    let c = b+amount;

    this.sorted.add(c,level);

    if( c > this.highest_amount ) {
      this.highest_level = level;
      this.highest_amount = c;
    }
    this.levels.set(level, c);
    if( this.highest_level == level && amount < 0 ) {
      this.find_highest();
    }
  }

  find_highest()
  {
    this.highest_level = this.sorted.items[ this.sorted.items.length-1 ];
    this.highest_amount = this.sorted.datas[ this.sorted.datas.length-1 ];
  }

}



