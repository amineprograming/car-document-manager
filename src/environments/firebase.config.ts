// Import the functions you need from the SDKs you need
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: 'AIzaSyBetwc3QhGdg8R05sMtAopE-uRhuk-KCRY',
  authDomain: 'car-management-79770.firebaseapp.com',
  projectId: 'car-management-79770',
  storageBucket: 'car-management-79770.firebasestorage.app',
  messagingSenderId: '603137695665',
  appId: '1:603137695665:web:your-web-app-id',
};

// Initialize Firebase
export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
