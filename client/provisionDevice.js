require('dotenv').config();
var fs = require('fs');
var websiteUrl = process.env.factoryWebsiteUrl;
var deviceId = process.argv[2];
var request = require('request');
request(websiteUrl+'/createleaf?deviceid='+deviceId, function (error, response, body) {
  var response=JSON.parse(body); 
  console.log("success, Keys have been stored");
  fs.mkdirSync('./keys/' + deviceId );
    fs.writeFileSync('./keys/' + deviceId + '/_cert.pem',response.public);
    fs.writeFileSync('./keys/' + deviceId + '/_key.pem',response.key);
});
