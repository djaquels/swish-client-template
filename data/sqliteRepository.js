const {PaymentRepository} = require('./paymentRepository.js')
const  sqlite3 = require('sqlite3')
const  {open} = require('sqlite')


class SQLitePaymentsRepository extends PaymentRepository {
  constructor(dbPath){
	super()
	this.dbPath = dbPath
  }

  async init(){
   this.db = await open({filename: this.dbPath, driver: sqlite3.Database})
   await this.db.run(`CREATE TABLE IF NOT EXISTS payments(reference TEXT PRIMARY KEY, data TEXT)`)	  
  }

  async create(payment){
   const paymentData = payment
   paymentData.status = 'Waiting for payment'
   await this.db.run(`INSERT INTO payments(payeePaymentReference, data) VALUES (?,?)`,
	   [payment.payeePaymentReference, JSON.stringify(payment)])
   return payment
  }

  async update(paymentReference, paymentUpdate){
     const paymentData = await this.db.get('SELECT data from payments WHERE payeePaymentReference = ?', [paymentReference])
     paymentData.status = paymentUpdate
     await this.db.run('UPDATE payments SET data=? WHERE payeePaymentReference=?', [JSON.stringify(paymentData), paymentReference])
     return paymentUpdate
  }

  async delete(paymentReference){
    await this.db.run('DELETE FROM payments WHERE payeePaymentReference=?',[paymentReference])
  }

  async getPayment(paymentReference){
   const row = await this.db.get('SELECT data from payments WHERE payeePaymentReference = ?', [paymentReference])
   return row
  }

  async list(){
   const rows = await this.db.all('SELECT data from payments')
   return rows.map(row => JSON.parse(row.data))	   
  }
}
module.exports = {
 SQLitePaymentsRepository 
}

