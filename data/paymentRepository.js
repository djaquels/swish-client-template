class PaymentRepository {
	async create(payment, instructionId){
		throw new Error("Method not callable from interface.")
	}

	async update(paymentReference, newState){
		throw new Error("Method not callable from interface.")
	}

	async deletePayment(paymentReference){
		throw new Error("Method not callable from interface.")
	}

        async getPayment(paymentReference){
		throw new Error("Method not callable from interface.")
	}

	async list(){
		throw new Error("Method not callable from interface.")
	}
}

module.exports = {
 PaymentRepository
}

