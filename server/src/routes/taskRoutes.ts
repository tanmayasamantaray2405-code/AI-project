import { Router } from 'express';
import { createTask, getUserTasks, updateTask, deleteTask } from '../controllers/taskController';
import { protect } from '../middleware/auth';

const router = Router();

// To support both JWT and direct access, we make endpoints flexible:
// If JWT is present, protect middleware will extract user context.
// However, we allow the request to proceed so direct API calls with userId in body work too.
router.post('/', (req, res, next) => {
  if (req.headers.authorization) {
    protect(req, res, next);
  } else {
    next();
  }
}, createTask);

router.get('/:userId', getUserTasks);
router.put('/:id', updateTask);
router.delete('/:id', deleteTask);

export default router;
