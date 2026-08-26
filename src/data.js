export const FILM_DURATION = 25.96
export const EDUCATION_HOLD_TIME = 10.384

const filmChapter = (chapter) => ({
  kind: 'film', scrollWeight: 1.55, mobileScrollWeight: 1.3, ...chapter,
})

const specimenChapter = (chapter) => ({
  kind: 'specimen', routeId: 'museum', scrollWeight: 1.05, mobileScrollWeight: 1,
  videoHold: EDUCATION_HOLD_TIME, ...chapter,
})

export const timelineChapters = [
  filmChapter({
    id: 'lereng', routeId: 'lereng', label: 'Lereng', eyebrow: 'Babak satu · Tanah',
    title: 'Dari lereng, tumbuh cerita.',
    body: 'Kabut pagi, tanah vulkanik, dan musim yang sabar menumbuhkan karakter pertama di setiap biji.',
    accent: '#D79A3B', image: '/assets/scenes/01-lereng.webp', videoRange: [0, 5.192],
  }),
  filmChapter({
    id: 'panen', routeId: 'panen', label: 'Panen', eyebrow: 'Babak dua · Tangan',
    title: 'Merah yang dipilih satu per satu.',
    body: 'Hanya buah matang yang berpindah ke keranjang—sebuah keputusan kecil yang menjaga rasa tetap utuh.',
    accent: '#B64A36', image: '/assets/scenes/02-panen.webp', videoRange: [5.192, EDUCATION_HOLD_TIME],
  }),
  specimenChapter({
    id: 'coffee-seed', label: 'Benih', eyebrow: 'Museum biji · 01',
    title: 'Kopi sebenarnya adalah benih.',
    body: 'Yang kita sangrai bukan biji dalam arti botani, melainkan benih dari buah ceri tanaman Coffea.',
    accent: '#C79A55', image: '/assets/museum/01-coffee-seed.webp',
    specimen: { type: 'roasted', stat: 'Buah → benih', note: 'Satu ceri menyimpan awal sebuah cangkir.' },
  }),
  specimenChapter({
    id: 'cherry-anatomy', label: 'Anatomi', eyebrow: 'Museum biji · 02',
    title: 'Di dalam satu ceri.',
    body: 'Kulit, daging buah, lendir, parchment, dan silverskin melindungi dua benih yang biasanya saling berhadapan. Sesekali hanya satu yang tumbuh bulat: peaberry.',
    accent: '#E9D9B6', image: '/assets/museum/02-cherry-anatomy.webp',
    specimen: { type: 'anatomy', stat: 'Umumnya 2 benih', note: 'Peaberry adalah satu benih tunggal yang membulat.' },
  }),
  specimenChapter({
    id: 'arabica', label: 'Arabika', eyebrow: 'Museum biji · 03',
    title: 'Arabika. Panjang dan berlapis.',
    body: 'Bentuknya cenderung lebih lonjong dengan alur melengkung. Di cangkir, Arabika sering dicari karena aroma, keasaman, dan kompleksitasnya.',
    accent: '#D79A3B', image: '/assets/museum/03-arabica.webp',
    specimen: { type: 'arabica', stat: 'Coffea arabica', note: 'Kafeinnya relatif lebih rendah daripada Robusta.' },
  }),
  specimenChapter({
    id: 'robusta', label: 'Robusta', eyebrow: 'Museum biji · 04',
    title: 'Robusta. Bulat dan bertenaga.',
    body: 'Bentuknya cenderung lebih padat dan bulat dengan alur lebih lurus. Tanamannya tangguh, sementara rasanya sering hadir lebih tebal dan pahit.',
    accent: '#91A078', image: '/assets/museum/04-robusta.webp',
    specimen: { type: 'robusta', stat: 'Coffea canephora', note: 'Kafeinnya relatif lebih tinggi daripada Arabika.' },
  }),
  specimenChapter({
    id: 'beyond-two', label: 'Keragaman', eyebrow: 'Museum biji · 05',
    title: 'Dunia kopi lebih dari dua.',
    body: 'Ada lebih dari 120 spesies Coffea. Arabika dan Robusta mendominasi minuman dunia, sementara Liberika hadir dalam jumlah kecil. Nama Excelsa kini dirujuk Kew ke Coffea dewevrei.',
    accent: '#C79A55', image: '/assets/museum/05-liberica-excelsa.webp',
    specimen: { type: 'beyond', stat: '>120 spesies', note: 'Dua spesies menjadi tulang punggung perdagangan dunia.' },
    sources: [
      { label: 'Kew Science', href: 'https://powo.science.kew.org/taxon/325985-2' },
      { label: 'World Coffee Research', href: 'https://varieties.worldcoffeeresearch.org/' },
      { label: 'Taksonomi Excelsa', href: 'https://powo.science.kew.org/taxon/urn%3Alsid%3Aipni.org%3Anames%3A747110-1' },
    ],
  }),
  filmChapter({
    id: 'jemur', routeId: 'jemur', label: 'Jemur', eyebrow: 'Babak tiga · Waktu',
    title: 'Matahari menyimpan manisnya.',
    body: 'Di atas para-para, kopi dibalik perlahan. Angin dan cahaya membangun kejernihan yang akan terasa nanti.',
    accent: '#E9D9B6', image: '/assets/scenes/03-jemur.webp', videoRange: [EDUCATION_HOLD_TIME, 15.576],
  }),
  filmChapter({
    id: 'sangrai', routeId: 'sangrai', label: 'Sangrai', eyebrow: 'Babak empat · Api',
    title: 'Panas membuka karakternya.',
    body: 'Suhu, suara retak, dan hitungan detik bertemu untuk mengubah potensi menjadi aroma yang nyata.',
    accent: '#C87942', image: '/assets/scenes/04-sangrai.webp', videoRange: [15.576, 20.768],
  }),
  filmChapter({
    id: 'seduh', routeId: 'seduh', label: 'Seduh', eyebrow: 'Babak lima · Rasa',
    title: 'Satu cangkir. Seluruh perjalanan.',
    body: 'Yang kamu teguk bukan hanya kopi—melainkan lereng, tangan, waktu, api, dan pengetahuan yang tiba di meja yang sama.',
    accent: '#F6F0E4', image: '/assets/scenes/05-seduh.webp', videoRange: [20.768, FILM_DURATION],
    cta: 'Jelajahi lagi',
  }),
]

export const navigationItems = [
  { id: 'lereng', label: 'Lereng', chapterId: 'lereng' },
  { id: 'panen', label: 'Panen', chapterId: 'panen' },
  { id: 'museum', label: 'Kenali biji', chapterId: 'coffee-seed' },
  { id: 'jemur', label: 'Jemur', chapterId: 'jemur' },
  { id: 'sangrai', label: 'Sangrai', chapterId: 'sangrai' },
  { id: 'seduh', label: 'Seduh', chapterId: 'seduh' },
]
