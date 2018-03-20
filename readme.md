#Example of device provisining in a factory 
We ran into a customer that produce an IoT concentrator used within different types of machines ranging from industrial to vending machines. 
In this scenario, there are three "players" involved : The concentrator manufacturer, the machine manufacter and the machines' end customers. The goal of the sample solution is to support all those three actors with a friction-less device activation. 

#Disclaimer
This is a sample solution to illustrate a possible usage of DPS in a factory oriented scenario. It is by no means a security best practice and it should be taken as a sample only. The assumption of this sample is that devices don't support TPM or HSM, hence usage of certificate based authentication. Certificate generation and workflow is also in a simplified state and should not be taken as best practice.

#Flow
1. Device is manufactured at the factory floor.
2. Device is served with correct image and dependencies, typically through a server local to the factory floor.
    1. Device is provisioned with OS and stuff
    2. Leaf certificates are generated with the HW id of the concentrator (GUID=RegistrationID=DeviceID). Typically, the GUID is printed on a label located on the concentrator board.
    3. The certificate is installed on the device.
    4. Server contact the Azure DPS to provision the device in the enrollemnt list. It uploads lead certificate and set the provisionning status to disabled in order to forbid registration without providing further information by end-customer.
3. Device is shipped to the machine manufacturer. On reception, he activate the board on a web portal, adding the needed usefull information (e.g. location, chassis nb,...).
    1. On activation request, the customer portal call the DPS in order to make it end-customer ready:
        * Provision the metadata as Device Twins
        * Set the provisionStatus as enabled 
        * Set the IoT Hub on which the device will be connected to
    2. Board is mounted inside the machine and is sent to the end-customer
4. When the customers recieved the machine: 
    1. At first boot, the machine will connect to the DPS for enrollment. It sends its leaf certificate as Authentication mechanism. DPS will do the device registration on the IoT Hub assigned in the steps before and send back its connection information to the device.
    2. Machine can now speak with the IoT hub using connection that was sent back in the previous step. The leaf certificate will be used as auth mechanism. 

#Components
Device Provisioning Service
IoT Hub(s)
Factory Server
Device provisioning Library
Custom end user Portal

#TODO ARM Template generating

#
