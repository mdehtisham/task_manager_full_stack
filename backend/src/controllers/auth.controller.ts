import { Request, Response } from 'express';
import * as authService from '../services/auth.service';

export async function signup(req: Request, res: Response): Promise<void> {
  const { email, password, name } = req.body as {
    email: string;
    password: string;
    name: string;
  };
  const user = await authService.signup(email, password, name);
  res.status(201).json({ data: user });
}

export async function login(req: Request, res: Response): Promise<void> {
  const { email, password } = req.body as { email: string; password: string };
  const result = await authService.login(email, password);
  res.json({ data: result });
}

export async function me(req: Request, res: Response): Promise<void> {
  const user = authService.getMe(req.user!.userId);
  res.json({ data: user });
}
