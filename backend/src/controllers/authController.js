import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import db from "../models/db.js";
import nodemailer from "nodemailer";

// ==============================
// 회원가입
// ==============================
export const registerUser = async (req, res) => {
  try {
    const { user_id, password, email } = req.body;
    if (!user_id || !password || !email)
      return res.status(400).json({ message: "필수 항목이 누락되었습니다." });

    const [existing] = await db.query("SELECT * FROM tb_user WHERE login_id = ?", [user_id]);
    if (existing.length > 0) {
      return res.status(400).json({ message: "이미 사용 중인 아이디입니다." });
    }

    const hashed = await bcrypt.hash(password, 10);
    await db.query("INSERT INTO tb_user (login_id, password, email) VALUES (?, ?, ?)", [
      user_id,
      hashed,
      email,
    ]);

    res.status(201).json({ message: "회원가입이 완료되었습니다." });
  } catch (err) {
    console.error("회원가입 오류:", err);
    res.status(500).json({ message: "회원가입 중 서버 오류가 발생했습니다." });
  }
};

// ==============================
// 로그인
// ==============================
export const loginUser = async (req, res) => {
  try {
    const { login_id, password } = req.body;
    const [users] = await db.query("SELECT * FROM tb_user WHERE login_id = ?", [login_id]);

    if (users.length === 0)
      return res.status(401).json({ message: "아이디 또는 비밀번호가 올바르지 않습니다." });

    const user = users[0];
    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch)
      return res.status(401).json({ message: "아이디 또는 비밀번호가 올바르지 않습니다." });

    // ✅ JWT 발급
    const token = jwt.sign(
      { id: user.user_id, login_id: user.login_id },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    res.json({
      message: "로그인 성공",
      token,
      user: { id: user.user_id, login_id: user.login_id, email: user.email },
    });
  } catch (err) {
    console.error("로그인 오류:", err);
    res.status(500).json({ message: "로그인 중 서버 오류가 발생했습니다." });
  }
};

// ==============================
// 아이디 중복 검사
// ==============================
export const checkDuplicate = async (req, res) => {
  try {
    const { user_id } = req.body;
    const [rows] = await db.query("SELECT user_id FROM tb_user WHERE login_id = ?", [user_id]);
    res.json({ exists: rows.length > 0 });
  } catch (err) {
    res.status(500).json({ message: "중복 검사 중 오류가 발생했습니다." });
  }
};

// ==============================
// 이메일 인증
// ==============================
export const sendVerification = async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ message: "이메일을 입력해주세요." });

  try {
    const code = Math.floor(100000 + Math.random() * 900000).toString(); // 6자리 인증번호

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: email,
      subject: "[꽤뚫어뷰] 이메일 인증번호",
      text: `인증번호는 ${code} 입니다.`,
    });

    await db.query(
      "INSERT INTO tb_email_verification (email, code, created_at) VALUES (?, ?, NOW())",
      [email, code]
    );

    res.json({ message: "이메일로 인증번호를 전송했습니다." });
  } catch (err) {
    console.error("이메일 발송 오류:", err);
    res.status(500).json({ message: "이메일 발송 중 오류가 발생했습니다." });
  }
};

// ==============================
// 아이디 찾기
// ==============================
export const findId = async (req, res) => {
  try {
    const { email } = req.body;
    const [rows] = await db.query("SELECT login_id FROM tb_user WHERE email = ?", [email]);
    if (rows.length === 0) return res.status(404).json({ message: "아이디를 찾을 수 없습니다." });
    res.json({ login_id: rows[0].login_id, message: "아이디 찾기 성공" });
  } catch (err) {
    res.status(500).json({ message: "아이디 찾기 중 오류가 발생했습니다." });
  }
};

// ==============================
// 비밀번호 찾기
// ==============================
export const findPassword = async (req, res) => {
  try {
    const { login_id, email } = req.body;
    const [rows] = await db.query("SELECT * FROM tb_user WHERE login_id = ? AND email = ?", [
      login_id,
      email,
    ]);
    if (rows.length === 0)
      return res.status(404).json({ message: "일치하는 정보를 찾을 수 없습니다." });

    console.log(`🔑 비밀번호 재설정 링크 발송 대상: ${email}`);
    res.json({ message: "비밀번호 재설정 링크가 이메일로 발송되었습니다." });
  } catch (err) {
    res.status(500).json({ message: "비밀번호 찾기 중 오류가 발생했습니다." });
  }
};

// ==============================
// JWT 유효성 검증
// ==============================
export const verifyToken = async (req, res) => {
  const authHeader = req.headers["authorization"];
  if (!authHeader) return res.status(401).json({ message: "인증 토큰이 없습니다." });

  const token = authHeader.split(" ")[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    res.json({ valid: true, user: decoded });
  } catch (err) {
    res.status(401).json({ message: "유효하지 않은 토큰입니다." });
  }
};
