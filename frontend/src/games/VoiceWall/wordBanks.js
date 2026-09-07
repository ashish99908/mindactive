// Language support for Voice Wall. Each bank is a list of { word, emoji }
// pairs where `word` is written and spoken in that language.
export const LANGUAGES = [
  { code: 'en', label: 'English', tts: 'en-IN' },
  { code: 'hi', label: 'हिन्दी', tts: 'hi-IN' },
  { code: 'as', label: 'অসমীয়া', tts: 'as-IN' },
];

export const BANKS = {
  en: [
    { word: 'Apple', emoji: '🍎' }, { word: 'Mango', emoji: '🥭' }, { word: 'Milk', emoji: '🥛' },
    { word: 'Dog', emoji: '🐶' }, { word: 'Cat', emoji: '🐱' }, { word: 'Sun', emoji: '☀️' },
    { word: 'Moon', emoji: '🌙' }, { word: 'Rain', emoji: '🌧️' }, { word: 'Flower', emoji: '🌸' },
    { word: 'Tree', emoji: '🌳' }, { word: 'Fish', emoji: '🐟' }, { word: 'Bird', emoji: '🐦' },
    { word: 'Banana', emoji: '🍌' }, { word: 'Rice', emoji: '🍚' }, { word: 'Cup of tea', emoji: '🍵' },
    { word: 'Chair', emoji: '🪑' }, { word: 'Umbrella', emoji: '☂️' }, { word: 'Bus', emoji: '🚌' },
    { word: 'House', emoji: '🏠' }, { word: 'Book', emoji: '📕' }, { word: 'Elephant', emoji: '🐘' },
    { word: 'Boat', emoji: '🛶' }, { word: 'Spectacles', emoji: '👓' }, { word: 'Lock', emoji: '🔒' },
  ],
  hi: [
    { word: 'आम', emoji: '🥭' }, { word: 'सेब', emoji: '🍎' }, { word: 'दूध', emoji: '🥛' },
    { word: 'कुत्ता', emoji: '🐶' }, { word: 'बिल्ली', emoji: '🐱' }, { word: 'सूरज', emoji: '☀️' },
    { word: 'चाँद', emoji: '🌙' }, { word: 'बारिश', emoji: '🌧️' }, { word: 'फूल', emoji: '🌸' },
    { word: 'पेड़', emoji: '🌳' }, { word: 'मछली', emoji: '🐟' }, { word: 'चिड़िया', emoji: '🐦' },
    { word: 'केला', emoji: '🍌' }, { word: 'चावल', emoji: '🍚' }, { word: 'चाय', emoji: '🍵' },
    { word: 'कुर्सी', emoji: '🪑' }, { word: 'छाता', emoji: '☂️' }, { word: 'बस', emoji: '🚌' },
    { word: 'घर', emoji: '🏠' }, { word: 'किताब', emoji: '📕' }, { word: 'हाथी', emoji: '🐘' },
    { word: 'नाव', emoji: '🛶' }, { word: 'चश्मा', emoji: '👓' }, { word: 'ताला', emoji: '🔒' },
  ],
  as: [
    { word: 'আম', emoji: '🥭' }, { word: 'আপেল', emoji: '🍎' }, { word: 'খীৰ', emoji: '🥛' },
    { word: 'কুকুৰ', emoji: '🐶' }, { word: 'মেকুৰী', emoji: '🐱' }, { word: 'বৰষুণ', emoji: '🌧️' },
    { word: 'ফুল', emoji: '🌸' }, { word: 'গছ', emoji: '🌳' }, { word: 'মাছ', emoji: '🐟' },
    { word: 'চৰাই', emoji: '🐦' }, { word: 'কল', emoji: '🍌' }, { word: 'ভাত', emoji: '🍚' },
    { word: 'চাহ', emoji: '🍵' }, { word: 'চকী', emoji: '🪑' }, { word: 'ছতা', emoji: '☂️' },
    { word: 'বাছ', emoji: '🚌' }, { word: 'ঘৰ', emoji: '🏠' }, { word: 'বহী', emoji: '📕' },
    { word: 'হাতী', emoji: '🐘' }, { word: 'নাও', emoji: '🛶' }, { word: 'গৰু', emoji: '🐄' },
    { word: 'চশমা', emoji: '👓' }, { word: 'চাবি', emoji: '🔑' }, { word: 'প্ৰদীপ', emoji: '🪔' },
  ],
};

// Spoken instruction and per-answer feedback in the player's language.
export const lines = {
  en: {
    ask: (w) => `Which picture is the ${w}?`,
    yes: (w) => `✅ Yes! That is the ${w.toLowerCase()}.`,
    no: (w) => `❌ This was the ${w.toLowerCase()}.`,
  },
  hi: {
    ask: (w) => `कौन-सा चित्र ${w} का है?`,
    yes: (w) => `✅ हाँ! यह ${w} है।`,
    no: (w) => `❌ यह ${w} था।`,
  },
  as: {
    ask: (w) => `কোনখন ছবি ${w}ৰ?`,
    yes: (w) => `✅ হয়! এয়া ${w}।`,
    no: (w) => `❌ এয়া ${w} আছিল।`,
  },
};
