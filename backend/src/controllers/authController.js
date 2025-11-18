import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import db from "../models/db.js";
import nodemailer from "nodemailer";
// dotenv는 app.js에서 이미 로드됨


// ==============================
// 회원가입
// ==============================
export const registerUser = async (req, res) => {
  try {
    const { user_id, password, email } = req.body;

    if (!user_id || !password || !email) {
      return res.status(400).json({ message: "필수 항목이 누락되었습니다." });
    }

    // ✅ login_id 기준으로 중복 검사 (명확하게 수정)
    const [existing] = await db.query(
      "SELECT * FROM tb_user WHERE login_id = ?",
      [user_id]
    );
    if (existing.length > 0) {
      return res.status(400).json({ message: "이미 사용 중인 아이디입니다." });
    }

    // ✅ 비밀번호 암호화
    const hashed = await bcrypt.hash(password, 10);

    // ✅ 신규 회원 저장
    await db.query(
      "INSERT INTO tb_user (login_id, password, email, signup_date) VALUES (?, ?, ?, NOW())",
      [user_id, hashed, email]
    );

    res.status(201).json({ message: "회원가입이 완료되었습니다." });
  } catch (err) {
    console.error("❌ 회원가입 오류:", err);
    res.status(500).json({ message: "회원가입 중 서버 오류가 발생했습니다." });
  }
};


// ==============================
// 로그인
// ==============================
export const loginUser = async (req, res) => {
  try {
    const { login_id, password } = req.body;

    if (!login_id || !password)
      return res.status(400).json({ message: "아이디와 비밀번호를 입력해주세요." });

    const [users] = await db.query("SELECT * FROM tb_user WHERE login_id = ?", [login_id]);

    if (users.length === 0)
      return res.status(401).json({ message: "아이디 또는 비밀번호가 올바르지 않습니다?" });
    const hashed = await bcrypt.hash(password, 10);
    const user = users[0];
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch)
      return res.status(401).json({ message: "아이디 또는 비밀번호가 올바르지 않습니다!" });

    // ✅ JWT 발급
    const token = jwt.sign(
      { id: user.user_id, login_id: user.login_id },
      process.env.JWT_SECRET,
      { expiresIn: "2h" }
    );
    res.json({
      message: "로그인 성공",
      token,
      user: { id: user.user_id, login_id: user.login_id, email: user.email },
    });
  } catch (err) {
    console.error("❌ 로그인 오류:", err);
    res.status(500).json({ message: "로그인 중 서버 오류가 발생했습니다." });
  }
};


// ==============================
// 아이디 중복 검사
// ==============================
export const checkDuplicate = async (req, res) => {
  try {
    console.log("📩 [중복검사 요청 도착]", req.body);
    const { user_id } = req.body;

    if (!user_id || user_id.trim() === "") {
      return res.status(400).json({ message: "아이디가 비어 있습니다." });
    }

    // ✅ DB 쿼리 (login_id 기준)
    const [rows] = await db.query(
      "SELECT login_id FROM tb_user WHERE login_id = ?",
      [user_id]
    );

    console.log("✅ [DB 조회 결과]", rows);

    res.json({ exists: rows.length > 0 });
  } catch (err) {
    console.error("❌ [중복검사 오류]", err.message);
    res.status(500).json({ message: "중복 검사 중 서버 오류가 발생했습니다." });
  }
};


