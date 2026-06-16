module.exports = function CardData() {

  var experimental_context = {};
  var timers_loaded = false;

  this.startup = function() {
    console.log("Installing cardizer");

    this.app.install('timerChange', this.timerChange.bind(this));
    this.app.install('scheduleChange', this.schedChange.bind(this));

    this.app.install('resourceCreate', this.resourceCreate.bind(this));
    this.app.install('resourceChange', this.resourceChange.bind(this));
    this.app.install('resourceUpdate', this.resourceUpdate.bind(this));

    var dn = this.app.util.getSeconds();
    this.app.recycle(this.setup.bind(this));
  };

  this.setup = function() {
    var i, d, db;
    console.log("Setting up cardizer");
    // initialize timers
    db = this.base.timers;
    var u = db.all();
    console.log(u.length + " timers");
    var cleanupids = [];
    for (i = 0; i < u.length; ++i) {
      console.log(u);
      if (u[i].running != false && u[i].running != "false") {
        u[i].running = false;
        db.save(u[i]);
      }
    }
    // load schedules
    db = this.base.schedules;
    var dx = this.app.util.getDate();
    console.log("cards.setup");
    db.loadRecords();
    d = db.all();
    var j, userids = {};
    console.log(d.length + " schedules");
    for (i = 0; i < d.length; ++i) {
      //console.log(d[i]);
      userids[ d[i].userid ] = true;
      //this.scheduleSchedule(d[i].userid);
    }
    for( i in userids ) {
      this.startScheduleFor(i);
    }
    console.log("Cardizer ready");
  };
  this.startScheduleFor = function(userid) {
    console.log("startScheduleFor(" + userid + ")");
    var d = this.base.schedules.search({'userid': userid});
    if( !d ) return;
    var j, waz = this.whichActiveSchedules(userid);
    console.log(waz.length + " schedules");
    if( !waz || waz.length <= 0 ) return;
    var r = waz[waz.length-1];
    var code = this.app.util.randomStr(8);
    var rc = this.app.util.cloneObject(r);
    rc.runcode = code;
    var udata = this.getUserdata(userid);
    udata.clockSchedule = code;
    udata.clockId = -1;
    this.saveUserdata(userid, udata);

    this.runSchedule(rc);
  };

  this.scheduleSchedule = function(r) {
    console.log("scheduleSchedule(", r, ")")
    var dx = this.app.util.getDate();
    if ( 'start_tm' in r && r.start_tm != "") {
      var dlow = this.stringTime(dx, r.start_tm);
      var dhigh = this.stringTime(dx, r.stop_tm);
      console.log("Time now: ", new Date());
      console.log("Time beg: ", dlow);
      console.log("Time end: ", dhigh);
      app.schedule(dlow.getTime() / 1000, this.startScheduleFor.bind(this), r.userid);
    } else {
      console.log("No start_tm in ", r);
    }
  };

  this.scheduleTimer = function(timer) {
    //console.log("scheduleTimer(", timer, ")")
    // what is the current schedule?
    var scheds = this.whichActiveSchedules(timer.userid);
    var i, found = false;
    //console.log("Active schedules: ", scheds);

    for (i = 0; i < scheds.length; ++i) {
      if (timer.schedules.indexOf("" + scheds[i].id) != -1) {
        found = true;
        break;
      }
    }
    if (found) {
      if (timer.next_tm == 0)
        timer.next_tm = app.util.getSeconds();
      if (timer.paused)
        return;
      if (timer.running != this.app.runtimeCode) {
        timer.running = this.app.runtimeCode;
        this.base.timers.save(timer);
        app.schedule(timer.next_tm, this.runTimer.bind(this), timer);
      }
    }
  };

  this.getBlankNotes = function(userid) {
    var ndb = this.base.notifications;

    var notes = ndb.search('userid', userid);
    var i;
    var blanktags = [];

    if( !notes ) return [];

    for( i=0; i<notes.length; ++i ) {
      if( !('tags' in notes[i]) || notes[i].tags.length == 0 ) {
        blanktags.push( notes[i] );
      }
    }
    return blanktags;
  }

  this.runClock = function(sched) {
    var udata = this.getUserdata(sched.userid);

    if( !udata.clock ) {
      console.log("Clock - notifications disabled");
      return;
    }

    console.log("test.runclock", sched.id);

    if( !this.isMainSchedule(sched) ) {
      this.startScheduleFor( sched.userid );
      return;
    }

    if( sched.runningLock != udata.clockLuck ) {
      console.log("!runningLock");
      return;
    }
    console.log("runClock(" + sched.name + ")");

    //console.log("runClock", sched);
    var timeStr = this.app.util.getSeconds(false);
    if (udata.push === false) {
      console.log("no push");
      return;
    }

    var tagsearch = sched.tags;
    //if( tagsearch.indexOf("new") == -1 ) tagsearch.push("new");
    var n;
    if( udata.clockBlocktags ) {
      for( var i in udata.clockBlocktags ) {
        if( (n=tagsearch.indexOf( udata.clockBlocktags[i] )) != -1 ) {
          tagsearch.splice(n,1);
        }
      }
    }
    if( udata.clockWhitetags && typeof udata.clockWhitetags != 'undefined' ) {
      tagsearch.concat( udata.clockWhitetags );
    }
    console.log("tagsearch", tagsearch);

    var notes = this.loadByTagNames( 'notifications', tagsearch );
    var notes2 = this.getBlankNotes( sched.userid );

    if( notes && notes2.length > 0 ) {
      notes = notes.concat(notes2);
    } else if( notes2.length > 0 ) {
      notes = notes2;
    }

    //console.log("Available notes: ", notes);
    //var notes = this.base.notifications.search( 'userid', sched.userid );
    var addtext = timeStr, addText;
    if( notes !== false ) {
      var n = this.app.util.randomInt( 0, notes.length-1 );
      console.log("Note " + n + " / " + notes.length);
      console.log("Sending myself " + notes[n].subject + ": " + notes[n].message);
      addText = notes[n].message;
    } else {
      console.log("No notes for", tagsearch);
      addText = "";
    }
    this.app.push.sendToUser( sched.userid, this.app.push.build(
        this.app.util.fmtTime(timeStr) + " " + sched.name,
        addText,
        false,
        'clock'
      ));

    var dn = this.app.util.getSeconds(false);
    dn.setMinutes(dn.getMinutes() + 1);
    dn.setSeconds(00);

    //this.saveUserdata(sched.userid, udata);
    app.schedule(Math.floor(dn.getTime() / 1000), this.runClock.bind(this), sched);
  };

  this.runSchedule = function(sched, force) {
    console.log("runSchedule " + sched.id); //(", sched, ")")
    return;
    if( !this.isMainSchedule(sched) ) return;

    var udata = this.getUserdata(sched.userid);

    if( udata.clock ) {
      this.app.tools.Push.sendToUser(sched.userid, JSON.stringify({
        'notification': {
          'title': "It is " + sched.name,
          'message': sched.comment,
          'image': sched.image
        }
      }));

      if ( udata.clockId != sched.id ) {
        udata.clockLuck = sched.runningLock = this.app.util.randomStr( 6 );
        udata.clockId = sched.id;
        this.saveUserdata( sched.userid, udata );
        app.quickcycle( this.runClock.bind(this), sched );
      }
    }

    var schedid = sched.id;
    var timers = this.base.timers.search('userid', sched.userid);
    var i;
    //console.log("Found ", timers.length ? timers.length : 0, " timers for " + sched.userid);
    // scan the schedule and start all timers in it
    for (i = 0; timers.length && i < timers.length; i++) {
      console.log("Check ", timers[i], " for " + schedid);
      if (timers[i].schedules.indexOf("" + schedid) != -1) {
        //console.log("Timer is scheduled");
        if (timers[i].next_tm == 0)
          timers[i].next_tm = app.util.getSeconds();
        if (timers[i].paused === true || timers[i].paused === "true" ) continue;
        if (timers[i].running != this.app.runtimeCode) {
          console.log("Setting the timer.");
          //timers[i].running = this.app.runtimeCode;
          this.base.timers.save(timers[i]);
          app.schedule(timers[i].next_tm, this.runTimer.bind(this), timers[i]);
        }
      }
    }
  };


  this.runTimer = function(timer) {
    var db = this.base.timers,
      tgtdb;
    var reader, obj, cmd;

    this.resetContext();

    console.log("runTimer(" + timer.type + ":" + timer.tableid + ")");

    // verify we're still active
    var scheds = this.whichActiveSchedules(timer.userid);
    var found = false;
    for (var i = 0; i < scheds.length; ++i) {
      if (timer.schedules.indexOf("" + scheds[i].id) != -1) {
        found = true;
        break;
      }
    }
    if (!found) {
      console.log("Timer no longer active, shutting down");
      timer.running = false;
      db.save(timer);
      return;
    }

    switch (timer.type) {
      case 'script':
      case 'scr':
      case 's':
        tgtdb = this.base.scripts;
        cmd = 's';
        break;
      case 'notification':
      case 'notice':
      case 'note':
      case 'n':
        tgtdb = this.base.notifications;
        cmd = 'n';
        break;
      case 'condition':
      case 'cond':
      case 'c':
        tgtdb = this.base.conditions;
        cmd = 'c';
        break;
    }
    reader = tgtdb.get(timer.tableid);
    if (!reader) {
      console.log("Not found " + timer.type + ":" + timer.tableid);
      return;
    }
    obj = reader;
    sess = {
      'userid': timer.userid,
      'user': {
        'userid': timer.userid
      }
    };

    switch (cmd) {
      case 's':
        this.runScript(sess, obj);
        break;
      case 'n':
        this.runNotification(sess.userid, obj);
        break;
      case 'c':
        this.runCondition(sess, obj);
        break;
    }

    // Schedule next event:
    var tmnow = app.util.getSeconds();
    var tmr = parseInt(timer.tm_repeat);
    if (timer.next_tm <= (tmnow - 2 * tmr)) {
      timer.next_tm = tmnow + tmr;
    } else {
      timer.next_tm = parseInt(timer.next_tm) + tmr;
    }
    db.save(timer);
  };



  this.timerChange = function(timer) {
    this.scheduleTimer(timer);
  };

  this.schedChange = function(sched) {
    this.scheduleSchedule(sched);
  };

  this.resourceChange = function(r) {
    console.log("resourceChange");
    // check if the url changed by checking the linked resource
    var resdb = this.app.wwwcache.base.resources;
  };

  this.resourceCreate = function(r) {
    // get the resource via url
    this.app.wwwcache.newRequest( r.url, 'basic', 'resourceUpdate' );
  };

  this.resourceUpdate = function(webres) {
    // locate resources with the same url
    // save the deets
    var rdb = this.base.resources;
    var items = rdb.search('url', webres.url);
  };

  this.resetContext = function() {
    this.experimental_context = {};
  };

  this.isActiveSchedule = function(sched) {
    var dx = this.app.util.getDate();

    dlow = this.stringTime(dx, sched.start_tm);
    dhigh = this.stringTime(dx, sched.stop_tm);

    if (dx >= dlow && dx <= dhigh) {
      return true;
    }
    return false;
  };

  this.whichActiveSchedules = function(userid) {
    var sch = this.base.schedules;
    var r = sch.search('userid', userid);
    if (!r) return false;
    var i;
    var scheds = [];
    var dx = this.app.util.getDate();
    var dlow, dhigh;

    for (i = 0; i < r.length; ++i) {
      if (r[i].start_tm && r[i].stop_tm) {
        dlow = this.stringTime(dx, r[i].start_tm);
        dhigh = this.stringTime(dx, r[i].stop_tm);
        console.log("dlow " + r[i].start_tm + ", dhigh " + r[i].stop_tm + ", dx=" + dx);

        if (dx >= dlow && dx <= dhigh) {
          //console.log(r[i], "dlow", dlow, "dhigh", dhigh, "dx", dx);
          scheds.push(r[i]);
        }
      }
    }
    return scheds;
  };

  this.isMainSchedule = function(sched) {
    var userid = sched.userid;
    var sch = this.base.schedules;
    var r = sch.search('userid', userid);
    if (!r) {
      console.log("isMainSchedule 404");
      return false;
    }
    var i;
    var scheds = [];
    var dx = this.app.util.getDate();
    var dlow, dhigh;
    var lastschedid = -1;

    for (i = 0; i < r.length; ++i) {
      if (r[i].start_tm && r[i].stop_tm) {
        dlow = this.stringTime(dx, r[i].start_tm);
        dhigh = this.stringTime(dx, r[i].stop_tm);

        if (dx >= dlow && dx <= dhigh) {
          lastschedid = r[i].id;
        }
      }
    }
    console.log("isMainSchedule " + lastschedid + ": " + sched.id + "?");

    if( sched.id == lastschedid )
      return true;

    return false;
  };

  this.saveUserdata = function(userid, data) {
    var obj = this.base.userdata.get('userid', userid);
    if (!obj) {
      this.app.util.throwStack("No user data found for " + userid);
      return;
    }
    obj.data = data;
    //console.log("Userdata: ", data);
    this.base.userdata.save(obj);
  };

  this.getUserdata = function(userid) {
    var xd = this.base.userdata;
    var user_obj = xd.get('userid', userid);
    var user_data;
    if (user_obj == false) {
      user_data = {
        push: true,
        attention: 1.0,
        menu: ['Mine', 'Home', 'Trending', 'Top', 'Recent']
      };
      user_obj = xd.create({
        userid: userid,
        data: user_data
      });
      xd.save(user_obj);
    } else {
      user_data = user_obj.data;
      //console.log("Userget: ", user_data);
    }
    return user_data;
  };

  this.getFlag = function(userid, flagname) {
    var f = this.base.flags.search({
      userid: userid,
      name: flagname
    });
    return f ? f[0] : f;
  };

  this.getScript = function(userid, scriptid) {
    var s = this.base.scripts.get(scriptid); //id: ['=', scriptid]} );
    //! verify permissions
    return s;
  };

  this.getNotification = function(userid, noteid) {
    var f = this.base.notifications.search({
      userid: userid,
      id: noteid
    });
    return f ? f[0] : f;
  };

  this.runScript = function(sess, scr) {
    var codelines = scr.code.split("\n");
    var nLine, args;
    var userid = sess.userid;
    var i, obj;

    for (nLine = 0; nLine < codelines.length; ++nLine) {
      args = codelines[nLine].split("^");
      for (i = 0; i < args.length; ++i) {
        args[i] = this.runTemplate(sess, args[i]);
      }
      try {
        switch (args[0]) {
          case 'message':
            this.app.tools.Push.sendToUser(userid, JSON.stringify({
              'notification': {
                'title': args[1],
                'message': args[2]
              }
            }));
            break;
          case 'timer':
            switch (args[1]) {
              case 'toggle':
                obj = this.base.timers.get(args[2]);
                if (obj.paused) obj.paused = false;
                else obj.paused = true;
                this.base.timers.save(obj);
                break;
              case 'enable':
                obj = this.base.timers.get(args[1]);
                obj.paused = false;
                this.base.timers.save(obj);
                break;
              case 'disable':
                obj = this.base.timers.get(args[1]);
                obj.paused = true;
                this.base.timers.save(obj);
                break;
            }
            break;
          case 'notice':
            this.runNotification(userid, this.getNotification(userid, args[1]));
            break;
          case 'toggle':
            var f = this.getFlag(userid, args[1]);
            if (f.value == 1 || f.value == true || ((f.value != 0 && f.value != false))) {
              f.value = false;
            } else {
              f.value = true;
            }
            this.base.flags.save(f);
            break;
          case 'set':
            var f = this.getFlag(userid, args[1]);
            f.value = args[2];
            this.base.flags.save(f);
            break;
        }
      } catch (e) {
        console.warn("Script error ", args, e);
      }
    }
  };

  this.runCondition = function(sess, cond) {
    var cx = cond.condition;
    var value;

    // evaluate conditional value
    var o = this.experimental_context;
    value = eval(runTemplate(sess, cx));

    // save value
    cond.last = value;
    cond.last_tm = app.util.getSeconds();
    this.base.conditions.save(cond);

    // run scripts
    if (cond.change_script)
      this.runScript(sess, this.getScript(sess.userid, cond.change_script));
    if (cond.value_scripts && value in cond.value_scripts) {
      this.runScript(sess, this.getScript(sess.userid, cond.value_scripts[value]));
    }
  };

  this.runTemplate = function(sess, str) {
    var i, genstr = str;
    var user = sess.user;
    var app = this.app;
    var spaces = [];
    var objs = [];

    //! first set up associations: !=name:tablename:tableid\n
    while ((i = genstr.indexOf("!=")) != -1) {
      var j = genstr.indexOf("\n", i);
      var evstr = genstr.substr(i + 2, j - (i + 2));
      genstr = genstr.substr(0, i) + genstr.substr(j + 1);

      var args = evstr.split(":");
      if (args[1] == "sessions") {
        db = this.app.sing.sess.base.sessions;
      } else if (args[1] == "users") {
        db = this.app.sing.sess.base.users;
      } else {
        db = this.base[args[1]];
      }
      console.log(db);
      var results = db.get(args[2]);
      console.log("Loaded " + args[0] + "=" + args[1] + "," + args[2] + ":", results);
      spaces.push(args[0]);
      objs.push(results);

      var o = this.experimental_context;
      eval(spaces.shift() + " =objs.shift();");
    }
    // for array searching: ~=name:tablename:searchby:oper:value\n
    while ((i = genstr.indexOf("~=")) != -1) {
      var j = genstr.indexOf("\n", i);
      var evstr = genstr.substr(i, j - i);
      genstr = genstr.substr(0, i) + genstr.substr(j + 1);

      var args = evstr.split(":");
      var db;
      if (args[1] == "sessions") {
        db = this.app.sing.sess.base.sessions;
      } else if (args[1] == "users") {
        db = this.app.sing.sess.base.users;
      } else {
        db = this.base[args[1]];
      }
      var results = db.search(args[2], args[3], args[4]);
      var obj;
      if (!results)
        obj = [];
      else if (results.length == 1)
        obj = results;

      var o = this.experimental_context;
      eval(args[0] + "=obj;");
    }

    // replace @{eval}s
    while ((i = genstr.indexOf("@{")) != -1) {
      var j = i + 2,
        len = 0,
        depth = 1;
      while (depth > 0) {
        len++;
        if (j + len >= genstr.length)
          break;
        if (genstr[j + len] == '{') depth++;
        else if (genstr[j + len] == '}') depth--;
      }
      if (depth != 0) {
        console.log("Invalid syntax in " + str);
        break;
      }
      var evstr = genstr.substr(j, len);
      console.log("eval(" + j + ", " + len + "): " + evstr);

      var o = this.experimental_context;
      var nstr = eval(evstr);

      genstr = genstr.substr(0, i) + nstr + genstr.substr(j + len + 1);
    }

    return genstr;
  };

  this.runNotification = function(userid, note) {
    var udata = this.getUserdata(userid);
    if (udata.push === false)
      return;
    //		this.defaults = { 'id': '', 'userid': '', 'subject': '', 'message': '' };
    console.log("runNotification", note);
    this.app.tools.Push.sendToUser(userid, JSON.stringify({
      'notification': {
        'title': note.subject,
        'message': note.message
      }
    }));

  };

  this.getResource = function(resourceid) {
    //.defaults = { 'id': '', 'authorid': '', 'privacy': '', 'url': '', 'title': '', 'comments': [], 'description': '' };
    var reader = this.data.resources.search('id', resourceid);
    if (!reader) {
      console.log("Not found resource " + resourceid);
      return false;
    }
    return reader[0];
  };


  this.stringTime = function(d, inTime) {
    var timedetails = {
      'hour': 0,
      'minute': 0
    };
    var found = false;

    if( typeof inTime == 'undefined' ) {
      return false;
    }

    // timeStr syntax:
    switch (inTime) {
      case '':
        return false;
      case 'noon':
        found = true;
        timedetails.hour = 12;
        break;
      case 'midnight':
        found = true;
        timedetails.hour = 00;
        timedetails.minute = 00;
        break;
      case 'sunrise':
        found = true;
        timedetails.hour = 6;
        break;
      case 'sunset':
        found = true;
        timedetails.hour = 18;
        break;
      default:
        found = false;
    }

    if (!found) {
      //! support 8am, 8:00am, 8:23am, 8:23, 16:23, 6pm, 12am
      var ampm = 0, aspot, timeStr;
      timeStr = inTime.toLowerCase();
      if ((aspot = timeStr.indexOf("am")) >= 0) {
        ampm = 1;
        timeStr = inTime.substr(0, aspot);
      } else if ((aspot = timeStr.indexOf("pm")) >= 0) {
        ampm = 2;
        timeStr = inTime.substr(0, aspot);
      }

      var hour = 0,
        minute = 0;

      if ((cspot = timeStr.indexOf(":")) > 0) {
        var tVals = timeStr.split(":");

        hour = parseInt(tVals[0]);
        minute = parseInt(tVals[1]);
      } else {
        hour = parseInt(timeStr);
      }
      if( isNaN(hour) || isNaN(minute) ) {
        console.warn("Invalid timestr " + inTime);
        return false;
      }
      if (hour == 12 && ampm == 1) hour = 0;
      if (hour < 12 && ampm == 2) hour += 12;
      if (hour == 24) hour = 0;

      timedetails.hour = hour;
      timedetails.minute = minute;
    }
    var j = new Date(d);
    j.setHours(timedetails.hour);
    j.setMinutes(timedetails.minute);
    //console.log("Details: ", timedetails, "Result: ", d);

    return j;
  };

  this.loadStatistics = function(userid) {
    var details = {};

    details.trending = [];
    details.toptags = [];

    return details;
  };

  this.loadBrowseHistory = function(userid) {
    var dtn = app.util.getSeconds();
    var fids = this.base.browsehistory.findSort('dt', '<', dtn, false, {
      userid: userid
    });
    console.log("loadBrowseHistory");
    console.log(fids);
    var objs = this.base.browsehistory.retrieve(fids);
    var i, tbl;

    for (i = 0; i < objs.length; ++i) {
      if (!(objs[i].table in this.base)) {
        console.log("lbh: cannot find table ", objs[i]);
        continue;
      }
      tbl = this.base[objs[i].table];
      units = tbl.search('id', objs[i].ident);
      if (units === false) continue;
      objs[i].unit = units[0];
    }

    return objs;
  };

  this.loadRecentHistory = function(userid) {
    var dtn = app.util.getSeconds();
    var fids = this.base.history.findSort('dt', '<', dtn, false, {
      userid: userid
    });
    console.log("loadRecentHistory");
    console.log(fids);
    return this.base.history.retrieve(fids);
  };

  this.loadByTagNames = function(table, tagnames) {
    var i, tagIds=[];

    for( i = 0; i < tagnames.length; ++i ) {
      var srch = this.base.tags.search('name', tagnames[i]);
      if( !srch ) {
        this.app.util.throwStack("Not found tag " + tagnames[i]);
        continue;
      }
      for( var j = 0; j < srch.length; ++j ) {
        tagIds.push( srch[j].id );
      }
    }
    //console.log("tagIds: ", tagIds);
    return this.loadByTags( table, tagIds );
  };

  this.loadByTags = function(table, tagids) {
    var i, itemList=[];

    for( i = 0; i < tagids.length; ++i ) {
      var taggeds = this.base.tagged.search({
        table: table,
        tagid: tagids[i]
      });
      if( !taggeds ) {
//        console.log("No taggeds found for " + tagids[i]);
        continue;
      }
      for( var j = 0; j < taggeds.length; ++j ) {
        itemList.push( taggeds[j].objid );
      }
    }
    var objectList=[];
    for( i = 0; i < itemList.length; ++i ) {
      var item = this.base[table].get( itemList[i] );
      if( !item ) {
        console.log(table + " has tagged-item " + itemList[i] + " missing!");
        continue;
      }
      objectList.push( item );
    }

    if( objectList.length == 0 )
      return false;
    return objectList;
  };

  this.loadTagsOf = function(table, objid) {
    var taggeds = this.base.tagged.search({
      objid: objid,
      table: table
    });
    var tbl = this.base.tags;
    var i, tag, results = [];
    if (taggeds) {
      for (i = 0; i < taggeds.length; ++i) {
        tag = tbl.get(taggeds[i].tagid);
        if (!tag) continue;
        results.push(tag.name);
      }
    }
    return results;
  };

  this.useLoadOne = function(table, id) {
    var results;
    if (table in this.loaders) {
      results = this.loaders[table](null, id);
      if (results) {
        var i;
        for (i = 0; i < results.length; ++i) {
          results[i].tags = this.loadTagsOf(table, results[i].id);
        }
      }
    } else if( table in this.sole_loaders ) {
      results = this.sole_loaders[table](null, id);
    } else {
      return this.only_loaders[table](null, id);
    }
    return this.mapById(results);
  };

  this.useLoader = function(table, userid) {
    var results;
    if (table in this.loaders) {
      results = this.loaders[table](userid);
      if (results) {
        var i;
        for (i = 0; i < results.length; ++i) {
          results[i].tags = this.loadTagsOf(table, results[i].id);
        }
      }
    } else if( table in this.sole_loaders) {
      results = this.sole_loaders[table](userid);
    } else if( table in this.only_loaders) {
      return this.only_loaders[table](userid);
    }
    return this.mapById(results);
  }

  this.loadEvents = function(userid, id) {
    if (typeof id != 'undefined') return this.base.events.get(id);
    var events = this.base.events.search('userid', userid);
    return events ? events : [];
  };

  this.loadTrackers = function(userid, id) {
    if (typeof id != 'undefined') return this.base.trackers.get(id);
    var trackers = this.base.trackers.search('userid', userid);
    return trackers ? trackers : [];
  };

  this.loadSchedules = function(userid, id) {
    if (typeof id != 'undefined') return this.base.schedules.get(id);
    var d = this.base.schedules.search('userid', userid);
    return d ? d : [];
  };

  this.loadAlbums = function(userid, id) {
    if( typeof id != 'undefined' ) return this.base.albums.get(id);
    var d = this.base.albums.search('userid', userid);
    return d ? d : [];
  };

  this.loadCaches = function(userid, id) {
    if (typeof id != 'undefined') return this.base.schedules.get(id);
    var d = this.base.caches.search('userid', userid);
    var i;
    if( !d ) return {};
    for( i in d ) {
      if( 'content_bd' in d[i] )
        delete d[i]['content_bd'];
    }
    return d;/*
    var i, ids=[];
    if( !d ) return ids;
    for( var i=0; i< d.length; ++i ) {
      ids.push( d[i] );
    }
    return ids;*/
  };

  this.loadTimers = function(userid, id) {
    if (typeof id != 'undefined') return this.base.timers.get(id);
    var d = this.base.timers.search('userid', userid);
    return d ? d : [];
  };

  this.loadNotifications = function(userid, id) {
    if (typeof id != 'undefined') return this.base.notifications.get(id);
    var d = this.base.notifications.search('userid', userid);
    return d ? d : [];
  };

  this.loadResources = function(userid, id) {
    if (typeof id != 'undefined') return this.base.resources.get(id);
    var d = this.base.resources.search('authorid', userid);
    return d ? d : [];
  };

  this.loadScripts = function(userid, id) {
    if (typeof id != 'undefined') return this.base.scripts.get(id);
    var d = this.base.scripts.search('authorid', userid);
    return d ? d : [];
  };

  this.loadConditions = function(userid, id) {
    if (typeof id != 'undefined') return this.base.conditions.get(id);
    var d = this.base.conditions.search('userid', userid);
    return d ? d : [];
  };

  this.loadLibraries = function(userid, id) {
    if (typeof id != 'undefined') return this.base.libraries.get(id);
    var a1 = this.base.libraries.search('authorid', userid);
    var a2 = this.base.libraries.search('authorid', -1);

    if (a1 === false) a1 = [];
    if (a2 === false) a2 = [];
    return a1.concat(a2);
  };

  this.loaders = {
    trackers: this.loadTrackers.bind(this),
    libraries: this.loadLibraries.bind(this),
    conditions: this.loadConditions.bind(this),
    notifications: this.loadNotifications.bind(this),
    resources: this.loadResources.bind(this),
    scripts: this.loadScripts.bind(this),
    schedules: this.loadSchedules.bind(this),
    timers: this.loadTimers.bind(this),
    events: this.loadEvents.bind(this),
  };
  this.sole_loaders = {
    history: this.loadBrowseHistory.bind(this),
    recent: this.loadRecentHistory.bind(this),
    stats: this.loadStatistics.bind(this),
  };
  this.only_loaders = {
    caches: this.loadCaches.bind(this),
    albums: this.loadAlbums.bind(this)
  };

  this.mapById = function(records) {
    var i;
    var recs = {};

    for (i = 0; i < records.length; ++i) {
      recs[records[i].id] = records[i];
    }
    return recs;
  };


  this.registerCardUser = function(userid, user) {
    // 	this.base.whiteboard.addClient( user, 'whiteboard_update', [ 'time', '>=', dtn ] );
    var usertables = ['notifications', 'timers', 'schedules', 'trackers', 'events', 'history', 'browsehistory', 'caches', 'albums', 'events'];
    var authortables = ['libraries', 'resources', 'scripts'];
    var othertables = ['trending'];

    var i, tab;

    for (i = 0; i < usertables.length; ++i) {
      tab = usertables[i];
      this.base[tab].addClient(user, tab + "_update", ['userid', '=', userid]);
      this.base[tab].addClient(user, tab + "_append", ['userid', '=', userid]);
      this.base[tab].addClient(user, tab + "_remove", ['userid', '=', userid]);
    }

    for (i = 0; i < authortables.length; ++i) {
      tab = authortables[i];
      this.base[tab].addClient(user, tab + "_update", ['authorid', '=', userid]);
      this.base[tab].addClient(user, tab + "_append", ['authorid', '=', userid]);
      this.base[tab].addClient(user, tab + "_remove", ['authorid', '=', userid]);
    }

    for (i = 0; i < othertables.length; ++i) {
      tab = othertables[i];
      this.base[tab].addClient(user, tab + "_update", ['userid', '=', userid]);
      this.base[tab].addClient(user, tab + "_append", ['userid', '=', userid]);
      this.base[tab].addClient(user, tab + "_remove", ['userid', '=', userid]);
    }
  };

};
