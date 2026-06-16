export function AIDatabase(app) {
    this.app = app;
    this.texts = [ 'time', 'type', 'message', 'fromid', 'toid' ];
    this.Texts = app.db.table('texts', this.texts, ['fromid','toid','time']);
};
