import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import pkg from 'pg';

dotenv.config();

const { Pool } = pkg;
const app = express();
const port = process.env.PORT || 5002;

app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5174',
  credentials: true
}));
app.use(express.json());

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});

pool.connect()
  .then(() => console.log('Connected to PostgreSQL Database Successfully!'))
  .catch(err => console.error('Database connection error', err.stack));

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'QuanLyCV API is running!' });
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
