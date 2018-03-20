var Transport = require('azure-iot-provisioning-device-http').Http;
var fs = require('fs');
require('dotenv').config();


console.log(process.argv[2]);
var registrationId = process.argv[2];
var X509Security = require('azure-iot-security-x509').X509Security;

console.log(process.env.ID_SCOPE);
var ProvisioningDeviceClient = require('azure-iot-provisioning-device').ProvisioningDeviceClient;

var provisioningHost = 'global.azure-devices-provisioning.net';
var idScope =  process.env.ID_SCOPE;
var deviceCert = {
    cert: fs.readFileSync('./keys/' + registrationId + '/_cert.pem').toString(),
    key: fs.readFileSync('./keys/' + registrationId + '/_key.pem').toString()
};

var transport = new Transport();
var securityClient = new X509Security(registrationId, deviceCert);
var deviceClient = ProvisioningDeviceClient.create(provisioningHost, idScope, transport, securityClient);

// Register the device.  Do not force a re-registration.
deviceClient.register(function (err, result) {
    if (err) {
        console.log("error registering device: " + err);
    } else {
        sendMessages(registrationId,result.assignedHub,deviceCert);

    }
});

//send messages to the IoT Hub
function sendMessages(deviceName, iotHub,certificate) {
    var clientFromConnectionString = require('azure-iot-device-mqtt').clientFromConnectionString;
    var connectionString = require('azure-iot-device').ConnectionString.createWithX509Certificate(iotHub, deviceName);
    var client = clientFromConnectionString(connectionString);
    var passphrase = '';

    console.log(client);
    var Message = require('azure-iot-device').Message;


    var options = {
        cert: certificate.cert,
        key: certificate.key,
        passphrase: passphrase
    };

    function printResultFor(op) {
        return function printResult(err, res) {
            if (err) console.log(op + ' error: ' + err.toString());
            if (res) console.log(op + ' status: ' + res.constructor.name);
        };
    }

    var connectCallback = function (err) {
        if (err) {
            console.log('Could not connect: ' + err);
        } else {
            console.log('Client connected');

            // Create a message and send it to the IoT Hub every second
            setInterval(function () {
                var temperature = 20 + (Math.random() * 15);
                var humidity = 60 + (Math.random() * 20);
                var data = JSON.stringify({ deviceId: process.argv[2], temperature: temperature, humidity: humidity });
                var message = new Message(data);
                message.properties.add('temperatureAlert', (temperature > 30) ? 'true' : 'false');
                console.log("Sending message: " + message.getData());
                client.sendEvent(message, printResultFor('send'));
            }, 1000);
        }
    };
    client.setOptions(options);

    client.open(connectCallback);

}
