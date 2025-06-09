import express from 'express';
import { forgotPassword, login, logout, refreshToken, register, resetPassword, updatePassword } from '../controllers/auth.js';

const router = express.Router();

router.post('/login', login);
router.get('/logout', logout);
router.post('/register', register);
router.get('/refresh-token', refreshToken);
router.post('/update-password', updatePassword);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);

const authRoutes = router;

export default authRoutes;