// ==============================
// ✉️ 이메일 인증번호 발송
// ==============================
export const sendVerification = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email)
      return res.status(400).json({ message: "이메일을 입력해주세요." });

    // ✅ 6자리 랜덤 코드 생성
    const code = Math.floor(100000 + Math.random() * 900000).toString();

    // ✅ nodemailer 설정
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    // ✅ 메일 전송
    await transporter.sendMail({
      from: `"꿰뚫어뷰 인증센터" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: "[꿰뚫어뷰] 이메일 인증번호 안내",
      text: `안녕하세요! 꿰뚫어뷰입니다.\n인증번호는 [ ${code} ] 입니다.\n5분 내에 입력해주세요.`,
    });

    // ✅ 이전 인증 요청 삭제 (중복 방지)
    await db.query("DELETE FROM tb_email_verification WHERE email = ?", [email]);

    // ✅ DB에 저장
    await db.query(
      "INSERT INTO tb_email_verification (email, code, verified, created_at) VALUES (?, ?, 0, NOW())",
      [email, code]
    );

    console.log(`📧 이메일 인증번호 발송 완료 → ${email} (${code})`);
    res.json({ success: true, message: "이메일로 인증번호를 전송했습니다." });
  } catch (err) {
    console.error("❌ 이메일 발송 오류:", err);
    res.status(500).json({ success: false, message: "이메일 발송 중 오류가 발생했습니다." });
  }
};


// ==============================
// 🧾 이메일 인증번호 확인
// ==============================
export const verifyEmailCode = async (req, res) => {
  try {
    const { email, code } = req.body;

    if (!email || !code)
      return res.status(400).json({ message: "이메일과 인증번호를 모두 입력해주세요." });

    const [rows] = await db.query(
      `SELECT * FROM tb_email_verification
       WHERE email = ? AND code = ?
       AND created_at >= NOW() - INTERVAL 5 MINUTE
       ORDER BY created_at DESC
       LIMIT 1`,
      [email, code]
    );

    if (rows.length === 0)
      return res.status(400).json({ message: "인증번호가 올바르지 않거나 만료되었습니다." });

    await db.query(
      "UPDATE tb_email_verification SET verified = 1 WHERE email = ? AND code = ?",
      [email, code]
    );

    res.json({ success: true, message: "이메일 인증이 완료되었습니다." });
  } catch (err) {
    console.error("❌ 인증번호 확인 오류:", err);
    res.status(500).json({ message: "이메일 인증 확인 중 서버 오류가 발생했습니다." });
  }
};


// ==============================
// 아이디 찾기
// ==============================
export const findId = async (req, res) => {
  try {
    const { email } = req.body;

    const [rows] = await db.query(
      "SELECT login_id FROM tb_user WHERE email = ?",
      [email]
    );

    if (rows.length === 0)
      return res.status(404).json({ message: "아이디를 찾을 수 없습니다." });

    res.json({ login_id: rows[0].login_id, message: "아이디 찾기 성공" });
  } catch (err) {
    console.error("❌ 아이디 찾기 오류:", err);
    res.status(500).json({ message: "아이디 찾기 중 서버 오류가 발생했습니다." });
  }
};


// ==============================
// 비밀번호 찾기 (임시 비밀번호 발송)
// ==============================
export const findPassword = async (req, res) => {
  try {
    const { login_id, email } = req.body;

    // 사용자 확인
    const [rows] = await db.query(
      "SELECT * FROM tb_user WHERE login_id = ? AND email = ?",
      [login_id, email]
    );
    if (rows.length === 0)
      return res
        .status(404)
        .json({ message: "일치하는 사용자 정보를 찾을 수 없습니다." });

    // ✅ 임시 비밀번호 생성
    const tempPassword = Math.random().toString(36).slice(2, 10) + "!";
    const hashedTemp = await bcrypt.hash(tempPassword, 10);

    // ✅ DB에 임시 비밀번호 업데이트
    await db.query("UPDATE tb_user SET password = ? WHERE login_id = ?", [
      hashedTemp,
      login_id,
    ]);

    // ✅ 이메일 발송
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    await transporter.sendMail({
      from: `"꿰뚫어뷰 비밀번호 재설정" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: "[꿰뚫어뷰] 임시 비밀번호 안내",
      text: `안녕하세요 ${login_id}님,\n\n요청하신 임시 비밀번호는 다음과 같습니다:\n\n${tempPassword}\n\n로그인 후 반드시 비밀번호를 변경해주세요.`,
    });

    console.log(`✅ 임시 비밀번호 발송 완료: ${email}`);

    res.json({
      success: true,
      message: "임시 비밀번호가 이메일로 발송되었습니다.",
    });
  } catch (err) {
    console.error("❌ 비밀번호 찾기 오류:", err);
    res.status(500).json({ message: "비밀번호 찾기 중 서버 오류가 발생했습니다." });
  }
};

