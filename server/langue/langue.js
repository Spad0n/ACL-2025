import en from './json/english.json' with { type: 'json' };
import fr from './json/french.json' with { type: 'json' };

const langues = { en, fr };

export function translate(lang, key){
    const keys = key.split('.');
    return keys.reduce((obj, k) => (obj && obj[k] ? obj[k] : null), langues[lang]) || key;
}