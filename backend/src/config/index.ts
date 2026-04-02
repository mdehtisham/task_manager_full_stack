import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(__dirname, '../../.env') });

export const config = {
  port: parseInt(process.env.PORT || '3001', 10),
  jwtSecret: process.env.JWT_SECRET || 'dev-secret-change-in-production',
  jwtExpiresIn: '8h',
  bcryptRounds: parseInt(process.env.BCRYPT_ROUNDS || '12', 10),
  dbPath: process.env.DB_PATH || './data/taskmanager.db',
  nodeEnv: process.env.NODE_ENV || 'development',
};
