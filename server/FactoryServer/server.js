var http = require('http')
var pem = require('pem')
var express = require('express')
var fs = require('fs');
require('dotenv').config();
//must point to your openSSL install
pem.config({
    pathOpenSSL: '/usr/bin/openssl'
})

var app = express();


//create a leaf certificate based on an intermediate certificate.
//arg deviceid the device Id to which this certificate will be applied
//return json with pair certificate + key as leaf certificate to be put on device.
app.get('/createleaf', function (req, res) {
    var deviceId = req.query.deviceid;
    console.log("Generate Leaf Cert for + Device: " + deviceId);
    var commonName = deviceId;

    parentCert = fs.readFileSync('./keys/root/'  + '/_cert.pem').toString('ascii');
    parentKey = fs.readFileSync('./keys/root/' + '/_key.pem').toString('ascii');
    parentChain = fs.readFileSync('./keys/root/' + '/_fullchain.pem').toString('ascii');
    var certOptions = {
        commonName: commonName,
        serial: Math.floor(Math.random() * 1000000000),
        days: 365000,
    };

    certOptions.config = [
        '[req]',
        'req_extensions = v3_req',
        'distinguished_name = req_distinguished_name',
        '[req_distinguished_name]',
        'commonName = ' + commonName,
        '[v3_req]',
        'extendedKeyUsage = critical,clientAuth'
    ].join('\n');

    certOptions.serviceKey = parentKey;
    certOptions.serviceCertificate = parentCert;

    var csr = pem.createCertificate(
        certOptions, function (err, cert) {
            createDevice(deviceId,res,cert,function(result,certificate){
                console.log("device created");
                result.setHeader('Content-Type', 'application/json');
                result.send(JSON.stringify({ public: certificate.certificate, key: certificate.clientKey }));    
            });
           

        }); 

    console.log('generated leaf certificate');
});


//create a device. 
//argument deviceid: the id/name of the device
function createDevice(deviceId,result,certificate,onSuccess){
    var provisioningServiceClient = require('azure-iot-provisioning-service').ProvisioningServiceClient;
    var registrationId = deviceId;
    console.log(process.env.CONNECTION_STRING);
    var serviceClient = provisioningServiceClient.fromConnectionString(process.env.CONNECTION_STRING);
    var deviceCert = certificate.certificate;
    console.log("proceeding to enroll");
    var enrollment = {
        registrationId: registrationId,
        deviceID: deviceId,
        provisioningStatus: 'disabled',
        initialTwin: {
          tags: { 
              mytag: 'abc'
          },
          properties: {
            desired: {
              myproperty1: '123',
              myproperty2: '789'
            }
          }
        },
        attestation: {
            type: 'x509',
            x509: {
                clientCertificates: {
                    primary: {
                        certificate: deviceCert
                    }
                }
            }
        }
    };

    serviceClient.createOrUpdateIndividualEnrollment(enrollment, function (err, enrollmentResponse) {
        if (err) {
            console.log('error creating the individual enrollment: ' + err);
        } else {
            console.log(enrollmentResponse.assignedHub);
            console.log("enrollment record returned: " + JSON.stringify(enrollmentResponse, null, 2));
            onSuccess(result,certificate);
        }
    });
}



//method to verify a certificate given a challenge
//parameter challenge the challenge given by Azure
//return the public part of the generated certificate
app.get('/verify', function (req, res) {

    var query = require('url').parse(req.url, true).query;

    var challenge = query.challenge;


    var commonName = challenge;
    parentCert = fs.readFileSync('./keys/root/' + '_cert.pem').toString('ascii');
    parentKey = fs.readFileSync('./keys/root/' + '_key.pem').toString('ascii');
    parentChain = fs.readFileSync('./keys/root/' + '_fullchain.pem').toString('ascii');
    var certOptions = {
        commonName: commonName,
        serial: Math.floor(Math.random() * 1000000000),
        days: 36500,
    };


    if (!fs.existsSync('./keys/verif/' + commonName)) {
        fs.mkdirSync('./keys/verif/' + commonName);
    }
    certOptions.config = [
        '[req]',
        'req_extensions = v3_req',
        'distinguished_name = req_distinguished_name',
        '[req_distinguished_name]',
        'commonName = ' + commonName,
        '[v3_req]',
        'extendedKeyUsage = critical,clientAuth'
    ].join('\n');

    certOptions.serviceKey = parentKey;
    certOptions.serviceCertificate = parentCert;

    var csr = pem.createCertificate(
        certOptions, function (err, cert) {
            console.log(err);
            console.log(cert);
            fs.writeFile('./keys/verif/' + commonName + '/_cert.pem', cert.certificate);
            fs.writeFile('./keys/verif/' + commonName + '/_key.pem', cert.clientKey);
            fs.writeFile('./keys/verif/' + commonName + '/_fullchain.pem', cert.certificate + '\n' + parentChain);
            res.setHeader('Content-Type', 'application/json');
            res.send(JSON.stringify({ challengeresult: cert.certificate }));
        });

    console.log('generated verification certificate')
});

//recreate root certificate
//arg rootname = the name of your root Certificate
app.get('/createroot', function (req, res) {
    var commonName = req.query.rootname;
    var certOptions = {
        commonName: commonName,
        serial: Math.floor(Math.random() * 1000000000),
        days: 365000,
    };
    certOptions.config = [
        '[req]',
        'req_extensions = v3_req',
        'distinguished_name = req_distinguished_name',
        'x509_extensions = v3_ca',
        '[req_distinguished_name]',
        'commonName = ' + commonName,
        '[v3_req]',
        'basicConstraints = critical, CA:true'
    ].join('\n');
    certOptions.selfSigned = true;
    var csr = pem.createCertificate(
        certOptions, function (err, cert) {
            fs.writeFile("./keys/root/_cert.pem", cert.certificate);
            fs.writeFile("./keys/root/_key.pem", cert.clientKey);
            fs.writeFile("./keys/root/_fullchain.pem", cert.certificate);

        });
    console.log(csr);
    res.send('generated root certificate on server side')
});


http.createServer(app).listen(8000);
