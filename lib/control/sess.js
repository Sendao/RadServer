export function AuthControl(app)
{
  this.app = app;
  this.sess = app.sess;

  this.routes = function(router)
  {
  console.log("setting up post route for login/register/logout");
  console.log("setting up post route for login/register/logout");
  console.log("setting up post route for login/register/logout");
  console.log("setting up post route for login/register/logout");
  console.log("setting up post route for login/register/logout");
    router.post('/login').bind(this.app.loginRoute.bind(this.app));
    router.post('/register').bind(this.app.registerRoute.bind(this.app));
    router.post('/logout').bind(this.app.logoutRoute.bind(this.app));
  console.log("routes complete");
  };
};

