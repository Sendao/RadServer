
export const config = {
    'hostname': 'localhost',
    'contactmail': 'sendao@gmail.com',
    'gmail_user': 'example@gmail.com',
    'gmail_host': 'smtp.gmail.com',
    'gmail_fullname': 'System Inadministrator',
    'ssl': '/home/sendao/shared/rad/test/.ssl/spirits.pfx',
    'gcmurl': 'https://spiritshare.org/',
    'packages': [ 'index', 'web' ],
    'iexkey': '',
    'alphakey': '',
    'nomkey': '',
    'coinkey': '',
    'krakenkey': '',
    'krakensecret': '',
    'tradierkey': '',
    'alpacakey': '',
    'alpacasecret': ''
};

var x = await import('./local-config.js');
for( var i in x.config ) {
	config[i] = x.config[i];
}
