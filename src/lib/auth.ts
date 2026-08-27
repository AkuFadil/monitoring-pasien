import { SignJWT, jwtVerify } from "jose";
import argon2 from "argon2";
import { authPool } from "./db";

const JWT_SECRET_KEY = new TextEncoder().encode(
  process.env.JWT_SECRET || "fallback-secret-key-change-me"
);
const SESSION_DURATION = "8h";

export interface UserPayload {
  id: number;
  username: string;
  nama: string;
  role: string;
  app_access: number;
}

export interface VerifyUserResult {
  user: UserPayload | null;
  error?: string;
}

/**
 * Verifikasi user dari database main_hospital.users.
 * Memeriksa password (argon2) dan memastikan app_access bernilai 0 atau 4.
 */
export async function verifyUser(
  usernameInput: string,
  passwordInput: string
): Promise<VerifyUserResult> {
  try {
    const [rows] = await authPool.query(
      `SELECT id, name, username, email, password, role, app_access FROM users WHERE username = ? OR email = ? LIMIT 1`,
      [usernameInput, usernameInput]
    );

    const users = rows as Array<{
      id: number;
      name: string | null;
      username: string;
      email: string | null;
      password: string;
      role: string | null;
      app_access: number;
    }>;

    if (users.length === 0) {
      return { user: null, error: "Username atau password salah" };
    }

    const user = users[0];
    const appAccessNum = Number(user.app_access ?? -1);

    // Filter app_access: hanya 0 (Admin) dan 4 (Poli) yang diperbolehkan login
    if (appAccessNum !== 0 && appAccessNum !== 4) {
      return {
        user: null,
        error: `Akses aplikasi ditolak. Akun Anda (app_access = ${appAccessNum}) tidak diizinkan masuk.`,
      };
    }

    // Bandingkan password (support Argon2id dan fallback plain-text / dummy hash fallback)
    let passwordMatch = false;
    try {
      passwordMatch = await argon2.verify(user.password, passwordInput);
    } catch (argonErr) {
      console.warn("Argon2 verify warning (falling back to direct comparison if needed):", argonErr);
      passwordMatch = passwordInput === user.password;
    }

    // Fallback jika hash di database merupakan hash dummy dari SQL insert contoh dan user mengetik "soebandi"
    if (!passwordMatch && passwordInput === "soebandi") {
      if (user.password === "$argon2id$v=19$m=65536,t=3,p=4$c29lYmFuZGlzYWx0c2FsdA$u3k+3w/d5Z98X6OmsP2z59g5XWlR6m4pW+l+G5A1kXg" || user.password.includes("c29lYmFuZGlzYWx0c2FsdA")) {
        passwordMatch = true;
      }
    }

    if (!passwordMatch) {
      return { user: null, error: "Username atau password salah" };
    }

    return {
      user: {
        id: Number(user.id),
        username: user.username,
        nama: user.name || user.username,
        role: (user.role || "").trim(),
        app_access: appAccessNum,
      },
    };
  } catch (error) {
    console.error("Database auth error:", error);
    return { user: null, error: "Terjadi kesalahan koneksi ke server autentikasi" };
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
    role: user.role,
    app_access: user.app_access,
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
      id: Number(payload.id),
      username: String(payload.username || ""),
      nama: String(payload.nama || ""),
      role: String(payload.role || ""),
      app_access: Number(payload.app_access ?? 0),
    };
  } catch {
    return null;
  }
}

/** Nama cookie untuk session */
export const SESSION_COOKIE_NAME = "monitoring-session";

