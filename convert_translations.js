import fs from 'fs';

const data = JSON.parse(fs.readFileSync('../localization/translations.json', 'utf8'));

const SUPPORTED_LANGS = ['en', 'ar', 'ja', 'zh', 'ko', 'de', 'fr', 'pt', 'es'];

const result = {};

for (const lang of SUPPORTED_LANGS) {
  result[lang] = { translation: {} };
}

for (const [key, langs] of Object.entries(data)) {
  for (const lang of SUPPORTED_LANGS) {
    if (langs[lang]) {
      result[lang].translation[key] = langs[lang];
    }
  }
}

// Write the funny mottos from the file
// MainMenu.gd uses FUNNY_TAGLINE_1 to FUNNY_TAGLINE_30
const mottos = {};
for (const lang of SUPPORTED_LANGS) {
    mottos[lang] = [];
}
for (let i = 1; i <= 30; i++) {
    const key = `FUNNY_TAGLINE_${i}`;
    const entry = data[key];
    if (entry) {
        for (const lang of SUPPORTED_LANGS) {
            if (entry[lang]) mottos[lang].push(entry[lang]);
        }
        // Remove mottos from the main translation file if you don't want them polluting it,
        // but it's fine to keep them. We'll just extract them for easy random access.
    }
}

fs.writeFileSync('./src/lib/ui_translations.json', JSON.stringify(result, null, 2));
fs.writeFileSync('./src/lib/mottos.json', JSON.stringify(mottos, null, 2));
console.log('Conversion done.');
