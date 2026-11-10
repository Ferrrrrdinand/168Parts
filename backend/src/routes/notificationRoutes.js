const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notificationController');

// 1. Ambil notifikasi untuk pembeli / member
router.get('/', notificationController.getNotifications);

// 2. Admin kirim pesan broadcast ke seluruh member
router.post('/broadcast', notificationController.sendBroadcast);

// 3. Tandai satu notifikasi sudah dibaca
router.post('/:id/read', notificationController.markAsRead);

// 4. Tandai semua notifikasi sudah dibaca
router.post('/read-all', notificationController.markAllAsRead);

// 5. Admin menghapus broadcast
router.delete('/:id', notificationController.deleteBroadcast);

module.exports = router;
