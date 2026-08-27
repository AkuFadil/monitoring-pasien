import { SignJWT, jwtVerify } from "jose";
import pool from "./db";

// ============================================================
// KONFIGURASI AUTH — Ubah bagian ini sesuai tabel user di database
// ============================================================

/**
 * ⚠️ PENTING: Ubah query di bawah sesuai struktur tabel user Anda.
 *
 * Contoh jika tabel bernama `b_ms_user` dengan kolom `username` dan `password`:
 *   SELECT id, username, nama, password FROM b_ms_user WHERE username = ? AND aktif = 1
 *
 * Contoh jika tabel bernama `users` dengan kolom `email` dan `password`:
 *   SELECT id, email AS username, name AS nama, password FROM users WHERE email = ?
 *
 * Lihat tutorial_setup_login.md untuk panduan lengkap.
 */
const USER_QUERY = `
  SELECT id, username, nama, password
  FROM b_ms_user
  WHERE username = ? AND aktif = 1
  LIMIT 1
`;

/**
 * Kolom password di database.
 * - "plain"  → password disimpan sebagai teks biasa (langsung dibandingkan)
 * - "md5"    → password disimpan sebagai MD5 hash
 *
 * Ubah sesuai cara penyimpanan password di database Anda.
 */
const PASSWORD_MODE: "plain" | "md5" = "md5";

// ============================================================
// AUTH FUNCTIONS — Tidak perlu diubah
// ============================================================

const JWT_SECRET_KEY = new TextEncoder().encode(
  process.env.JWT_SECRET || "fallback-secret-key-change-me"
);
const SESSION_DURATION = "8h"; // Durasi session

export interface UserPayload {
  id: number;
  username: string;
  nama: string;
}

/** Hash MD5 sederhana menggunakan Node.js crypto */
async function md5Hash(text: string): Promise<string> {
  const { createHash } = await import("crypto");
  return createHash("md5").update(text).digest("hex");
}

/**
 * Verifikasi user dari database.
 * Mengembalikan data user jika valid, null jika gagal.
 */
export async function verifyUser(
  username: string,
  password: string
): Promise<UserPayload | null> {
  try {
    const [rows] = await pool.query(USER_QUERY, [username]);
    const users = rows as Array<{
      id: number;
      username: string;
      nama: string;
      password: string;
    }>;

    if (users.length === 0) return null;

    const user = users[0];

    // Bandingkan password
    let passwordMatch = false;
    if (PASSWORD_MODE === "md5") {
      const hashed = await md5Hash(password);
      passwordMatch = hashed === user.password;
    } else {
      passwordMatch = password === user.password;
    }

    if (!passwordMatch) return null;

    return {
      id: user.id,
      username: user.username,
      nama: user.nama,
    };
  } catch (error) {
    console.error("Database auth error:", error);
    return null;
  }
}

/**
 * Buat JWT session token.
 */
export async function createSessionToken(user: UserPayload): Promise<string> {
  return new SignJWT({
    id: user.id,
    username: user.username,
    nama: user.nama,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(SESSION_DURATION)
    .sign(JWT_SECRET_KEY);
}

/**
 * Verifikasi JWT session token.
 * Mengembalikan payload user jika valid, null jika expired/invalid.
 */
export async function verifySessionToken(
  token: string
): Promise<UserPayload | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET_KEY);
    return {
      id: payload.id as number,
      username: payload.username as string,
      nama: payload.nama as string,
    };
  } catch {
    return null;
  }
}

/** Nama cookie untuk session */
export const SESSION_COOKIE_NAME = "monitoring-session";
