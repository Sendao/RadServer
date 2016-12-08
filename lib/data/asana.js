var fs = require('fs');
var async = require('async');
var Email = require('../tool/email.js');

module.exports = function AsanaData() {
	var Asana = new oauth.session( 'https://app.asana.com/', { 'clientId': '176173827789544',
		'clientSecret': 'a3327f22ec7820d49cebbeb9a6e3ccc1',
		'authurl': 'https://app.asana.com/-/oauth_authorize?response_type=code&client_id=176173827789544&redirect_uri=https%3A%2F%2Fspiritshare.ns01.info%2Fasana_oauth.js'}
	);
	
	this.getAuthDetail = function()
	{
		return { 'ready': 1, 'authurl': this.Asana.params.authurl, 'clientid': '176173827789544' };
	};
	
	this.oauthConfirm = function( userId, userKey, userToken )
	{
		
	};
};
