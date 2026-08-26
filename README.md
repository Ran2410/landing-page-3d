# Akar & Aroma

Demo React + Vite berupa perjalanan Kopi Nusantara yang dikendalikan oleh scroll. Lima clay-diorama dibuat dengan Codex ImageGen, dianimasikan menjadi satu film lokal oleh FFmpeg, dan dimuat sebagai Blob agar seek video stabil.

Di antara babak Panen dan Jemur terdapat **Museum Biji**: lima materi pengenalan kopi dengan foto spesimen hasil Codex ImageGen yang menyelesaikan rotasi 360° mengikuti scroll. Foto bisa diputar lagi dengan drag, sentuhan, atau tombol panah, sementara mode reduced-motion menampilkannya secara statis.

## Menjalankan

```bash
npm install
npm run dev
```

Build dan pengujian:

```bash
npm test
npm run build
```

## Aset

- `public/assets/scenes/*.png`: master gambar hasil Codex ImageGen.
- `public/assets/scenes/*.webp`: poster ringan dan fallback reduced-motion.
- `public/assets/museum/*.webp`: foto spesimen museum hasil Codex ImageGen.
- `public/assets/akar-aroma-film.mp4`: film H.264 1080p tanpa audio, GOP 8.
- `scripts/render-film.sh`: pipeline FFmpeg yang dapat dijalankan ulang.

Film lama tidak dirender ulang. Tidak ada Higgsfield, Monid, Blender, backend, atau API runtime. Semua aset yang dipakai halaman tersimpan lokal.
