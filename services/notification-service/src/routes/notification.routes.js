const express = require('express');
const router = express.Router();
const notifController = require('../controllers/notification.controller');
const { authenticate, internalOnly } = require('../middlewares/auth.middleware');

router.post('/internal', internalOnly, notifController.createInternal);
router.get('/my', authenticate, notifController.getMyNotifications);
router.patch('/read-all', authenticate, notifController.readAll);
router.patch('/:id/read', authenticate, notifController.readNotification);
router.delete('/:id', authenticate, notifController.deleteNotification);

module.exports = router;
