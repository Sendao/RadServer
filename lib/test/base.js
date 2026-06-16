
module.exports = function TestingObject(app, fw)
{
    var db = app.db;
    var dbase = app.dbase;
    var cc = this;

    this.Data = function() {
        db.control.call(this, 'test');

        this.Tests = function() {
            this.name = 'tests';
            this.indice = { 'id': {}, "name": {} };
            this.sorting = { 'id': 0 };
            this.defaults = { 'name': '', 'data': [] };
            dbase.call(this, app, 'test');
        };
        this.tests = new this.Tests();
    };
    this.data = new this.Data();

    this.run = function() {
        var xd, items, item;

        xd = this.data.tests;

        xd.removeAll();

        //* create an entry
        item = xd.create();
        fw.assert( typeof item == 'object', "db item creation" );

        // save entry
        item.name = 'whodunnit';
        xd.save(item);
        xd.db.clean(xd);

        // load saved entry
        console.log("itemid " + item.id);
        items = xd.search( 'id', item.id );
        fw.assert( items.length == 1, "Number of items found in search" );
        fw.assert( items[0].id == item.id, "Correct item found" );
        fw.assert( items[0].name == 'whodunnit', "Item identified by name" );

        // load saved entry by name
        items = xd.search( 'name', item.name );
        fw.assert( items.length == 1, "Number of items found in search by name (" + items.length + ")" );
        fw.assert( items[0].id == item.id, "Correct item found by name" );

        // overwrite with longer name and some data
        item.name = 'whodunnit also';
        item.data = ['hello','world','and','scott'];
        xd.save(item);
        xd.db.clean(xd);

        // load saved entry
        items = xd.search( 'id', item.id );
        fw.assert( items.length == 1, "Number of items found in search 2 (" + items.length + ")" );
        fw.assert( items[0].id == item.id, "Correct item found 2 (" + item.id + "," + items[0] + ")" );

        // overwrite with shorter name, using older index
        item.name = 'whodunnit';
        xd.save(item);
        xd.db.clean(xd);

        // load saved entry
        items = xd.search( 'id', item.id );
        fw.assert( items.length == 1, "Number of items found in search 3 (" + items.length + ")" );
        fw.assert( items[0].id == item.id, "Correct item found 3 (" + item.id + "," + items[0] + ")" );
        fw.assert( items[0].name == 'whodunnit', "Item identified by name 3" );
    };

};