// ==============================
// 회원정보 수정 (POST 방식)
// ==============================
export const updateProfile = async (req, res) => {
  try {
    const { current_password, new_password, new_email, email_code } = req.body;
    const authHeader = req.headers["authorization"];

    if (!authHeader)
      return res.status(401).json({ message: "인증 토큰이 없습니다." });

    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userId = decoded.id;

    // 🔹 현재 비밀번호 확인
    const [users] = await db.query("SELECT * FROM tb_user WHERE user_id = ?", [userId]);
    if (users.length === 0)
      return res.status(404).json({ message: "사용자를 찾을 수 없습니다." });

    const user = users[0];
    const isMatch = await bcrypt.compare(current_password, user.password);
    if (!isMatch)
      return res.status(400).json({ message: "현재 비밀번호가 일치하지 않습니다." });

    // 🔹 이메일 변경 시: 인증번호 검증
    if (new_email && email_code) {
      const [codes] = await db.query(
        `SELECT * FROM tb_email_verification 
         WHERE email = ? AND code = ? AND verified = 1 
         ORDER BY created_at DESC LIMIT 1`,
        [new_email, email_code]
      );

      if (codes.length === 0) {
        return res.status(400).json({ message: "이메일 인증이 완료되지 않았습니다." });
      }
    }

    // 🔹 업데이트 대상 준비
    const updates = [];
    const params = [];

    if (new_password) {
      const hashed = await bcrypt.hash(new_password, 10);
      updates.push("password = ?");
      params.push(hashed);
    }

    if (new_email) {
      updates.push("email = ?");
      params.push(new_email);
    }

    if (updates.length === 0)
      return res.status(400).json({ message: "변경할 항목이 없습니다." });

    // 🔹 쿼리 실행
    const sql = `UPDATE tb_user SET ${updates.join(", ")} WHERE user_id = ?`;
    params.push(userId);
    await db.query(sql, params);

    console.log(`✅ 회원정보 수정 완료 (user_id=${userId})`);
    res.json({ success: true, message: "회원정보가 수정되었습니다." });
  } catch (err) {
    console.error("❌ 회원정보 수정 오류:", err);
    res.status(500).json({ message: "회원정보 수정 중 서버 오류가 발생했습니다." });
  }
};

// ==============================
// JWT 유효성 검증
// ==============================
export const verifyToken = (req, res) => {
  const authHeader = req.headers["authorization"];
  if (!authHeader)
    return res.status(401).json({ message: "인증 토큰이 없습니다." });

  const token = authHeader.split(" ")[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    res.json({ valid: true, user: decoded });
  } catch (err) {
    res.status(401).json({ message: "유효하지 않은 토큰입니다." });
  }
};

// ==============================
// 🗑️ 회원탈퇴 (DELETE)
// ==============================
export const withdrawUser = async (req, res) => {
  try {
    const authHeader = req.headers["authorization"];
    if (!authHeader)
      return res.status(401).json({ success: false, message: "인증 토큰이 없습니다." });

    const token = authHeader.split(" ")[1];
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
      return res.status(403).json({ success: false, message: "토큰 검증 실패" });
    }

    const userId = decoded.id;

    // 🔹 사용자 존재 확인
    const [rows] = await db.query("SELECT * FROM tb_user WHERE user_id = ?", [userId]);
    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: "사용자를 찾을 수 없습니다." });
    }

    // 🔹 실제 탈퇴 처리 (완전 삭제)
    await db.query("DELETE FROM tb_user WHERE user_id = ?", [userId]);

    console.log(`🗑️ 회원탈퇴 완료 (user_id=${userId})`);
    return res.json({ success: true, message: "회원탈퇴가 완료되었습니다." });
  } catch (err) {
    console.error("❌ 회원탈퇴 오류:", err);
    return res.status(500).json({ success: false, message: "회원탈퇴 중 서버 오류가 발생했습니다." });
  }
};