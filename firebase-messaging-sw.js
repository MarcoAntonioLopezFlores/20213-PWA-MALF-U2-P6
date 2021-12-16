importScripts("https://www.gstatic.com/firebasejs/7.6.1/firebase-app.js");
importScripts("https://www.gstatic.com/firebasejs/7.6.1/firebase-messaging.js");

firebase.initializeApp({
  apiKey: "AIzaSyAgzlkevRCu2QsmtpeRsielTNNlrq_7gjI",
  authDomain: "authfirebase-1f20b.firebaseapp.com",
  storageBucket: "authfirebase-1f20b.appspot.com",
  appId: "1:373769965574:web:6c65fe7e70cd9862bff387",
  measurementId: "G-3HLMVMNNP3",
  projectId: "authfirebase-1f20b",
  messagingSenderId: "373769965574",
});

const messaging = firebase.messaging();

messaging.setBackgroundMessageHandler((payload) => {
  console.log("Push on ", payload);

  const options = {
    body: payload.notification.body,
    icon: "images/icons/android-launchericon-48-48.png",
  };
  new Notification(payload.notification.title, options);
});
