# 📖 Tutorial: Setup Login Database — Monitoring Pasien

Tutorial ini menjelaskan cara mengonfigurasi fitur login agar terhubung dengan tabel user di database MySQL RS dr. Soebandi.

---

## Langkah 1: Temukan Tabel User di Database

Jalankan query ini di MySQL client (phpMyAdmin, DBeaver, atau terminal) untuk menemukan tabel yang menyimpan data user:

```sql
-- Cari tabel yang mengandung kata 'user'
SELECT TABLE_NAME 
FROM information_schema.TABLES 
WHERE TABLE_SCHEMA = 'db_rsd_soebandi_billing' 
  AND TABLE_NAME LIKE '%user%';

-- Cari tabel yang mengandung kata 'login', 'auth', 'akun'
SELECT TABLE_NAME 
FROM information_schema.TABLES 
WHERE TABLE_SCHEMA = 'db_rsd_soebandi_billing' 
  AND (TABLE_NAME LIKE '%login%' 
    OR TABLE_NAME LIKE '%auth%' 
    OR TABLE_NAME LIKE '%akun%');

-- Cari tabel yang mengandung kata 'pegawai', 'karyawan', 'staff'
SELECT TABLE_NAME 
FROM information_schema.TABLES 
WHERE TABLE_SCHEMA = 'db_rsd_soebandi_billing' 
  AND (TABLE_NAME LIKE '%pegawai%' 
    OR TABLE_NAME LIKE '%karyawan%' 
    OR TABLE_NAME LIKE '%staff%');
```

Setelah menemukan nama tabelnya, lihat strukturnya:

```sql
-- Ganti 'nama_tabel' dengan nama tabel yang ditemukan
DESCRIBE nama_tabel;

-- Lihat contoh datanya
SELECT * FROM nama_tabel LIMIT 5;
```

> [!IMPORTANT]
> Catat nama kolom yang berisi: **username** (atau email), **password**, **nama lengkap**, dan **id**.

---

## Langkah 2: Edit File `src/lib/auth.ts`

Buka file [auth.ts](file:///d:/Users/Projek/Soebandi/web/monitoring-pasien/src/lib/auth.ts) dan ubah bagian **USER_QUERY** (sekitar baris 20-24).

### Konfigurasi saat ini (default):

```typescript
const USER_QUERY = `
  SELECT id, username, nama, password
  FROM b_ms_user
  WHERE username = ? AND aktif = 1
  LIMIT 1
`;
```

### Contoh-contoh perubahan:

#### Jika tabel bernama `users` dengan kolom `email`:
```typescript
const USER_QUERY = `
  SELECT id, email AS username, name AS nama, password
  FROM users
  WHERE email = ? AND active = 1
  LIMIT 1
`;
```

#### Jika tabel bernama `b_ms_pegawai`:
```typescript
const USER_QUERY = `
  SELECT id, nip AS username, nama, password
  FROM b_ms_pegawai
  WHERE nip = ? AND aktif = 1
  LIMIT 1
`;
```

#### Jika tabel bernama `tb_akun`:
```typescript
const USER_QUERY = `
  SELECT id, username, nama_lengkap AS nama, password
  FROM tb_akun
  WHERE username = ?
  LIMIT 1
`;
```

> [!WARNING]
> Query **HARUS** mengembalikan kolom-kolom berikut (gunakan `AS` untuk alias jika nama kolom berbeda):
> - `id` — ID unik user
> - `username` — username/email untuk login
> - `nama` — nama lengkap untuk ditampilkan
> - `password` — password (plain text atau MD5 hash)

---

## Langkah 3: Sesuaikan Mode Password

Di file yang sama [auth.ts](file:///d:/Users/Projek/Soebandi/web/monitoring-pasien/src/lib/auth.ts), cek bagian **PASSWORD_MODE** (sekitar baris 34):

```typescript
const PASSWORD_MODE: "plain" | "md5" = "md5";
```

| Mode | Kapan digunakan |
|------|----------------|
| `"md5"` | Password di database disimpan sebagai MD5 hash (umum di sistem lama) |
| `"plain"` | Password di database disimpan sebagai teks biasa |

### Cara mengecek mode password:

```sql
-- Lihat contoh nilai password di database
SELECT username, password FROM nama_tabel LIMIT 3;
```

- Jika hasilnya seperti `e10adc3949ba59abbe56e057f20f883e` (32 karakter hex) → gunakan `"md5"`
- Jika hasilnya seperti `password123` (teks biasa) → gunakan `"plain"`

---

## Langkah 4: Ganti JWT Secret

Buka file `.env.local` di root project dan ganti nilai `JWT_SECRET`:

```env
# GANTI dengan string random yang kuat! Minimal 32 karakter.
JWT_SECRET=masukkan-secret-key-yang-kuat-dan-random-disini
```

> [!TIP]
> Generate secret key random dengan menjalankan di terminal:
> ```bash
> node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
> ```

---

## Langkah 5: Restart Server

Setelah mengubah konfigurasi, restart development server:

```bash
# Stop server (Ctrl+C), lalu jalankan ulang
npm run dev
```

---

## Langkah 6: Test Login

1. Buka browser → `http://localhost:3000`
2. Anda akan diarahkan ke halaman login
3. Masukkan username dan password sesuai data di database
4. Jika berhasil, Anda akan masuk ke dashboard

---

## Troubleshooting

| Masalah | Solusi |
|---------|--------|
| "Username atau password salah" padahal sudah benar | Cek `PASSWORD_MODE` — mungkin salah antara `md5` dan `plain` |
| Error "Terjadi kesalahan server" | Cek terminal untuk error detail. Kemungkinan nama tabel atau kolom salah |
| Tidak bisa konek ke database | Pastikan `.env.local` berisi kredensial database yang benar |
| Session expired terlalu cepat | Ubah `SESSION_DURATION` di `auth.ts` (default: `"8h"`) |

---

## Struktur File Login

```
src/
├── app/
│   ├── api/auth/
│   │   ├── login/route.ts    ← API endpoint login
│   │   └── logout/route.ts   ← API endpoint logout
│   └── login/
│       └── page.tsx           ← Halaman login UI
├── lib/
│   └── auth.ts                ← ⚙️ KONFIGURASI UTAMA (ubah query di sini)
└── middleware.ts               ← Proteksi route (redirect ke /login jika belum login)
```
