// Copyright 2012-2015 Scott Powell, all rights reserved
// Please feel free to modify and use this code for your own purposes.
//! todo: allow radlib to catch parameter vals like 'view=filename'
var radNest = {}; // xVar storage
var radViews = {}; // Loaded GET request storage
var radTemps = {}; // xTemplate storage
var radWatches = {}; // xWatch div storage
var radWatch2 = {}; // Narrow storage
var radWatch3 = {}; // Context storage
var radWHooks = {}; // xWatch js storage
var radSects = {}; // Section storage
var radCharts = {}; // xChart storage

var radLoadCB = [];
var finRadCB = [];

var dbgLog = [];

var radicle = {
        'lowtab': { 'onclick': 'selectTab(this)' },
        'formbtn': { 'onclick': 'fsend(this)', 'style': 'cursor: pointer' }
    };

var radRootables = []; // Page Refactoring (this works but needs more work to be robust)
var radRoots = {}; 
var radRegions = {}; // Experimental, unfinished (does not work properly at all)
var radDataSafe = {};
var radQueries = {}; // xType queries
var radLists = {}; // xType data lists
var radTypemasks = {}; 

// Runtime parameters (these should ideally be removed, per our lessons from object oriented code)
var radNode = false;
var radMute = false;
var radRunning = 0;

// Begin
function radHook( path, func, obj )
{
    if( path in radWHooks ) {
        for ( var i=0; i<radWHooks[path].length; ++i)
        {
            if( radWHooks[path][i][0] == func && radWHooks[path][i][1] == obj )
                return;
        }
        radWHooks[path].push([func,obj]);
    } else {
        radWHooks[path] = [[func,obj]];
    }
}

function radStartup()
{
    XRegisterResize('radResize();');
}

/*
 * radScanClass: scan an element and set params from defaults
 * based on element name, class name, and/or id
 * Should be run multiple times on an element,
 * first when loaded again later when scaled
 */
function radScanClass( dv, preloadStage=false )
{
	var classNames = [], found=false;
    if ( isValid(dv.className) )
    {
    	classNames = dv.className.split(' ');
    }
    
    if( 'id' in dv && dv.id != '' )
    	classNames.unshift( '#' + dv.id );
    classNames.unshift( dv.nodeName.toLowerCase() );

    if( typeof dv.attributes != 'undefined' ) {
    	for( var i = 0; i < dv.attributes.length; ++i ) {
	    	if( dv.attributes[i].value == '' ) {
	    		classNames.unshift( dv.attributes[i].name );
	    	}
	    }
    }
    for ( var i = 0; i < classNames.length; ++i )
    {
        if ( classNames[i] in radicle )
        {
//            console.log("Activate class " + classNames[i]);
            var arr = radicle[classNames[i]];
            var wasset = false, x;
            for ( var j in arr )
            {
            	if( j[0] == '#' ) {
            		var vStop = false;
            		if( typeof dv.xParams != 'undefined' )
            			dv.xParams += ",";
            		else
            			dv.xParams = "";
            		dv.xParams += j.slice(1) + "=" + arr[j];
            		continue;
            	}
                if( j == 'set' || j == 'add' || j == 'append' || j == 'push' ) continue;
                wasset = false;
                if( j == 'style' || j == 'xStyle' ) {
            		if( ( x = getAttribute(dv, j) ) != null ) {
            			if( x != arr[j] ) {
            				wasset = true;
            				dv.setAttribute(j, x + ";" + arr[j] );
            			}
            		}
                }
                if( !wasset ) {
    				if( j.substr(0,1) == '#' ) {
    					dv[j] = arr[j];
    				} else {
    					dv.setAttribute(j, arr[j]);
    				}
                }
            }
            if( 'set' in arr ) {
                for( var j in arr['set'] ) {
                    dv[j] = arr['set'][j];
                }
            }
            if( ((j='add') in arr) || ((j='append') in arr) || ((j='push') in arr) ) {
            	for( var k in arr[j] ) {
            		dv[k] = dv[k] + arr[j][k];
            	}
            } 
            found = true;
        }
    }
    return found;
}

function radIsClass( dv, cls )
{
	var classNames = [];
    if ( isValid(dv.className) )
    {
    	classNames = dv.className.split(' ');
    }
    
    if( 'id' in dv && dv.id != '' )
    	classNames.unshift( '#' + dv.id );
    classNames.unshift( dv.nodeName.toLowerCase() );

    // does the head splash here? no, but that's a good idea. thanks!
    if( typeof dv.attributes != 'undefined' ) {
	    for( var i = 0; i < dv.attributes.length; ++i ) {
	    	if( dv.attributes[i].value == '' ) {
	    		classNames.unshift( dv.attributes[i].name );
	    	}
	    }
    }
    for ( var i = 0; i < classNames.length; ++i )
    {
    	if( typeof cls != 'string' ) {
    		if( Array.isArray(cls) ) {
    			if( cls.indexOf(classNames[i]) != -1 )
    				return true;
    		} else if( classNames[i] in cls )
    			return true;
    	} else if ( classNames[i] == cls )
        	return true;
    }
    return false;
}

function radClass( cls )
{
    for ( var i in cls )
    {
        if ( i in radicle )
        {
            delete radicle[i];
        }
        radicle[i] = cloneObject(cls[i]);
    }
}


















//  *** EXPERIMENTAL CODE BOUNDARY *** //
//  *** EXPERIMENTAL CODE BOUNDARY *** //
//  *** EXPERIMENTAL CODE BOUNDARY *** //
//  *** EXPERIMENTAL CODE BOUNDARY *** //
//  *** EXPERIMENTAL CODE BOUNDARY *** //
//  *** EXPERIMENTAL CODE BOUNDARY *** //
//  *** EXPERIMENTAL CODE BOUNDARY *** //
//  *** EXPERIMENTAL CODE BOUNDARY *** //
//  *** EXPERIMENTAL CODE BOUNDARY *** //
//  *** EXPERIMENTAL CODE BOUNDARY *** //
//  *** EXPERIMENTAL CODE BOUNDARY *** //

function radType( typename, defs )
{
    if( typename in radQueries ) return;
    
    radQueries[typename] = { 'n': 1, 'limn': 20, 'objs': [], 'lists': [], 'title': typename, 'pPage': 'page', 'pStart': 'start', 'pLimit': 'count', 'xSect': typename };
    for ( var i in defs )
    {
        radQueries[typename][i] = defs[i];
    }
    if( defs['socket'] ) {
		// connect handler for type data
		if( 'socket_code' in defs ) {
			socketRegister( defs['socket_code'], radSocketDataHandler, typename );
		} else {
			socketRegister( typename, radSocketDataHandler, typename );
		}
		console.log("Registered socket handler 'socket:'");
		HtmlRequestGet( defs['socket'], '', radSocketRequestHandler, typename );
        return;
    }
    if( defs['query'] && defs['query'].includes('http') ) {
    	defs['uri'] = defs['query'];
    	delete defs['query'];
    }
    if( defs['query'] ) {
        console.log("type created: " + typename + "(hooked)");
        radHook( defs['query'], defs['compiler'], defs );
    } else if( defs['refresh'] ) {
        if( defs['uri'] ) {
            defs['query'] = defs['uri'];
        }
        console.log("type created: " + typename + "(refresh)");
        radQueries[typename]['r'] = radStartPoll( defs['query'], defs['refresh'], radTypeDataHandler, typename );
    } else {
        if( defs['uri'] ) {
            defs['query'] = defs['uri'];
        }
        console.log("type created: " + typename + "(request)");
        HtmlRequestGet( defs['query'], '', radTypeDataHandler, typename );
    }
}
function radTypePoll( typename, polltime )
{
    radQueries[typename]['refresh'] = polltime;
    var rq = radQueries[typename];
    radClearPoll( rq['r'] );
    radQueries[typename]['r'] = radStartPoll( rq['query'], polltime, radTypeDataHandler, typename );
}
function radViewHandler( responsedata, divid, requestobj )
{
	var rv = radViews[divid];
	rv.status = 200;
	rv.data = responsedata;
	var viewdiv = gE(divid);
	viewdiv.innerHTML = responsedata;
}
var socket_wait_timer = -1;
var socket_typenames = [];
function radSocketReopen( typename )
{
	var defs = radQueries[typename];
    HtmlRequestGet( defs['socket'], '', radSocketRequestHandler, typename );
}

function radSocketRequestHandler( responsedata, typename, requestobj )
{
	var rq = radQueries[typename];
	console.log("Socket request for " + typename + ": ", requestobj, responsedata);
	var resobj = JSON.parse(responsedata);
	if( resobj.status != 'ok' ) {
		console.warn("Invalid socket response: ", resobj);
		return;
	}
	if( typeof wsSock == 'undefined' ) {
		console.log("Socket handler not registered - waiting for socket library include..");
		if( socket_wait_timer == -1 ) {
			socket_typenames = [typename];
			socket_wait_timer = setInterval("retryConnectSocketHandler()", 1000);
		} else {
			socket_typenames.push(typename);
		}
	}
}
function retryConnectSocketHandler( typenames ) {
	if( typeof wsSock == 'undefined' ) return;
	/*
	var rq, tn;
	
	for( var i=0; i < socket_typenames.length; ++i ) {
		tn = socket_typenames[i];
		rq = radQueries[tn];
		if( 'socket_code' in rq ) {
			socketRegister( rq['socket_code'], radSocketDataHandler, tn );
		} else {
			socketRegister( 'data', radSocketDataHandler, tn );
		}
	}
	*/
	socket_typenames = [];
	clearInterval(socket_wait_timer);
	socket_wait_timer=-1;
}
function radSocketDataHandler( event, code, typename )
{
	var rq = radQueries[typename];
	console.log("socket: ", event, code, typename);
    if( rq['datacb'] ) {
        var fc = rq['datacb'];
        if( typeof fc == 'string' )
            fc = eval(fc);
        fc( JSON.parse(event['data']), rq );
    } else {
        radCStore( rq['dataname'], JSON.parse(event['data'])['event'] );
    }
}
function radTypeDataHandler( responsedata, typename, requestobj )
{
    var rq = radQueries[typename];
    if( 'r' in rq && rq.r in rad_polls ) {
        var poll = rad_polls[ rq.r ];
        if( 'refresh' in poll && poll.refresh.indexOf("#") != -1 ) {
            radUpdatePoll(rq.r);
        }
    }
    
    var data;
    if( responsedata == null || responsedata === 0 ) {
        data = null;
    } else {
        if( typeof responsedata == 'string' ) {
            data = JSON.parse(responsedata);
        } else {
            data = responsedata;
        }
        
        if( 'error' in data ) {
            console.error(data.error);
        }
        if( 'statuslog' in data ) {
            console.log(data.log);
        }
        if( 'status' in data ) {
            data = data['data'];
        }
    }

    if( rq['datacb'] ) {
        var fc = rq['datacb'];
        if( typeof fc == 'string' )
            fc = eval(fc);
        fc( data, rq );
    } else {
        radCStore( rq['dataname'], data);
    }
}
function radParseMath( div, sMath )
{
	var a;
	try {
		sMath = sMath.replace(/[^-()\d*+\/.]/g, '');
		a = eval(sMath);
	} catch( err ) {
		console.warn( "radParseMath: error (" + sMath + ")", err );
		throw err;
	}
    return a;
}
function radParseAnyway( div, sMath )
{
//    sMath = sMath.replace(/[^-()\d*+\/.]/g, '');
	var a;
	try {
		a = eval(sMath);
	} catch( err ) {
		console.warn( "radParseAnyway: error (" + sMath + ")", err.message );
		throw err;
	}
	return a;
}

var rad_polls = {};
function radPoll( id )
{
    var poll = rad_polls[id];
    
    HtmlRequest( radTranslate(poll['uri']), '', poll['cb'], radTranslate(poll['data']) );
}
function radClearPoll( id )
{
    clearInterval( rad_polls[id].timehandler );
    delete rad_polls[id];
}
function radClearPolls( url )
{
    var i;
    var rkeys = [];
    for( i in rad_polls ) {
        rkeys.push(i);
    }
    for( j=0; j<rkeys.length; j++ ) {
        i = rkeys[j];
        if( rad_polls[i].query == url ) {
            clearInterval( rad_polls[i].timehandler );
            delete rad_polls[i];
        }
    }
}
function radStartPoll( url, refresh_seconds, handler, data )
{
    var r=randStr(5);
    var poll = { 'uri': url, 'cb': handler, 'id': r, 'data': data, 'refresh': refresh_seconds };
    var sec_now = radTranslate(refresh_seconds);
    poll.timehandler = setInterval( 'radPoll("' + r + '")', sec_now * 1000 );
    rad_polls[r] = poll;
    radTypeDataHandler(0, data); // initialize
    
    radPoll(r);
    return r;
}
function radUpdatePoll( r )
{
    var poll = rad_polls[r];
    var sec_now = radTranslate( poll['refresh'] );
    clearInterval( rad_polls[id].timehandler );
    poll.timehandler = setInterval( 'radPoll("' + r + '")', sec_now * 1000 );
}

/*

warning... this is still in development... yes you read it right... you're risking your life by continuing to read this code without proper protection.




radMaskType('users', {
    'password': -1 || 'password': 'hide' || 'password': false,
    'id': 0 || 'id': 'id',
    //'name': 1, //default
    'rank': { 'type': 'link', 'source': 'ranks', 'key': 'id', 'value': 'title' },
    'photo': { 'type': 'image', 'size': 'full', 'ref': 'user_photo' },
    'icon': { 'type': 'image', 'size': 'thumbnail', 'ref': 'user_photo' },
    //'photos': { 'type': 'list', 'source': 'users.*.photos' }, //default for detected array
    //'profile': { 'type': 'object', 'source': 'users.*.profile' }, //default for detected hash
}
*/
/*
-- default object methodology --
=> object list names indicate type ['items', 'users.*.photos']
id, ident, gid => object list reference id



*/
function radSetContent( divid, template, root )
{
    var dv = gE(divid);

    clearNode(dv);
    blitzTemplate(dv, template, root);
}

function radMaskType( typename, ms )
{
    radTypemasks[typename] = ms;
}
var radScanned = {};
function radAutoTemp( mode, root, cls ) // PS this is never used. Enjoy
{
    // omfg massive function get ready to overload, registers:
    var found, str, dv, dvx, dvy;

    // load object:
    var obj = radVar(root);

    // locate type information:
    var rx = root.split('.'), pathroot = '';
    for ( var i = 0; i < rx.length - 1; ++i )
    {
        if ( !isNaN(rx[i]) )
        {
            pathroot += ".*";
        }
        else
        {
            found = false;
            for ( var j in radTypemasks )
            {
                if ( j.substr(0, pathroot.length + 2) == pathroot + ".*" )
                {
                    pathroot += ".*";
                    found = true;
                    break;
                }
            }
            if ( !found )
            {
                pathroot += rx[i];
            }
        }
    }

    // check for default or pregenerated template:
    var rso;
    var tplname = mode + "_" + type + "_" + cls;
    if ( tplname in radTemps )
    {
        // compare object to radScanned[pathroot]
        var rsx = radScanned[pathroot];
        rso = radTypemasks[pathroot];
        found = true;
        for ( i in obj )
        {
            if ( !(i in rsx) )
            {
                found = false;
                break;
            }
            //! this code can be improved to fit many more standard methods
            //~ what does this comment mean?
             // definitely must scan vs any supplied defaults, what fun would we be if we didn't
            if ( i in rso )
            {
                if ( typeof rso[i] == 'object' )
                {
                    if ( typeof rsx[i] != 'object' )
                    {
                        found = false;
                        break;
                    }
                    if ( rso[i]['type'] != rsx[i]['type'] )
                    {
                        found = false;
                        break;
                    }
                }
                else if ( rso[i] != rsx[i] )
                {
                    found = false;
                    break;
                }
                continue;
            }
            if ( typeof obj[i] == 'object' )
            {
                if ( 'length' in obj[i] )
                {
                    if ( rso[i]['type'] != 'object' )
                    {
                        found = false;
                        break;
                    }
                }
                else 
                {
                    if ( rso[i]['type'] != 'list' )
                    {
                        found = false;
                        break;
                    }
                }
            }
        }
        if ( found )
        {
            dv = cDiv();
            dv.setAttribute('xCast', tplname);
            dv.setAttribute('xRoot', root);
            //! ?radSchedLoad(dv);
            return dv;
        }
    }

    //! scan type into radScanned[pathroot]
    rso = {};
    for ( i in obj )
    {
        if ( i in radTypemasks[pathroot] )
        {
            rso[ i ] = radTypemasks[pathroot][i];
            continue;
        }
        if ( typeof obj[i] == 'object' )
        {
            if ( 'length' in obj[i] )
            {
                rso[ i ] = { 'type': 'object', 'source': pathroot + ".*." + i };
            }
            else
            {
                rso[ i ] = { 'type': 'list', 'source': pathroot + ".*." + i };
            }
        }
        else
        { // scalar:
            if ( i == 'password' || i == 'passwd' || i == 'pass' )
            {
                rso[ i ] = false;
//          }
//          else if ( i == 'id' || i == 'ident' || i == 'gid' )
//          { //! or, don't do this,...
//              rso[ i ] = 'id';
            }
            else
            {
                rso[ i ] = true;
            }
        }
    }
    radScanned[pathroot] = rso;

    //'photos': { 'type': 'list', 'source': 'users.*.photos' }, //default for detected array
    //'profile': { 'type': 'object', 'source': 'users.*.profile' }, //default for detected hash

    //! generate templates
    tplname += "_" + root;
    dv = cDiv();
    dv.setAttribute('xTemplate', tplname);
    dv.setAttribute('xRoot', root);
    switch( mode )
    {
        case 'icon':
            // find an image:
            found = str = false;
            for ( i in rso )
            {
                if ( typeof rso[i] == 'object' )
                {
                    if ( rso[i]['type'] == 'image' )
                    {
                        if ( rso[i]['size'] == 'thumbnail' )
                        {
                            found = i;
                        }
                        else
                        {
                            str = i;
                        }
                    }
                }
            }
            if ( found === false )
            {
                found = str;
            }
            //! place the image:
            if ( found === false )
            {
                dvx = cDivCl('');
                aC(dv, dvx);
            }
            else
            {
                dvx = cDivCl('');
                aC(dv, dvx);
            }
            break;
        case 'line':
            //! find a string by approximate length
            var mx = {};
            for ( i in rso )
            {
                if ( typeof rso[i] == 'object' || rso[i] === false || !(i in obj) || !('length' in obj[i]) )
                {
                    continue;
                }

                //! generate divs
                mx[i] = obj[i].length;
            }
            found = false;
            for ( i in mx )
            { //+ just use the first one for now, this could be optimized though
                if ( mx[i] < 120 )
                {
                    //! generate divs
                    found = true;
                    break;
                }
            }
            if ( !found ) 
            {
                //! generate divs
            }
            break;
        case 'para':
            //! find an icon and a few strings
            for ( i in rso )
            {
                if ( !(i in obj) || typeof rso[i] == 'object' || rso[i] === false )
                {
                    continue;
                }
                //! generate divs
            }
            found = false;
            for ( i in mx )
            { //+ just use the first one for now, this could be optimized though
                if ( mx[i] < 120 )
                {
                    //! generate divs
                    found = true;
                    break;
                }
            }
            if ( !found )
            {
                //! generate divs
            }
            break;
        case 'view':
            //! list item strings and object titles as lines
            for ( i in rso )
            {
                if ( !(i in obj) || typeof rso[i] == 'object' || rso[i] === false )
                {
                    continue;
                }

                //! generate divs
            }
            break;
        case 'full':
            //! list all item type data and nest subs
            for ( i in rso )
            {
                if ( typeof rso[i] == 'object' )
                {
                    //! generate divs
                    continue;
                }
                if ( rso[i] === false ) 
                {
                    continue;
                }
                //! generate divs
            }
            break;
        case 'form':
            //! as full but in a form using xForm=root
            break;
    }

    return dv;
}
function radTypeList( typename, listname, indtype )
{
    if ( !(typename in radQueries) )
    {
        radType(typename);
    }
    var nob = { 'list': listname, 'index': indtype };
    radQueries[typename].lists.push(nob);
    if ( !(listname in radLists) )
    {
        radLists[listname] = typename;
    }
}
function radNewID( listn )
{
    var n;

    n = -5;
    while( radVar(listn + "." + n) != null )
    {
        n--;
    }
    return n;
}
function obfNumbers( str )
{
    var i, c;
    var ostr = "";
    for ( i = 0; i < str.length; ++i )
    {
        c = str.substr(i, 1);
        if ( !isNaN(c) )
        {
            ostr += "_";
        }
        else
        {
            ostr += c;
        }
    }
    return ostr;
}
function renderToRegion( regn, roots )
{
	if ( !(regn in radRegions) )
	{
		console.warn("Can't add to " + regn + ": region does not exist");
		return;
    }
    var ireg = radRegions[regn];
    var i, cdiv, inx;
    var rox, roxp;

    for ( i = 0; i < roots.length; ++i )
    {
        inx = roots[i].lastIndexOf(".");
        rox = obfNumbers(roots[i].substring(0, inx-1)); //! possibly use regex's for radLists' keys instead?
        if ( !(rox in radLists) )
        {
            console.log("Can't render from list " + rox);
            continue;
        }
        roxp = roots[i].substr(inx);

        ireq.xDefs.push( roots[i] );

//      cdiv = copyTemplate(ireq.xClass + "." + ireq.xFrame
    }   
}
function renderRegion( regn )
{
    var ireq = radRegions[regn];
    var i;

    for ( i = 0; i < ireq.xDefs; ++i )
    {
    }
}


