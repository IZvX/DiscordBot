const paypal = require("paypal-rest-sdk");

paypal.configure({
  mode: "sandbox", // or 'live' for production
  client_id: "AYIbtPg4VVJq_4tkdsYUDC-Cpmvz5oCfRAftFmoOnEfcbkN8PBNE9lTeg-Cv3dHtezuhIzE7GA9BZWzR",
  client_secret: "ECSznRunWXXxu-zfCIP0QhcwB58wFKGBhUqnwOmbuZx571o_nqtYY2QNydFR99OtxzctCgj5CPOUG8Ct",
});

async function createPaypalPayment(amount) {
  return new Promise((resolve, reject) => {
    const payment = {
      intent: "sale",
      payer: { payment_method: "paypal" },
      transactions: [
        {
          amount: {
            total: amount, // Use the dynamic amount here
            currency: "USD",
          },
          description: "Payment for Robux",
        },
      ],
      redirect_urls: {
        return_url: "http://yourwebsite.com/payment-success",
        cancel_url: "http://yourwebsite.com/payment-cancelled",
      },
    };

    paypal.payment.create(payment, (error, payment) => {
      if (error) {
        reject(error);
      } else {
        // Find the approval URL from the PayPal response
        const approvalUrl = payment.links.find(link => link.rel === 'approval_url').href;
        resolve(approvalUrl); // Resolve with the approval URL
      }
    });
  });
}

module.exports = { createPaypalPayment };
