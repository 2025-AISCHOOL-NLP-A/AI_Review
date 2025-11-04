import db from "../models/db.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

export const registerUser = async (requestAnimationFrame, res) => {
    try {
        const { username, email, password } = req.body;
        const hashed = await bcrypt.hash(password, 10);

        const query = `
        INSERT INTO tb_user (username, email, password)
        VALUES (?, ?, ?
        `;
        await db.query(query, [username, email, hashed]);
        res.status(201).json({ message: "✅ 회원가입 성공" });
    } catch (err) {
        console.error("회원가입 오류:", err);
        res.status(500).json({ error:"회원가입 실패" });
    }
};

export const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;
    const [rows] = await db.query(`SELECT * FROM tb_user WHERE email = ?`, [email]);

    if (rows.length === 0) {
      return res.status(400).json({ error: "❌ 존재하지 않는 이메일" });
    }

    const user = rows[0];
    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      return res.status(400).json({ error: "❌ 비밀번호 불일치" });
    }

    // ✅ 로그인 성공 → JWT 토큰 발급
    const token = jwt.sign(
      { user_id: user.user_id, username: user.username },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    res.json({
      message: "✅ 로그인 성공",
      token: token,
      username: user.username
    });
  } catch (err) {
    console.error("로그인 오류:", err);
    res.status(500).json({ error: "로그인 실패" });
  }
};