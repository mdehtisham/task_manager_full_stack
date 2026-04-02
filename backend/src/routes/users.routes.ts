import { Router } from 'express';
import { authenticate } from '../middleware/authenticate';
import { listUsers } from '../controllers/users.controller';

const router = Router();
router.get('/', authenticate, listUsers);

export default router;