//  *** EXPERIMENTAL CODE BOUNDARY *** //
//  *** EXPERIMENTAL CODE BOUNDARY *** //
//  *** EXPERIMENTAL CODE BOUNDARY *** //
//  *** EXPERIMENTAL CODE BOUNDARY *** //
//  *** EXPERIMENTAL CODE BOUNDARY *** //
//  *** EXPERIMENTAL CODE BOUNDARY *** //
//  *** EXPERIMENTAL CODE BOUNDARY *** //
//  *** EXPERIMENTAL CODE BOUNDARY *** //
//  *** EXPERIMENTAL CODE BOUNDARY *** //
//  *** EXPERIMENTAL CODE BOUNDARY *** //
//  *** EXPERIMENTAL CODE BOUNDARY *** //




























/*

  = store divs by root in radNest structural mirror
 - radFactorable( root, depth )
  - root="items", depth=1
   = store radRoots[items.*] = [divs]
  - root="cdesk", depth=0
   = store radRoots[cdesk] = [divs]
  - root="userlist", depth=0
   = store radRoots[userlist] = [divs]
  - root="userlist", depth=2
   = store radRoots[userlist.*userid.*] = [divs]
 - radRefactor( aSearch, aReplace )
 */
function radFactorable( str, depth )
{
    if ( !isValid(depth) ) depth = 1;
    radRootables.push( [str, depth] );
}
function radFactor( root, node )
{
    var i, j, cx = chrCount(root, "."), ex;
    for ( i = 0; i < radRootables.length; ++i )
    {
        if ( cx != radRootables[i][1] || root.indexOf( radRootables[i][0] ) !== 0 )
        {
            continue;
        }

        if ( !(i in radRoots) )
        {
            radRoots[i] = {};
        }
        if ( !(root in radRoots[i]) )
        {
            radRoots[i][root] = [];
        }
        ex = radRoots[i][root];

        for ( j = 0; j < ex.length; ++j )
        {
            if ( isAncestorOf( node, ex[j] ) ) // parent is registered
            {
                return;
            }
        }
        radRoots[i][root].push(node);
    }
    return;
}
function radRefactor( aSearch, aReplace )
{
    // aSearch = {parms}: root
    // aReplace = {parms}: root, !*
    var nodes = [], i, j, k, ii;
    var root = null, dep = 1, ident = "";

    for ( k in aSearch )
    {
        if ( k == 'root' )
        {
            root = aSearch[k];
        }
        else if ( k == 'depth' )
        {
            dep = aSearch[k];
        }
        else if ( k == 'ident' )
        {
            ident = aSearch[k];
        }
    }
    if ( root == null )
    {
        return false;
    }

    for ( i = 0; i < radRootables.length; ++i )
    {
        if ( radRootables[i][0] == root && radRootables[i][1] == dep )
        {
            if ( ident == "" )
            {
                for ( j in radRoots[i] )
                {
                    for ( ii in radRoots[i][j] )
                    {
                        nodes.push( radRoots[i][j][ii] );
                    }
                }
            }
            else
            {
                for ( ii in radRoots[i][ident] )
                {
                    nodes.push( radRoots[i][ident][ii] );
                }
            }
        }
    }

    if ( 'root' in aReplace )
    {
        var oparm = root, parm = aReplace.root;
        var ii, rw_keys = Object.keys(radWatches), hl_oldwatch = [];
        for ( ii = 0; ii < rw_keys.length; ++ii )
        {
            i = rw_keys[ii];
            if ( parm.indexOf(i) == 0 || i.indexOf(parm) == 0 )
            {
                for ( j = 0; j < radWatches[i].length; j++ )
                {
                    hl_oldwatch.push( radWatches[i][j] );
                }
                delete radWatches[i];
                rw_keys.splice(ii, 1);
                ii--;
            }
        }
        for ( ii = 0; ii < rw_keys.length; ++ii )
        {
            i = rw_keys[ii];
            if( i == '' ) continue;
            if ( oparm.indexOf(i) == 0 || i.indexOf(oparm) == 0 )
            {
                for ( j = 0; j < hl_oldwatch.length; ++j )
                {
                    radWatches[i].push( hl_oldwatch[j] );
                }
            }
        }
        
        // repeat for radWatch2...
        rw_keys = Object.keys(radWatch2);
        hl_oldwatch = [];
        for ( ii = 0; ii < rw_keys.length; ++ii )
        {
            i = rw_keys[ii];
            if ( parm.indexOf(i) == 0 || i.indexOf(parm) == 0 )
            {
                for ( j = 0; j < radWatch2[i].length; j++ )
                {
                    hl_oldwatch.push( radWatch2[i][j] );
                }
                delete radWatch2[i];
                rw_keys.splice(ii, 1);
                ii--;
            }
        }
        for ( ii = 0; ii < rw_keys.length; ++ii )
        {
            i = rw_keys[ii];
            if( i == '' ) continue;
            if ( oparm.indexOf(i) == 0 || i.indexOf(oparm) == 0 )
            {
                for ( j = 0; j < hl_oldwatch.length; ++j )
                {
                    radWatch2[i].push( hl_oldwatch[j] );
                }
            }
        }
        
        // repeat for radWatch3...
        rw_keys = Object.keys(radWatch3);
        hl_oldwatch = [];
        for ( ii = 0; ii < rw_keys.length; ++ii )
        {
            i = rw_keys[ii];
            if ( parm.indexOf(i) == 0 || i.indexOf(parm) == 0 )
            {
                for ( j = 0; j < radWatch3[i].length; j++ )
                {
                    hl_oldwatch.push( radWatch3[i][j] );
                }
                delete radWatch3[i];
                rw_keys.splice(ii, 1);
                ii--;
            }
        }
        for ( ii = 0; ii < rw_keys.length; ++ii )
        {
            i = rw_keys[ii];
            if( i == '' ) continue;
            if ( oparm.indexOf(i) == 0 || i.indexOf(oparm) == 0 )
            {
                for ( j = 0; j < hl_oldwatch.length; ++j )
                {
                    radWatch3[i].push( hl_oldwatch[j] );
                }
            }
        }
    }

    for ( i = 0; i < nodes.length; ++i )
    {
        if ( 'root' in aReplace )
        {
            nodes[i].xroot = nodes[i].croot = aReplace.root;
        }
        if ( 'className' in aReplace )
        {
            nodes[i].className = aReplace.className;
            radScanClass(nodes[i]);
        }
        if ( 'id' in aReplace )
        {
            nodes[i].id = nodes[i].xId = aReplace.id;
        }
        if ( 'xForm' in aReplace )
        {
            nodes[i].xForm = aReplace.xForm;
        }
        if ( 'src' in aReplace )
        {
            nodes[i].src = aReplace.src;
        }
        if ( 'value' in aReplace )
        {
            nodes[i].value = aReplace.value;
        }
        if ( 'name' in aReplace )
        {
            nodes[i].name = aReplace.name;
        }
        radSchedLoad(nodes[i]);
    }
}
function dbg(msg, errobj)
{
    if ( isValid(errobj) )
    {
        msg = msg + ": " + fPrint(errobj, 3);
    }
    dbgLog.push(msg);
//  startStatus("debug", msg);
}
function registerRad( fnc )
{
    radLoadCB[ radLoadCB.length ] = fnc;
}
function registerRadPost( fnc )
{
    finRadCB[ finRadCB.length ] = fnc;
}
function schedRad()
{
    setTimeout('radLoad()', 1);
}
var rad_first_time = 1;

function radLoad()
{
    if ( radMute )
        return;

    radRunning++;

    if ( rad_first_time == 1 )
    {
    	if( document.head.hasAttribute('splash') ) {
            /*
            var ms = gE("mainscroll");
            if( ms ) {
            	ms.style.display = 'none';
            	ms.setAttribute('keepscan', 1);
            }
            */
    	}
        rad_first_time = 2;
    }

    winSize();

    for ( var i = 0; i < radLoadCB.length; ++i )
        radLoadCB[i]();

    loadPage();
    updatePage();
}
function finUpdPage()
{
    radRunning--;
    radPost();
    
    if( document.head.hasAttribute('splash') ) {
    	var x = document.head.getAttribute('splash');
    	if( typeof x != 'string' || x == '' ) x = 'splashpage';
    	
        var osi = gE(x);
        osi.style.display = 'none';
//        var msi = gE("mainscroll");
//        msi.style.display = 'block';
    }
    //document.body.style.display='block';
}
function radPost()
{
    var i;

    for ( i = 0; i < finRadCB.length; ++i )
        finRadCB[i]();
}

function radChanged(path){radChange(path);}


function radChange( path )
{
    for( var i in radWatches )
    {
        if( path.indexOf(i) == 0 || i.indexOf(path) == 0 ) // double prefix test
        {
            radSchedLoadDivIds(radWatches[i]);
        }
    }
    var epath = path.split(/./);
    var rpath;
    for( var i in radWatch2 ) // path near i
    {
        rpath = i.split(/./);
        if( epath.length < rpath.length ) continue; // sanity test
        if( epath.length > rpath.length + 2 ) continue; // refine to nearby results (not obj.properties.list.n, only obj.name or obj.items.count)
        
        if( path.indexOf(i) == 0 ) // narrower test
        {
            radSchedLoadDivIds(radWatch2[i]);
        }
    }
    
    for( var i in radWatch3 ) { // path < i, i ~> path
        if( i.indexOf(path) == 0 ) // path < i
        {
            rpath = i.split(/./);
            var j, obj, found=true;
            obj = radVar(path);
            for( j=epath.length; j<rpath.length; j++ ) {
                if( rpath[j] in obj ) {
                    obj = obj[ rpath[j] ];
                } else {
                    found = false;
                    break;
                }
            }
            if( found )
                radSchedLoadDivIds(radWatch3[i]);
        }
    }


    
    for( var i in radWHooks )
    {
        if( path.indexOf(i) == 0 || i.indexOf(path) == 0 ) // double prefix test
        {
            for( var j in radWHooks[i] ) {
                radWHooks[i][j][0](radWHooks[i][j][1], path);
            }
        }
    }
}
function radCXStore( parstr, val )
{
    if ( !isValid(parstr) ) return;
    var i, exp = parstr.split(/\./);
    var bnest = radNest;
    for ( i = 0; i < exp.length-1; ++i )
    {
        if ( !exp[i] in bnest || typeof bnest[exp[i]] == 'undefined' ) 
        {
            radStoreNX( radNest, parstr, val );
            return;
        }
        bnest = bnest[exp[i]];
    }
    if ( i >= 0 && exp[i] in bnest )
    {
        delete bnest[exp[i]];
    }
    radStoreNX( radNest, parstr, val );
}
function radCStore( parstr, val )
{
    if ( !isValid(parstr) ) return;
    var i, exp = parstr.split(/\./);
    var bnest = radNest;
    for ( i = 0; i < exp.length-1; ++i )
    {
        if ( !exp[i] in bnest || typeof bnest[exp[i]] == 'undefined' ) 
        {
            radStoreNX( radNest, parstr, val );
            radChange(parstr);
            return;
        }
        bnest = bnest[exp[i]];
    }
    if ( i >= 0 && typeof bnest == 'object' && exp[i] in bnest )
    {
        delete bnest[exp[i]];
    }
    radStoreNX( radNest, parstr, val );
    radChange(parstr);
}
function radStore( parm, val )
{
    radStoreNX( radNest, parm, val );
    radChange(parm);
}

function radClear( parstr )
{
    if ( !isValid(parstr) ) return;
    var i, exp = parstr.split(/\./);
    var bnest = radNest;
    for ( i = 0; i < exp.length-1; ++i )
    {
        if ( !exp[i] in bnest || typeof bnest[exp[i]] == 'undefined' ) 
        {
            return;
        }
        bnest = bnest[exp[i]];
    }
    if ( i >= 0 && exp[i] in bnest )
    {
        delete bnest[exp[i]];
    }
    radChange(parstr);
}
function radXClear( parstr )
{
    if ( !isValid(parstr) ) return;
    var i, exp = parstr.split(/\./);
    var bnest = radNest;
    for ( i = 0; i < exp.length-1; ++i )
    {
        if ( !exp[i] in bnest || typeof bnest[exp[i]] == 'undefined' ) 
        {
            return;
        }
        bnest = bnest[exp[i]];
    }
    if ( i >= 0 && exp[i] in bnest )
    {
        delete bnest[exp[i]];
    }
}
function radClearSet( parstrs )
{
    var parstr, i, exp, bnest;
    for ( parstr in parstrs )
    {
        if ( !isValid(parstr) ) 
        {
            continue;
        }
        exp = parstr.split(/\./);
        bnest = radNest;
        for ( i = 0; i < exp.length-1; ++i )
        {
            if ( !exp[i] in bnest || typeof bnest[exp[i]] == 'undefined' ) 
            {
                return;
            }
            bnest = bnest[exp[i]];
        }
        if ( i >= 0 && exp[i] in bnest )
        {
            delete bnest[exp[i]];
        }
        radChange(parstr);
    }
}
function radHas( parstr )
{
    return ( radVar(parstr) != null );
}

var radUseEmpty = false;
function radVar( varn, xbase )
{
    var rv, vx;
    var temproot="";

    if ( !isValid(xbase) )
    {
        xbase = radNode;
    }
    if( !isValid(xbase) ) {
        temproot = "";
    } else if( typeof xbase.nodeName == 'undefined' ) {
        temproot = xbase;
    } else {
        temproot = xbase.croot;
    }
    
    if( !isValid(varn) ) {
        return null;
    }
    
    if( varn == 'root' ) {
        if ( !isValid(radNode) )
            return "";
        if( typeof radNode == 'string' ) return radNode;
        return radNode.croot;
    }

    if ( varn == 'seed' && isValid(xbase.xSeed) )
    {
        return xbase.xSeed;
    }
    if ( varn.substr(0, 1) == "." )
    {
        if ( isValid(temproot) && temproot != "" )
        {
            rv = temproot + varn;
        }
        else
        {
            return "template-error: " + varn;
        }
    }
    else
    {
        vx = radVarX(varn);
        if ( vx != null )
        {
            return vx;
        }
        rv = temproot + "." + varn;
    }
    return radVarX(rv);
}

var sched_divs = [];
var schednx_timeout = -1;
function radSchedLoadFin()
{
    var i, dc;
    schednx_timeout=-1;
    while( sched_divs.length > 0 ) {
        dc = sched_divs;

        sched_divs = [];
        for ( i = 0; i < dc.length; ++i )
        {
            radLoadDiv( dc[i] );
        }
    }
    radPost();
}
function radSchedLoad( div )
{
    if ( sched_divs.indexOf( div ) >= 0 )
    {
        return;
    }
    sched_divs.push(div);
    if ( schednx_timeout != -1 )
    {
        clearTimeout(schednx_timeout);
    }
    schednx_timeout = setTimeout(radSchedLoadFin, 100);
}
function radSchedLoadDivs( divs )
{
    if ( schednx_timeout != -1 )
    {
        clearTimeout(schednx_timeout);
    }
    for( var i=0; i<divs.length; i++ ) {
        var div = divs[i];
        if( !div ) continue;
        if ( sched_divs.indexOf( div ) >= 0 )
            continue;
        sched_divs.push(div);
    }
    schednx_timeout = setTimeout(radSchedLoadFin, 100);
}
function radSchedLoadDivIds( divs )
{
    if ( schednx_timeout != -1 )
    {
        clearTimeout(schednx_timeout);
    }

    for( var i=0; i<divs.length; i++ ) {
        var div = gE(divs[i]);
        if( !div ) continue;
        if ( sched_divs.indexOf( div ) >= 0 )
            continue;
        sched_divs.push(div);
    }
    schednx_timeout = setTimeout(radSchedLoadFin, 100);
}



function radLoadDivs(divs)
{
    var div;
    while( divs.length > 0 ) {
        div = divs.shift();
        radLoadDiv( div );
    }
    radPost();
}
function radLoadSect(sect)
{
    if ( !(sect in radSects) )
    {
        return;
    }

    if ( sect != 'status' )
    {
        console.log("radLoadSect(" + sect + ")");
    }

    var i, ix = radSects[sect].slice(0);

    for ( i = 0; i < ix.length; ++i )
    {
        radLoadDiv( ix[i] );
    }
    radPost();
}
function radLoadSects(sects)
{
    var i;
    var divs = [];

    for ( i = 0; i < sects.length; ++i )
    {
        sect = sects[i];
        if ( !(sects[i] in radSects) ) 
        {
            continue;
        }
        for ( j = 0; j < radSects[sect].length; ++j )
        {
            if ( !searchForParent(divs, radSects[sect][j]) )
            {
                divs[ divs.length ] = radSects[sect][j];
            }
        }
    }
    for ( i = 0; i < divs.length; ++i )
    {
        radLoadDiv( divs[i] );
    }
    radPost();
}









//  *** EXPERIMENTAL CODE BOUNDARY *** //
//  *** EXPERIMENTAL CODE BOUNDARY *** //
//  *** EXPERIMENTAL CODE BOUNDARY *** //
//  *** EXPERIMENTAL CODE BOUNDARY *** //
//  *** EXPERIMENTAL CODE BOUNDARY *** //
//  *** EXPERIMENTAL CODE BOUNDARY *** //
//  *** EXPERIMENTAL CODE BOUNDARY *** //
//  *** EXPERIMENTAL CODE BOUNDARY *** //
//  *** EXPERIMENTAL CODE BOUNDARY *** //
//  *** EXPERIMENTAL CODE BOUNDARY *** //
//  *** EXPERIMENTAL CODE BOUNDARY *** //
function radLoadData( dataname, pageno, insist )
{
    if ( !isValid(insist) && (dataname + pageno) in radDataSafe )
    {
        return;
    }
    radDataSafe[ (dataname + pageno) ] = true;
    radQueries[dataname].n = pageno;
    setTimeout('p2RadLoadData("' + dataname + '")', 1);
}
function p2RadLoadData( dataname )
{
    var rQ = radQueries[dataname];
    var dt = (('title' in rQ) ? rQ.title : dataname);
    if( pStart in rQ )
        runPull( rQ.query + "&" + rQ.pStart + "=" + (rQ.n*rQ.pLimit) + "&" + rQ.pLimit + "=" + rQ.limn, "Loading " + dt );
    else
        runPull( rQ.query + "&" + rQ.pPage + "=" + rQ.n + "&" + rQ.pLimit + "=" + rQ.limn, "Loading " + dt );
}



/*
* radIncrLoad
* load data into radDb['vname'] at page offset/pagelength
* store index to data[idfield] in reftab
*/
function radIncrLoad( vname, data, offset, reftab, idfield )
{
    var ntab, otab, on;

    if ( !isValid(idfield) )
    {
        idfield = "id";
    }

    otab = radVarList(vname);
    if ( otab == null )
    {
        otab = [];
    }
    ntab = reftab?radVar(reftab):{};
    if ( !ntab )
    {
        ntab = {};
    }
    on = offset < 0?0:offset;
    for ( i = 0; i < data.length; ++i)
    {
        if ( data[i][idfield] in ntab )
        {
            continue;
        }
        if ( radHas( vname + "." + (on + i) ) )
        {
            radClear( vname + '.' + (on + i) );
        }
        otab[ on + i ] = data[i];
        ntab[ data[i][idfield] ] = on + i;
    }
    radStore(vname, otab);
    if (reftab)
    {
        radStore(reftab, ntab);
    }
}
/*
* radRandLoad
* load obj into radDb['vname'] at index 0
* or overwrite if existing value in reftab
*/
function radRandLoad( vname, obj, reftab, idfield )
{
    var ntab, otab, on;
    var i;

    if ( !isValid(idfield) )
    {
        idfield = "id";
    }

    otab = radVarList(vname);
    if ( !isValid(otab) )
    {
        console.log("table " + vname + " = empty");
        otab = [];
    }
    ntab = reftab?radVar(reftab):{};
    if ( !ntab )
    {
        ntab = {};
    }
    if ( obj[idfield] in ntab )
    {
        // existing location found
        radStore( vname + "." + ntab[obj[idfield]], obj );
    }
    else
    {
        otab.unshift(obj);
        radClear(vname);
        radStore(vname, otab);
        radCompileIndex(vname, reftab, idfield);
    }
}
function radUnLoad( vname, id, reftab, idfield )
{
    var ntab, otab, on;
    var i;

    if ( !isValid(idfield) )
    {
        idfield = "id";
    }
    otab = radVarList(vname);
    if ( !isValid(otab) )
    {
        return;
    }
    ntab = reftab?radVar(reftab):{};
    if ( !isValid(ntab) )
    {
        return;
    }
    if ( !(id in ntab) )
    {
        return;
    }

    otab.splice(ntab[id], 1);
    radClear(vname);
    radStore(vname, otab);
    radCompileIndex(vname, reftab, idfield);
}
function radCompileIndex( src, tgt, idfield )
{
    var ntab, otab, i;

    if ( !isValid(idfield) )
    {
        idfield = "id";
    }
    otab = radVar(src);
    if ( !otab )
    {
        return;
    }
    
    ntab = {};
    for ( i = 0; i < otab.length; ++i )
    {
        ntab[ otab[i][idfield] ] = i;
    }
    radClear(tgt);
    radStore(tgt, ntab);
}



