const express = require("express");
const axios = require("axios");
const fs = require('fs');
const https = require('https');
const path = require('path');
const dotenv = require('dotenv');
const { google } = require('googleapis');//move to data  layer
const { SQLitePaymentsRepository } = require('./data/sqliteRepository.js')
// dotenv configuraiton
const env = '.env';
dotenv.config({ path: path.resolve(__dirname, env) });

// Server configurations
const app = express();
const PORT = 8080;
const swishAPI = process.env.SWISH_API
const callbackURL = process.env.CALL_BACK_URL


app.use(express.json())



const agent = new https.Agent({
  cert: fs.readFileSync('./.ssl/cert.pem', { encoding: 'utf8' }),
  key: fs.readFileSync('./.ssl/private.key', { encoding: 'utf8' }),
  //ca: fs.readFileSync('./.ssl/Swish_TLS_RootCA.pem', { encoding: 'utf8' }),
});

const client = axios.create({
  httpsAgent: agent
}); // this creates an HTTPS client with the right certs for communication with Swish API


// Storage (DB) configurations
let db = null
const connect = async (type) => {
	switch(type){
	 case 'sqlite':
	  const sqliteRepo = new SQLitePaymentsRepository('./data/db/payments.db')
	  await sqliteRepo.init()
	  return sqliteRepo
	 default:
	  return null
	}
}

const getDBConnection = async() => {
  const dbClient = await connect(process.env.STORAGE_ENGINE)
  if(!db){
    db = dbClient
  }
  return db
}
/*update to handle desired storage engine (available): pg, gsheet, sqlite(local test) or text (local test)
for adding a custom engine please read the docs. README.md
*/

async function _getGoogleSheetClient() {
  const auth = new google.auth.GoogleAuth({
    keyFile: "./.ssl/sa.json",
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });
  const authClient = await auth.getClient();
  return google.sheets({
    version: 'v4',
    auth: authClient,
  });
}


function getUUID() {
  const hexDigits = '0123456789ABCDEF';
  let key = '';

  for (let i = 0; i < 32; i++) {
    key += hexDigits[Math.floor(Math.random() * 16)];
  }

  return key;
}

async function modifySpreadsheet(reference, status) {
  const sheets = await await _getGoogleSheetClient();
  const spreadsheetId = '1EpzPmMtxXkKougfuObdQMav2waeY_yGl6ggkwznQCl8';
  const range = 'Purchases!A:G'; // Adjust the sheet name and range as per your spreadsheet

  // Read the spreadsheet data
  const response = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range,
  });
  const rows = response.data.values;

  // Find the row with the matching value in column E
  const rowIndex = rows.findIndex(row => row[4] === `${reference}`); // Assuming column E is index 4

  if (rowIndex !== -1) {
    // Modify the value in column C for the found row
    rows[rowIndex][2] = status; // Assuming column C is index 2

    // Update the modified row in the spreadsheet
    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: `Purchases!C${rowIndex + 1}`, // Assuming column C is index 2
      valueInputOption: 'RAW',
      resource: {
        values: [[rows[rowIndex][2]]],
      },
    });
  } else {
    console.log('No matching row found.');
  }
}

// Define routes
app.get("/api/payment-request", async (req, res) => {
  const reference = req.query.payment_reference?.replace(/[^a-zA-ZåÅäÄöÖ0-9\-]/g, '-')
  const amount_sek = Number(req.query.amount)
  const concept = req.query.concept
  // Handle payment request logic
  const instructionId = getUUID();
  const callback = `${callbackURL}/api/callback`
  const data = {
    payeePaymentReference: reference,
    callbackUrl: callback,
    payeeAlias: '1234977948',
    currency: 'SEK',
    amount: amount_sek,
    message: concept
  };
  console.log(`Creating payment for ${reference} ${amount_sek} ${concept}`)
  client.put(
    `${swishAPI}/swish-cpcapi/api/v2/paymentrequests/${instructionId}`,
    data
  ).then(async (api) => {
    //console.log('Payment request created')
    try {
      const token = api.headers.paymentrequesttoken
      const dbInstance = await getDBConnection()
      await dbInstance?.create(data)
      res.send({
      message: 'Payment request created',
      id: instructionId,
      url: `swish://paymentrequest?token=${token}&callbackurl=${callback}`
      //qr: getQrCodeFromToken(token)
      });
    }catch(err){
      res.send({
        message: 'Payment request could not be created.',
        id: instructionId,
        url: 'swish://error',
        error: err
      })
    }
  }).catch(err => {
    console.log(err)
    res.send("Payment Failed")
  })
});

app.post("/api/callback", async (req, res) => {
  try {
    //console.log(req.body)
    const message_maping = {
      "PAID": "Payment completed", "CANCELLED": "Payment was cancelled",
      "DECLINED": "Payment was declined by customer", "ERROR": "Unexpected error"
    }
    const status = req.body.status
    const payment_reference = req.body.payeePaymentReference
    const update_row_status = message_maping[status]
    const reference_clean = payment_reference.replace(/'/g, '');
    console.log(`Payment update received: ${reference_clean} ${update_row_status}`);
    //modifySpreadsheet(reference_clean, update_row)
    db.update(reference_clean, update_row_status)
    res.send("Payment processed");
  } catch (err) {
    console.log(err)
  }
});

app.get("/api/callback", (req, res)  => {
  res.redirect('https://publicdomain.se/');
})

app.get("/api/info", async (req, res) => {
  try {
    const response = await client.get(
      `${swishAPI}/swish-cpcapi/api/v1/paymentrequests/D040A107AEEDDEECDE8B0E3A16F9B11F`
    );

    if (response.status === 200) {
      return response.data;
    }
  } catch (error) {
    console.error(error);
  }
})

// Start the server
app.listen(PORT,() => {
  console.log(`Server is running on port ${PORT}`);
});

