const Groq = require('groq-sdk');
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

// Groq decommissioned llama3-8b-8192 (every request failed with model_decommissioned).
// gpt-oss-20b is the current fast default; override with GROQ_MODEL in .env if needed.
const MODEL = process.env.GROQ_MODEL || 'openai/gpt-oss-20b';

/** Models sometimes wrap JSON in markdown fences or prose — extract the JSON object. */
const extractJson = (text) => {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  const raw = fenced ? fenced[1] : text;
  const start = raw.indexOf('{');
  const end = raw.lastIndexOf('}');
  if (start === -1 || end === -1) throw new Error('Model returned no JSON object');
  return JSON.parse(raw.slice(start, end + 1));
};

// Full catalog of the platform's games with what each one trains and how to
// read its metrics. Keeps AI insights accurate as new games are added.
const GAME_CATALOG = `
1. Bazaar Buddy — calculation, attention, executive function (market shopping decisions)
2. Spot the Change — visual attention, memory (object count grows with level)
3. Word Garden — language, verbal fluency
4. Find My Way Home — spatial memory, navigation
5. Recipe Helper — sequencing, executive function
6. Story & Remember — short-term memory, comprehension
7. Route Planner — spatial memory, executive function (memorizes and repeats direction sequences)
8. Haat Budget — calculation, attention (adds market prices and picks the correct total)
9. Voice Wall — language, comprehension (word-to-picture matching; available in English, Hindi and Assamese)
10. Festival Match — memory, cultural knowledge (matches festivals to their symbols)
11. Recipe Sequence — sequencing, working memory (memorizes and repeats recipe steps)
12. Landmark Jigsaw — visual memory, attention (finds the missing piece of a studied scene)
13. Soundboard — auditory memory, attention (hears a spoken word, then identifies it)
14. Memory Match — working memory, visual attention (card-pair matching; wrong_answers are mismatched flips)
15. Sriti-Smriti Recall — short-term memory, recall (studies a small list, then recognizes items from it)
16. Melody Tap — auditory memory, sequencing (listens to short tone sequences and taps them back)
17. Calm Waves — relaxation, mindfulness (guided breathing; there are no wrong answers — accuracy is always 100% by design, so judge engagement only from level reached and completion_time)
`;

/** Best-effort extraction from a truncated or malformed JSON response:
 *  pulls known fields out with regexes instead of dumping raw JSON to the UI. */
const salvageFields = (text) => {
  const out = {
    overallPerformance: '', strengths: [], areasToMonitor: [],
    progress: '', recommendedLevel: null, suggestedGames: [], recentChanges: '',
  };

  for (const key of ['overallPerformance', 'progress', 'recentChanges']) {
    const m = text.match(new RegExp(`"${key}"\\s*:\\s*"([\\s\\S]*?)"`, 'i'));
    if (m) out[key] = m[1].replace(/\\n/g, '\n').replace(/\\"/g, '"').trim();
  }

  for (const key of ['strengths', 'areasToMonitor', 'suggestedGames']) {
    const keyIdx = text.search(new RegExp(`"${key}"\\s*:\\s*\\[`));
    if (keyIdx === -1) continue;
    const open = text.indexOf('[', keyIdx);
    const close = text.indexOf(']', open);
    // A truncated array has no closing bracket — take complete items up to the cut.
    const body = close === -1 ? text.slice(open + 1) : text.slice(open + 1, close);
    const items = body.match(/"((?:[^"\\]|\\.)*)"/g) || [];
    out[key] = items.map(s => s.slice(1, -1).replace(/\\"/g, '"').trim()).filter(Boolean);
  }

  const lvl = text.match(/"recommendedLevel"\s*:\s*([0-9]+(?:\.[0-9]+)?)/i);
  if (lvl) out.recommendedLevel = Number(lvl[1]);

  return out;
};

exports.analyzePerformance = async (patientData) => {
  const prompt = `
You are a cognitive performance analyst. Analyze the following game performance data for a patient. Provide insights in JSON format with keys: overallPerformance, strengths (list), areasToMonitor (list), progress, recommendedLevel (number), suggestedGames (list), recentChanges.
Important: Do not diagnose any medical condition. Only comment on game performance.
Note: average_reaction_time is in milliseconds (reaction speed per question); completion_time is in seconds for the whole session.
Keep the response compact: every list to at most 4 short items, and reply with the JSON object only.

Game catalog — every game this platform offers, what each trains, and how to interpret it. Use these meanings when interpreting results, and suggest games ONLY from this list in suggestedGames:
${GAME_CATALOG}

Patient Name: ${patientData.patientName}

Game Results:
${JSON.stringify(patientData.gameResults, null, 2)}

Provide response as valid JSON only.
  `;

  let response;
  try {
    const params = {
      messages: [{ role: 'user', content: prompt }],
      model: MODEL,
      temperature: 0.5,
      // Generous budget: reasoning models spend tokens before the JSON answer,
      // and a truncated JSON is the #1 cause of unusable analyses.
      max_tokens: 4096,
    };
    if (MODEL.startsWith('openai/gpt-oss')) params.reasoning_effort = 'low';
    const chatCompletion = await groq.chat.completions.create(params);
    response = chatCompletion.choices[0]?.message?.content || '';
  } catch (error) {
    const apiError = error?.error?.error?.message || error?.error?.message || error?.message || 'Unknown error';
    const err = new Error(`Groq API error: ${apiError}`);
    err.statusCode = error?.statusCode || error?.status;
    throw err;
  }

  try {
    return extractJson(response);
  } catch {
    // Truncated/malformed response — salvage whatever fields are readable so the
    // UI never falls back to rendering the raw JSON string.
    return salvageFields(response);
  }
};
