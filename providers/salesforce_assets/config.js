//Update the properties of the object below and rename this file config.js

let config = {}

config.salesforce = {}
config.salesforce.client_id = '<client_id>';
config.salesforce.client_secret = '<client_secret>';
config.salesforce.sandboxRoot = '<sandbox>';
config.salesforce.callbackRoot = 'http://localhost:3000/';
config.salesforce.username = '<username>';
config.salesforce.password = '<password>';
config.salesforce.token = null;
config.salesforce.instance_url = null;
config.app={}
config.app.port = 3002 //or whatever port you want to run this applicaiton on. 

module.exports = config