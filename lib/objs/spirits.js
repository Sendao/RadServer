export function WebDB(myapp) {
  var cc = this;
  var app = myapp;

  this.blacklists = [ 'userid', 'word' ];
  this.topics = [ 'userid', 'title' ];
  this.searchers = [ 'userid', 'topic', 'lastDt', 'title', 'terms' ];
  this.results = [ 'topic', 'searcher', 'uri', 'contents',
    'textContent', 'loadDt', 'refreshDt', 'refresh' ];
};
