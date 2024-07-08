# Swish Payments with App Engine

Swish is a [swedish payments service](https://www.swish.nu/privat) used nationwide, integrating app payments means your service to be available for a 9 million people market.

Here is a simple, yet robust and complete Swish client that could be easy integrating in any web or mobile app.

## Requirements

- Google Cloud Account 
- Swish SSL [certificates](https://developer.swish.nu/documentation/environments#certificates), for production certs you need to contact your bank. Create a .ssl folder and paste your .pem and .key files.
- Nodejs 16+


### Caveats

For the purpose of prototyping this client is used by a Appshet mobile client and uses the google office suite as backed service for storing client payments in real life systems its recommended to use a proper backend system. Still the code base can be reutilized for communicating with the Swish API.