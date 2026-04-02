import { Request, Response } from 'express';
import * as usersService from '../services/users.service';

export function listUsers(req: Request, res: Response): void {
  const isAdmin = req.user?.role === 'admin';
  const users = usersService.getAllUsers(isAdmin);
  res.json({ data: users });
}
