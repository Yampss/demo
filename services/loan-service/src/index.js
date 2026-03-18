require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { initDB } = require('./models/loan.model');
const loanRoutes = require('./routes/loan.routes');

const app = express();
const PORT = process.env.PORT || 3004;

app.use(cors());
app.use(express.json());

app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', service: 'loan-service' });
});

app.use('/api/loans', loanRoutes);

const start = async () => {
  await initDB();
  app.listen(PORT, () => {
    console.log(`Loan service running on port ${PORT}`);
  });
};

start();
