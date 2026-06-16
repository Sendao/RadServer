var Req = require('request');
var Cheer = require('cheerio');
var htmlparser = require("htmlparser2");
var domu = require('domutils');

export function WWWData() {

  this.addSearcher = function(params) {

  };

  this.addRequest = function(params) {

    var rdb = this.base.requests;
    var ev = '';
    if (type == 'basic') {
      if (url.indexOf(".rss") != -1) {
        type = 'rss';
      } else if (url.indexOf("https://news.google.com/search") != -1) {
        type = 'news';
      } else if (url.indexOf("https://www.google.com/search") != -1) {
        type = 'search';
      }
    }
    var r = new this.objs.Requests({
      url: url,
      type: type,
      state: 'pull',
      schedTm: new Date(),
      lastDt: false,
      runEvent: typeof ev == 'undefined' ? '' : ev
    });
    this.app.tools.Mongoose.save(r);

    app.quickcycle(this.handleRequest.bind(this), r);
    console.log("Ok, requesting!");
  };

  this.handleRequest = function(req) {
    console.log("handleRequest()");
    switch (request.state) {
      case 'pull':
        this.requestSite(request);
        break;
      case 'read':
        this.readSite(request);
        break;
    }
  };


  this.requestSite = function(r) {
    var cc = this;
    Req(r.url, function(err, res, body) {
      var rdb = cc.objs.Requests;
      console.log("Got request response");
      if (!res || res.statusCode != 200) {
        console.log("Request '" + r.url + "': ", res.statusCode, res);
        r.state = 'broken';
        rdb.save(r);
        return;
      }
      c = new cc.objs.Cache({
        'url': r.url,
        'content': body
      });
      this.app.tools.Mongoose.save(c);

      r.state = 'read';
      r.lastDt = dn;
      r.cacheid = c._id;
      r.schedTm = dn;
      this.app.tools.Mongoose.save(r);

      app.quickcycle(cc.handleRequest.bind(cc), r);
    });
  };


  this.readSite = function(r) {
    var cdb = this.base.cache;
    c = this.objs.Cache.find({'_id': r.cacheid}, function(err, docs) {
      if( err ) {
        console.log("readSite error: couldn't find cache");
        console.log(err);
        return;
      }

      if( docs.length != 1 ) {
        console.log("readSite error: wrong docs length " + docs.length);
        return;
      }

      var c = docs[0].toObject();

      switch (r.type) {
        case 'basic':
        case 'html':
          this.readBasicPage(r, c);
          break;
        case 'search':
          this.readSearchResults(r, c);
          break;
        case 'news':
          this.readNewsResults(r, c);
          break;
        case 'rss':
          this.readRSSFeed(r, c);
          break;
        case 'blog':
          this.readBlogFeed(r, c);
          break;
      }
  };


  this.readNewsResults = function(r, c) {
    r.state = 'done';

    this.app.tools.Mongoose.save(r);
  };

  this.readRSSFeed = function(r) {
    r.state = 'done';
    this.app.tools.Mongoose.save(r);
  };
  this.readBlogFeed = function(r) {
    r.state = 'done';
    this.app.tools.Mongoose.save(r);
  };


  this.readSearchResults = function(r, c) {
    var cc = this;
    var sdb = this.base.structs;
    var s = new this.objs.Struct();
    s = sdb.create();
    s.links = [];
    s.images = [];
    s.texts = "";

    var handler = new htmlparser.DomHandler((error, dom) => {
      if (error) {
        console.warn("DomHandler error: ", error);
        return;
      }
      console.log("readSearchResults dom handler");

      var result1 = domu.getElementById('search', dom);

      var results_list = domu.getElements({
        'class': 'r'
      }, result1);
      var results_list = domu.getElementsByTagName("h3", results_list);
      console.log("r h3s: " + results_list.length);

      s.links = [];

      for (var i = 0; i < results_list.length; ++i) {
        var linkArea = domu.getElements({
          href: (x) => {
            return typeof x != 'undefined' && x;
          }
        }, results_list[i].parent);
        if (linkArea.length == 0) {
          console.log("invalid link in results");
          //console.log( JSON.stringify( cc.simplifyDom( results_list[i]) ) );
          continue;
        } else {
          link_href = linkArea[0].attribs.href;
          link_title = domu.getText(linkArea[0]);
          console.log("title: " + domu.getText(linkArea[0]));
        }

        var descrArea = domu.getElements({
          'class': 'st'
        }, results_list[i].parent);

        //console.log("descrArea results: " + descrArea.length);
        link_text = domu.getText(descrArea);
        //console.log(link_text);

        link = {
          href: link_href,
          text: link_title,
          description: link_text
        };
        s.links.push(link);
      }
      console.log("[end results]");
      console.log(s);
      this.app.tools.Mongoose.save(s);
      r.state = 'done';

      this.app.tools.Mongoose.save(r);

      if (r.runEvent)
        app.message(r.runEvent, r);
    });

    var parser = new htmlparser.Parser(handler);
    parser.write(c.content);
    parser.end();
  };

  this.readBasicPage = function(r, c) {
    var s = new this.objs.Struct();
    s.links = [];
    s.images = [];
    s.texts = "";

    var cc = this;

    var handler = new htmlparser.DomHandler((error, dom) => {
      if (error) {
        console.warn("DomHandler error: ", error);
        return;
      }
      console.log("readBasicPage dom handler done");
      /* google structure:
      class=srg [results list]
        class=rc [instance]
          class=r
           a href [ link ]
            h3 [ title ]
          class=s
           class=st
           text [description]
           */

      s.texts = domu.getText(dom);
      if (typeof s.texts == 'string')
        s.texts = s.texts.split("\r\n");
      //console.log("Read text: " + s.texts);
      var ahrefs = domu.getElementsByTagName('a', dom);
      var i, imgs;
      var links = [],
        link;
      for (i = 0; i < ahrefs.length; ++i) {
        link = {};
        link.href = ahrefs[i].attribs.href;
        // try to find an image
        imgs = domu.getElementsByTagName('img', ahrefs[i]);
        if (imgs && imgs.length > 0) {
          link.img = imgs[0].attribs.src;
          //link.text = "<img src='" + imgs[0].attribs.src + "'>";
        } else {
          link.text = domu.getText(ahrefs[i]);
        }
        links.push(link);
      }
      s.links = links;
      console.log("Read " + links.length + " links.");
      console.log(links);

      var images = [];
      imgs = domu.getElementsByTagName('img', dom);
      for (i = 0; i < imgs.length; ++i) {
        images.push({
          'src': imgs[i].attribs.src
        });
      }
      s.images = images;
      console.log("Read " + images.length + " images.");
      console.log(images);

      this.app.tools.Mongoose.save(s);

      r.structid = s._id;
      r.state = 'done';

      this.app.tools.Mongoose.save(r);

      if (r.runEvent)
        app.message(r.runEvent, r);
    });

    var parser = new htmlparser.Parser(handler);
    parser.write(c.content);
    parser.end();
  };


};
