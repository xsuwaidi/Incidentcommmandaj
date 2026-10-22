/* AI for the Firebase build: Gemini through Firebase AI Logic (Gemini Developer API).
   Gives the app the same sampler it has on claude.ai — limits() and json(prompt, {images}) — used to turn
   a voice report into requests, analyse field photos and recommend an approach from the SOP manual.
   Needs AI Logic switched on in the Firebase console (Build → AI Logic → Get started → Gemini Developer API). */
import { initializeApp } from './vendor/firebase/esm/firebase-app.js';
import { getAI, getGenerativeModel, GoogleAIBackend } from './vendor/firebase/esm/firebase-ai.js';

const cfg = window.IC_FIREBASE;
if (cfg && cfg.config && cfg.config.apiKey && cfg.ai !== false && window.__icAIRegister) {
  const app = initializeApp(cfg.config, 'ic-ai');
  const ai = getAI(app, { backend: new GoogleAIBackend() });
  const model = getGenerativeModel(ai, {
    model: cfg.aiModel || 'gemini-flash-latest',
    generationConfig: { responseMimeType: 'application/json', temperature: 0.2 },
  });

  const b64 = blob => new Promise((res, rej) => {
    const r = new FileReader();
    r.onload = () => res(String(r.result).split(',')[1]);
    r.onerror = () => rej({ code: 'image_rejected' });
    r.readAsDataURL(blob);
  });
  // map Firebase AI errors to the codes the app already explains to the user
  const code = e => {
    const m = String((e && (e.message || e.code)) || '');
    if (/429|quota|RESOURCE_EXHAUSTED/i.test(m)) return 'rate_limited';
    if (/404|not found|no longer available/i.test(m)) return 'ai_model';
    if (/403|not been used|disabled|PERMISSION_DENIED|api-not-enabled|firebasevertexai|generativelanguage/i.test(m)) return 'ai_not_enabled';
    if (/SAFETY|blocked/i.test(m)) return 'refused';
    return (e && e.code) || 'ai_failed';
  };

  window.__icAIRegister({
    async limits() { return { images: true }; },
    async json(prompt, opts) {
      const parts = [{ text: prompt }];
      for (const img of (opts && opts.images) || []) parts.push({ inlineData: { mimeType: img.type || 'image/jpeg', data: await b64(img) } });
      let text;
      try { text = (await model.generateContent(parts)).response.text(); }
      catch (e) { throw { code: code(e) }; }
      try { return JSON.parse(text.replace(/^\s*```(?:json)?\s*|\s*```\s*$/g, '')); }
      catch (e) { throw { code: 'invalid_json' }; }
    },
  });
}
