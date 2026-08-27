import mysql from "mysql2/promise";

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 20,
  maxIdle: 10,
  idleTimeout: 60000,
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 10000,
});

export const authPool = mysql.createPool({
  host: process.env.AUTH_DB_HOST || "192.168.200.249",
  port: Number(process.env.AUTH_DB_PORT || 3306),
  user: process.env.AUTH_DB_USER || "admin",
  password: process.env.AUTH_DB_PASSWORD || "Soebandi_123!",
  database: process.env.AUTH_DB_NAME || "main_hospital",
  waitForConnections: true,
  connectionLimit: 10,
  maxIdle: 5,
  idleTimeout: 60000,
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 10000,
});

export default pool;

