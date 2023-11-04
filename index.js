const express = require("express");
const axios = require("axios");
const fs = require('fs');
const https = require('https');

const app = express();
const PORT = 3000;



const agent = new https.Agent({
    cert: fs.readFileSync('./.ssl/Swish_Merchant_TestCertificate_1234679304.pem', { encoding: 'utf8' }),
    key: fs.readFileSync('./.ssl/Swish_Merchant_TestCertificate_1234679304.key', { encoding: 'utf8' }),
    ca: fs.readFileSync('./.ssl/Swish_TLS_RootCA.pem', { encoding: 'utf8' }),
  });

const client = axios.create({
    httpsAgent: agent
  });


  async function getQrCodeFromToken(token) {
    const data = {
      token,
      size: "300",
      format: "png",
      border: "0"
    };
  
    try {
      const response = await client.post(
        `https://mpc.getswish.net/qrg-swish/api/v1/commerce`,
        data,
        { responseType: 'arraybuffer' }
      );
  
      if (response.status === 200) {
        return response.data;
      }
    } catch (error) {
      console.error(error);
    }
  };

function getUUID() {
    const hexDigits = '0123456789ABCDEF';
    let key = '';
  
    for (let i = 0; i < 32; i++) {
      key += hexDigits[Math.floor(Math.random() * 16)];
    }
  
    return key;
  }  
// Define routes
app.get("/api/payment-request", (req, res) => {
  // Handle payment request logic
  const instructionId = getUUID();
  const callback = 'https://example.com/swishcallback'
  const data = {
    payeePaymentReference: '0123456789',
    callbackUrl: callback,
    payeeAlias: '1234679304',
    currency: 'SEK',
    amount: '100',
    message: 'Kingston USB Flash Drive 8 GB'
  };
  
  client.put(
  `https://mss.cpc.getswish.net/swish-cpcapi/api/v2/paymentrequests/${instructionId}`,
    data
  ).then((api) => {
     //console.log('Payment request created')
     const token = api.headers.paymentrequesttoken 
     res.send({
        message: "Payment request created",
        id: instructionId,
        url: `swish://paymentrequest?token=${token}&callbackurl=${callback}`
        //qr: getQrCodeFromToken(token)
     });
  }).catch(err => {
    console.log(err)
    res.send("Payment Failed")
  })
});

app.post("/api/callback", (req, res) => {
  res.send("Callback endpoint");
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