function radPage( qry, n )
{
    radQueries[qry].n = n;
    if ( radQueries[qry].cb )
    {
        radQueries[qry].cb(qry, n);
    }
    if ( typeof radQueries[qry].xSect != 'undefined' )
    {
        radLoadSect(radQueries[qry].xSect);
    }
}
function radNextPage( qry )
{
    radPage(qry, radQueries[qry].n + 1);
}
function radPrevPage( qry )
{
    if ( radQueries[qry].n > 1 )
    {
        radPage(qry, radQueries[qry].n-1);
    }
}

//  *** EXPERIMENTAL CODE BOUNDARY *** //
//  *** EXPERIMENTAL CODE BOUNDARY *** //
//  *** EXPERIMENTAL CODE BOUNDARY *** //
//  *** EXPERIMENTAL CODE BOUNDARY *** //
//  *** EXPERIMENTAL CODE BOUNDARY *** //
//  *** EXPERIMENTAL CODE BOUNDARY *** //
//  *** EXPERIMENTAL CODE BOUNDARY *** //
//  *** EXPERIMENTAL CODE BOUNDARY *** //
//  *** EXPERIMENTAL CODE BOUNDARY *** //
//  *** EXPERIMENTAL CODE BOUNDARY *** //
//  *** EXPERIMENTAL CODE BOUNDARY *** //












function radVarX( srch )
{
    var exp = srch.split(/\./);
    var exp0;
    var i, bnest = radNest;
    var bld, nc;
    
    switch( exp[0] ) {
    case 'proot':
        if( exp.length <= 1 ) {
            return radRoot( radNode.parentNode );
        }
        break;
    case 'root':
        if( exp.length <= 1 ) {
            return radRoot( radNode );            
        }
    case '':
        var tgt = radRoot( radNode );
        if( isValid(tgt) && tgt != "" && tgt.substr(0,1) != '.' ) {
            //console.log(tgt);
            bnest = radVar( tgt );
            exp.shift();
            srch = exp.join(".");
        } else {
            return null;
        }
        break;
    }

    //! check in params of parent nodes
    if ( isValid(radNode) && typeof radNode != 'string' )// && srch.substr(0, 1) == '@'
    {       
        for ( nc = radNode; nc; nc = nc.parentNode )
        {
            if ( typeof nc.params != 'undefined' && srch in nc.params )
            {
                return nc.params[srch];
            }
        }
    }

    for ( i = 0; i < exp.length; ++i )
    {
        if ( typeof bnest != 'object' && typeof bnest != 'string' && typeof bnest != 'Array' )
        {
            bnest = null;
//          console.warn("wrong type: " + srch + ": " + exp.length + ": " + typeof bnest);
        }
        if ( i == exp.length-1 )
        {
            switch( exp[i] )
            {
                case 'fields': case 'keys':
                    return bnest.keys();
                case 'count': case 'length':
                    if ( typeof bnest.length == 'undefined' )
                        return bnest.keys().length;
                    else
                        return bnest.length;
                case 'cap': case 'capitalize':
                    return bnest.substr(0, 1).toUpperCase() + bnest.substr(1);
                case 'upper':
                    return bnest.toUpperCase();
                case 'lower':
                    return bnest.toLowerCase();
            }
        }
        if ( exp[i].substr(0, 1) == '!' )
        {
            bnest = eval("bnest." + exp[i].substr(1) + "()");
        }
        else if ( exp[i].substr(0, 1) == '~' )
        {
            bnest = eval( exp[i].substr(1).replace('obj', 'bnest') );
        }
        else if ( exp[i].indexOf("(") != -1 )
        {
            bnest = eval("bnest." + exp[i]);
        }
        else if ( bnest !== null && (exp[i] in bnest) )
        {
            bnest = bnest[ exp[i] ];
        } else {
            bnest = null;
        }
    }
    return bnest;
}

function radQt( varx, xbase )
{
    if ( varx.substr(0, 1) != "#" )
    {
        return varx;
    }
    var vx = radVar(varx.substr(1), xbase);
    return vx == null ? "" : vx;
}

function radVarList( parstr )
{
    return obj2List2(radVar(parstr));
}

function radNVarArray( srch )
{
    return radNVarX(srch);
}

var initialLoad = true;
function loadDiv( div )
{
    var i, idiv, vdiv, il, schar = [0, div];

    while( schar.length > 0 )
    {
        if ( schar.shift() == 1 )
        {
            vdiv = schar.shift();
//! this is good for loadDiv but what about doing what sizeOneDiv() does
//          if ( vdiv.nodeName == 'FORM' && ( vdiv.getAttribute('xMethod') != null ) )
//              fgenform(vdiv);
            continue;
        }
        vdiv = schar.shift();

        if ( vdiv.nodeName == "SCRIPT" )
        {
            continue;
        }
        if ( isDisabled(vdiv) )
        {
            continue;
        }

        ival = false;
        for ( i = vdiv.childNodes.length-1; i >= 0; --i )
        {
            idiv = vdiv.childNodes[i];
            if ( idiv.nodeName == "#comment" || idiv.nodeName == "script" || idiv.nodeName=='svg' )
            {
                continue;
            }

            if ( idiv.nodeName == "#text" )
            {
                if ( typeof idiv.nodeValue != 'undefined' )
                {
                    ival = idiv.nodeValue;
                }
                else
                {
                    ival = idiv.textContent;
                }

                if ( ival == "" || ival == "\n" || isAllSpacing(ival) )
                {
                    vdiv.removeChild(idiv);
                    continue;
                }

                tDiv = cE("div");
                if ( isValid(vdiv.croot) ) 
                {
                    tDiv.croot = vdiv.croot;
                }
                /*
                if ( isValid(vdiv.xroot) )
                {
                    tDiv.xroot = vdiv.xroot;
                }
                */
                tDiv.setAttribute('origcontent', ival);
                vdiv.insertBefore(tDiv, idiv);
                vdiv.removeChild(idiv);
                tDiv.origcontent = ival;
                idiv = tDiv;
                readDiv(idiv, vdiv);
                continue;
            }
            
            readDiv(idiv, vdiv);
            if ( !idiv.childNodes || idiv.childNodes.length <= 0 ) continue;
            //if ( idiv.nodeName == "textarea" ) continue;
            schar.push(0, idiv);
        }
        schar.push(1, vdiv);
    }
    initialLoad = false;
}

function searchForParent( tgts, chld )
{
    var n;
    do
    {
        if ( (n = tgts.indexOf(chld)) != -1 ) return n;
        chld = chld.parentNode;
    } while( chld );
    return false;
}
function radStoreSpec( parm, val )
{
    var exp;
    var dsc, i, c;

    if ( typeof parm.split == 'undefined' ) exp = [parm];
    else {
        dsc = "";
        exp = [];
        for ( i = 0; i < parm.length; ++i )
        {
            if ( (c = parm.substr(i, 1)) == "\\" )
            {
                i++;
                c = parm.substr(i, 1);
                if ( c == "." )
                {
                    dsc += ".";
                }
                else
                {
                    dsc += "\\" + c;
                }
                continue;
            }
            else if ( c == '.' )
            {
                if (dsc != "")
                {
                    exp.push(dsc);
                    dsc = "";
                }
            }
            else
            {
                dsc += c;
            }
        }
        if (dsc != "") exp.push(dsc);
    }
    var bnest = radNest;
    for ( i = 0; i < exp.length-1; ++i )
    {
        if ( !(exp[i] in bnest) )
        {
            bnest[exp[i]] = [];
        }
        bnest = bnest[exp[i]];
    }
    bnest[exp[i]] = val;
}
function radStoreNX( bnest, parm, val )
{
    var exp, dsc, vset;
    var i, j, vtype, vt2, c;
    var nxs = [ [bnest, parm, val] ];

//  console.log("set " + parm + " = " + val);

    while( nxs.length > 0 )
    {
        vset = nxs.shift();
        if ( typeof vset[1].split == 'undefined' ) exp = [vset[1]];
        else {
            dsc = "";
            exp = [];
            // split the parameter name('vset[1]') into parts('dsc') and write to list('exp')
            for ( i = 0; i < vset[1].length; ++i )
            {
                if ( (c = vset[1].substr(i, 1)) == "\\" )
                {
                    i++;
                    c = vset[1].substr(i, 1);
                    if ( c == "." )
                    {
                        dsc += ".";
                    }
                    else
                    {
                        dsc += "\\" + c;
                    }
                    continue;
                }
                else if ( c == '.' )
                {
                    if ( dsc != "" )
                    {
                        exp.push(dsc);
                        dsc = "";
                    }
                } else {
                    dsc += c;
                }
            }
            if ( dsc != "" )
            {
                exp.push(dsc);
            }
        }
        bnest = vset[0];
        val = vset[2];
        vtype = ( typeof val == 'object' ?
            ( Object.prototype.toString.call( val ) == '[object Array]' ? 0 : 1 ) :
            2
            );
        // 0=array, 1=object, 2=scalar

        for ( i = 0; i < exp.length; ++i )
        {
            if ( i == exp.length-1 )
            {
                if ( vtype == 2 ) // scalar
                {
                    bnest[exp[i]] = val;
                }
                else if ( vtype == 0 ) // array
                {
                    if ( !(exp[i] in bnest) )
                    {
                        bnest[exp[i]] = [];
                    }
//                  console.log("create array " + exp[i]);
                    bnest = bnest[exp[i]];
                    for ( j = 0; j < val.length; ++j )
                    {
                        nxs.push( [ bnest, j, val[j] ] );
                    }
                }
                else if ( vtype == 1 ) // object
                {
                    if ( !(exp[i] in bnest) )
                    {
                        bnest[exp[i]] = {};
                    }
//                  console.log("create object " + exp[i]);
                    bnest = bnest[exp[i]];
                    for ( j in val )
                    {
                        nxs.push( [ bnest, j, val[j] ] );
                    }
                }
            }
            else
            {
                if ( !(exp[i] in bnest) )
                {
                    bnest[exp[i]] = {};
                }
                else
                {
                    vt2 = ( typeof bnest[exp[i]] == 'object' ?
                        ( Object.prototype.toString.call( bnest[exp[i]] ) == '[object Array]' ? 0 : 1 ) :
                        2
                        );
                    if ( vt2 == 2 )
                    {
                        bnest[exp[i]] = [ bnest[exp[i]] ];
                        vt2 = 0;
                    }
                    //if ( vt2 == 0 ){ // no arrays anymore, dammit. (upgrade this using parseInt)
                    //  bnest[exp[i]] = arrayObject( bnest[exp[i]] );
                    //}
                }
                bnest = bnest[exp[i]];
            }
        }
    }
}
function arrayObject( arr )
{
    var obj = {};

    for ( var i = 0; i < arr.length; ++i )
    {
        obj[i] = arr[i];
    }
    return obj;
}

function radVarArray( parstr )
{
    return radVar(parstr);
}
function radVarArrayN( parstr )
{
    return radVar(parstr);
}

function radScanDiv(dv)
{
    readDiv(dv, dv.parentNode);
    loadDiv(dv);
}
function divName(dv)
{
    var smln="",reso="";;
    if( dv === null ) {
        return 'null';
    } else if( typeof dv == 'undefined' ) {
        return 'undef';
    } else if( typeof dv != 'object' ) {
        smln=typeof dv;
    } else if( dv.nodeName == 'BODY' || dv.nodeName == 'HTML' ) {
        return '$' + dv.nodeName;
    } else if( dv.nodeName == '#COMMENT' || dv.nodeName == '#TEXT' ) {
        smln = '*' + dv.nodeName;
    } else if( isValid(dv.id) ) {
        smln=dv.id;
    } else if( isValid(dv.name) ) {
        smln=dv.name;
    } else if( isValid(dv.className) ) {
        smln="#"+dv.className;
    } else {
        smln = 'div';
    }
    reso = smln;
    if( dv.parentNode != null )
        reso += ":" + divName(dv.parentNode);
    else
        reso += ".";
    return reso;
}
function radLoadDiv(dv)
{
    if( dv == null ) return;
    var smln=divName(dv);
    radRunning++;
    readDiv(dv, dv.parentNode);
    loadDiv(dv);
    sizeDiv(dv, true); // the 'true' means 'do this in one thread'
    radRunning--;
}
function loadPage()
{
//  alert("loadPage");
    readDiv(document.body, null);
    loadDiv(document.body);
}
function updatePage()
{
//  alert("updatePage");
    winSize();
    sizeDiv(document.body, false, finUpdPage);
//  alert("finish");
}


var radif = [];
var radiflev = -1, radifn = -1;
var radifsafe = false;

