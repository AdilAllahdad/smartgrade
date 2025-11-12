const express = require('express');
const { createAdmin, loginUser, getUserProfile, getUsers, registerUser, deleteUser } = require('../controllers/authController');
const { protect, admin } = require('../middleware/authMiddleware');

const router = express.Router();

router.post('/login', loginUser);
router.post('/register', registerUser);
router.get('/profile', protect, getUserProfile);
router.post('/create-admin', createAdmin);
router.get('/users', protect, getUsers);
router.post('/users', protect, registerUser); // Added endpoint for creating users
router.delete('/users/:id', protect, deleteUser);

module.exports = router;
