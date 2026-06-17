var db;

class Database
{
	constructor(mainframe)
	{
		this.mainframe = mainframe;
		db = this;
		HtmlRequestGet('/ed/start.json', '', gotDBStart);
	}

	build()
	{
		var div = document.createElement("div");

		blitzTemplate(div, "modules");
		this.main = div;
		return div;
	}
}

function gotDBStart(data)
{
	var i;
	var obj = JSON.parse(data);
	console.log(obj);
	mods = obj.data.modules;
	radStore("mods", mods);
	tabledefs = obj.data.tabledefs;
	radStore("tables", tabledefs);
}

function loadTable(modname, tabname)
{
	HtmlRequestGet('/ed/list.json', buildArgString({t:tabname,m:modname,p:0}), finishLoadTable.bind(null, modname, tabname));
}
function finishLoadTable(modname, tabname, data)
{
	console.log("Module: ", modname);
	console.log("Table: ", tabname);
	console.log("Data: ", data);
	var obj = JSON.parse(data);
	console.log("flt: ", obj);
	radStore("data." + modname + "." + tabname, obj.data);
	var div = document.createElement("div");
	templateParams( { 'table': tabname, 'module': modname } );
	blitzTemplate(div, "lister");
	db.mainframe.add("#"+ modname + "#" + tabname, div);
}

function previousPage( modname, tabname )
{
	var pg = radVar("page." + modname + "." + tabname);
	pg--;
	radStore("page." + modname + "." + tabname, pg);
	HtmlRequestGet('/ed/list.json', buildArgString({t:tabname,m:modname,p:pg}), finishLoadTable.bind(modname, tabname));
}

function nextPage( modname, tabname )
{
	var pg = radVar("page." + modname + "." + tabname);
	pg++;
	radStore("page." + modname + "." + tabname, pg);
	HtmlRequestGet('/ed/list.json', buildArgString({t:tabname,m:modname,p:pg}), finishLoadTable.bind(modname, tabname));
}

function editTable( modname, tabname, id )
{
	var i, found=false;
	var dat = radVar("data." + modname + "." + tabname);
	for( i=0; i<dat.length; ++i ) {
		if( dat[i].id == id ) {
			found=true;
			break;
		}
	}
	if( !found ) {
		alert("Can't find item.");
		return;
	}
	div = document.createElement("div");
	templateParams( { 'table': tabname, 'module': modname, 'id': id, 'editno': i } );
	blitzTemplate(div, "edittable");
}

function delTable( modname, tabname, id )
{
	HtmlRequest('/ed/del.js', buildArgString({'m': modname, 't': tabname, 'id':id}), finishDelTable);
}
function finishAddTable(data)
{
	var obj = JSON.parse(data);
	var mod = obj.data.m;
	var tab = obj.data.t;
	var objs = radVar("data." + mod + "." + tab);
	objs.push(obj.data.obj);
	radStore("data." + mod + "." + tab, objs);
}
function finishEditTable(data)
{
	var obj = JSON.parse(data);
	console.log(obj);
	var mod = obj.data.m;
	var tab = obj.data.t;
	var id = obj.data.obj.id;
	var objs = radVar("data." + mod + "." + tab);
	var i;
	for( i=0; i<objs.length; ++i ) {
		if( objs[i].id == id ) {
			objs.splice(i,1,obj.data.obj);
			break;
		}
	}
	radStore("data." + mod + "." + tab, objs);
	setTimeout("radChange('data." + mod + "." + tab + "')",100);
}
function finishDelTable(data)
{
	var obj = JSON.parse(data);
	var id = obj.data.id;
	var mod = obj.data.m;
	var tab = obj.data.t;
	var objs = radVar("data." + mod + "." + tab);
	var i;
	for( i=0; i<objs.length; ++i ) {
		if( objs[i].id == id ) {
			objs.splice(i,1);
			break;
		}
	}
	radStore("data." + mod + "." + tab, objs);
}