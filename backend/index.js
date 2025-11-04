import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import mysql from 'mysql2/promise';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '.env') });

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Serve static files from ../frontend/public (images, favicon, etc.)
app.use(express.static(path.join(__dirname, '..', 'frontend', 'public'), {
  maxAge: '1d',
  etag: true
}));

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'test',
  port: Number(process.env.DB_PORT || 3306),
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

app.get('/api/health', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT 1 + 1 AS two');
    res.json({ ok: true, db: rows[0].two === 2 });
  } catch (e) {
    res.status(500).json({ ok: false, error: String(e) });
  }
});

app.get('/api/users', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT id, name, email FROM users ORDER BY id DESC LIMIT 50');
    res.json(rows);
  } catch (e) {
    res.status(500).json({ message: 'DB query failed', error: String(e) });
  }
});

app.post('/api/users', async (req, res) => {
  const { name, email } = req.body || {};
  if (!name || !email) return res.status(400).json({ message: 'name and email are required' });
  try {
    const [result] = await pool.query('INSERT INTO users (name, email) VALUES (?, ?)', [name, email]);
    res.status(201).json({ id: result.insertId, name, email });
  } catch (e) {
    res.status(500).json({ message: 'Insert failed', error: String(e) });
  }
});

// Auth Routes
app.post('/auth/login', async (req, res) => {
  const { login_id, password } = req.body || {};
  if (!login_id || !password) {
    return res.status(400).json({ message: '아이디와 비밀번호를 입력해주세요.' });
  }
  
  try {
    const [rows] = await pool.query(
      'SELECT id, login_id, name, email FROM users WHERE login_id = ? AND password = ?',
      [login_id, password]
    );
    
    if (rows.length > 0) {
      res.json({ message: '로그인 성공', user: rows[0] });
    } else {
      res.status(401).json({ message: '아이디 또는 비밀번호가 올바르지 않습니다.' });
    }
  } catch (e) {
    res.status(500).json({ message: '로그인 요청 중 오류가 발생했습니다.', error: String(e) });
  }
});

app.post('/auth/check-duplicate', async (req, res) => {
  const { user_id } = req.body || {};
  if (!user_id) {
    return res.status(400).json({ message: '아이디를 입력해주세요.' });
  }
  
  try {
    const [rows] = await pool.query('SELECT id FROM users WHERE login_id = ?', [user_id]);
    res.json({ exists: rows.length > 0 });
  } catch (e) {
    res.status(500).json({ message: '중복 검사 중 오류가 발생했습니다.', error: String(e) });
  }
});

app.post('/auth/send-verification', async (req, res) => {
  const { email } = req.body || {};
  if (!email) {
    return res.status(400).json({ message: '이메일을 입력해주세요.' });
  }
  
  // 실제로는 이메일 발송 로직이 필요하지만, 여기서는 단순 성공 응답
  try {
    // 이메일 발송 로직 (미구현)
    console.log(`인증번호 발송: ${email}`);
    res.json({ message: '인증번호가 발송되었습니다.' });
  } catch (e) {
    res.status(500).json({ message: '이메일 발송 중 오류가 발생했습니다.', error: String(e) });
  }
});

app.post('/auth/join', async (req, res) => {
  const { user_id, password, email } = req.body || {};
  if (!user_id || !password || !email) {
    return res.status(400).json({ message: '필수 입력 항목이 누락되었습니다.' });
  }
  
  try {
    const [result] = await pool.query(
      'INSERT INTO users (login_id, password, email) VALUES (?, ?, ?)',
      [user_id, password, email]
    );
    res.status(201).json({ message: '회원가입이 완료되었습니다.', id: result.insertId });
  } catch (e) {
    // 중복 아이디 에러 처리
    if (e.code === 'ER_DUP_ENTRY') {
      res.status(400).json({ message: '이미 사용 중인 아이디입니다.' });
    } else {
      res.status(500).json({ message: '회원가입 중 오류가 발생했습니다.', error: String(e) });
    }
  }
});

app.post('/auth/find-id', async (req, res) => {
  const { email } = req.body || {};
  if (!email) {
    return res.status(400).json({ message: '이메일을 입력해주세요.' });
  }
  
  try {
    const [rows] = await pool.query('SELECT login_id FROM users WHERE email = ?', [email]);
    if (rows.length > 0) {
      res.json({ message: `아이디: ${rows[0].login_id}`, login_id: rows[0].login_id });
    } else {
      res.status(404).json({ message: '일치하는 정보를 찾을 수 없습니다.' });
    }
  } catch (e) {
    res.status(500).json({ message: '아이디 찾기 중 오류가 발생했습니다.', error: String(e) });
  }
});

app.post('/auth/find-password', async (req, res) => {
  const { login_id, email } = req.body || {};
  if (!login_id || !email) {
    return res.status(400).json({ message: '아이디와 이메일을 입력해주세요.' });
  }
  
  try {
    const [rows] = await pool.query(
      'SELECT id FROM users WHERE login_id = ? AND email = ?',
      [login_id, email]
    );
    if (rows.length > 0) {
      // 실제로는 비밀번호 재설정 링크를 이메일로 발송
      console.log(`비밀번호 재설정 링크 발송: ${email}`);
      res.json({ message: '비밀번호 재설정 링크를 이메일로 발송했습니다.' });
    } else {
      res.status(404).json({ message: '일치하는 정보를 찾을 수 없습니다.' });
    }
  } catch (e) {
    res.status(500).json({ message: '비밀번호 찾기 중 오류가 발생했습니다.', error: String(e) });
  }
});

app.listen(port, () => {
  console.log(`Server started on http://localhost:${port}`);
});


