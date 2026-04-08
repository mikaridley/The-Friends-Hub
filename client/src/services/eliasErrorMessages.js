/** Normalize Elias socket/callback errors to English (legacy servers may still send Hebrew). */
const HEBREW_TO_ENGLISH = {
  'חדר לא נמצא': 'Room not found',
  'החדר לא נמצא': 'Room not found',
  'לא נמצא חדר': 'Room not found',
  'המשחק כבר התחיל': 'Game already started',
  'המשחק כבר החל': 'Game already started',
  'לא ניתן להצטרף המשחק התחיל': 'Game already started',
  'רק המארח יכול לעשות זאת': 'Only the host can do that',
  'רק המארח יכול': 'Only the host can do that',
  'רק למארח מותר': 'Only the host can do that',
  'רק לבעל החדר': 'Only the host can do that',
  'צריך לפחות שחקן אחד בכל קבוצה': 'Need at least one player on each team',
  'חובה שיהיה לפחות שחקן אחד בכל צוות': 'Need at least one player on each team',
  'זה לא התור שלך': 'Not your turn',
  'לא התור שלך': 'Not your turn',
  'רק אחרי סיום המשחק': 'Only after the game has finished',
  'ניתן רק לאחר סיום המשחק': 'Only after the game has finished',
  'מתחבר לשרת': 'Connecting to server…',
  'מתחבר לשרת...': 'Connecting to server…',
}

const HEBREW_RANGE = /[\u0590-\u05FF]/

export function normalizeEliasErrorMessage(raw) {
  if (raw == null) return ''
  const s = String(raw).trim()
  if (!s) return ''
  if (HEBREW_TO_ENGLISH[s]) return HEBREW_TO_ENGLISH[s]
  if (HEBREW_RANGE.test(s)) {
    return 'Something went wrong. Please try again.'
  }
  return s
}
