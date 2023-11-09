const express = require("express");
const axios = require("axios");
const fs = require('fs');
const https = require('https');

const app = express();
const PORT = 8080;


app.use(express.json())



const agent = new https.Agent({
    cert: fs.readFileSync('./.ssl/cert.pem', { encoding: 'utf8' }),
    key: fs.readFileSync('./.ssl/private.key', { encoding: 'utf8' }),
    //ca: fs.readFileSync('./.ssl/Swish_TLS_RootCA.pem', { encoding: 'utf8' }),
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
  const callback = 'https://dance-vida-payments.ey.r.appspot.com/api/callback'
  const data = {
    payeePaymentReference: '0123456788',
    callbackUrl: callback,
    payeeAlias: '1234977948',
    currency: 'SEK',
    amount: '1',
    message: 'Kingston USB Flash Drive 8 GB'
  };
  
  client.put(
  `https://cpc.getswish.net/swish-cpcapi/api/v2/paymentrequests/${instructionId}`,
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
  console.log(req.body)
  res.send("Callback endpoint");
});

app.get("/api/info", async ( req, res) => {
  try {
    const response = await client.get(
      `https://cpc.getswish.net/swish-cpcapi/api/v1/paymentrequests/D040A107AEEDDEECDE8B0E3A16F9B11F`
    );

    if (response.status === 200) {
      return response.data;
    }
  } catch (error) {
    console.error(error);
  }
})

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
