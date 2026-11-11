# ربط الأجهزة عبر Firebase · Firebase setup

يحتاج هذا الإعداد نحو 20 دقيقة مرة واحدة. بعده تتصل الأجهزة الأربعة ببعضها مباشرة من رابط GitHub Pages.

> للتجربة ببيانات وهمية فقط. خوادم Firebase خارج الشبكة الداخلية للدفاع المدني، فلا تُستخدم لبلاغات حقيقية.

## 1. إنشاء المشروع

1. افتح [console.firebase.google.com](https://console.firebase.google.com) وسجّل الدخول بحساب Google.
2. **Create a project**، وسمّه مثلًا `incident-command-pilot`. يمكن إيقاف Google Analytics.

## 2. تسجيل دخول الأجهزة

1. **Build → Authentication → Get started**.
2. في **Sign-in method** اختر **Anonymous** ثم **Enable** و**Save**.
3. في **Settings → Authorized domains** أضف `xsuwaidi.github.io`.

## 3. قاعدة البيانات

1. **Build → Firestore Database → Create database**.
2. اختر أقرب موقع متاح (مثل `me-central1` في الدوحة أو `me-central2` في الدمام)، ثم **Start in production mode**.
3. في تبويب **Rules** الصق محتوى الملف `firestore.rules` من هذا المستودع، ثم **Publish**.

## 4. ربط التطبيق بالمشروع

1. **Project settings** (رمز الترس) → **Your apps** → رمز الويب `</>`.
2. سجّل التطبيق باسم مثل `ic-web`، ولا تحتاج Firebase Hosting.
3. انسخ القيم من `firebaseConfig` إلى الملف `firebase-config.js` في المستودع:

```js
window.IC_FIREBASE = {
  config: {
    apiKey: 'AIza...',
    authDomain: 'incident-command-pilot.firebaseapp.com',
    projectId: 'incident-command-pilot',
    storageBucket: 'incident-command-pilot.firebasestorage.app',
    messagingSenderId: '...',
    appId: '1:...:web:...'
  },
  storage: false
};
```

4. احفظ الملف وارفعه إلى GitHub. بعد دقيقة أو دقيقتين يظهر في أعلى التطبيق «مباشر — مرتبط بكل الأجهزة».

هذه القيم تعرّف المشروع فقط وليست سرية. الحماية تأتي من قواعد Firestore.

## 5. الصور والفيديو (اختياري)

- **بدون Cloud Storage** (الإعداد الافتراضي): تُصغَّر الصور وتُحفظ في قاعدة البيانات، والفيديو غير متاح.
- **مع Cloud Storage**: صور بحجمها الكامل وفيديو حتى 20 ميجابايت. يتطلب ترقية المشروع إلى خطة **Blaze** (الدفع حسب الاستخدام؛ استخدام التجربة عادة ضمن الحد المجاني).
  1. **Build → Storage → Get started**.
  2. في **Rules** الصق محتوى `storage.rules` ثم **Publish**.
  3. غيّر `storage: false` إلى `storage: true` في `firebase-config.js`.

## 6. فتح الأجهزة

افتح `https://xsuwaidi.github.io/Incidentcommmandaj/devices.html` واختر الجهاز:

| الجهاز | الرابط |
|---|---|
| حاسوب غرفة العمليات | `index.html?d=ops` |
| آيباد قائد الحادث | `index.html?d=ic` |
| آيباد مساعد قائد الحادث | `index.html?d=aic` |
| هاتف قائد القطاع | `index.html?d=sector` |

## ملاحظات

- **العمل دون اتصال:** كل جهاز يحتفظ بنسخة محلية، ويرسل التغييرات عند عودة الاتصال.
- **الذكاء الاصطناعي** غير مربوط في هذه النسخة؛ تحليل الصور وتحويل البلاغ الصوتي يعملان في نسخة claude.ai فقط حاليًا.
- **قبل أي بيانات حقيقية:** حسابات لكل دور بدل الدخول المجهول، وقواعد أضيق، واستضافة داخل الشبكة الداخلية (انظر خطة التطوير).

## English summary

1. Create a Firebase project.
2. Enable **Anonymous** sign-in, and add `xsuwaidi.github.io` to Authorized domains.
3. Create a Firestore database and publish `firestore.rules`.
4. Register a web app and paste its config into `firebase-config.js`.
5. Optionally, enable Cloud Storage (Blaze plan), publish `storage.rules` and set `storage: true`.
6. Open `devices.html` on each device.

Local testing works with the Firebase emulators (`firebase emulators:start`) using `firebase.json`.
