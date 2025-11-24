require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const axios = require('axios');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 10000;
const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY;

app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));

// Endpoint to trigger STK Push (Paystack Charge)
app.post('/pay', async (req, res) => {
  const { phone, amount } = req.body;

  if (!phone || !amount) return res.status(400).send('Phone and amount required');

  try {
    const response = await axios.post(
      'https://api.paystack.co/charge',
      {
        email: `${phone}@trustwallet.africa`, // fake email for M-PESA prompt
        amount: parseInt(amount) * 100, // Paystack expects kobo
        currency: 'KES',
        channels: ['mobile_money'],
        mobile_money: { phone: phone, provider: 'mpesa' }
      },
      {
        headers: {
          Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );

    res.json({ status: 'success', data: response.data });
  } catch (err) {
    console.error(err.response?.data || err.message);
    res.status(500).json({ status: 'error', message: err.response?.data || err.message });
  }
});

// Webhook to receive payment confirmations
app.post('/webhook', (req, res) => {
  const event = req.body;

  console.log('Webhook event received:', event);

  // Respond to Paystack quickly
  res.sendStatus(200);
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});