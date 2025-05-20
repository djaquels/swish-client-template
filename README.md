# Swish Payments with App Engine

Swish is a [swedish payments service](https://www.swish.nu/privat) used nationwide, integrating app payments means your service to be available for a 9 million people market.

Here is a simple, yet robust and complete Swish client that could be easy integrating in any web or mobile app.

## Requirements

- Google Cloud Account 
- Swish SSL [certificates](https://developer.swish.nu/documentation/environments#certificates), for production certs you need to contact your bank. Create a .ssl folder and paste your .pem and .key files. For test you can download [test certificates](https://developer.swish.nu/documentation/environments#managing-certificates). 
- Nodejs 16+


### Local Test

By default the app uses a SQLite database for storing payments transactions and a .env file to configure Swish Test API URLs, database settings.
Then service can start by running
```
npm install
npm start
```

### Deploy to prod

The project includes an app.yaml file that can be use to deploy to an Google App Engine service, there you can configure teh following environment variables:
- Swish Endpoint
- Storage Engine (SQLite, PostgreSQL, GSheet)