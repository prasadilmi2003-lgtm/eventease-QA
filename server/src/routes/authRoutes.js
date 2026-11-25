import { Router } from 'express'
import rateLimit from 'express-rate-limit'
import {
  register,
  login,
  logout,
  getMe,
  updateMe,
  forgotPassword,
  resetPassword,
} from '../controllers/authController.js'
import { protect } from '../middleware/authMiddleware.js'

const router = Router()

// BUG-001: only failed logins count, so valid users and load tests with correct passwords are unaffected.
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  skipSuccessfulRequests: true,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many failed login attempts. Try again in 15 minutes.' },
})

router.post('/register', register)
router.post('/login', loginLimiter, login)
router.post('/logout', logout)
router.get('/me', protect, getMe)
router.patch('/me', protect, updateMe)
router.post('/forgot-password', forgotPassword)
router.post('/reset-password', resetPassword)

export default router
