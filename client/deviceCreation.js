require('dotenv').config();
var fs = require('fs');
var websiteUrl = process.env.websiteUrl;
var deviceId = process.argv[2];

//do the get request to create
var request = require('request');
console.log(websiteUrl+'/createleaf?deviceid='+deviceId);
request(websiteUrl+'/createleaf?deviceid='+deviceId, function (error, response, body) {

  var response=JSON.parse(body); 
  console.log(response.key);
  fs.mkdirSync('./keys/' + deviceId );
    fs.writeFileSync('./keys/' + deviceId + '/_cert.pem',response.public);
    fs.writeFileSync('./keys/' + deviceId + '/_key.pem',response.key);
});
