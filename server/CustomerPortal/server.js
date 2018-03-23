var http = require('http')
var express = require('express')
require('dotenv').config();


var app = express();
app.use(express.json());
app.use(express.static('static'));
//recreate root certificate
//arg rootname = the name of your root Certificate
app.post('/postForm', function (req, res) {
  

  var provisioningServiceClient = require('azure-iot-provisioning-service').ProvisioningServiceClient;
  var registrationId = req.body.deviceId;
  var serviceClient = provisioningServiceClient.fromConnectionString(process.env.CONNECTION_STRING);

  serviceClient.getIndividualEnrollment(registrationId, function (err, enrollmentResponse) {
    if (err) {
      console.log('error reading the individual enrollment: ' + err);
    } else {
      console.log("Etag: " + enrollmentResponse.etag);
      console.log(enrollmentResponse);
      etag = enrollmentResponse.etag;
      if(req.body.tags != null){
        var tags = JSON.parse(req.body.tags);
        enrollmentResponse.initialTwin = tags;
      }
      enrollmentResponse.provisioningStatus = 'enabled';
      serviceClient.createOrUpdateIndividualEnrollment(enrollmentResponse, function (err, enrollmentResponse2) {
        if (err) {
          console.log('error updating the individual enrollment: ' + err);
        } else {
          console.log("updated enrollment record returned: " + JSON.stringify(enrollmentResponse2, null, 2));
        }
      });

    }
  });

  res.send('updated device enrolment for: ' + registrationId);
  res.send();
});

http.createServer(app).listen(8000);
