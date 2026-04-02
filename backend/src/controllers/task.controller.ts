import { Request, Response } from 'express';
import * as taskService from '../services/task.service';
import { TaskQueryParams } from '../types';

export async function listTasks(req: Request, res: Response): Promise<void> {
  const userId = req.user!.userId;
  const role = req.user!.role;

  const query = req.query as Record<string, string | undefined>;

  const params: TaskQueryParams = {
    page: query.page ? parseInt(query.page, 10) : 1,
    limit: query.limit ? parseInt(query.limit, 10) : 20,
    status: query.status as TaskQueryParams['status'],
    priority: query.priority as TaskQueryParams['priority'],
    assignedTo: query.assignedTo,
    sortBy: query.sortBy,
    order: query.order as TaskQueryParams['order'],
    search: query.search,
  };

  const result = taskService.listTasks(userId, role, params);
  res.json({ data: result.data, meta: result.meta });
}

export async function createTask(req: Request, res: Response): Promise<void> {
  const userId = req.user!.userId;
  const task = await taskService.createTask(req.body, userId);
  res.status(201).json({ data: task });
}

export async function getTask(req: Request, res: Response): Promise<void> {
  const userId = req.user!.userId;
  const role = req.user!.role;
  const task = taskService.getTask(req.params.id, userId, role);
  res.json({ data: task });
}

export async function updateTask(req: Request, res: Response): Promise<void> {
  const userId = req.user!.userId;
  const role = req.user!.role;
  const task = await taskService.updateTask(req.params.id, req.body, userId, role);
  res.json({ data: task });
}

export async function deleteTask(req: Request, res: Response): Promise<void> {
  const userId = req.user!.userId;
  const role = req.user!.role;
  taskService.deleteTask(req.params.id, userId, role);
  res.status(204).send();
}
