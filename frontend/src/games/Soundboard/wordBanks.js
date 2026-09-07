// Language support for Soundboard. TTS speaks each `word`; the player
// matches it to the thing that makes that sound (`emoji`).
export const LANGUAGES = [
  { code: 'en', label: 'English', tts: 'en-IN' },
  { code: 'hi', label: 'हिन्दी', tts: 'hi-IN' },
  { code: 'as', label: 'অসমীয়া', tts: 'as-IN' },
];

export const BANKS = {
  en: [
    { word: 'Bell', emoji: '🔔' }, { word: 'Dog', emoji: '🐶' }, { word: 'Cat', emoji: '🐱' },
    { word: 'Bird', emoji: '🐦' }, { word: 'Rain', emoji: '🌧️' }, { word: 'Alarm clock', emoji: '⏰' },
    { word: 'Phone', emoji: '📞' }, { word: 'Car', emoji: '🚗' }, { word: 'Train', emoji: '🚂' },
    { word: 'Temple bell', emoji: '🛕' }, { word: 'Drum', emoji: '🥁' }, { word: 'Fan', emoji: '🌀' },
    { word: 'Door', emoji: '🚪' }, { word: 'Clock', emoji: '🕰️' },
  ],
  hi: [
    { word: 'घंटी', emoji: '🔔' }, { word: 'कुत्ता', emoji: '🐶' }, { word: 'बिल्ली', emoji: '🐱' },
    { word: 'चिड़िया', emoji: '🐦' }, { word: 'बारिश', emoji: '🌧️' }, { word: 'अलार्म', emoji: '⏰' },
    { word: 'फोन', emoji: '📞' }, { word: 'कार', emoji: '🚗' }, { word: 'रेलगाड़ी', emoji: '🚂' },
    { word: 'मंदिर की घंटी', emoji: '🛕' }, { word: 'ढोल', emoji: '🥁' }, { word: 'पंखा', emoji: '🌀' },
    { word: 'दरवाज़ा', emoji: '🚪' }, { word: 'घड़ी', emoji: '🕰️' },
  ],
  as: [
    { word: 'ঘণ্টা', emoji: '🔔' }, { word: 'কুকুৰ', emoji: '🐶' }, { word: 'মেকুৰী', emoji: '🐱' },
    { word: 'চৰাই', emoji: '🐦' }, { word: 'বৰষুণ', emoji: '🌧️' }, { word: 'এলাৰ্ম', emoji: '⏰' },
    { word: 'ফোন', emoji: '📞' }, { word: 'গাড়ী', emoji: '🚗' }, { word: 'ৰেল', emoji: '🚂' },
    { word: 'মন্দিৰৰ ঘণ্টা', emoji: '🛕' }, { word: 'ঢোল', emoji: '🥁' }, { word: 'পাখা', emoji: '🌀' },
    { word: 'দুৱাৰ', emoji: '🚪' }, { word: 'ঘড়ী', emoji: '🕰️' },
  ],
};

// Screen + speech lines in the player's language.
export const lines = {
  en: {
    listen: 'Press play and listen carefully…',
    pick: 'Which one did you hear?',
    yes: (w) => `✅ Yes! You heard "${w}".`,
    no: (shown, w) => `❌ That was the ${shown.toLowerCase()}. You heard "${w}".`,
    noVoice: '🔇 No voice for this language on this device — read the word instead:',
  },
  hi: {
    listen: 'प्ले दबाइए और ध्यान से सुनिए…',
    pick: 'आपने क्या सुना था?',
    yes: (w) => `✅ हाँ! आपने "${w}" सुना था।`,
    no: (shown, w) => `❌ वह ${shown} था। आपने "${w}" सुना था।`,
    noVoice: '🔇 इस डिवाइस में इस भाषा की आवाज़ नहीं है — शब्द पढ़ लीजिए:',
  },
  as: {
    listen: 'প্লে টিপি মন দি শুনক…',
    pick: 'আপুনি কি শুনিছে?',
    yes: (w) => `✅ হয়! আপুনি "${w}" শুনিছে।`,
    no: (shown, w) => `❌ সেয়া ${shown} আছিল। আপুনি "${w}" শুনিছে।`,
    noVoice: '🔇 এই ভাষাৰ কণ্ঠ এই ডিভাইচত নাই — শব্দটো পঢ়ক:',
  },
};