function radTransParm( strin )
{
    radifsafe = true;
    var vx = radTranslate(strin);
    if ( vx == null || vx == 'null' || vx == 'undefined' ) vx = "";
    radifsafe = false;
    return vx;
}
function radTranslateFrom( root, str )
{
    var tmpnode = radNode;

    radNode = root;
    var result = radTranslate(str);
    radNode = tmpnode;

    return result;
}
function radTransArr( arrin )
{
    var i, arrout;
    
    if( Array.isArray(arrin) ) {
        arrout = [];
        for( i=0; i<arrin.length; i++ ) {
            arrout[i] = radTranslate(arrin[i]);
        }
    } else {
        arrout = {};
        for( i in arrin ) {
            arrout[i] = radTranslate(arrin[i]);
        }
    }
    return arrout;
}
function radRoot( div )
{
    if( !isValid(div) ) return "";
    if( typeof div == 'string' ) return div;
    return div.croot;
}
function radTranslate( strin )
{
    if( typeof strin == 'object' ) {
        return radTransArr(strin);
    } else if( typeof strin == 'number' ) {
        return strin;
    //} else if( typeof strin == 'undefined' ) {
//        return '';
    } else if( typeof strin != 'string' || strin == null ) {
        return '';
    }
    var i, lasti, strout, sbuild = "";
    var shold, m, n, o, stpt, stg, scmd, inqt, sparm, sop, sparm2;
    var rv1, rv2, rv3, iff;
    var xv, xv2, iff;
    var j, c;

    var pat = /[\[\]#\$_\.0-9a-zA-Z]/i;

    i = lasti = 0;
    strout = "";


    if ( typeof strin == 'undefined' )
    {
        return "";
    }
    while( (i = strin.indexOf("#", i)) != -1 )
    {
        if ( i != lasti )
        {
            if ( radifsafe || radiflev < 0 || radif[radiflev] == 1 )
            {
                strout += strin.substr(lasti, i - lasti);
            }
        }
        if ( strin.substr(i + 1, 1) == "#")
        {
            if ( radifsafe || radiflev < 0 || radif[radiflev] == 1 )
            {
                strout += "#";
            }
            i += 2;
            lasti = i;
            continue;
        }
        else if ( strin.substr(i + 1, 1) == "[" )
        {
            braceCount = 1;
            for ( j = i + 2; j < strin.length; j++ )
            {
                c = strin.substr(j, 1);
                if ( c == "[" )
                {
                    braceCount++;
                }
                else if ( c == "]" )
                {
                    braceCount--;
                    if ( braceCount <= 0 ) break;
                }
            }
            m = j;
            if ( m < 0 || m >= strin.length )
            {
                if ( radifsafe || radiflev < 0 || radif[radiflev] == 1 )
                {
                    strout += "[";
                }
                i += 2;
                lasti = i;
                continue;
            }
            i += 2;
            shold = strin.substr(i, m-i);
            n = shold.indexOf(" ");
        
            if ( n < 0 )
                scmd = shold;
            else
                scmd = shold.substr(0, n);
            if ( shold.substr(0, 1) == "~" )
            {
                 // function call or something //! (something like what??)
                if ( radifsafe || radiflev < 0 || radif[radiflev] == 1 )
                {
                    var examine = radTranslate(shold.slice(1));
                    if ( examine != "" )
                    {
                        try
                        {
//                          console.log("Test: " + examine);
                            examine = examine.replace('obj', '')
                            strout += eval(examine);
                        }
                        catch (err)
                        {
                            console.warn(examine, err);
                            strout += "#err#";
                        }
                    }
                }
            }
            else if ( scmd == "if" )
            {
                stpt = n + 1;
                rv1 = paramStr(shold, stpt);
                sparm = rv1[1];
                rv2 = paramStr(shold, rv1[0]);
                sop = rv2[1];
                rv3 = paramStr(shold, rv2[0]);
                sparm2 = rv3[1];

                xv = radQt(sparm);
                if ( xv == null ) xv = "";
                xv2 = radQt(sparm2);
                if ( xv2 == null ) xv2 = "";
                
                iff = false;
                if ( sop == "" )
                {
                    iff = ( xv != "" );
                }
                else if ( sop == "=" || sop == "==" )
                {
                    iff = ( xv == xv2 );
                }
                else if ( sop == "!=" )
                {
                    iff = ( xv != xv2 );
                }
                else
                {
                    iff = false;
                }

                if ( radiflev >= 0 && radif[radiflev] != 1 )
                {
                    radifn++;
                }
                else
                {
                    radifn++;
                    radiflev++;
                    radif[radiflev] = iff ? 1 : 0;
                }
//              console.log("ris: " + radifsafe + ", ril: " + radiflev + ", ri: " + (radiflev>=0?radif[radiflev]:"-") + ", test: " + sparm + sop + sparm2 + ", ev: " + iff);
            }
            else if ( scmd == "elseif" || scmd == "elsif" || scmd == "elif" )
            {
                stpt = n + 1;
                rv1 = paramStr(shold, stpt);
                sparm = rv1[1];
                rv2 = paramStr(shold, rv1[0]);
                sop = rv2[1];
                rv3 = paramStr(shold, rv2[0]);
                sparm2 = rv3[1];
                
                xv = radQt(sparm);
                if ( xv == null ) xv = "";
                xv2 = radQt(sparm2);
                if ( xv2 == null ) xv2 = "";
                
                iff = false;
                if ( sop == "" )
                {
                    iff = ( xv != "" );
                }
                else if ( sop == "=" || sop == "==" )
                {
                    iff = ( xv == xv2 );
                }
                else if ( sop == "!=" )
                {
                    iff = ( xv != xv2 );
                }
                else
                {
                    iff = false;
                }
//              console.log("ei ril: " + radiflev + ", ri: " + (radiflev>=0?radif[radiflev]:"-") + ", test: " + sparm + sop + sparm2 + ", ev: " + iff);
                if ( iff )
                {
                    if ( radif[radiflev] == 0 )
                    {
                        radif[radiflev] = 1;
                    }
                    else if ( radif[radiflev] == 1 )
                    {
                        radif[radiflev] = 0;
                    }
                }
                else
                {
                    if ( radif[radiflev] == 1 )
                        radif[radiflev] = -1;
                }
            }
            else if ( scmd == "else" )
            {
                if ( radifn <= radiflev )
                {
                    if ( radif[radiflev] == 0 )
                    {
                        radif[radiflev] = 1;
                    }
                    else
                    {
                        radif[radiflev] = -1;
                    }
                }
            }
            else if ( scmd == "endif" || scmd == "fi" )
            {
                if ( radifn <= radiflev )
                    radiflev--;
                radifn--;
            }
            else
            {
                if ( radifsafe || radiflev < 0 || radif[radiflev] == 1 )
                {
                    var vx = radVarX( radTranslate(scmd) );
                    if ( vx == null )
                    {
                        strout += '';
                    }
                    else
                    {
                        strout += vx;
                    }
                }
            }
            lasti = i = m + 1;
            continue;
        }
        // # var:
        i++;
        sbuild = "";
        var lastc = "";
        //! Check this code.
        while( i < strin.length )
        {
            c = strin.substr(i, 1);
            if ( c == "." && lastc == "." )
            {
                if ( radifsafe || radiflev < 0 || radif[radiflev] == 1 )
                {
                    sbuild = sbuild.substr(0, sbuild.length-1);
                }
                break;
            }
            else
            {
                lastc = c;
            }
            if ( pat.test(c) )
            {
                if ( radifsafe || radiflev < 0 || radif[radiflev] == 1 )
                {
                    sbuild += c;
                }
                i++;
            }
            else
            {
                if( sbuild == "" )
                {
                    // invalid syntax
                    strout += "#";
                    i++;
                }
                break;
            }
        }
        if ( radifsafe || radiflev < 0 || radif[radiflev] == 1 )
        {
            var vx;
            if( sbuild == "" ) {
                vx = "";
            } else {
                vx = radVarX( radTranslate( sbuild ) );
            }
            if ( vx == null )
            {
                vx = "";
            }
            strout += vx;
        }
        lasti = i;
        i--;
    }
    if ( lasti >= 0 && strin.length > lasti )
    {
        if ( radifsafe || radiflev < 0 || radif[radiflev] == 1 )
        {
            strout += strin.substr(lasti);
        }
    }
    return strout;
}

function paramStr( shold, stpt )
{
    var rv;
    var finpt, param, inqt, c, o;

    do
    {
        if ( stpt > shold.length )
        {
            return [stpt, ""];
        }
        c = shold.substr(stpt, 1);
        if ( c == "\n" || c == "\r" || c == "\t" || c == " " )
        {
            stpt++;
            continue;
        }
        break;
    } while(true);

    inqt = "";
    param = "";
    for ( o = stpt; o < shold.length; o++ )
    {
        c = shold.substr(o, 1);
        if ( inqt === "" )
        {
            if ( c == '"' )
            {
                inqt = '"';
                stpt = o + 1;
            }
            else if ( c == "'" )
            {
                inqt = "'";
                stpt = o + 1;
            }
            else
            {
                inqt = false;
            }
        }
        else if ( inqt === false )
        {
            if ( c == "\n" || c == "\r" || c == "\t" || c == " " || c == '"' || c == "'" || c == '#' || c == "]" )
            {
                finpt = o;
                param = shold.substr( stpt, o-stpt );
                break;
            }
        }
        else if ( inqt == c )
        {
            finpt = o+1;
            param = shold.substr( stpt, o-stpt );
            break;
        }
    }
    if ( param == "" && o > stpt )
    {
        param = shold.substr(stpt);
    }

    rv = [ finpt, param ];
    return rv;
}


var rad_dragger=false;
var rad_dragel=false;

function radDrag(ev)
{
    var evt=ev.target;
    var evp=evt;
    var mp = mc(ev);
    var tgtid;
    var x,y;

    if( evp.nodeName == "#text" )
        evp=evp.parentNode;
    mv_gldiv = evp;
    while( mv_gldiv && !isValid(mv_gldiv.xDrag) ) {
        mv_gldiv = mv_gldiv.parentNode;
    }
    if( !mv_gldiv ) {
        alert("Draggable not found");
        return;
    }
    rad_dragel = mv_gldiv;

    eval( rad_dragel.xy_dragget );

    if( ( (!x || isNaN(x)) && ( rad_dragel.xDrag == 'x' || rad_dragel.xDrag == 'xy' ) ) ||
        ( (!y || isNaN(y)) && ( rad_dragel.xDrag == 'y' || rad_dragel.xDrag == 'xy' ) ) ) {
        eval( rad_dragel.xy_draginit );
        eval( rad_dragel.xy_dragset );
    }        

    rad_dragger = [ x, mp[0], y, mp[1] ];

    tgt_doc = evt.ownerDocument.documentElement;
    tgt_doc.onmouseup = radDrag_up;
    tgt_doc.onmousemove = radDrag_upd;
    tgt_doc.onselectstart = function(){return false;};
}

function radDrag_upd(ev)
{
    if( !ev ) ev = window.event;
    var mp = mc(ev);
    var x,y;    

    x = ( rad_dragger[0] - rad_dragger[1] ) + mp[0];
    y = ( rad_dragger[2] - rad_dragger[3] ) + mp[1];

    if( ( ( rad_dragel.xDrag == 'x' || rad_dragel.xDrag == 'xy' ) && x != rad_dragger[0] ) ||
        ( ( rad_dragel.xDrag == 'y' || rad_dragel.xDrag == 'xy' ) && y != rad_dragger[2] ) )
    {
        eval( rad_dragel.xy_dragset );
    }
}
function radDrag_up(ev)
{
    if( !ev ) ev = window.event;
    var mp = mc(ev);
    var x,y;

    tgt_doc.onmouseup = null;
    tgt_doc.onmousemove = null;
    tgt_doc.onselectstart = null;
    
    x = ( rad_dragger[0] - rad_dragger[1] ) + mp[0];
    y = ( rad_dragger[2] - rad_dragger[3] ) + mp[1];

    if( ( ( rad_dragel.xDrag == 'x' || rad_dragel.xDrag == 'xy' ) && x != rad_dragger[0] ) ||
        ( ( rad_dragel.xDrag == 'y' || rad_dragel.xDrag == 'xy' ) && y != rad_dragger[2] ) )
    {
        eval( rad_dragel.xy_dragset );
    }
}







var rendered_divs = [];

/*
radiant parameter descriptions:

xLoop=path - iterate through a data list
 xKey=k - iteration counter
 xInd=i - iteration key (yeah it's backwards)
 xVal=v - iteration value
//xSuper=path - use fixSelect to provide enhanced imaged select boxes
//xListBox=path - use custom-input+enhanced select box
xSuper=1 - use fixSelect with no empty value
xListBox=1 - use fixSelect with empty value support
xOptions=_a=hello,b=goodbye,c=quicklist
xOptions=tripath (dataroot,value_field(or 0 for index, or 1 for value),display_field(or empty or 0 or 1 for value)) - preload select box
xForm=path - use magic forms
xConnect=path - connect the value of a textbox or select field to a path
xSwitch=path - only render the proper xCase for path
 xCase=choice
xTest=condition - eval() condition to decide whether or not to display the div
xDraw=jsfunc(div) - to re-render the div
xOnSize=jsfunc(div) - to re-size and position the div when the window size changes or loads
xCmd=jsfunc(div) - onclick
*/

var readable_parms = [ "xWatch", "xWatch2", "xWatch3", "xSect", "xSeed", "xSrc", "xId", "xName",
/*charts*/ "xHeader", "xTypedraw", "xViewField", "xField", "xChartCmd", "xSort", "xType",
        "xForm", "xFormChange", "xFormCb", "xCb",
        "xSelect", "xSelectArea", 
        "xFin", "xOrd",
        "xSwitch", "xCase", "xListBox", "xOptions",
        "xConnect", "xSuper",
        "xParams", "xCast",
        "xChange", "xOnRender", "xOnSize", "xDraw", "xDisp", "xCmd", "xMouseOver", "xMouseOut", "xMouseDown",
        "xDrag", "xDragInit", "xDragGet", "xDragSet",
        "xFirstLoad", "xView", "xAView"
];
var transfer_parms = [ "xMethod" ];
var object_parms = [ "xStyle" ];
var aliased_parms = { "xParms": "xParams", "xDisplay": "xDisp", "xSection": "xSect",
            "xSource": "xSrc", "xAssign": "xParams", "xSet": "xParams" };
var translate_parms = [ "xClass", "xPath" ];
var origin_check = [ 'name', 'id', 'src', 'className', 'value' ];
var html_parms = [ 'href' ];
var event_parms = [ 'change' ];

function readDiv(idiv, pdiv)
{
    var x, y;

    if ( isValid(pdiv) )
    {
        radNode = pdiv;
    }
    else if ( isValid(idiv.parentNode) )
    {
        radNode = pdiv = idiv.parentNode;
    }
    else
    {
        radNode = idiv;
        pdiv = false;
    }

    if ( idiv.nodeName == "#text" )
    {
        console.warn("Attempting to scan a text node");
        return;
    }

    if ( !idiv.hasAttribute )
    {
        return;
    }
    
    radScanClass(idiv, true);

    if ( !isValid(idiv.xroot) || idiv.xroot == "" )
    {
        if ( isValid(x = getAttribute(idiv, 'xroot')) )
        {
            idiv.xroot = x;
        }
        else if ( pdiv && isValid(pdiv.xroot) )
        {
            idiv.xroot = pdiv.xroot;
        }
    }
    if ( isValid(idiv.xroot) )
        idiv.croot = radTranslate(idiv.xroot);

    for ( y in aliased_parms )
    {
        if ( isValid(x = getAttribute(idiv, y)) )
        {
            idiv[aliased_parms[y]] = x;
        }
    }
    for ( y = 0; y < translate_parms.length; y++ )
    {
        if ( isValid(x = getAttribute(idiv, translate_parms[y])) )
        {
            idiv[translate_parms[y]] = radTranslate(x);
        }
    }

    if ( pdiv && isValid(x=getAttribute(pdiv, "xSeed")) && ( !isValid(getAttribute(idiv, 'xSeed')) ) )
    {
        idiv.setAttribute('xSeed', x);
    }

    radNode = idiv;

    for ( y = 0; y < html_parms.length; y++ )
    {
        if ( isValid(x = getAttribute(idiv, html_parms[y])) && typeof x == 'string' )
        {
            idiv['x' + html_parms[y]] = x;
        }
    }
    for ( y = 0; y < object_parms.length; y++ )
    {
        if ( isValid(x = getAttribute(idiv, object_parms[y])) && typeof x == 'string' )
        { // ( style parser: )
            var a = x.split(';');
            var o = {};
            if( typeof a != 'object' ) a = [a];
            for( var i = 0; i < a.length; i++ )
            {
                var b = a[i].split(':');
                if( b.length < 2 ) continue;
                if( b.length > 2 ) b[1] = b.slice(1).join(":");
                while( i < a.length && b[1].substr( b[1].length-1, 1 ) == "\\" ) { // just in case ;)
                    i++;
                    b[1] = b[1] + a[i];
                }
                o[b[0].trim()] = b[1].trim();
            }
            idiv[object_parms[y]] = o;
        }
    }
    for ( y = 0; y < readable_parms.length; y++ )
    {
        if ( isValid(x = getAttribute(idiv, readable_parms[y])) )
        {
            idiv[readable_parms[y]] = x;
        }
    }
    for( y = idiv.attributes.length-1; y >= 0 ; --y ) {
    	if( idiv.attributes[y].name[0] == '#' ) {
    		if( typeof idiv.xParams != 'undefined' ) {
    			idiv.xParams += ",";
    		} else {
    			idiv.xParams = "";
    		}
    		idiv.xParams += idiv.attributes[y].name.slice(1) + "=" + idiv.attributes[y].value;
    	}
    }
    /*
    var yf = null;
    for ( y = 0; y < form_parms.length; y++ )
    {
        if ( idiv.hasAttribute(readable_parms[y]) && isValid(x = idiv.getAttribute(readable_parms[y])) )
        {
            if( yf == null ) yf = getForm(idiv);
            if( yf != null ) yf[ form_parms[y] ] = x;
        }
    }
    */
    var z;
    for ( y = 0; y < origin_check.length; y++ )
    {
        if ( typeof idiv['o' + (z = origin_check[y])] != 'string' && typeof (x = idiv[z]) == 'string' && x.indexOf("#") != -1 )
        {
            idiv['o' + z] = x;
            if( z == 'value' ) { // add focus/blur to save/load it, similar to forms
                //onblur
            }
        }
    }


    if ( typeof idiv.xChart != 'string' && isValid(x = getAttribute(idiv, 'xChart')) )
    {
        idiv.xChart = x;
        var fc = x;
        if ( !isValid(y = idiv.croot) )
        {
            y = "";
        }
        fc += "_" + y;
        if ( isValid(y = idiv.xSeed) )
        {
            fc += "_" + y;
        }
        if ( !(fc in radCharts) )
        {
            radCharts[fc] = { 'sort':'' };
        }
    }
    var o = "";
    var fn = {};

    if ( isValid(x = getAttribute(idiv, 'xRef')) )
    {
        var ax = x.split(/,/), ay;
        var i, val;
        for ( i = 0; i < ax.length; ++i )
        {
            ay = ax[i].split(/=/);
            val = ay.length == 1 ? '1' : radTranslate(ay[1]);
            if ( isValid(val) && val != 'null' )
            {
                idiv[ay[0]] = val;
                idiv.setAttribute(ay[0], val);
            }
        }
    }
    if ( isValid(x = getAttribute(idiv, "xValues")) )
    {
        var vals = [];

        if( x.indexOf(",") > 0 ) {
            vals = x.split(",");
        } else {
            vals = [ x ];
        }
        var subvals;
        for( y=0; y<vals.length; y++ ) {
            if( vals[y].indexOf("-") > 0 ) {
                subvals=buildRange(vals[y].split('-'));
                vals.splice(y,1,subvals);
                y += subvals.length-1;
            }
        }
        idiv.xVals = vals;
    }
    if ( isValid(x = getAttribute(idiv, "xRegion")) )
    {
        // add to render region
        idiv.xRegion = x;
        radRegions[x] = idiv;
    }
    if ( isValid(x = getAttribute(idiv, "xClass")) )
    {
        // determine render class
        idiv.xClass = x;
        if ( !(x in radQueries) )
        {
            radType(x, { 'templates':[] } );
        }
    }
    if ( isValid(x = getAttribute(idiv, "xDef")) )
    {
        // determine renderable classes (optional)
        idiv.xDef = x.split('/');
    }
    if ( isValid(x = getAttribute(idiv, "xFrame")) )
    {
        // determine rendering type
        idiv.xFrame = x;
    }
    if ( isValid(x = getAttribute(idiv, "xTemplate")) )
    {
        if ( isValid(idiv.xClass) )
        {
            radQueries[idiv.xClass].templates.push( [x, idiv] );
            x = idiv.xClass + "." + x;
        }
        idiv.xTemp = x;
        radTemps[x] = idiv;
    }
    
    if ( isValid(x = getAttribute(idiv, "xDataname")) )
    {
        var rqo = { 'n': 1, 'limn': 20, 'objs': [], 'dataname': x };
        if ( isValid(y = getAttribute(idiv, 'xQuery')) )
        {
            rqo['query'] = y;
        }
        if( isValid(y = getAttribute(idiv, 'xSockCode')) )
        {
        	rqo['socket_code'] = y;
        }
        if( isValid(y = getAttribute(idiv, 'xSocket')) )
        {
        	rqo['socket'] = y;
        }
        if ( isValid(y = getAttribute(idiv, 'xUrl')) )
        {
            rqo['uri'] = y;
        }
        if ( isValid(y = getAttribute(idiv, "xRefresh")) )
        {
            rqo['refresh'] = y;
        }
        if ( isValid(y = getAttribute(idiv, 'xPage')) )
        {
            rqo['pPage'] = y;
        }
        if ( isValid(y = getAttribute(idiv, 'xLimit')) )
        {
            rqo['pLimit'] = y;
        }
        if ( isValid(y = getAttribute(idiv, 'xPerpage')) )
        {
            rqo['limn'] = y;
        }
        if ( isValid(y = getAttribute(idiv, 'xPagecmd')) )
        {
            rqo['cb'] = y;
        }
        if ( isValid(y = getAttribute(idiv, 'xCb')) )
        {
            rqo['datacb'] = y;
        } else if ( isValid(y = getAttribute(idiv, 'xCallback')) )
        {
            rqo['datacb'] = y;
        }
        if ( isValid(y = getAttribute(idiv, 'xTitle')) )
        {
            rqo['title'] = y;
        }
        if ( isValid(y = getAttribute(idiv, 'xDrawsect')) )
        {
            rqo['xSect'] = y;
        }
        idiv.rqo = rqo;
    }

    if ( isValid(x = getAttribute(idiv, "xEmptyLoop")) )
    {
        idiv.xEmptyLoop = x;
        idiv.setAttribute('keepscan', 1);
    }

    if ( isValid(x = getAttribute(idiv, "xLoopHead")) )
    {
        idiv.xLoopHead = x;
        idiv.setAttribute('keepscan', 1);
        idiv.style.display = 'none';
    }

    if ( isValid(x = getAttribute(idiv, "xLoopMore")) )
    {
        idiv.xLoopMore = x;
        if ( idiv.hasAttribute("xMax") && isValid(x = idiv.getAttribute('xMax')) )
        {
            idiv.xMax = x;
        }
        idiv.setAttribute('keepscan', 1);
        idiv.style.display = 'none';
    }

    if ( isValid(x = getAttribute(idiv, "xTest")) )
    {
        idiv.xTest = x;
    }

    if ( idiv.hasAttribute("xReverseLoop") )
    {
        idiv.xReverseLoop = 1;
    }

    if( idiv.hasAttribute("xScrollBottom") )
    {
        idiv.xScrollBottom = 1;
    }


    if ( isValid(x = getAttribute(idiv, "xLoop")) )
    {
        if( !idiv.hasAttribute(idiv, 'xSeed') || !isValid(idiv.getAttribute('xSeed')) )
        {
            seedval = 'xL' + base_seed;
            base_seed++;
            idiv.setAttribute("xSeed", seedval);
        }
        idiv.xLoop = x;
        if ( isValid(x = getAttribute(idiv, "xKey")) )
        {
            idiv.xKey = x;
        }
        if ( isValid(x = getAttribute(idiv, "xInd")) )
        {
            idiv.xInd = x;
        }
        if ( isValid(x = getAttribute(idiv, 'xMax')) )
        {
            idiv.xMax = x;
        }

        if ( isValid(x = getAttribute(idiv, "xFilter")) )
        {
            idiv.xFilter = x;
        }
        if ( isValid(x = getAttribute(idiv, "xVal")) )
        {
            idiv.xVal = x;
        }
        else if ( isValid(x = getAttribute(idiv, "xValue")) )
        {
            idiv.xVal = x;
        }

        if ( isValid(x = getAttribute(idiv, 'xPager')) )
        {
            idiv.pagequery = radTranslate(x);
//          idiv.xpageno = 1;
            radQueries[x]['objs'].push( idiv );
        }
    }
    if ( isValid(x = getAttribute(idiv, "origcontent")) )
    {
        idiv.origcontent = x;
    }

}

function buildRange(vx)
{
    var i=vx[0], j=vx[1];
    var x=[];
    while( i <= j ) {
        x.push(i);
        i++;
    }
    return x;
}

function isAllSpacing(vx)
{
    var len = vx.length;
    for ( var i = 0; i < len; ++i )
    {
        var c = vx.substr(i, 1);
        if ( c == ' ' || c == '\t' || c == '\r' || c == '\n' )
        {
            continue;
        }
        return false;
    }
    return true;
}

function subRead(ndiv)
{
    var schar, xdiv, pdiv, il, i, ival, tDiv, cant;

    //! if isDisabled(ndiv) return false; //? should we do this
    schar = [0, ndiv, ndiv.parentNode];

    while( schar.length > 0 )
    {
        tp = schar.shift();
        if ( tp == 1 )
        {
            xdiv = schar.shift();
//! this is good for subRead() but what about doing what sizeOneDiv() does
//          if ( xdiv.nodeName == 'FORM' && ( xdiv.getAttribute('xMethod') != null ) )
//              fgenform(xdiv);
            continue;
        }
        xdiv = schar.shift();
        pdiv = schar.shift();

        if ( xdiv.nodeName == "#comment" || xdiv.nodeName == "script" || xdiv.nodeName == "#text" || xdiv.nodeName == 'svg' )
        {
            continue;
        }

//      if ( xdiv.getAttribute("xNoProc") == 1 )
//          return;
        //! if ( isDisabled(xdiv) ) return;

        readDiv(xdiv, pdiv);

        if ( isValid(getAttribute(xdiv, "origcontent")) )
        {
            continue;
        }

        for ( i = 0; i < xdiv.childNodes.length; ++i )
        {
            if ( xdiv.childNodes[i].nodeName == "#comment" || xdiv.childNodes[i].nodeName == "script" || xdiv.childNodes[i].nodeName == "#text" || xdiv.childNodes[i].nodeName == 'svg' )
            {
                continue;
            }
            schar.push(0, xdiv.childNodes[i], xdiv);
        }
        schar.push(1, xdiv);
    }

    sizeDiv(ndiv, true);
}

var radChanges = {};
function radiantChange( divid, overrides )
{
    radChanges[divid] = overrides;
}
if (!Array.indexOf)
{
    Array.prototype.indexOf = function(obj)
    {
        for ( var i = 0; i < this.length; ++i )
        {
            if ( this[i] == obj )
            {
                return i;
            }
        }
        return -1;
    }
}
var prop_defaults = [ 'id', 'className', 'style', 'value', 'src', 'innerHTML' ];



function radChartClear( chnm, y, sd )
{
    var fc = chnm + "_" + y;
    if ( isValid(sd) ) 
    {
        fc += "_" + sd;
    }
    if ( !(fc in radCharts) )
    {
        console.log("delete nonexistant chart " + fc);
        return;
    }
//  console.log("chartClear("+fc+")");
    delete radCharts[fc];
}

var selectcats = {}, selected_nodes = [];
var current_select_cat = false;

function radResetSelect()
{
    current_select_cat = false;
    var i;

    for ( i = 0; i < selected_nodes.length; ++i )
    {
        classSwap(selected_nodes[i], "rselected", "rselectable");
        radScanClass(selected_nodes[i]);
    }
    selected_nodes = [];
}
function radClickSelect(el, ev)
{
    if ( !isValid(el.xselectcat) )
    {
        console.log("clickSelectNode on non selectable"); // huh?
        return;
    }

    if ( current_select_cat !== false && current_select_cat != el.xselectcat )
    {
        return; // not in the set
    }

    var i = selected_nodes.indexOf(el);
    if ( i >= 0 )
    {
        //deselect it
        selected_nodes.splice(i, 1);
        classSwap(el, "rselected", "rselectable");
    }
    else
    {
        selected_nodes.push(el);
        classSwap(el, "rselectable", "rselected");
    }
    radScanClass(el);
}
var rad_select_xy = [-1, -1];
var rad_xy_selected = [];
function radSelectAreaDown(ev)
{
    var i, j;
    var xp;

    rad_select_xy = mc(ev);
    rad_xy_selected = [];

    document.onmouseup = radSelectAreaFinish;
    document.onmousemove = radSelectAreaTest;
}
function radSelectAreaTest(ev)
{
    var mp = mc(ev), xp, el;
    var i, j, q;

    for ( i in selectcats )
    {
        if ( current_select_cat !== false && current_select_cat != i )
        {
            continue;
        }
        for ( j = 0; j < selectcats[i].length; ++j )
        {
            xp = getPos(el = selectcats[i][j]);
            if ( el.xSelectMask == 1 )
            {
                continue;
            }
            if ( ( ( xp[0] >= rad_select_xy[0] && xp[0] <= mp[0] ) || ( xp[0] <= rad_select_xy[0] && xp[0] >= mp[0] ) ) &&      
                ( ( xp[1] >= rad_select_xy[1] && xp[1] <= mp[1] ) || ( xp[1] <= rad_select_xy[1] && xp[1] >= mp[1] ) ) )
            {
                if ( !current_select_cat )
                {
                    current_select_cat = i;
                }
                el.xSelectMask = 1;
                rad_xy_selected.push(el);
                classSwap(el, "rselectable", "rselected");
                radScanClass(el);
            }
            else if ( el.xSelectMask == 1 )
            {
                rad_xy_selected.splice( rad_xy_selected.indexOf(el), 1 );
                el.xSelectMask = 0;
            }
        }
    }
}
function radSelectAreaFinish(ev)
{
    var xp, el;

    for ( var i = 0; i < rad_xy_selected.length; ++i )
    {
        el = rad_xy_selected[i];
        el.xSelectMask = 0;
        if ( selected_nodes.indexOf(el) < 0 )
        {
            selected_nodes.push(el);
        }
    }

    document.onmousemove = null;
    document.onmouseup = null;
}
function serialObject( pn, obj )
{
    var str = "";
    var xoNest;
    var i, v;

    v = ( typeof obj == 'object' ?
        ( Object.prototype.toString.call( obj ) == '[object Array]' ? 1 : 2 ) :
        0
        );

    if ( v == 0 )
    {
        // scalar
        return esc(pn) + "=" + esc(obj);
    }
    else if ( v == 1 )
    {
        // array
        for ( i = 0; i < obj.length; ++i )
        {
            str += ( str != "" ? "&" : "" ) + serialObject(pn + "[" + i + "]", obj[i]);
        }
        return str;
    }
    else if ( v == 2 )
    { 
        // object
        for ( i in obj )
        {
            str += (str != "" ? "&" : "" ) + serialObject(pn + "." + i, obj[i]);
        }
        return str;
    }
    return "";
}
function radSendForm( frm )
{
    var i, xo = radVar(frm.xFormTarget);
//  console.log("Form send");
    radFormSave(frm, true);
}
function radFormUpdate( form )
{
    var i, tgt = form.xFormTarget, ix = form.elements;
//  console.log("Saving form to data model");
    for ( i = 0; i < ix.length; ++i )
    {
        if ( ix[i].name.substr(0, 1) == "_" )
        {
            continue;
        }
        radStore( tgt + "." + ix[i].name, ix[i].value );
    }
    var x;
}
function radFormSave( frm, allowSend=false )
{
    var tgt = frm.xFormTarget;

    var validform=true;
    if( typeof tgt == 'undefined' || tgt == '' || tgt == null || tgt == false ) {
        validform=false;
    }

//  console.log("Form Save");
    var i, y;
    var ix = frm.elements;
    if( typeof ix == 'undefined' ) {
        validform=false;
        console.log("Invalid form.", frm);
        return false;
    }
    
    console.log("SaveData");
    for ( i = 0; i < ix.length; ++i )
    {
        if ( ix[i].name.substr(0, 1) != "_" )
        {
            if( ix[i].type == 'checkbox' && ix[i].checked == false ) {
                y = "";
            } else if( ix[i].type == 'select-multiple' ) {
                var j;
                y = [];
                for( j = 0; j < ix[i].selectedOptions.length; j++ ) {
                    y.push( ix[i].selectedOptions[j].value );
                }
            } else {
                y = ix[i].value;
            }
            if( typeof ix[i].xPath != 'undefined' ) {
                radCStore( ix[i].xPath, y );
            } else if( validform ) {
                radCStore( tgt + "." + ix[i].name, y );
            }
        }
    }
    
    if( allowSend != true )
        return false;
    
    if( isValid(frm.action) ) {
        if( isValid(frm.xFormCb) ) {
            HtmlObjRequest(frm.action, radVar( tgt ), frm.xFormCb);
        } else if( isValid(frm.xCb) ) {
        	HtmlObjRequest(frm.action, radVar( tgt ), frm.xCb);
        } else {
        	HtmlObjRequest(frm.action, radVar( tgt ), null);
        }
        return false;
    }

    if( isValid(frm['cMethod']) )
        return ( eval(frm['cMethod'].replace('this', 'frm')) === true );

    if ( frm.hasAttribute('xMethod') )
        return ( eval(frm.getAttribute('xMethod').replace('this', 'frm')) === true );

    if ( frm.hasAttribute('xMethod2') )
    {
        var xp = eval(frm.getAttribute('xMethod2'));
        xp(frm);
        return false;
    }

    if ( isValid(frm.basesubmit) )
    {
        return eval( frm.basesubmit.replace('this', 'frm') );
    }
    return false;
}
var rad_focus = false;
function radFieldFocus( el )
{
    //! manage focus events properly
    console.log("focused: " + el.name);
    rad_focus = el;
    //! close any existing dropdown list
    //! drop down a generated stylable list from el.vals
}
var kc_tab = 9;
var kc_enter = 13;
var kc_up = 38;
var kc_dn = 40;
var kc_rt = 39;
var kc_lt = 37;
var kc_esc = 27;
function radFieldValKey( el )
{
    var ev = window.event;
    var dv = ev.target || ev.srcElement;

    //! select the matching entry from the dropdown list
    //! use arrow keys to change
    //! ignore enter key
    
    if( ev.keyCode == kc_enter ) {
        return false;
    } else if( ev.keyCode == kc_up ) {
        return false;
    } else if( ev.keyCode == kc_dn ) {
        return false;
    }

/*
    rdb_target = el.id;
    setTimeout('radFieldValKeySet('+ev.keyCode+');',1);
*/
    return true;
}
/*
function radFieldValKeySet( kc )
{
    var dv = gE(rdb_target);
    var otext = dv.value;
    //! test values against xvals
}
*/
function radFieldUpdate( el )
{
    if( typeof current_focus != 'undefined' && current_focus == el ) {
        current_focus = false;
    }
    var eln = el.name;
    if ( el.name.substr(0, 1) == "_" ) // do not process old 'select' boxes after fixSelect() from lib.js
    {
        return;
    }

    var frm = el.form;
    var tgt = frm.xFormTarget;
    var x;
    var val = el.value;

    if ( el.type == 'checkbox' )
    {
        if ( !el.checked ) val = '';
    }

    if( 'xvals' in el ) {
        //! close the dropped-down list
        var i, found=false;

        for( i=0; i<el.xvals.length; i++ ) {
            if( val == el.xvals[i] ) {
                found=true;
            }
        }
        if( !found ) {
            el.value=val=el.xvals[0];
        }
    }

    var validform=true;
    if( typeof tgt == 'undefined' || tgt == '' || tgt == null || tgt == false ) {
        validform=false;
    }

    if( typeof el.xPath != 'undefined' ) {
        radStore(el.xPath, val);
    } else if( validform ) {
        radStore( tgt + "." + eln, val );
    }


    if ( isValid(x = el.oldOnChange) )
    {
        return eval(x.replace('this', 'el'));
    }
    var yf = el;
    while( yf && yf.nodeName != 'FORM' ) {
        if ( isValid(x = yf.xFormChange) )
        {
            return eval(radTranslateFrom(el, x.replace('this', 'frm').replace('form', 'frm')));
        }
        yf = yf.parentNode;
    }
    if ( isValid(x = yf.xFormChange) )
    {
        return eval(radTranslateFrom(el, x.replace('this', 'frm').replace('form', 'frm')));
    }
    return null;
}

function radFormPush( frm )
{
    var tgt = frm.xFormTarget;
    var ix = frm.elements;

//  console.log("Loading form from model");
//  var zz = radVar(tgt);
//  if ( zz == null ) return;

    var validform=true;
    if( typeof tgt == 'undefined' || tgt == '' || tgt == null || tgt == false ) {
        validform=false;
    }

    for ( var i = 0; i < ix.length; ++i )
    {
        if ( ix[i].nodeName == "#text" || ix[i].nodeName == "#comment"  )
        {
            continue;
        }
        if ( ix[i].name.substr(0, 1) == "_" )
        {
            continue;
        }
        if( typeof ix[i].xPath != 'undefined' && radHas( ix[i].xPath ) ) {
            ix[i].value = radVar(ix[i].xPath);
        } else if( validform && radHas( tgt + "." + ix[i].name ) ) {
            ix[i].value = radVar(tgt + "." + ix[i].name);
        }
    }
}
function radFormLoad( frm )
{
    var tgt = frm.xFormTarget;
    var ix = frm.elements;
    var zz;
    var checkpar;
    var sname;

    var validform=true;
    if( typeof tgt == 'undefined' || tgt == '' || tgt == null || tgt == false ) {
        validform=false;
        zz = null;
    } else {
        zz = radVar(tgt);
    }
    if ( validform && zz == null )
    {
        radStore(tgt, zz = {});
    }
    
    if( !frm.hasAttribute('xMethod') ) {
    	if( frm.action != '' )
    		frm.setAttribute('xMethod', 'radSendForm(this, true)');
    	else
    		frm.setAttribute('xMethod', 'radSaveForm(this)');
    }

//  console.log("radFormLoad()");
    var i, x, y, inform;
    for ( i = 0; i < ix.length; ++i )
    {
        if ( ix[i].nodeName == "#text" || ix[i].nodeName == "#comment" )
        {
            continue;
        }
        if ( ix[i].name.substr(0, 1) == "_" )
        {
            sname = ix[i].name.substr(1);
        }
        else
        {
            sname = ix[i].name;
        }

        checkpar = ix[i].parentNode;
        while( checkpar != null )
        {
            if ( checkpar.style && checkpar.style.display == 'none' )
            {
                break;
            }
            checkpar = checkpar.parentNode;
        }
        if ( checkpar != null )
        {
            continue;
        }

        x = undefined;
        y = null;

        inform = ( typeof ix[i].xPath != 'undefined' || validform );

        if( typeof ix[i].xPath != 'undefined' && radHas( ix[i].xPath ) ) {
            y = radVar(ix[i].xPath);
        } else if( validform && radHas( tgt + "." + sname ) ) {
            y = radVar(tgt + "." + sname);
        }

        if( y != null ) {
            if ( ix[i].type == 'checkbox' )
                ix[i].checked = ( y == ix[i].value );
            else if( ix[i].type == 'select-multiple' ) {
                var j;
                
                if( typeof y == 'string' ) y = [ y ];
                
                for( j = 0; j < ix[i].options.length; j++ ) {
                    ix[i].options[j].selected = ( y.indexOf( ix[i].options[j].value ) != -1 );
                }
            } else {
                ix[i].value = y;
            }
        }

        if( inform ) {

            if ( !isValid(ix[i].oldOnChange) &&
                isValid(x = getAttribute(ix[i], 'onchange')) &&
                x.indexOf("radFieldUpdate(this)") < 0 )
            {
                ix[i].oldOnChange = x;
            }
            ix[i].setAttribute('onchange', 'radFieldUpdate(this)');

        }


        if ( 'xvals' in ix[i] || typeof ix[i].xPath != 'undefined' ) { //! || ( other reason to monitor focus )

            if ( !isValid(ix[i].oldOnFocus) &&
                isValid(x = getAttribute(ix[i], 'onfocus')) &&
                x.indexOf("radFieldFocus(this)") < 0 )
            {
                ix[i].oldOnFocus = x;
            }
            ix[i].setAttribute('onfocus', 'radFieldFocus(this)');

            if ( !isValid(ix[i].oldOnKeyDown) &&
                isValid(x = getAttribute(ix[i], 'onkeydown')) &&
                x.indexOf("radFieldValKey(this)") < 0 )
            {
                ix[i].oldOnKeyDown = x;
            }
            ix[i].setAttribute('onkeydown', 'radFieldValKey(this)');
        }

        if ( isValid(ix[i].xSuper) )
        {
            if ( !isValid(ix[i].xFin) && isValid(ix[i].xFormTarget) )
            {
                ix[i].xFin = 'radFieldUpdate(this)';
            }
            /* fixSelect(ix[i], ix[i].xFin, ix[i].xOrd); */
            fixSelect(ix[i], ix[i].xFin, ix[i].xOrd);
        }
        else if ( isValid(ix[i].xListBox) )
        {
            if ( !isValid(ix[i].xFin) && isValid(ix[i].xFormTarget) )
            {
                ix[i].xFin = 'radFieldUpdate(this)';
            }
            fixSelect(ix[i], ix[i].xFin, ix[i].xOrd, true);
        }

    }
    if( validform )
        fgenform(frm);
    return;
}


var rad_on_finish = [];
var rad_render_tree = [], rad_size_tree = [];
var rad_render_count = 0, rad_resize_count = 0;

function onRenderFinish(cmd)
{
    if ( rad_on_finish.indexOf(cmd) < 0 )
        rad_on_finish.push(cmd);
}
function renderFinish()
{
    var i, rdx;

    for ( i = 0; i < rad_on_finish.length; ++i )
    {
        rdx = rad_on_finish[i];
        rad_on_finish.splice(i, 1);
        rdx();
        i--;
    }

    radResize();    
}
function onRender(div, act)
{
    var j, rxt;

    rad_render_count++;
    for ( var i = 0; i < rad_render_tree.length; ++i )
    {
        rxt = rad_render_tree[i];
        j = rxt.length;
        if ( j == 0 )
        {
            //!thisshouldtechnicallyneverhappen
            console.log("onRender", "technician notice" );
            continue;
        }

        do
        {
            --j;
        } while ( j!=-1 && isAncestorOf( div, rxt[j][0] ) );
        if ( j != (rxt.length-1) )
        {
            rxt.splice(j + 1, 0, [div, act]);
            return;
        }
    }
    rad_render_tree.push( [[ div, act ]] );
    if ( rad_tmx == -1 )
    {
        rad_time_px = 1;
        rad_tmx = setTimeout("renderTest()", rad_time_px);
    }
}
//WORMHOLE ALERT

//.

//WORMHOLE ALERT
var rad_prev_render=-1, rad_prev_resize=-1;
function renderTest()
{
    var who_am_i = -01;
    if ( rad_prev_render == rad_render_count && (rad_tmx = who_am_i) && renderTest2() == 0 )
    {
        return renderFinish();
    }
    rad_prev_render = rad_render_count;
    var the_matrix = [1, 15, 30, 100, 50, 200, 500, 300];
    if ( (who_am_i = the_matrix.indexOf(rad_time_px)) < the_matrix.length + who_am_i )
    {
        rad_time_px = the_matrix[ who_am_i + 1 ];
    }
/*  if ( rad_time_px == 1 ) rad_time_px = 15;
    else if ( rad_time_px == 15 ) rad_time_px = 30;
    else if ( rad_time_px == 30 ) rad_time_px = 100;
    else if ( rad_time_px == 100 ) rad_time_px = 50;
    else if ( rad_time_px == 50 ) rad_time_px = 200;
    else if ( rad_time_px == 200 ) rad_time_px = 500;
    else rad_time_px = 300; // muahahahaha */
    rad_tmx = setTimeout("renderTest()", rad_time_px);
}
var rad_time_px = 1, rad_time_py = 100;
var rad_tmy=-1, rad_tmx=-1;
function onSize(div, act)
{
    var i;
    var searchnodes = [];
    var vy, vx, v;
    
    if( div.zSize ) return;
    div.zSize = true;

    for ( i = 0; i < rad_size_tree.length; ++i )
    {
        searchnodes.push( [ rad_size_tree[i], 0 ] );
    }
    var last_parent = false;
    while( searchnodes.length > 0 )
    {
        vy = searchnodes.shift();
        vx = vy[0];
        if ( vy[1] == 1 )
        {
            vx[2].push( [div, act, [], 0] );
            return;
        }

        if ( isAncestorOf(div, vx[0]) )
        {
            last_parent = vx;
            searchnodes.unshift([ vx, 1 ]);
            for ( i = 0; i < vx[2].length; ++i )
            {
                searchnodes.unshift([ vx[2][i], 0 ] );
            }
        }
    }

    rad_size_tree.push( [ div, act, [], 0 ] );
}
function flagSized(div)
{
    var i;
    if ( rad_tmy != -1 )
    {
        clearTimeout(rad_tmy);
        renderSize(false);
        rad_resize_count++;
        return;
    }
    rad_resize_count++;
    for ( i = 0; i < rad_size_tree.length; ++i )
    {
        if ( isAncestorOf(div, rad_size_tree[i][0]) )
        {
            radSchedResize();
            rad_size_tree[i][3]++;
            return i;
        }
    }
    return -1;
}
var rad_time_px = 1, rad_timer_count = 0;
function radSchedResize()
{
    if ( rad_tmy != -1 )
    {
        clearTimeout(rad_tmy);
    }
    rad_time_px = 1;
    renderSize(false);
    rad_resize_count++;
}
function renderSize(ready)
{
    rad_timer_count++;
    if ( ready && rad_prev_resize==rad_resize_count && (rad_tmy=-1) && renderSize2()==0 )
    {
        return;
    }
    rad_tmy=-1;
    rad_prev_resize = rad_resize_count;
    var the_matrix = [1, 30, 31, 32, 33, 50, 100, 200, 150, 500, 300];
    var who_am_i=-01;
    if ( ready )
    {
        if ( (who_am_i = the_matrix.indexOf(rad_time_px)) < the_matrix.length-1 )
        {
            rad_time_px = the_matrix[ who_am_i + 1 ];
        }
    }

    if ( rad_prev_resize == rad_resize_count )
    {
        rad_tmy = setTimeout("renderSize(true)", rad_time_px);
    }
    else
    {
        rad_tmy = setTimeout("renderSize(false)", rad_time_px);
    }
}
function renderSize2()
{
    var i, j, v;
    var cnx = 0, rendernodes = [];

    for ( i = 0; i < rad_size_tree.length; ++i )
    {
        rendernodes.unshift(rad_size_tree[i]);
    }
    while( rendernodes.length > 0 )
    {
        vx = rendernodes.shift();
        v = vx[0];
        if ( !v.parentNode || v.parentNode.clientHeight != 0 || v.parentNode.clientWidth != 0 )
        {
            pairCall( vx[0], vx[1] );
        }
        else
        {
            cnx++;
        }
        for ( j = 0; j < vx[2].length; j++ )
        {
            rendernodes.unshift(vx[2][j]);
        }
    }
    rad_resize_count = cnx;
    return cnx;
}
function renderTree(n)
{
    pairCall( n[0], n[1] );

    for ( var i = 0; i < n[2].length; ++i )
    {
        var k = n[2][i];
        if ( k[0].clientWidth != 0 || k[0].clientHeight != 0 )
        {
            renderTree(k);
        }
    }
}
function renderTest2()
{
    var i, j, k;

    rad_render_count = 0;

    for ( i = 0; i < rad_render_tree.length; ++i )
    {
        rxt = rad_render_tree[i];
        for ( j = 0; j < rxt.length; j++ )
        {
            k = rxt[j];
            if ( k[0].clientWidth != 0 || k[0].clientHeight != 0 )
            {
                pairCall(k[0], k[1]);
                rxt.splice(rxt.indexOf(k), 1);
                j = -1;
            }
            else
            {
                rad_render_count += rxt.length;
                break;
            }
        }
        if ( j == 0 )
        {
            rad_render_tree.splice(i, 1);
            i--;
        }
    }

    return rad_render_tree.length;
}

function pairCall( div, strfun )
{
    var x, n;
    if ( strfun.indexOf("(") == -1 )
    {
        x = strfun + "(div)";
    }
//  else if ( strfun.indexOf("div") > strfun.indexOf("(") )
//  {
//      x = strfun.replace('div', 'div');
//  }
    else
    {
        x = strfun;
        n = 0;
        while( (n = x.indexOf("(", n)) != -1 )
        {
            if ( x.substr(n + 1, 1) == ")" )
            {
                x = x.substr(0, n) + "(div)" + x.substr(n + 2);
            }
            else
            {
                x = x.substr(0, n) + "(div, " + x.substr(n + 1);
            }
            n++;
        }
    }
    try
    {
        n = eval(x);
    }
    catch (err)
    {
        console.log(x, err);
        //don't even think about//throw(err);
        /**/ n /**/ = /**/ -1 /**/ ;
    }
    return n;
}

function radResize()
{
    var rtree = [], rxt;
    
    for ( var i = 0; i < rad_size_tree.length; ++i )
    {
        rtree.push( rad_size_tree[i] );
    }
    
    while( rtree.length > 0 ) {
        rxt = rtree.shift();
     
        for ( var j = 0; j < rxt[2].length; ++j )
        {
            rtree.push( rxt[2][j] );
        }

        pairCall(rxt[0], rxt[1]);
    }
    return 0;
}
function scaleDiv( idiv )
{
    var x, xp, xpy, y, i;
    var found;
    var process_children = true;

    radScanClass(idiv);

    if ( isValid(idiv.xroot) )
    { //&& !isValid(idiv.croot)
        idiv.croot = radTranslate(idiv.xroot);
    }

    radNode = idiv;

    if ( isValid(x = idiv.xParams) )
    {
        xp = x.split(',');
        var ob = {};
        for ( i = 0; i < xp.length; ++i )
        {
            xpy = xp[i].split('=');
            if( xpy.length <= 1 ) {
                xpy = xp[i].split(":");
                if( xpy.length <= 1 ) {
                    console.log("Invalid parameters " + idiv.xParams);
                    break;
                }
            }
            ob[ xpy[0].trim() ] = radTranslate( xpy.slice(1).join().trim() );
        }
        idiv.params = ob;
    }
    
    if( typeof idiv.rqo == 'object' ) {
        var dName = radTranslate( idiv.rqo['dataname'] );
        var dType = radTranslate( idiv.rqo );
        //console.log("Got rqo " + dName);
        radType( dName, dType );
    }

    for ( i = 0; i < origin_check.length; ++i )
    {
        if ( isValid(x = idiv['o' + origin_check[i]]) && x.indexOf("#") >= 0 )
        {
            y = radTransParm(x);
            idiv[origin_check[i]] = y;
            idiv.setAttribute(origin_check[i], y);
        }
        if ( isValid(x = idiv['x' + origin_check[i].capitalize()]) )
        {
            y = radTranslate(x);
            idiv[origin_check[i]] = y;
            idiv.setAttribute(origin_check[i], y);
        }
        else if ( isValid(x = idiv[origin_check[i]]) && typeof x == 'string' && x.indexOf("#") >= 0 )
        {
            y = radTransParm(x);
            idiv[origin_check[i]] = y;
            idiv.setAttribute(origin_check[i], y);
        }
    }
    if ( isValid(x = idiv.ocn) && x.indexOf("#") >= 0 )
    {
        idiv.className = radTransParm(x);
    }
    if ( isValid(x = idiv.oval) && x.indexOf("#") >= 0 )
    {
        idiv.value = radTransParm(x);
    }

    for ( i = 0; i < transfer_parms.length; ++i )
    {
        if( isValid( x=getAttribute(idiv, transfer_parms[i]) ) ) {
            y = 'c' + transfer_parms[i].substr(1);
            idiv[y]=radTranslate(x);
        }
    }

    for ( i = 0; i < event_parms.length; ++i )
    {
        if ( isValid(x = idiv['x' + event_parms[i].capitalize()]) )
        {
            idiv.setAttribute('on' + x, radTransParm(x));
        }
    }
    if ( isValid(x = idiv.xCmd) )
    {
        idiv.setAttribute('onclick', radTransParm(x));
    }
    if ( isValid(x = idiv.xMouseDown) )
    {
        idiv.setAttribute('onmousedown', radTransParm(x));
    }
    if ( isValid(x = idiv.xMouseOver) )
    {
        idiv.setAttribute('onmouseover', radTransParm(x));
    }
    if ( isValid(x = idiv.xMouseOut) )
    {
        idiv.setAttribute('onmouseout', radTransParm(x));
    }
/*  if ( isValid(x = idiv.xChange) )
        idiv.setAttribute('onchange', radTransParm(x)); */
    
    if ( isValid(x = idiv.xDisp) )
    {
        idiv.style.display = radTransParm(x);
    }
    
    if ( isValid(x = idiv.xTest) )
    {
        try
        {
            if ( !eval(radTranslate(x)) )
            {
                idiv.style.display = 'none';
                return false;
            }
            else
            {
                idiv.style.display = 'block';
            }
        }
        catch (err)
        {
            console.warn('test ' + x + ": " + radTranslate(x), err);
        }
    }

/*
    if ( isValid(idiv.id) )
        console.log('scaling ' + idiv.id + ": " + idiv.innerHTML);
    else if ( isValid(idiv.name) )
        console.log('scaling "' + idiv.name + '"' + ": " + idiv.innerHTML);
    else if ( isValid(idiv.className) )
        console.log('scaling [' + idiv.className + ']' + ": " + idiv.innerHTML);
//  else if ( isValid(idiv.text) )
//      console.log('scaling ' + idiv.text);
//*/

    for ( i = 0; i < html_parms.length; ++i )
    {
        if ( isValid(x = idiv['x' + html_parms[i]]) )
        {
            idiv.setAttribute(html_parms[i], radTranslate(x));
        }
    }
    if ( isValid(x = idiv.xForm) )
    {
        idiv.xFormTarget = radTransParm(x); 
    }
    if ( isValid(x = idiv.xFormCb) )
    {
        idiv.xFormCb = radTransParm(x);
    }
    if ( isValid(x = idiv.xOnRender) )
    {
        onRender(idiv, x);  
    }
    if ( isValid(x = idiv.xOnSize) )
    {
        onSize(idiv, x);
    }


    if ( isValid(x = idiv.xSelect) )
    {
        var xc = radTransParm(x);
        idiv.xselectcat = xc;
        if ( !isValid(idiv.className) )
        {
            idiv.className = "rselectable";
        }
        else if ( idiv.className.indexOf("rselect") < 0 )
        {
            idiv.className += " rselectable";
        }

        if ( !(xc in selectcats) )
        {
            selectcats[xc] = [idiv];
        }
        else if ( !(idiv in selectcats[xc]) )
        {
            selectcats[xc].push(idiv);
        }

        idiv.setAttribute('onselectstart', 'radSelectStart(this)');
        idiv.setAttribute('onselectionchange', 'radSelectChange(this)');
    }

    if ( isValid(idiv.croot) )
    {
        radFactor(idiv.croot, idiv);
    }

    if ( isValid(x = idiv.xSelectArea) )
    {
        el.setAttribute('onmousedown', 'radSelectAreaDown(event)');
    }

    if ( isValid(x = idiv.xWatch) )
    {
        if( !isValid(idiv.id) || idiv.id == "" ) {
            idiv.id = "watcher_" + str_rand(12);
//            console.log("xWatch without id: " + idiv.xWatch);
        }
        var x2 = radTranslate(x);
        var xs = x2.split(',');
        for( var xsi in xs ) {
            x = xs[xsi];
            x = radTransParm(x);
            if( x == '' ) continue;
            if ( x in radWatches )
            {
                if ( radWatches[x].indexOf(idiv.id) == -1 )
                {
                    radWatches[x].push(idiv.id);
                }
            }
            else
            {
                radWatches[x] = [idiv.id];
            }
        }
    }


    if ( isValid(x = idiv.xWatch2) )
    {
        if( !isValid(idiv.id) || idiv.id == "" ) {
            idiv.id = "watcher2_" + str_rand(12);
//            console.log("xWatch2 without id: " + idiv.xWatch2);
        }
        var x2 = radTranslate(x);
        var xs = x2.split(',');
        for( var xsi in xs ) {
            x = xs[xsi];
            x = radTransParm(x);
            if( x == '' ) continue;
            if ( x in radWatch2 )
            {
                if ( radWatch2[x].indexOf(idiv.id) == -1 )
                {
                    radWatch2[x].push(idiv.id);
                }
            }
            else
            {
                radWatch2[x] = [idiv.id];
            }
        }
    }

    if ( isValid(x = idiv.xWatch3) )
    {
        if( !isValid(idiv.id) || idiv.id == "" ) {
            idiv.id = "watcher3_" + str_rand(12);
//            console.log("xWatch3 without id: " + idiv.xWatch3);
        }
        var x2 = radTranslate(x);
        var xs = x2.split(',');
        for( var xsi in xs ) {
            x = xs[xsi];
            x = radTransParm(x);
            if( x == '' ) continue;
            if ( x in radWatch3 )
            {
                if ( radWatch3[x].indexOf(idiv.id) == -1 )
                {
                    radWatch3[x].push(idiv.id);
                }
            }
            else
            {
                radWatch3[x] = [idiv.id];
            }
        }
    }


    if ( idiv.id in radChanges )
    {
        for ( x in radChanges[idiv.id] )
        {
            if ( prop_defaults.indexOf(x) >= 0 )
            {
                idiv[x] = radChanges[idiv.id][x];
            }
            else
            {
                idiv.setAttribute(x, radChanges[idiv.id][x]);
            }
        }
    }

    if ( isValid(x = idiv.origcontent) )
    {
        if ( idiv.parentNode && idiv.parentNode.localName == 'textarea' )
        {
            idiv.parentNode.value = radTranslate(x);
        }
        else
        {
            idiv.innerHTML = radTranslate(x);
        }
        process_children = false; 
    }

    if ( isValid(x = idiv.xSect) )
    {
        var xs = x.split(',');
        for( var xsi in xs ) {
            x = xs[xsi];
            x = radTransParm(x);
            if ( !(x in radSects) )
            {
                radSects[x] = [ idiv ];
            }
            else if ( searchForParent(radSects[x], idiv) === false )
            {
                radSects[x].push(idiv);
            }
        }
    }

    if( isValid(idiv.xDrag) )
    {
        idiv.xy_draginit = radTranslate( idiv.xDragInit );
        idiv.xy_dragget = radTranslate( idiv.xDragGet );
        idiv.xy_dragset = radTranslate( idiv.xDragSet );
    }

    if ( isValid(x = idiv.xCast) )
    {
        // cast into template
        x = radTranslate(x);
        if( (y=x.indexOf("(")) != -1 ) {
        	var z = x.indexOf(")");
        	var a = x.substring(y+1,z);
        	var b = x.substr(0,y);
        	//! todo: parse ""
        	var lst = a.split(",");
        	for( var i=0; i<lst.length; i++ ) {
        		if( !isValid(lst[i]) ) continue;
        		var details = lst[i].split("=");
        		console.log("cast details:", details);
        		if( details.length < 2 ) {
        			console.log("invalid cast " + x + ": " + lst[i]);
        			continue;
        		}
        		if( details[0][0] == '#' ) {
        			if( typeof idiv.params == 'undefined' ) {
        				idiv.params = {};
        			}
        			idiv.params[ details[0].slice(1) ] = details[1];
        		} else {
        			idiv[ details[0] ] = details[1];
        		}
        	}
        	x = b;
        }
        try
        {
            blitzTemplate(idiv, x);
        }
        catch(err)
        {
            console.log(x, err);
        }
        process_children = false;
    }

    if ( isValid(x = idiv.xDraw) )
    {
        x = radTranslate(x);
        if ( (i = x.indexOf("(")) == -1 )
        {
            try
            {
                var xfunc = eval( x );
                var a = xfunc( idiv );
                if ( a === false )
                {
                    process_children = false;
                }
            }
            catch(err)
            {
                process_children = false;
                console.log(x, err);
            }
        }
        else
        {
            if ( pairCall(idiv, x) === false )
            {
                process_children = false;
            }
        }
    }

    if( typeof idiv.xStyle != 'undefined' ) {
        radStyle(idiv);
    }

    if ( isValid(x = idiv.xFirstLoad) )
    {
        if ( getStyle(idiv, 'display') != 'none' && !isValid(idiv.done_loading) )
        {
//          idiv.done_loading = true;
            x = radTranslate(x);
            if ( (i = x.indexOf("(")) == -1 )
            {
                try
                {
                    var xfunc = eval( x );
                    var a = xfunc( idiv );
                    if ( a )
                    {
                        idiv.done_loading = true;
                    }
                }
                catch(err)
                {
                    process_children = false;
                    console.log(x, err);
                }
            }
            else
            {
                if ( pairCall(idiv, x) )
                {
                    idiv.done_loading = true;
                }
            }
        }
    }
    
    if ( isValid(x = idiv.xAView ) ) {
    	idiv.xView = "view/" + idiv.xAView + ".html";
    }
    if ( isValid(x = idiv.xView) ) {
    	if( typeof idiv.viewLoaded == 'undefined' ) {
    		if( !isValid(idiv.id) || idiv.id == "" ) {
    			idiv.id = "view_" + str_rand(12);
    		}
    		if( idiv.id in radViews ) {
    		    radViewHandler(radViews[idiv.id].data, idiv.id, null);
    		} else {
    		    radViews[ idiv.id ] = { 'url': radTranslate(x), 'data': null };
    		    HtmlRequestGet( radViews[idiv.id].url, '', radViewHandler, idiv.id );
    		}
    	}
    }

    if ( isValid(x = idiv.xChart) )
    {
        var lNodes = [], i, j, sortie, sortfield, sortfield2;
        var fc, y, z, xDiv, yDiv, xRoot, xTest;
        var cdArr, cdSrt;

        if ( isValid(y = idiv.croot) )
        {
            fc = x + "_" + y;
        }
        else
        {
            fc = x + "_0";
        }
        var sd = idiv.xSeed;
        if ( isValid(sd) )
        {
            fc += "_" + sd;
        }
        else
        {
            console.log("invalid chart seed");
        }
        if ( !(fc in radCharts) )       
        {
            radCharts[fc] = cloneObject(radCharts[x + "_"]);
        }

        var build = gE("ch" + fc);
        if ( typeof build != 'undefined' && build !== false && build !== null )
        {
            console.log("Node existed: " + fc);
            kamiNode(build);
        }

        build = cDivId("ch" + fc);

//      if ( !isValid(sortfield = radCharts[fc].sort) ) sortfield="";
        sortfield = radCharts[fc].sort || "";
//      if ( !isValid(sortfield2 = radCharts[fc].sort2) ) sortfield2="";
        sortfield2 = radCharts[fc].sort2 || "";
        xTest = isValid(idiv.xTest);

        sortie2 = sortie = -1;

        // load template:
        for ( i = idiv.childNodes.length-1; i >= 0; --i )
        {
            xDiv = idiv.childNodes[i];
            if ( xDiv.nodeName == "#comment" || xDiv.nodeName == "SCRIPT" || xDiv.nodeName == "#text" || xDiv.nodeName == 'svg' )
            {
                continue;
            }
            if ( !isValid(xDiv.xHeader) )
            {
                idiv.removeChild( xDiv );
            }
            else
            {
                lNodes.unshift(xDiv);
            }
        }

        aC( idiv, build );
        xRoot = idiv.croot;
        build.setAttribute("xroot", xRoot);
        subRead(build); // ok

        
        // load list values from db:
        var ixm = [], ix;
        var cdOri = radVar(xRoot);

        if ( typeof cdOri.length == 'undefined' )
        {
            i = 0;
            cdArr = [];
            for ( ix in cdOri )
            {
                ixm[i] = ix;
                cdArr[i] = cdOri[ix];
                i++;
            }
        }
        else
        {
            cdArr = cdOri;
            ixm = false;
        }


        // sort cdArr by sort field
        if ( sortfield != '' )
        {
            if ( sortfield2 != "" )
            {
                cdArr = subSort( cdArr, [sortfield, sortfield2] );
            }
            else
            {
                cdArr = subSort( cdArr, [sortfield] );
//              console.log("sorted:" + fPrint(cdArr, 2));
            }
        }

        radCharts[fc].len = cdArr.length;

        // draw headers:
        //! add onclick-sort and highlight current sort field
        var headtxt;

        for ( j = 0; j < lNodes.length; ++j )
        {
            xDiv = lNodes[j].cloneNode(true);
            if ( xDiv.xHeader == 'false' ) 
            {
                continue;
            }
            aC(build, xDiv);
            subRead(xDiv);
            headtxt = xDiv.xHeader;
            if ( headtxt == null || typeof headtxt == 'undefined' || headtxt == "" || headtxt == " " )
            {
                headtxt = "&nbsp;";
            }
            if ( xDiv.className != "" )
            {
                xDiv.className = xDiv.className + " fl";
            }
            else
            {
                xDiv.className = "fl";
            }
            if ( isValid(xDiv.xSort) )
            {
                if ( sortfield == xDiv.xField )
                { // currently sorted
                    xDiv.style.fontSize = "+2";
                    xDiv.style.fontDecoration = 'none';
                    xDiv.style.cursor = 'hand';
                }
                else if ( sortfield2 == xDiv.xField )
                {
                    xDiv.style.fontSize = "+1";
                    xDiv.style.fontDecoration = 'underline';
                    xDiv.style.cursor = 'pointer';
                    xDiv.setAttribute('onclick', "resortChart('" + fc + "', '" + xDiv.xField + "')");
                }
                else
                {
                    xDiv.style.cursor = 'pointer';
                    xDiv.style.fontDecoration = 'underline';
                    xDiv.setAttribute('onclick', "resortChart('" + fc + "', '" + xDiv.xField + "')");
                }
            }
            xDiv.innerHTML = headtxt;
        }
        aC( build, cBR() );
//      if ( xRoot.indexOf("cfgs") != -1 )
//          alert("Length [" + xRoot + "]=" + cdArr.length);
        radCharts[fc].bld = build;

        var sbuild;

        for ( i = 0; i < cdArr.length; ++i )
        {
            if ( ixm !== false ) ix = ixm[i];
            else ix = i;

            sbuild = cE("div");
            sbuild.setAttribute("xRoot", xRoot + "." + ix);
            aC(build, sbuild);
            subRead(sbuild);

            for ( j = 0; j < lNodes.length; ++j )
            {
                if ( xTest !== false )
                {
                    try
                    {
                        var xt = eval(radTranslate(xTest));
                        if ( !xt(xDiv, xRoot, ix) )
                        {
                            continue;
                        }
                    }
                    catch (err)
                    {
                        console.log(xTest + " j=" + j + ", i=" + i, err);
                    }
                }
                xDiv = lNodes[j].cloneNode(true);
//              if ( !xDiv.hasAttribute('xroot') )
//                  xDiv.setAttribute('xroot', xRoot + "." + ix);
                aC(sbuild, xDiv);
                if ( isValid(x = getAttribute(xDiv, 'xChartCmd')) )
                {
                    x = str_replace("#id", ix, str_replace("#k", i, x));
                    xDiv.setAttribute('xCmd', x);
                    xDiv.style.cursor = 'pointer';
                }
                subRead(xDiv);
                if ( isValid(x = xDiv.xClass) )
                {
//                  if ( xDiv.className != "" && xDiv.className.indexOf("~") ){
//                      xDiv.className = xDiv.className + " " + x;
//                  }
//                  else
//                  {
                    xDiv.className = x;
//                  }
                    radScanClass(xDiv);
                }
                if ( isValid(x = xDiv.xId) )
                {
                    xDiv.id = radTranslate(x);
                }
                if ( isValid(x = xDiv.xName) )
                {
                    xDiv.name = radTranslate(x);
                }
                if ( isValid(x = xDiv.xTypedraw) )
                {
                    try
                    {
                        var xfunc = eval(radTransParm(x));
                        if ( xfunc(xDiv, xRoot, ix) )
                        {
                            readDiv(xDiv, xDiv.parentNode);
                            loadDiv(xDiv);
                            sizeDiv(xDiv, true);
                        }
                    }
                    catch (err)
                    {
                        console.log(x + " j=" + j + ", i=" + i, err);
                    }
                }
                else if ( isValid(y = xDiv.xViewField) )
                {
                    x = xDiv.xField;
                    xDiv.innerHTML = radTranslate( str_replace("#id", i, str_replace('#field', '#' + ix + '.' + x, y)) );
                }
                else
                {
                    x = xDiv.xField;
                    y = xDiv.xType;
                    if ( y == 'fixed' )
                    {
                        xDiv.xparser = "#" + xRoot + "." + ix + "." + x;
                        xDiv.innerHTML = xDiv.xcontent = radTransParm("#" + xRoot + "." + ix + "." + x);
                    }
                    else if ( y == 'head' )
                    {
                        if ( !isValid(xDiv.className) || xDiv.className == '' || xDiv.className == 'fl' )
                            xDiv.className = 'technihead fl';
                        else
                            xDiv.className += ' technihead fl';
                        xDiv.innerHTML = radTransParm("#" + xRoot + "." + ix + "." + x);
                        xDiv.xcontent = radTransParm("#" + xRoot + "." + ix + "." + x);
                    }
                    else if ( y == 'value' )
                    {
                        yDiv = cTextbox(x, radTransParm('#' + xRoot + "." + ix + '.' + x));
                        aC(xDiv, yDiv);
                    }
                    else if ( y == 'textarea' )
                    {
                        yDiv = cTextarea(x, radTransParm('#' + xRoot + "." + ix + '.' + x));
                        yDiv.cols = 12;
                        yDiv.rows = 2;
                        aC(xDiv, yDiv);
                    }
                    else if ( y == 'smnumval' )
                    {
                        yDiv = cTextbox(x, radTransParm('#' + xRoot + "." + ix + '.' + x));
                        yDiv.size = 4;
                        aC(xDiv, yDiv);
                    }
                    else if ( y == 'lgnumval' )
                    {
                        yDiv = cTextbox(x, radTransParm('#' + xRoot + "." + ix + '.' + x));
                        yDiv.size = 10;
                        aC(xDiv, yDiv);
                    }
                    else if ( y == 'hidden' )
                    {
                        yDiv = cHidden(x, radTransParm('#' + xRoot + "." + ix + '.' + x));
                        aC(xDiv, yDiv);
                    }
                    else if ( y == 'showid' )
                    {
                        yDiv = cHidden(x, radTransParm('#' + xRoot + "." + ix + '.' + x));
                        aC(xDiv, yDiv);
                        yDiv = cFlText(radTransParm('#' + xRoot + "." + ix + '.' + x));
                        aC(xDiv, yDiv);
                    }
                    else if ( y == 'range' )
                    {
                    }
                    else if ( y == 'list' )
                    {
                    }
                }
            }
            aC( build, cBR() );
        }
        radCharts[fc].done = true;

        if( idiv.xScrollBottom ) {
            idiv.scrollTop = idiv.scrollHeight;
        }
        return false;
    }

    if ( isValid(x = idiv.xSwitch) )
    {
        x = radTranslate(x);
        if ( x.substr(0, 1) == '.' )
        {
            x = idiv.croot + x;
        }
        var xVal = radVar(x);
        
        for ( i = idiv.childNodes.length-1; i >= 0; i-- )
        {
            if ( isValid(x = idiv.childNodes[i].xCase) && radTranslate(x) == xVal )
            {
                idiv.childNodes[i].style.display = 'block';
            }
            else
            {
                idiv.childNodes[i].style.display = 'none';
            }
        }
    }

    if ( isValid(x = idiv.xEmptyLoop) )
    {
        var uKey=radTranslate(idiv.xKey), uInd=radTranslate(idiv.xInd), uVal=radTranslate(idiv.xVal);
        var isOpen=true, xVal, xKey, xInd, xTest;
        x = radTranslate(x);
        if ( x.substr(0, 1) == '.' )    x = idiv.croot + x;
        var cdArr = radVar(x);
        if ( !isValid(xTest = idiv.xFilter) )   xTest = false;

        if ( cdArr == null || cdArr == 'null' || cdArr === false || ( cdArr && cdArr.length == 0 ) || ( typeof cdArr == 'object' && Object.keys(cdArr).length == 0 ) )
            isOpen=false;
        if( isOpen && xTest !== false )
        {
            if ( typeof cdArr.length == 'undefined' )
            {
                isOpen=false;
                xInd = 0;
                for ( ix in cdArr )
                {
                    xKey = ix;
                    xVal = cdArr[xKey];

                    if ( isValid(uKey) )    radCXStore( uKey, xKey );
                    if ( isValid(uVal) )    radCXStore( uVal, cdArr[xKey] );
                    if ( isValid(uInd) )    radCXStore( uVal, xInd );

                    if ( !eval(radTranslate(xTest)) ) {
                        xInd++;
                        continue;
                    }
                    isOpen=true;
                    break;
                }
            } else {
                for ( xInd = 0; xInd < cdArr.length; ++xInd )
                {
                    xKey = xInd;
                    xVal = cdArr[xInd];

                    if ( isValid(uKey) )    radCXStore( uKey, xKey );
                    if ( isValid(uInd) )    radCXStore( uxInd, xInd );
                    if ( isValid(uVal) )    radCXStore( uVal, cdArr[xKey] );

                    if ( !eval(radTranslate(xTest)) )
                        continue;
                    isOpen=true;
                    break;
                }
            }
        }
        idiv.style.display = isOpen ? 'none' : 'block';
    }

    if ( isValid(x = idiv.xLoopHead) )
    {
        var uKey=radTranslate(idiv.xKey), uInd=radTranslate(idiv.xInd), uVal=radTranslate(idiv.xVal);
        var isOpen=true, xVal, xKey, xInd, xTest;
        x = radTranslate(x);
        if ( x.substr(0, 1) == '.' )    x = idiv.croot + x;
        var cdArr = radVar(x);
        if ( !isValid(xTest = idiv.xFilter) )   xTest = false;

        if ( cdArr == null || cdArr == 'null' || cdArr === false || ( cdArr && cdArr.length == 0 ) || ( typeof cdArr == 'object' && Object.keys(cdArr).length == 0 ) )
            isOpen=false;
        if( isOpen && xTest !== false )
        {
            if ( typeof cdArr.length == 'undefined' )
            {
                isOpen=false;
                xInd = 0;
                for ( ix in cdArr )
                {
                    xKey = ix;
                    xVal = cdArr[xKey];

                    if ( isValid(uKey) )    radCXStore( uKey, xKey );
                    if ( isValid(uVal) )    radCXStore( uVal, cdArr[xKey] );
                    if ( isValid(uInd) )    radCXStore( uVal, xInd );

                    if ( !eval(radTranslate(xTest)) ) {
                        xInd++;
                        continue;
                    }
                    isOpen=true;
                    break;
                }
            } else {
                for ( xInd = 0; xInd < cdArr.length; ++xInd )
                {
                    xKey = xInd;
                    xVal = cdArr[xInd];

                    if ( isValid(uKey) )    radCXStore( uKey, xKey );
                    if ( isValid(uInd) )    radCXStore( uInd, xInd );
                    if ( isValid(uVal) )    radCXStore( uVal, cdArr[xKey] );

                    if ( !eval(radTranslate(xTest)) )
                        continue;
                    isOpen=true;
                    break;
                }
            }
        }
        idiv.style.display = isOpen ? 'block' : 'none';
    }

    if ( isValid(x = idiv.xLoopMore) )
    {
        x = radTranslate(x);
        if ( x.substr(0, 1) == '.' )
        {
            x = idiv.croot + x;
        }
        var cdArr = radVar(x);
        var i, cdOri = radVar(x), xMax = idiv.xMax, foundMore = false;

        if ( cdOri != null && typeof cdOri.length == 'undefined' )
        {
            i = 0;
            for ( ix in cdOri )
            {
                i++;
                if ( i >= xMax )
                {
                    foundMore = true;
                    break;
                }
            }
        }
        else if ( cdOri != null && cdOri.length > xMax )
        {
            foundMore = true;
        }

        if ( foundMore )
        {
            idiv.style.display = 'block';
        }
        else
        {
            idiv.style.display = 'none';
        }
    }

    if ( isValid(x = idiv.xLoop) && idiv.style.display != 'none' )
    {
        var uKey=radTranslate(idiv.xKey), uInd=radTranslate(idiv.xInd), uVal=radTranslate(idiv.xVal);
        var cdN, cdArr, i, j, qry;
        var xNode, tDiv, keytab = [];
        var maxChild, xTest = false;

        x = radTranslate(x);
        if ( x.substr(0, 1) == '.' )
        {
            x = idiv.croot + x;
        }
        idiv.xcontent = x; // complete name of loop list

//      if ( x == "

        // load list values from db:
        var cdOri = radVar(x), cdTmp;
        var ixm = [], ix;
        var ixMax = isValid(idiv.xMax) ? idiv.xMax : -1;
        var redraw_loop = false;
        var xVal, xKey, xInd, xTest;
        if ( !isValid(xTest = idiv.xFilter) )
        {
            xTest = false;
        }

        if ( cdOri == null ) cdOri = [];

        // pre-run list contents, removing filter and setting indices
        if ( typeof cdOri.length == 'undefined' )
        {
            xInd = 0;
            cdArr = [];
            for ( ix in cdOri )
            {
                xKey = ix;
                xVal = cdOri[xKey];

                if ( isValid(uInd) )    radCXStore( uInd, xInd );
                if ( isValid(uKey) )    radCXStore( uKey, xKey );
                if ( isValid(uVal) )    radCXStore( uVal, cdOri[xKey] );

                if ( xTest !== false && !eval(radTranslate(xTest)) ) {
                    continue;
                }

                ixm[xInd] = xKey;
                cdArr[xInd] = xVal;
                xInd++;
                if ( ixMax > 0 && xInd >= ixMax )
                    break;
            }
        } else {
            cdArr = cdOri;
            if ( xTest !== false )
            {
                for ( xInd = 0; xInd < cdArr.length; ++xInd )
                {
                    xKey = xInd;
                    xVal = cdArr[xInd];

                    if ( isValid(uKey) )    radCXStore( uKey, xKey );
                    if ( isValid(uInd) )    radCXStore( uInd, xInd );
                    if ( isValid(uVal) )    radCXStore( uVal, cdArr[xInd] );

                    if ( !eval(radTranslate(xTest)) )
                    {
                        cdArr.splice(xInd, 1);
                        xInd--;
                    }
                }
            }
            ixm = false;
        }
        if ( isValid(idiv.xSort) )
        {
//          cdTmp = cdArr;
            radsort_key = idiv.xSort;
            cdArr.sort(radSortArray);
            if ( ixm.length > 0 )
            {
                for ( ix in cdOri )
                {
                    for ( i = 0; i < cdArr.length; ++i )
                    {
                        if ( cdOri[ix] == cdArr[i] )
                        {
                            ixm[i] = ix;
                            break;
                        }
                    }
                }
            }
            var sxi = "";
            for ( i = 0; i < cdArr.length; i++ )
            {
                if ( sxi != "" ) sxi += ",";
                sxi += cdArr[i][radsort_key];
            }
//          console.log(sxi);
            redraw_loop = true;
//          cdArr = [];
//          for ( ix = 0; ix < cdTmp.length; ix++ )
//          {
//          }
        }
        
//      cdArr = radVar(radTranslate(x));

        // limit to particular values:
        if ( isValid(qry = idiv.pagequery) )
        {
            /*
            idiv.pagemax = radTranslate(x);
            idiv.pagecmd = radTranslate(x);
            */
            var per = radQueries[qry].limn;
            var i = (radQueries[qry].n-1) * per;
            var found = false, valid = true;
            for ( n = 0; n < per; ++n )
            {
                if ( cdOri && ((n + i) in cdOri) )
                {
                    keytab.push(n + i);
                    found = true;
                }
                else
                {
                    keytab.push(false);
                    if ( valid )
                    {
                        valid = false;
                        radLoadData(qry, radQueries[qry].n);
                    }
                }
            }
            if ( !found )
            {
                // no data in page
                cdArr = [];
            }
            else
            {
                // refine cdArr by keytab
                var cdX = [];
                for ( n = 0; n < per; n++ )
                {
                    if ( keytab[n] === false ) continue;
                    ixm[ n ] = keytab[n];
                    cdX[ n ] = cdOri[ keytab[n] ];
                }
                cdArr = cdX;
            }
        }

        // study existing divs to see if we need to rewrite the list:
        var cdPre = [];     
        if ( !redraw_loop )
        {
            for ( i = idiv.childNodes.length-1; i >= 0; --i )
            {
                xNode = idiv.childNodes[i];
                if ( xNode.nodeName == "#comment" || xNode.nodeName == "script" || xNode.nodeName == "#text" || xNode.nodeName == 'svg' )
                {
                    continue;
                }
                if ( xNode.hasAttribute("isForChild") && isValid(xNode.getAttribute("isForChild")) )
                {
                    ix = ( ixm !== false && xNode.loopindex in ixm ) ? ixm[ xNode.loopindex ] : xNode.loopindex;
                    if ( !(xNode.loopindex in cdArr) || (ix != xNode.loopkey) || (cdArr[xNode.loopindex] != xNode.loopval) )
                    {
                        redraw_loop = true;
                        break;
                    }
                }
                else
                {
                    xNode.style.display = 'none';
                }
            }
        }
        if ( redraw_loop )
        {
            for ( i = idiv.childNodes.length - 1; i >= 0; --i )
            {
                xNode = idiv.childNodes[i];
                if ( xNode.nodeName == "#comment" || xNode.nodeName == "script" || xNode.nodeName == "#text" || xNode.nodeName == 'svg' )
                {
                    continue;
                }
                if ( xNode.hasAttribute("isForChild") && isValid(xNode.getAttribute("isForChild")) )
                {
                    idiv.removeChild( xNode );
                }
                else
                {
                    xNode.setAttribute("isForZero", "1");
                    xNode.style.display = 'none';
                }
            }
        }
        else
        { // generate cdPre
            for ( i = idiv.childNodes.length - 1; i >= 0; --i )
            {
                xNode = idiv.childNodes[i];
                if ( xNode.nodeName == "#comment" || xNode.nodeName == "script" || xNode.nodeName == "#text" || xNode.nodeName == 'svg' )
                {
                    continue;
                }
                if( !xNode.hasAttribute("isForChild") || !isValid(xNode.getAttribute("isForChild")) )
                {
                    xNode.setAttribute("isForZero", "1");
                    xNode.style.display = 'none';
                    continue;
                }
                ix = ( ixm !== false && xNode.loopindex in ixm ) ? ixm[ xNode.loopindex ] : xNode.loopindex;
                if ( !(xNode.loopindex in cdArr) || (ix != xNode.loopkey) || (cdArr[xNode.loopindex] != xNode.loopval) )
                {
                    idiv.removeChild( xNode );
//                  console.log(x + " cdPre remove:" + xNode.loopindex);
                }
                else
                {
                    var n;
                    for ( n = 0; n < cdPre.length; n += 2 )
                    {
                        if ( cdPre[n][0] == xNode.loopindex &&
                            cdPre[n][1] == xNode.loopkey &&
                            cdPre[n][2] == xNode.loopval )
                        {
                            cdPre[n + 1].push(xNode);
                            break;
                        }
                    }
                    if ( n >= cdPre.length )
                    {
                        cdPre.push( [ xNode.loopindex, xNode.loopkey, xNode.loopval ], [xNode] );
                    }
                }
            }
        }
        maxChild = idiv.childNodes.length;

        idiv.xLoopCount = typeof cdArr.length != 'undefined' ? cdArr.length : 'varied';

        // generate new children while re-drawing pre-made items:
        var escape_pre = false;
        if ( idiv.xReverseLoop == 1 )
        {
            if ( ixMax > 0 && ixMax < cdArr.length )
            {
                i = ixMax;
            }
            else 
            {
                i = cdArr.length;
            }
            while( i > 0 )
            {
                i--;
                ix = (ixm !== false) ? ixm[i] : i;

                escape_pre = false;
                for ( j = 0; j < cdPre.length; j += 2 )
                {
                    if ( cdPre[j][0] == i && cdPre[j][1] == ix && cdPre[j][2] == cdArr[i] )
                    {
                        escape_pre = true;
                        break;
                    }
                }

                if ( isValid(uInd) )
                {
                    radCXStore( uInd, ix );
                }

                if ( isValid(uKey) )
                {
                    radCXStore( uKey, i );
                }
                
                radCXStore( uVal, cdArr[i] );

                if (escape_pre)
                {
                    // redraw items
                    j++;
                    for ( n = 0; n < cdPre[j].length; ++n )
                    {
                        cdN = cdPre[j][n];
                        if ( cdN.style && cdN.style.display )
                        {
                            cdN.style.display = '';
                        }
                        subRead(cdN);
                    }
                    continue;
                }

                if ( isValid(x = radTranslate(idiv.xTest)) )
                {
                    try
                    {
                        if ( eval(x) != true )
                            continue;                       
                    }
                    catch (err)
                    {
                        console.log(x, err);
                    }
                }
                for ( j = 0; j < maxChild; ++j )
                {
                    if ( idiv.childNodes[j].nodeName == '#comment' || idiv.childNodes[j].nodeName == "#text" || idiv.childNodes[j].nodeName == 'svg' ) 
                    {
                        continue;
                    }
                    if ( idiv.childNodes[j].hasAttribute("isForChild") && isValid(idiv.childNodes[j].getAttribute("isForChild")) )
                    {
                        continue;
                    }
                    cdN = idiv.childNodes[j].cloneNode(true);
                    cdN.loopindex = i;
                    cdN.loopkey = ix;
                    cdN.loopval = cdArr[i];

                    // make child visible:
                    if ( cdN.style && cdN.style.display )
                    {
                        cdN.style.display = '';
                    }
                    cdN.setAttribute("isForChild", "yes");
                    cdN.removeAttribute("isForZero");
                    subRead(cdN);
                    radNode = idiv;
                    aC(idiv, cdN);
                }
            }
        }
        else
        {
            if ( ixMax <= 0 || cdArr.length < ixMax ) ixMax = cdArr.length;
            for ( i = 0; i < ixMax; ++i )
            {
                ix = ( ixm !== false ) ? ixm[i] : i;

                escape_pre = false;
                for ( j = 0; j < cdPre.length; j += 2 )
                {
                    if ( cdPre[j][0] == i && cdPre[j][1] == ix && cdPre[j][2] == cdArr[i] )
                    {
                        escape_pre = true;
                        break;
                    }
                }

                if ( isValid(uInd) )
                {
                    radCXStore( uInd, ix );
                }

                if ( isValid(uKey) )
                {
                    radCXStore( uKey, i );
                }
                
                radCXStore( uVal, cdArr[i] );

                if (escape_pre)
                {
                    // redraw items
                    j++;
                    for ( n = 0; n < cdPre[j].length; ++n )
                    {
                        cdN = cdPre[j][n];
                        if ( cdN.style && cdN.style.display )
                        {
                            cdN.style.display = '';
                        }
                        subRead(cdN);
                    }
                    continue;
                }

                if ( isValid(x = radTranslate(idiv.xTest)) )
                {                   
                    try
                    {
                        if ( eval(x) != true )
                        {
                            continue;
                        }
                    }
                    catch (err)
                    {
                        console.log(x, err);
                    }
                }
                for ( j = 0; j < maxChild; ++j )
                {
                    if ( idiv.childNodes[j].nodeName == '#comment' || idiv.childNodes[j].nodeName == "#text" || idiv.childNodes[j].nodeName == 'svg' )
                    {
                        continue;
                    }
                    if ( idiv.childNodes[j].hasAttribute("isForChild") && isValid(idiv.childNodes[j].getAttribute("isForChild")) )
                    {
                        continue;
                    }
                    cdN = idiv.childNodes[j].cloneNode(true);
                    cdN.loopindex = i;
                    cdN.loopkey = ix;
                    cdN.loopval = cdArr[i];

                    // make child visible:
                    if ( cdN.style && cdN.style.display )
                    {
                        cdN.style.display = '';
                    }
                    cdN.setAttribute("isForChild", "yes");
                    cdN.removeAttribute("isForZero");
                    aC(idiv, cdN);
                    subRead(cdN);
                }
            }
        }
        radXClear( uKey );
        radXClear( uVal );

        // do not process children, since they already have been, by subRead
        process_children = false;
    }
    else if ( isValid(x = idiv.xOptions) )
    {
        x = radTranslate(x);
        var exp_path, exp_val, exp_desc, exp_list, tform;
        if ( x.substr(0, 1) == '_' )
        {
            tform = x.substr(1).split(',');
            var tf, i;
            exp_list = [];
            exp_val = 'ev';
            exp_desc = 'ed';
            for ( i = 0; i < tform.length; i++ )
            {
                tf = tform[i].split('=');
                if ( tf.length <= 1 )
                {
                    exp_list.push( { 'ev': tform[i], 'ed': tform[i] } );
                }
                else
                {
                    exp_list.push( { 'ev': tf[0], 'ed': tf[1] } );
                }
            }
        } else {
            tform = x.split(',');
            if ( tform.length > 1 )
            {
                exp_path = tform[0];
                exp_val = tform[1];
                exp_desc = tform[2];
            } else {
                exp_path = x;
                exp_val = 1; exp_desc = 0;
            }
            exp_list = radVar(radTranslate(exp_path));
        }
        var newopt, vtype;
        if ( exp_list == null )
        {
        }

        vtype = ( typeof exp_list == 'object' ?
            ( Object.prototype.toString.call( exp_list ) == '[object Array]' ? 0 : 1 ) :
            2
            );
        if ( !isValid(exp_desc) || exp_desc=='' )
        {
            if ( exp_val == 0 ) exp_desc = 1;
            else if ( exp_val == 1 ) exp_desc = 0;
            else exp_desc = exp_val;
        }
        //clearNode(idiv);
        i = idiv.childNodes.length;
        while( i > 0 ) {
            i--;
            if( idiv.childNodes[i].isGenerated ) {
                idiv.removeChild( idiv.childNodes[i] );
            }
        }
        
        if ( vtype == 0 )
        {
            for ( i = 0; i < exp_list.length; i++ )
            {
                newopt = cE("option");
                newopt.isGenerated = true;
                if ( exp_val == 0 )
                {
                    newopt.value = i;
                }
                else if ( exp_val == 1 )
                {
                    newopt.value = exp_list[i];
                }
                else
                {
                    newopt.value = exp_list[i][exp_val];
                }
                if ( exp_desc == 0 )
                {
                    newopt.innerHTML = exp_list[i];
                }
                else if ( exp_desc == 1 )
                {
                    newopt.innerHTML = i;
                }
                else
                {
                    newopt.innerHTML = exp_list[i][exp_desc];
                }
                aC(idiv, newopt);
            }
        }
        else if ( vtype == 1 )
        {
            for ( i in exp_list )
            {
                newopt = cE("option");
                newopt.isGenerated = true;
                if( exp_val == 0 ) {
                    newopt.value = i;
                } else if( exp_val == 1 ) {
                    newopt.value = exp_list[i];
                } else {
                    newopt.value = exp_list[i][exp_val];
                }
//              newopt.value = (exp_val==0) ? i : ( (exp_val==1) ? exp_list[i] : exp_list[i][exp_val] );

                newopt.innerHTML = (exp_desc==0) ? exp_list[i] : ( (exp_desc==1) ? i : exp_list[i][exp_desc] );

                aC(idiv, newopt);
            }
        }
    }

    // check xConnect select/option values
    if ( isValid(idiv.xConnect) )
    {
        idiv.value = radTranslate(idiv.xConnect);
    }

    // continue processing chilren:

    if( idiv.xScrollBottom ) {
        idiv.scrollTop = idiv.scrollHeight;
    }
    return process_children;
}

function radStyle(idiv)
{
    var i,j;
    var s;
    var sw,rf;
    var nstyles = [ 'width', 'height', 'pad', 'padding', 'margin', 'border-width', 'left', 'top', 'right', 'bottom' ];

    for( i in idiv.xStyle ) {
        s = i.toLowerCase();
        rf = false;
        for( j=0; j<nstyles.length; j++ ) {
            if( s.indexOf(nstyles[j]) != -1 ) {
                rf = true;
                break;
            }
        }
        
        if( rf && idiv.xStyle[i].indexOf("px") != -1 ) {
            rf = false;
            onSize( idiv, 'radStyle' );
        }

        if( (sw=s.indexOf("-")) != -1 ) { // margin-left -> marginLeft
            s = s.substr(0,sw) + s.substr(sw+1,1).toUpperCase() + s.substr(sw+2);
        }
        if( rf ) {
            idiv.style[s] = radParseAnyway( idiv, radTranslate(idiv.xStyle[i]) ) + "px";
        } else {
            idiv.style[s] = radParseAnyway( idiv, radTranslate(idiv.xStyle[i]) );
        }
        continue;                
    }
}

var radsort_key = '';
function radSortArray(a, b)
{
    if ( parseInt(a[radsort_key]) < parseInt(b[radsort_key]) )
    {
        return -1;
    }
    if ( parseInt(a[radsort_key]) > parseInt(b[radsort_key]) )
    {
        return 1;
    }
    return 0;
}

function radFinish2(divid)
{
    var div = gE(divid);
    var idiv = div, i;
    var x = radTransParm(getAttribute(div, "xPostDraw2"));
    try
    {
        if ( (i = x.indexOf("(")) != -1 )
        {
            eval(x);
        }
        else
        {
            var xfunc = eval( x );
            if( typeof xfunc == 'function' ) {
                xfunc( idiv );
            }
        }
    }
    catch (err)
    {
        console.log(x, err);
        console.log(x + " Exception " + fPrint(err, 2));
        // throw err; // let's not // ok // if you all think so // must be a good idea
    }
}
function radFinish3(divid)
{
    var idiv = gE(divid);

    if( isValid(idiv.xDrag) )
    {
        var x,y;
        try
        {
            eval( idiv.xy_draginit );
            eval( idiv.xy_dragset );
        }
        catch (x)
        {
            alert("error: " + x);
        }

        idiv.setAttribute('onmousedown', 'radDrag(event)');
        if( !isValid(idiv.style.cursor) ) {
            if( idiv.xDrag == 'x' )
                idiv.style.cursor='ew-resize';
            if( idiv.xDrag == 'y' )
                idiv.style.cursor='ns-resize';
            if( idiv.xDrag == 'xy' )
                idiv.style.cursor='move';
        }
    }
}

function autoFinishDiv(idiv)
{
    var x;

    if ( idiv.nodeName == 'FORM' ) { // isValid(x = idiv.xFormTarget) )
//  {
        formstore.push(idiv);
        formTest();
        if( typeof idiv.xFormTarget != 'undefined' ) {
            idiv.basesubmit = ( idiv.hasAttribute('onsubmit') ) ? idiv.getAttribute('onsubmit') : null;
            idiv.setAttribute('onsubmit', 'return radFormSave(this);');
        }
    }

    if ( isValid(x = getAttribute(idiv, "xPostDraw2")) )
    {
        if( idiv.id == '' ) {
            console.log("Postdraw2 with no id");
        } else {
            setTimeout('radFinish2("' + idiv.id + '")',50);
        }
    }
    if( isValid(idiv.xDrag) )
    {
        if( idiv.id == '' ) {
            console.log("xDrag with no id");
        }
        setTimeout('radFinish3("' + idiv.id + '")',100);
    }
    if ( isValid(x = getAttribute(idiv, "xPostDraw")) )
    { // should we move this to post processing area? what if szL?
        x = radTransParm(x);
        try
        {
            if ( (i = x.indexOf("(")) != -1 )
            {
                if ( x.indexOf("div,") != -1 || x.indexOf("div)") != -1 )
                {
                    var div = idiv;
                    eval(x);
                }
                else
                {
                    eval( x.substr(0, i) + "(idiv," + x.substr(i + 1) );
                }
            }
            else
            {
                var xfunc;
                if( x.indexOf("idiv") == -1 && x.indexOf("div") != -1 ) {
                    var div = idiv;
                    xfunc = eval( x );
                } else {
                    xfunc = eval( x );
                }
                if( typeof xfunc == 'function' ) {
                    xfunc( idiv );
                }
            }
        }
        catch (err)
        {
            if ( x.indexOf("div,") != -1 || x.indexOf("div)") != -1 )
            {
                console.log(x, err);
            }
            else
            {
                console.log(x.substr(0, i) + "(idiv," + x.substr(i + 1), err);
            }
            console.log(x + " Exception " + fPrint(err, 2));
            // throw err; // let's not // ok // if you all think so // must be a good idea
        }
    }


}





var current_sort_algo;
function subSort(arr, fields)
{
    var i;
    current_sort_algo = fields;
    arr.sort(mySort);
    return arr;
}
function mySort(a, b)
{
    var i;
    var fn, isrev;
//  trk += a['a']+","+a['b']+","+a['c'] + ":" + b['a']+"," + b['b'] + "," + b['c'] + "<BR>";
    for ( i = 0; i < current_sort_algo.length; ++i )
    {
        fn = current_sort_algo[i];
        if ( fn.substr(0, 1) == "-" )
        {
            fn = fn.substr(1);
            isrev = true;
        }
        else
        {
            isrev = false;
        }
//untested but vaguely entertaining:
//return a[fn]> b[fn]? (isrev?1:-1) : ( (a[fn]<b[fn]) ? (isrev?-1:1) : 0
        if ( a[fn] > b[fn] )
        {
//          console.log(a[fn] + " > " + b[fn] + ":"+(isrev?-1:1));
            return isrev ? 1 : -1;
        }
        else if ( a[fn] < b[fn] )
        {
//          console.log(a[fn] + " < " + b[fn] + ":"+(isrev?1:-1));
            return isrev ? -1 : 1;
        }
    }
    return 0;
}
function resortChart(sheet, field)
{
    return;
}
var stopresize = false;
var szFinCB = [];
var szSingleRun = 0; // how many singleSizeDiv calls are running? (they might be nested via xDraw calls)
var szContWait = -1; // timer handle for when we are waiting to continue the scan
var formstore = [];
var formtimer = -1;

function formTest()
{
    if ( formstore.length > 0 )
    {
        if ( formtimer != -1 ) clearTimeout(formtimer);
        formtimer = setTimeout('finishForms()', 50);
    }
}
function finishForms()
{
    var i, j;

    formtimer=-1;
//  console.log("Processing " + formstore.length + " forms");
    for ( i = 0; i < formstore.length; ++i )
    {
//      console.log("Form " + formstore[i].name);
        radFormLoad(formstore[i]);
        for ( j = i + 1; j < formstore.length; ++j ) 
        {
            if ( formstore[i] == formstore[j] )
            {
                formstore.splice(j, 1);
                j--;
            }
        }
    }
    formstore = [];
}
var szStack = [];
function sizeDiv( div, onestack, cb )
{
    var i;

    if ( onestack )
    {
        singleSizeDiv(div, cb);
    } else {
        szStack.push([0, div, cb]);
    }
    if ( szSingleRun == 0 && szContWait == -1 )
    {
        szContWait = setTimeout('contSizeDiv()', 1);
    }
}
function contSizeDiv()
{
    if ( szContWait != -1 )
    {
        clearTimeout(szContWait);
        szContWait = -1;
    }

    if ( szSingleRun > 0 || stopresize == true )
        return;


    var vdivarr, vdiv, cb, i;

    if ( szStack.length == 0 )
    {
        if ( szFinCB.length > 0 )
        {
            var szFinCopy = szFinCB;
            szFinCB = [];

            for ( i = 0; i < szFinCopy.length; ++i )
            {
                szFinCopy[i]();
            }
        }
        return;
    }

    while( szStack.length > 0 )
    {
        vdivarr = szStack.shift();
        vdiv = vdivarr[1];
        if( vdivarr.length > 2 ) cb = vdivarr[2];
        else cb = false;

        if ( vdivarr[0] == 1 )
        {
            autoFinishDiv(vdiv);
            if( cb !== false && typeof cb == 'function' )
                cb(vdiv);
            if( (i = szStack.indexOf([1, vdiv])) != -1 )
                szStack.splice(i, 2);
            continue;
        }
        else
        {
            if ( vdiv && !isValid(vdiv.xTemp) )
                sizeOneDiv(vdiv, szStack, cb);
            break; // operation will continue if singleSizeDiv() is not running
        }
    }
    szContWait = setTimeout('contSizeDiv()', 1);
}
function singleSizeDiv(dv, xcb)
{
/*
singleSizeDiv()
uses an internal stack 'szList' to process a div and its children in one run
it uses szSingleRun incrementer to pause contSizeDiv() until singleSizeDiv() is done
 in case of xDraw calling more radLoadDiv() and radLoadSect()
 eg for templates subRead() calls
*/
    var szList = [[0, dv, xcb]];
    var i;
    var vdivarr, vdiv;
    var cb;

    szSingleRun++;
    while( szList.length > 0 )
    {
        vdivarr = szList.shift();
        vdiv = vdivarr[1];
        if( vdivarr.length > 2 ) cb = vdivarr[2];
        else cb = false;

        if ( vdiv.nodeName == "#text" )
        {
            console.log("trying to size a text node");
            continue;
        }
        try
        {
            if ( vdivarr[0] == 1 )
            {
                autoFinishDiv(vdiv);
                if( cb !== false && typeof cb == 'function' )
                    cb(vdiv);
                if( (i = szStack.indexOf([1, vdiv])) != -1 )
                    szStack.splice(i, 2);

                continue;
            }
            if ( !isValid(vdiv.xTemp) ) //! && !isDisabled(vdiv)
                sizeOneDiv(vdiv, szList, cb);
        }
        catch (err)
        {
            console.log("sizeOneDiv crash", err + " in div " + vdiv.nodeName + "." + vdiv.id + ", " + fPrint(err, 2));  
            szSingleRun--;
            throw err;
        }
    }

    if ( cb )
    {
        szFinCB.push(cb);
    }
    if ( szSingleRun == 1 && szContWait == -1 && szStack.length == 0 )
    {
        for ( i = 0; i < szFinCB.length; ++i )
        {
            try
            {
                szFinCB[i]();
            }
            catch(err)
            {
                console.log("sizeOneDiv crash2", err + ": " + fPrint(err, 2));
            }
        }
    }
    szSingleRun--;
}
function sizeOneDiv(vdiv, szL, cb)
{
/*
sizeOneDiv does the actual work of scaling a div and its children
 - its children go into szL for further processing
 - szL is szStack by default.
*/
    var idiv, i, x;
    var usediv = ( radiflev < 0 || radif[radiflev] == 1 );

    if( typeof szL == 'undefined' ) szL = szStack;

    if ( !vdiv.hasAttribute ) 
        return;

    if ( vdiv.hasAttribute('td') && vdiv.getAttribute('td') == '1' )
        vdiv.style.display = 'block';

    if ( isValid(vdiv.xTemp) )
        return;

    try
    {
        if ( vdiv.nodeName != 'svg' && scaleDiv(vdiv) && vdiv.childNodes && vdiv.childNodes.length > 0 )
        {
            flagSized(vdiv);
            if ( isDisabled(vdiv) )
                return;

            for ( i = 0; i < vdiv.childNodes.length; ++i )
            {
                idiv = vdiv.childNodes[i];
                if ( idiv.nodeName == "#comment" || idiv.nodeName == "script" || idiv.nodeName == "#text" || idiv.nodeName == 'svg' ) 
                    continue;
                if ( isValid(idiv.xTemp) ) 
                    continue;

                szL.push([0, idiv]); // add child to stack
            }

        }
    }
    catch (err)
    {
        console.log("Error while scaling div", err);
        throw err;
    }
    szL.push([1, vdiv, cb]); // sizeOneDiv runtime stack

    if ( !( radiflev < 0 || radif[radiflev] == 1 ) )
    {
        vdiv.setAttribute('td', '1');
        vdiv.style.display = 'none';
    }
}
function isDisabled(vdiv)
{
    return ( vdiv.style && getAttribute(vdiv, 'keepscan') != 1 && vdiv.style.display == 'none' && getAttribute(vdiv, 'td') != '1' )
}
function radProcess( div, pdiv )
{
    readDiv(div,pdiv);
    loadDiv(div);
    sizeDiv(div,true);
    //! test: does this call finishDiv() eventually, or inline, or what? it's not obvious.
}
function copyTemplate(tmpname, newroot, seedval)
{
    if ( !(tmpname in radTemps) )
    {
        throw "Build error: " + tmpname + " not found in templates.";
    }
    var ndiv = radTemps[tmpname].cloneNode(true);

    ndiv.removeAttribute("xTemplate");
    delete ndiv.xTemp;

//  console.log("render " + tmpname + "@" + newroot);


    if ( ndiv.hasAttribute('xRoot') && !isValid(ndiv.xroot) )
    {
        ndiv.xroot = ndiv.getAttribute('xRoot');
    }
    if ( isValid(newroot) && newroot != "" )
    {
        if ( isValid(ndiv.xroot) && newroot.substr(0, 1) == "." )
            ndiv.xroot += newroot;
        else
            ndiv.xroot = newroot;
        ndiv.croot = radTranslate(ndiv.xroot);
    }
    ndiv.setAttribute('xRoot', ndiv.xroot);

    if ( !isValid(seedval) )
    {
        seedval = 'xB' + base_seed;
        base_seed++;
    }

    ndiv.setAttribute("xSeed", seedval);

    radProcess(ndiv,null);

    return ndiv;
}

function injectTemplate(div, tmpname, newroot, seedval)
{
    if ( !(tmpname in radTemps) )
    {
        throw "inject template: " + tmpname + " not found in templates.";
    }
    var i, ndiv, xn = radTemps[tmpname].childNodes, x;
    var pdiv = radTemps[tmpname], setsect;

    if ( !isValid(seedval) )
    {
        seedval = 'xB' + base_seed;
        base_seed++;
    }
    
    if ( isValid(x = div.xSect) )
    {
        if ( !(x in radSects) )
            radSects[x] = [ div ];
        else if ( searchForParent(radSects[x], div) === false )
            radSects[x].push(div);
        setsect = x;
    } else if( isValid(x = getAttribute(pdiv, 'xSect')) ) {
        setsect = radTranslate(x);
    }
//  div.setAttribute('xSect', div.xSect);
    div.setAttribute("xSeed", seedval);

    if ( div.hasAttribute('xRoot') && !isValid(div.xroot) )
    {
        div.xroot = div.getAttribute('xRoot');
    }
    if ( isValid(newroot) && newroot != "" )
    {
        if ( isValid(div.xroot) && newroot.substr(0, 1) == "." )
            div.xroot += newroot;
        else
            div.xroot = newroot;
        div.croot = radTranslate(div.xroot);
    }
    div.setAttribute('xRoot', div.xroot);

//  console.log("render " + tmpname + "@" + newroot);
    for ( i = 0; i < xn.length; ++i )
    {
        if ( xn[i].nodeName == '#comment' || xn[i].nodeName == "#text" || xn[i].nodeName == 'svg'  ) continue;

        ndiv = xn[i].cloneNode(true);
        aC(div, ndiv);

        radProcess(ndiv, div);
    }

    return;
}

function injectTemplate1(div, tmpname, newroot, seedval)
{
    if ( !(tmpname in radTemps) )
    {
        throw "inject template: " + tmpname + " not found in templates.";
    }
    var i, ndiv, xn = radTemps[tmpname].childNodes, x;
    var pdiv = radTemps[tmpname], setsect;

    if ( !isValid(seedval) )
    {
        seedval = 'xB' + base_seed;
        base_seed++;
    }
    
    if ( isValid(x = div.xSect) )
    {
        if ( !(x in radSects) )
            radSects[x] = [ div ];
        else if ( searchForParent(radSects[x], div) === false )
            radSects[x].push(div);
        setsect = x;
    } else if( isValid(x = getAttribute(pdiv, 'xSect')) ) {
        setsect = radTranslate(x);
    }
//  div.setAttribute('xSect', div.xSect);
    div.setAttribute("xSeed", seedval);

    if ( div.hasAttribute('xRoot') && !isValid(div.xroot) )
    {
        div.xroot = div.getAttribute('xRoot');
    }
    if ( isValid(newroot) && newroot != "" )
    {
        if ( isValid(div.xroot) && newroot.substr(0, 1) == "." )
            div.xroot += newroot;
        else
            div.xroot = newroot;
        div.croot = radTranslate(div.xroot);
    }
    div.setAttribute('xRoot', div.xroot);
    for ( i = 0; i < xn.length; ++i )
    {
        if ( xn[i].nodeName == '#comment' || xn[i].nodeName == "#text" || xn[i].nodeName == 'svg'  ) continue;

        ndiv = xn[i].cloneNode(true);
        aC(div, ndiv);
    }

}
function injectTemplate2(div)
{
    var i,xn;
    for ( i = 0; i < div.childNodes.length; ++i )
    {
        xn = div.childNodes[i];
        radProcess(xn, div);
    }
}
function genTemplate(tmpname, newroot, seedval)
{
    var div = document.createElement("div");
    injectTemplate(div,tmpname,newroot,seedval);
    return div;
}
function genTemplate1(tmpname, newroot, seedval)
{
    var div = document.createElement("div");
    injectTemplate1(div,tmpname,newroot,seedval);
    return div;
}
function genTemplate2(div)
{
    injectTemplate2(div);
}
function blitzTemplate(div, tmpname, newroot, seedval)
{
    clearNode(div);
    injectTemplate(div, tmpname, newroot, seedval);
    return false;
}
function jsTemplate(div, tmpname, newroot, seedval) // not for use in direct html
{
    blitzTemplate(div, tmpname, newroot, seedval);
    radProcess(div,div.parentNode);
}
var base_seed = 1000;
var template_child_delay = 0;
function funcTemplate(div, tmpname, passpn, passpv) //. schedule for removal
{
    radStore(passpn + radVar("seed"), passpv);
    blitzTemplate(div, tmpname);
    return false;
}
function quickTemplate(div, tmpname, newroot, seedval) //! totally pointless function now ... left here for compat
{
//  template_child_delay = 1;
    blitzTemplate(div, tmpname, newroot, seedval);
    return false;
}
function subTemplate(bdiv, tmpname, newroot, seedval)
{
    var x;
    div = document.createElement("div");
    if ( !isValid(seedval) && isValid(x = getAttribute(bdiv, 'xseed')) )
        seedval = x;

    div.setAttribute('xseed', seedval);
    clearNode(bdiv);
    aC(bdiv, div);
    injectTemplate(div, tmpname, newroot, seedval);
//  console.log("draw: " + tmpname + ":" + newroot);
    return false;
}

function fixScroll() //. schedule for removal. don't ever do this. why do you do this. no.
{
    if ( document.documentElement )
    {
        document.documentElement.scrollTop = 0;
    }
    document.body.scrollTop = 0;
}

function getStyle(el, style) //. move to lib.js
{
    var cStyle;
    if ( el.currentStyle != undefined )
    {
        strCssRule = style.replace(/\-(\w)/g, function (strMatch, p1){
            return p1.toUpperCase();
        });
        return el.currentStyle[strCssRule];
    }
    else if ( document.defaultView )
    {
        cStyle = document.defaultView.getComputedStyle(el, null);
    }
    else
    {
        return '';
    }
    return ( cStyle == null ) ? '' : cStyle[style];
}

