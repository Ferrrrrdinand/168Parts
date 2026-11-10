const express = require('express');
const router = express.Router();
const chatController = require('../controllers/chatController');

// 1. Inisialisasi atau load room chat (Pelanggan / Guest)
router.post('/rooms/init', chatController.initRoom);

// 2. Daftar seluruh room chat (Admin Seller Centre)
router.get('/rooms', chatController.getRooms);

// 3. Ambil pesan & histori dalam room
router.get('/rooms/:roomId/messages', chatController.getRoomMessages);

// 4. Kirim pesan ke room
router.post('/rooms/:roomId/messages', chatController.sendMessage);

// 5. Update status room (Admin tandai selesai / dialihkan)
router.patch('/rooms/:roomId/status', chatController.updateRoomStatus);

module.exports = router;
