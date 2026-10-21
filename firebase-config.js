/* Firebase settings for this deployment.
   Leave apiKey empty and the app runs in local demo mode on each device (no sync between devices).
   To connect devices, copy the values from Firebase console → Project settings → Your apps → Web app.
   These values identify the project; they are not secret. Access is controlled by firestore.rules. */
window.IC_FIREBASE = {
  config: {
    apiKey: '',
    authDomain: '',
    projectId: '',
    storageBucket: '',
    messagingSenderId: '',
    appId: ''
  },
  storage: false   // true after enabling Cloud Storage (Blaze plan): video and full-size photos
};
