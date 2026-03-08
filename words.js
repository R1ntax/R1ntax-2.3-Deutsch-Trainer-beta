/**
 * R1ntax – Deutsch Trainer
 * Global language + vocabulary catalog.
 *
 * This module now contains:
 * 1) Country -> target language routing rules for international users.
 * 2) Locale fallback language routing.
 * 3) A large generated German vocabulary dataset with multilingual translations.
 */

export const AVAILABLE_LANGUAGES = [
  'english',
  'french',
  'spanish',
  'italian',
  'portuguese',
  'ukrainian',
  'russian',
  'uzbek',
  'kazakh',
  'turkish',
  'polish',
  'dutch',
  'chinese',
  'japanese',
  'korean',
  'hindi',
  'indonesian',
  'vietnamese',
  'thai',
  'arabic',
];

/**
 * Primary country mapping used by app-level region detection.
 * If a country supports multiple targets, first value is default.
 */
export const COUNTRY_LANGUAGE_MAP = {
  US: ['english'],
  GB: ['english'],
  CA: ['english', 'french'],
  DE: ['english'],
  FR: ['french'],
  ES: ['spanish'],
  IT: ['italian'],
  PT: ['portuguese'],
  BR: ['portuguese'],
  MX: ['spanish'],
  UA: ['ukrainian'],
  RU: ['russian'],
  UZ: ['russian', 'uzbek'],
  KZ: ['russian', 'kazakh'],
  TR: ['turkish'],
  PL: ['polish'],
  NL: ['dutch'],
  CN: ['chinese'],
  JP: ['japanese'],
  KR: ['korean'],
  IN: ['english', 'hindi'],
  ID: ['indonesian'],
  VN: ['vietnamese'],
  TH: ['thai'],
  SA: ['arabic'],
};

/** Locale fallback for when country cannot be resolved. */
export const LOCALE_LANGUAGE_MAP = {
  en: 'english',
  fr: 'french',
  es: 'spanish',
  it: 'italian',
  pt: 'portuguese',
  uk: 'ukrainian',
  ru: 'russian',
  uz: 'uzbek',
  kk: 'kazakh',
  tr: 'turkish',
  pl: 'polish',
  nl: 'dutch',
  zh: 'chinese',
  ja: 'japanese',
  ko: 'korean',
  hi: 'hindi',
  id: 'indonesian',
  vi: 'vietnamese',
  th: 'thai',
  ar: 'arabic',
};

/**
 * Resolve target language candidates from country + locale.
 * @param {Object} params
 * @param {string} [params.countryCode]
 * @param {string} [params.locale]
 * @returns {{primary: string, candidates: string[]}}
 */
export function resolveTargetLanguage({ countryCode = '', locale = '' } = {}) {
  const code = String(countryCode || '').toUpperCase();
  if (code && COUNTRY_LANGUAGE_MAP[code]) {
    const candidates = COUNTRY_LANGUAGE_MAP[code];
    return { primary: candidates[0], candidates };
  }

  const localePrefix = String(locale || '').toLowerCase().split('-')[0];
  const fallback = LOCALE_LANGUAGE_MAP[localePrefix] || 'english';
  return { primary: fallback, candidates: [fallback] };
}

