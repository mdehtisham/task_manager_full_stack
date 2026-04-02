import { Router } from 'express';
import { authenticate } from '../middleware/authenticate';
import { validate } from '../middleware/validate';
import { validateCreateTask, validateUpdateTask, validateTaskQuery } from '../validators/task.validator';
import * as taskController from '../controllers/task.controller';
import { asyncHandler } from '../utils/asyncHandler';

const router = Router();

router.use(authenticate);

router.get('/', validate(validateTaskQuery, 'query'), asyncHandler(taskController.listTasks));
router.post('/', validate(validateCreateTask), asyncHandler(taskController.createTask));
router.get('/:id', asyncHandler(taskController.getTask));
router.put('/:id', validate(validateUpdateTask), asyncHandler(taskController.updateTask));
router.delete('/:id', asyncHandler(taskController.deleteTask));

export default router;
