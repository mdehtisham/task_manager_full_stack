import express from 'express';
import { requestLogger } from './middleware/requestLogger';
import { errorHandler } from './middleware/errorHandler';
import authRoutes from './routes/auth.routes';
import taskRoutes from './routes/task.routes';
import usersRoutes from './routes/users.routes';

const app = express();

app.use(express.json());
app.use(requestLogger);

// CORS for development
app.use((_req, res, next) => {
  res.header('Access-Control-Allow-Origin', 'http://localhost:3000');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  if (_req.method === 'OPTIONS') {
    res.sendStatus(200);
    return;
  }
  next();
});

app.use('/api/auth', authRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/users', usersRoutes);

app.use(errorHandler);

export default app;
