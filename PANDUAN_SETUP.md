# 🌹 Birthday Website — Panduan Setup Supabase

## Langkah 1 — Buat akun Supabase
1. Buka https://supabase.com dan daftar gratis
2. Klik **"New Project"**, isi nama project (misal: `birthday-princess`)
3. Tunggu project selesai dibuat (~1 menit)

---

## Langkah 2 — Buat Tabel Database
1. Di sidebar kiri klik **"Table Editor"**
2. Klik **"New Table"**
3. Isi:
   - Name: `birthday_content`
   - Centang **"Enable Row Level Security (RLS)"** → lalu nonaktifkan (klik toggle off)
4. Tambahkan kolom berikut (klik "+ Add Column"):

| Name        | Type    | Default |
|-------------|---------|---------|
| id          | int8    | (sudah ada, primary key) |
| name        | text    | null    |
| message     | text    | null    |
| photos      | jsonb   | null    |
| music_url   | text    | null    |
| music_name  | text    | null    |

5. Klik **"Save"**

---

## Langkah 3 — Buat Storage Bucket
1. Di sidebar klik **"Storage"**
2. Klik **"New Bucket"**
3. Isi nama: `birthday-photos`
4. Centang **"Public bucket"** (agar foto bisa dilihat siapa saja)
5. Klik **"Save"**

---

## Langkah 4 — Atur Akses Storage (Policy)
1. Di Storage, klik bucket `birthday-photos`
2. Klik tab **"Policies"**
3. Klik **"New Policy"** → pilih **"For full customization"**
4. Buat 2 policy:

**Policy 1 — Upload (INSERT):**
- Policy name: `Allow public upload`
- Allowed operation: INSERT
- Target roles: anon
- USING expression: `true`
- WITH CHECK expression: `true`

**Policy 2 — Lihat (SELECT):**
- Policy name: `Allow public read`
- Allowed operation: SELECT
- Target roles: anon
- USING expression: `true`

---

## Langkah 5 — Ambil Kredensial
1. Di sidebar klik **"Project Settings"** → **"API"**
2. Copy nilai:
   - **Project URL** → paste ke `SUPABASE_URL` di `config.js`
   - **anon public key** → paste ke `SUPABASE_ANON_KEY` di `config.js`

---

## Langkah 6 — Edit config.js
Buka file `public/config.js` dan isi:

```js
const SUPABASE_URL    = 'https://xxxxx.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGci...';
const STORAGE_BUCKET  = 'birthday-photos';
const TABLE_NAME      = 'birthday_content';
```

---

## Langkah 7 — Deploy ke Vercel
1. Buka https://vercel.com → login
2. Klik **"Add New Project"** → **"Upload"**
3. Drag & drop folder `birthday-v2` ini
4. Klik **Deploy**
5. Selesai! Kamu dapat link seperti `https://birthday-princess-xxx.vercel.app`

---

## ✅ Cara pakai setelah deploy
- Buka website → klik **"✏ Edit Pesan"** untuk ubah nama & pesan → **Simpan**
- Klik kotak foto untuk upload gambar → otomatis tersimpan ke cloud
- Upload lagu → tekan ▶ untuk putar
- Semua data tersimpan permanen — siapapun yang buka link akan melihat versi terbaru 🌹
