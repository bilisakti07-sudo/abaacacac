// Firebase Configuration for Eco Innovation App
// TODO: Replace with your actual Firebase config from Firebase Console
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "eco-innovation-xxxxx.firebaseapp.com",
  projectId: "eco-innovation-xxxxx",
  storageBucket: "eco-innovation-xxxxx.appspot.com",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);

// Get references to Firebase services
const auth = firebase.auth();
const db = firebase.firestore();
const storage = firebase.storage();

// Set Firestore persistence settings for offline support
db.enablePersistence()
  .catch((err) => {
    if (err.code == 'failed-precondition') {
      console.log('Multiple tabs open, persistence can only be enabled in one tab at a time.');
    } else if (err.code == 'unimplemented') {
      console.log('The current browser does not support all of the features required to enable persistence');
    }
  });

// Export for use in other modules
window.firebaseConfig = {
  auth,
  db,
  storage
};

console.log('Firebase initialized successfully');
