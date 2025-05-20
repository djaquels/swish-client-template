const { google } = require('googleapis');
const { PaymentRepository } = require('./paymentRepository');

class GSheetsPaymentsRepository extends PaymentRepository {
    constructor() {
        super()
        this.gclient = null
    }

    async create(payment, instructionId) { }
    async update(paymentReference, paymentUpdate) {
        const sheets = this.gclient;
        const spreadsheetId = '1EpzPmMtxXkKougfuObdQMav2waeY_yGl6ggkwznQCl8';
        const range = 'Purchases!A:G'; // Adjust the sheet name and range as per your spreadsheet

        // Read the spreadsheet data
        const response = await sheets.spreadsheets.values.get({
            spreadsheetId,
            range,
        });
        const rows = response.data.values;

        // Find the row with the matching value in column E
        const rowIndex = rows.findIndex(row => row[4] === `${paymentReference}`); // Assuming column E is index 4

        if (rowIndex !== -1) {
            // Modify the value in column C for the found row
            rows[rowIndex][2] = paymentUpdate; // Assuming column C is index 2

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
    async delete(paymentReference) { }
    async getPayment(paymentReference) { }
    async list() { }
    async init() {
        const auth = new google.auth.GoogleAuth({
            keyFile: "./.ssl/sa.json",
            scopes: ['https://www.googleapis.com/auth/spreadsheets'],
        });
        const authClient = await auth.getClient();
        this.gclient = google.sheets({
            version: 'v4',
            auth: authClient,
        });
    }

}

module.exports = {
    GSheetsPaymentsRepository
}
