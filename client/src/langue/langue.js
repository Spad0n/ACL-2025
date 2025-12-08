import en from './json/english.json';
import fr from './json/french.json';

const langues = { en, fr };

export function translate(lang, key){
    const keys = key.split('.');
    return keys.reduce((obj, k) => (obj && obj[k] ? obj[k] : null), langues[lang]) || key;
}