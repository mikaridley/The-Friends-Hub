import { readFileSync } from 'fs'
import { dirname, join } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const wordsPath = join(__dirname, '../data/hebrew-words.json')

export const HEBREW_WORDS = JSON.parse(readFileSync(wordsPath, 'utf8'))
