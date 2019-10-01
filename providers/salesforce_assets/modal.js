'use strict';
// Cache configured time or 1 hour
const farmhash = require("farmhash")
const config = require('config');
const ttl = (config.craigslist && config.craigslist.ttl) || 60 * 60;
const request = require('request').defaults({ gzip: true });

const sfConfig = require('./config')

module.exports = function() {
  // This is our one public function it's job its to fetch data from craigslist and return as a feature collection
  this.getData = function(req, callback) {
    if (!sfConfig.salesforce.token) { 
        getToken().then(function(token){
            sfConfig.salesforce.token = token.access_token;
            sfConfig.salesforce.instance_url = token.instance_url;
            console.log(sfConfig.salesforce.token);  
            getAssets().then(function(assets){
                callback(null, assets)
            });
        })
    } else {
        getAssets().then(function(assets){
            callback(null, assets)
        });;
    }
  };
};
function getAssets(){
    return new Promise(function(resolve, reject){

        // let queryParams = "Authorization= Bearer "+sfConfig.salesforce.token;
        // var reqBodyLength = queryParams.length;
        let obj = {
            headers: { 'Content-Type': 'application/x-www-form-urlencoded','Authorization': 'Bearer ' + sfConfig.salesforce.token, 'Accept': 'application/json'},//, 'Content-Length':reqBodyLength},
            //url:     sandboxRoot+'services/oauth2/token',
            url: sfConfig.salesforce.instance_url+'/services/data/v20.0/query/?q=SELECT+name,id,Location__Longitude__s,Location__Latitude__s+from+Asset',
        };
        request(obj, (err, res, body) => {
            if (err) {
                reject(err);
            } else {
                console.log('res.body: ', res.body);
                const assets = translate(res.body);
                console.log('assets: ', assets);
                assets.ttl = ttl;
                
                resolve(assets);    
            }
            
        });
    });
}
function getToken(){
    return new Promise(function(resolve, reject){
        let queryParams = "grant_type=password&client_id="+sfConfig.salesforce.client_id;
        queryParams += "&client_secret="+sfConfig.salesforce.client_secret;
        queryParams += "&username="+sfConfig.salesforce.username;
        queryParams += "&password="+sfConfig.salesforce.password;
        var reqBodyLength = queryParams.length;
        let obj = {
            headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'Accept': 'application/json', 'Content-Length':reqBodyLength},
            //url:     sandboxRoot+'services/oauth2/token',
            url: 'https://login.salesforce.com/services/oauth2/token',
            body: queryParams
        };
        request.post(obj, function (err, res, body) {
            if (err){ 
                reject(err);
            } else {
                console.log(res.body);
                resolve(JSON.parse(res.body));
            }
        });
    })
}
// Map accross all elements from a Craigslist respsonse and translate it into a feature collection
function translate(data) {
  const list = JSON.parse(data);
  console.log('list: ',list);
  const featureCollection = {
    type: 'FeatureCollection',
    features: []
  };
  console.log('list[0]: ', list.records[0])  
    
  if (list.records && list.records[0]) {
    const assets = list.records;
    featureCollection.features = assets.map(formatFeature);
  }
  return featureCollection;
}

// This function takes a single element from the craigslist response and translates it to GeoJSON
// TODO format based on schema types for other craiglists things like jobs
function formatFeature(asset) {
    console.log('apt: ', asset);
  const feature = {
    type: 'Feature',
    geometry: {
      type: 'Point',
      coordinates: [asset.location__Longitude__s, asset.location__Latitude__s]
    },
    properties: {
      type: asset.type,
      name: asset.Name,
      id: asset.Id
      // Transform the PostingID to an integer <= 2147483647
    }
  };
  return feature;
}


/**
 * Create an ID that is an integer in range of 0 - 2147483647. Should be noted that
 * the scaling of unsigned 32-bit integers to a range of 0 - 2147483647 increases likely hood
 * that two different input receive the same output
 * @param {*} id 
 */
function transformId (id) {
    // Hash to 32 bit unsigned integer
    const hash = farmhash.hash32(id.toString());
    
    // Normalize to range of postive values of signed integer
    return Math.round((hash / 4294967295) * (2147483647))
}