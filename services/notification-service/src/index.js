require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { initDB } = require('./models/notification.model');
const notificationRoutes = require('./routes/notification.routes');

const app = express();
const PORT = process.env.PORT || 3005;

app.use(cors());
app.use(express.json());

app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', service: 'notification-service' });
});

app.use('/api/notifications', notificationRoutes);

const start = async () => {
  await initDB();
  app.listen(PORT, () => {
    console.log(`Notification service running on port ${PORT}`);
  });
};

start();
