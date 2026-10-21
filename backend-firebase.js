/* Firebase backend for the incident command app.
   Gives the app the same small interface it uses on claude.ai — use('db' | 'assets' | 'room' | 'sample') —
   so index.html runs unchanged on its own Firebase project. Needs firebase-config.js and the Firebase compat SDK.

   db      Cloud Firestore, with offline persistence: each device keeps working without a connection
           and sends its changes when the connection returns.
   assets  photos and video. With Cloud Storage (storage:true) files go to /media; without it, photos are
           shrunk and kept inside Firestore, and video is not available.
   room    which devices are online, from a heartbeat in /presence.
   sample  AI is not connected in this backend yet (returns null, the AI buttons stay hidden). */
(function () {
  const cfg = window.IC_FIREBASE;
  if (!cfg || !cfg.config || !cfg.config.apiKey || !window.firebase) return;

  firebase.initializeApp(cfg.config);
  const auth = firebase.auth();
  const fs = firebase.firestore();
  fs.settings({ ignoreUndefinedProperties: true, merge: true });
  const emu = cfg.emulator;
  if (emu) {
    auth.useEmulator('http://' + emu.host + ':' + emu.auth);
    fs.useEmulator(emu.host, emu.firestore);
  }
  const useStorage = !!(cfg.storage && firebase.storage);
  const storage = useStorage ? firebase.storage() : null;
  if (storage && emu && emu.storage) storage.useEmulator(emu.host, emu.storage);

  // offline-first: keep a local copy on the device and queue writes while offline
  const persisted = fs.enablePersistence({ synchronizeTabs: true }).catch(() => {});

  function fail(e) {
    window.dispatchEvent(new CustomEvent('ic-backend-error', { detail: { code: (e && e.code) || 'unknown' } }));
  }

  // every device signs in anonymously; Firestore rules only admit signed-in devices
  const ready = persisted.then(() => new Promise((resolve, reject) => {
    const stop = auth.onAuthStateChanged(u => { if (u) { stop(); resolve(u); } });
    auth.signInAnonymously().catch(e => { stop(); reject(e); });
  }));
  ready.catch(fail);

  // Writes land in the local cache at once; the server ack can wait until the device is back online,
  // so the app does not block on it. Failures (for example permission-denied) are reported as an event.
  const write = p => { p.catch(fail); return Promise.resolve(); };

  const docRef = r => ({
    set: body => write(r.set(body)),
    update: patch => write(r.set(patch, { merge: true })),   // nested objects merge, like the app expects
  });
  const query = q => ({
    orderBy: (f, dir) => query(q.orderBy(f, dir)),
    limit: n => query(q.limit(n)),
    onSnapshot: (next, err) => q.onSnapshot(next, err || (() => {})),
  });
  const db = {
    collection: path => Object.assign(query(fs.collection(path)), { doc: id => docRef(fs.collection(path).doc(id)) }),
    doc: path => docRef(fs.doc(path)),
  };

  const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 8);

  async function inlinePhoto(blob) {
    const bmp = await createImageBitmap(blob);
    const sc = Math.min(1, 1024 / Math.max(bmp.width, bmp.height));
    const c = document.createElement('canvas');
    c.width = Math.round(bmp.width * sc); c.height = Math.round(bmp.height * sc);
    c.getContext('2d').drawImage(bmp, 0, 0, c.width, c.height);
    const url = c.toDataURL('image/jpeg', 0.7);
    if (url.length > 900000) throw { code: 'too_large' };
    return url;
  }
  const assets = {
    async upload(blob, opts) {
      const type = (opts && opts.type) || blob.type || '';
      const id = uid();
      if (storage) {
        const ref = storage.ref('media/' + id);
        await ref.put(blob, { contentType: type });
        return { id, url: await ref.getDownloadURL() };
      }
      if (!type.startsWith('image/')) throw { code: 'video_unavailable' };
      return { id, url: await inlinePhoto(blob) };
    },
  };

  function makeRoom() {
    let me = '';
    try { me = localStorage.getItem('ic-device') || ''; } catch (e) {}
    if (!me) { me = 'dev-' + uid(); try { localStorage.setItem('ic-device', me); } catch (e) {} }
    const ref = fs.collection('presence').doc(me);
    let state = null, docs = [], listeners = [];
    const beat = () => { if (state) ref.set(Object.assign({}, state, { t: Date.now() })).catch(() => {}); };
    setInterval(beat, 25000);
    window.addEventListener('pagehide', () => { ref.delete().catch(() => {}); });
    const emit = () => {
      const cut = Date.now() - 75000;
      const peers = docs.filter(d => (d.data().t || 0) > cut)
        .map(d => ({ kind: 'viewer', isMe: d.id === me, presence: { role: d.data().role, sec: d.data().sec || null } }));
      listeners.forEach(cb => cb({ peers }));
    };
    fs.collection('presence').onSnapshot(q => { docs = q.docs; emit(); }, () => {});
    setInterval(emit, 30000);
    return {
      presence(p) { state = { role: p.role || '', sec: p.sec || null }; beat(); return Promise.resolve(); },
      onPeers(cb) { listeners.push(cb); emit(); },
    };
  }
  let room = null;

  window.icBackend = {
    async use(name) {
      await ready;
      if (name === 'db') return db;
      if (name === 'assets') return assets;
      if (name === 'room') return room || (room = makeRoom());
      return null;   // 'sample' (AI) — not connected yet
    },
  };
})();
