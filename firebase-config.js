/* Firebase settings for this deployment.
   Leave apiKey empty and the app runs in local demo mode on each device (no sync between devices).
   To connect devices, copy the values from Firebase console → Project settings → Your apps → Web app.
   These values identify the project; they are not secret. Access is controlled by firestore.rules. */
window.IC_FIREBASE = {
  config: {
    apiKey: 'AIzaSyDstmWsNTu2Y_ZLNLsBEcrSGYjpwLq-Hu4',
    authDomain: 'incidentcommand-9e11d.firebaseapp.com',
    projectId: 'incidentcommand-9e11d',
    storageBucket: 'incidentcommand-9e11d.firebasestorage.app',
    messagingSenderId: '898057787058',
    appId: '1:898057787058:web:beb85d241133f223609bab'
  },
  storage: false   // true after enabling Cloud Storage (Blaze plan): video and full-size photos
};