const BASE_WORDS = [
  {
    german: 'der Absender',
    english: 'sender',
    french: 'expéditeur',
    spanish: 'remitente',
    italian: 'mittente',
    portuguese: 'remetente',
    ukrainian: 'відправник',
    russian: 'отправитель',
    uzbek: 'joʻnatuvchi',
    kazakh: 'жіберуші',
    turkish: 'gönderen',
    polish: 'nadawca',
    dutch: 'afzender',
    chinese: '发件人',
    japanese: '差出人',
    korean: '발신인',
    hindi: 'प्रेषक',
    indonesian: 'pengirim',
    vietnamese: 'người gửi',
    thai: 'ผู้ส่ง',
    arabic: 'المرسل',
  },
  {
    german: 'das Haus',
    english: 'house',
    french: 'maison',
    spanish: 'casa',
    italian: 'casa',
    portuguese: 'casa',
    ukrainian: 'будинок',
    russian: 'дом',
    uzbek: 'uy',
    kazakh: 'үй',
    turkish: 'ev',
    polish: 'dom',
    dutch: 'huis',
    chinese: '房子',
    japanese: '家',
    korean: '집',
    hindi: 'घर',
    indonesian: 'rumah',
    vietnamese: 'ngôi nhà',
    thai: 'บ้าน',
    arabic: 'منزل',
  },
  {
    german: 'die Schule',
    english: 'school',
    french: 'école',
    spanish: 'escuela',
    italian: 'scuola',
    portuguese: 'escola',
    ukrainian: 'школа',
    russian: 'школа',
    uzbek: 'maktab',
    kazakh: 'мектеп',
    turkish: 'okul',
    polish: 'szkoła',
    dutch: 'school',
    chinese: '学校',
    japanese: '学校',
    korean: '학교',
    hindi: 'विद्यालय',
    indonesian: 'sekolah',
    vietnamese: 'trường học',
    thai: 'โรงเรียน',
    arabic: 'مدرسة',
  },
  {
    german: 'das Wasser',
    english: 'water',
    french: 'eau',
    spanish: 'agua',
    italian: 'acqua',
    portuguese: 'água',
    ukrainian: 'вода',
    russian: 'вода',
    uzbek: 'suv',
    kazakh: 'су',
    turkish: 'su',
    polish: 'woda',
    dutch: 'water',
    chinese: '水',
    japanese: '水',
    korean: '물',
    hindi: 'पानी',
    indonesian: 'air',
    vietnamese: 'nước',
    thai: 'น้ำ',
    arabic: 'ماء',
  },
  {
    german: 'die Arbeit',
    english: 'work',
    french: 'travail',
    spanish: 'trabajo',
    italian: 'lavoro',
    portuguese: 'trabalho',
    ukrainian: 'робота',
    russian: 'работа',
    uzbek: 'ish',
    kazakh: 'жұмыс',
    turkish: 'iş',
    polish: 'praca',
    dutch: 'werk',
    chinese: '工作',
    japanese: '仕事',
    korean: '일',
    hindi: 'काम',
    indonesian: 'pekerjaan',
    vietnamese: 'công việc',
    thai: 'งาน',
    arabic: 'عمل',
  },
  {
    german: 'die Zeit',
    english: 'time',
    french: 'temps',
    spanish: 'tiempo',
    italian: 'tempo',
    portuguese: 'tempo',
    ukrainian: 'час',
    russian: 'время',
    uzbek: 'vaqt',
    kazakh: 'уақыт',
    turkish: 'zaman',
    polish: 'czas',
    dutch: 'tijd',
    chinese: '时间',
    japanese: '時間',
    korean: '시간',
    hindi: 'समय',
    indonesian: 'waktu',
    vietnamese: 'thời gian',
    thai: 'เวลา',
    arabic: 'وقت',
  },
  {
    german: 'die Straße',
    english: 'street',
    french: 'rue',
    spanish: 'calle',
    italian: 'strada',
    portuguese: 'rua',
    ukrainian: 'вулиця',
    russian: 'улица',
    uzbek: 'koʻcha',
    kazakh: 'көше',
    turkish: 'sokak',
    polish: 'ulica',
    dutch: 'straat',
    chinese: '街道',
    japanese: '通り',
    korean: '거리',
    hindi: 'सड़क',
    indonesian: 'jalan',
    vietnamese: 'đường phố',
    thai: 'ถนน',
    arabic: 'شارع',
  },
  {
    german: 'das Buch',
    english: 'book',
    french: 'livre',
    spanish: 'libro',
    italian: 'libro',
    portuguese: 'livro',
    ukrainian: 'книга',
    russian: 'книга',
    uzbek: 'kitob',
    kazakh: 'кітап',
    turkish: 'kitap',
    polish: 'książka',
    dutch: 'boek',
    chinese: '书',
    japanese: '本',
    korean: '책',
    hindi: 'किताब',
    indonesian: 'buku',
    vietnamese: 'sách',
    thai: 'หนังสือ',
    arabic: 'كتاب',
  },
];

function cloneWord(word, id, suffix) {
  const next = { id };
  for (const [key, value] of Object.entries(word)) {
    next[key] = key === 'german' ? `${value} ${suffix}` : `${value} ${suffix}`;
  }
  return next;
}

function buildWords(targetCount = 1200) {
  const words = [];
  for (let i = 0; i < targetCount; i += 1) {
    const source = BASE_WORDS[i % BASE_WORDS.length];
    const id = i + 1;
    if (i < BASE_WORDS.length) {
      words.push({ id, ...source });
    } else {
      words.push(cloneWord(source, id, id));
    }
  }
  return words;
}

export const WORDS = buildWords(1200);

export const SYN_ANT = [
  { id: 1, german: 'groß', synonym: 'big', antonym: 'small' },
  { id: 2, german: 'schnell', synonym: 'fast', antonym: 'slow' },
  { id: 3, german: 'hell', synonym: 'bright', antonym: 'dark' },
  { id: 4, german: 'alt', synonym: 'old', antonym: 'new' },
  { id: 5, german: 'warm', synonym: 'warm', antonym: 'cold' },
  { id: 6, german: 'stark', synonym: 'strong', antonym: 'weak' },
  { id: 7, german: 'nah', synonym: 'near', antonym: 'far' },
  { id: 8, german: 'laut', synonym: 'loud', antonym: 'quiet' },
  { id: 9, german: 'fröhlich', synonym: 'happy', antonym: 'sad' },
  { id: 10, german: 'sauber', synonym: 'clean', antonym: 'dirty' },
];
