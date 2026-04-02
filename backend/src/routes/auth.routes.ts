import { Router } from 'express';
import { signup, login, me } from '../controllers/auth.controller';
import { authenticate } from '../middleware/authenticate';
import { validate } from '../middleware/validate';
import { validateSignup, validateLogin } from '../validators/auth.validator';
import { asyncHandler } from '../utils/asyncHandler';

const router = Router();

router.post('/signup', validate(validateSignup), asyncHandler(signup));
router.post('/login', validate(validateLogin), asyncHandler(login));
router.get('/me', authenticate, asyncHandler(me));

export default router;
