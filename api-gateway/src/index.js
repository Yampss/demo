require('dotenv').config();
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const { createProxyMiddleware } = require('http-proxy-middleware');

const app = express();
const PORT = process.env.PORT || 3000;

const USER_SERVICE_URL = process.env.USER_SERVICE_URL || 'http://user-service:3001';
const ACCOUNT_SERVICE_URL = process.env.ACCOUNT_SERVICE_URL || 'http://account-service:3002';
const TRANSACTION_SERVICE_URL = process.env.TRANSACTION_SERVICE_URL || 'http://transaction-service:3003';
const LOAN_SERVICE_URL = process.env.LOAN_SERVICE_URL || 'http://loan-service:3004';
const NOTIFICATION_SERVICE_URL = process.env.NOTIFICATION_SERVICE_URL || 'http://notification-service:3005';

app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-internal-key'],
}));

app.use(morgan('combined'));

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 500,
  message: { success: false, message: 'Too many requests, please try again later.' },
});

app.use(limiter);

app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    service: 'api-gateway',
    uptime: process.uptime(),
    services: {
      user: USER_SERVICE_URL,
      account: ACCOUNT_SERVICE_URL,
      transaction: TRANSACTION_SERVICE_URL,
      loan: LOAN_SERVICE_URL,
      notification: NOTIFICATION_SERVICE_URL,
    },
  });
});

const makeProxy = (target) => createProxyMiddleware({
  target,
  changeOrigin: true,
  on: {
    error: (err, req, res) => {
      if (!res.headersSent) {
        res.status(503).json({ success: false, message: 'Service temporarily unavailable' });
      }
    },
  },
});

app.use('/api/users', makeProxy(USER_SERVICE_URL));
app.use('/api/accounts', makeProxy(ACCOUNT_SERVICE_URL));
app.use('/api/transactions', makeProxy(TRANSACTION_SERVICE_URL));
app.use('/api/loans', makeProxy(LOAN_SERVICE_URL));
app.use('/api/notifications', makeProxy(NOTIFICATION_SERVICE_URL));

app.use((req, res) => {
  res.status(404).json({ success: false, message: 'Route not found' });
});

app.listen(PORT, () => {
  console.log(`API Gateway running on port ${PORT}`);
});
