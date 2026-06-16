// Scott Powell 2016
const os = await import('node:os');

const { App } = await import('./lib/app.js');
const app = new App();

const { config } = await import('./lib/config.js');
app.config = config;
const { Tester } = await import('./lib/test.js');
const { staticApp } = await import('./lib/static.js');
const app_static = staticApp;


var autoloads;
if( 'packages' in app.config ) {
    autoloads = app.config['packages'];
} else {
    autoloads = [ 'watch' ];
}

await app.configure( autoloads );

console.log("System configured.");
app_static['app'] = app;
app.startup(app_static);


const _journey = await import('journey');
const Journey = _journey.default;
const router = new(Journey.Router);
app.journey = Journey;

app.routes( router );
app_static.routes( router );

await app.loadTools();

if( os.hostname() == 'localhost' || app.config.mobile ) {
  await app.init(true);
} else {
  await app.init(false);
}

