// firebaseConfig.js
import { initializeApp } from 'firebase/app';
import { initializeAuth, getReactNativePersistence } from 'firebase/auth';
import ReactNativeAsyncStorage from '@react-native-async-storage/async-storage';

const firebaseConfig = {
  apiKey: "AIzaSyAXF4qgP-1Ikb_go9uZPHAbdoReKLd8U1o",
  authDomain: "pledgetrial.firebaseapp.com",
  projectId: "pledgetrial",
  storageBucket: "pledgetrial.firebasestorage.app",
  messagingSenderId: "1052661908414",
  appId: "1:1052661908414:web:222704e8db5194216aafef",
  measurementId: "G-D5H76LKXV2"

}; 


const app = initializeApp(firebaseConfig);
const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(ReactNativeAsyncStorage)
});

export { auth };
