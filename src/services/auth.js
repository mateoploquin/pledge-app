// // signUp.js
import { createUserWithEmailAndPassword, updateProfile, getIdToken } from 'firebase/auth';
import axios from 'axios';
import { auth } from '../../firebaseConfig';
// import * as FileSystem from 'expo-file-system';


export async function signUp(email, password, displayName) {
  try {
    // Create user with email and password
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    // Update user profile with display name
    await updateProfile(user, { displayName });

    // Get ID token
    
    await user.reload(); // Reloads user to fetch updated profile info
    const idToken = await getIdToken(user, true);

    // // Save ID token to a text file
    // await saveIdTokenToFile(idToken);

    // Send token to backend
    await sendTokenToBackend(idToken);
  } catch (error) {
    console.error('Error during sign-up:', error);
    throw error;
  }
}

async function sendTokenToBackend(idToken) {
  try {
    await axios.post('https://6adc-88-1-22-55.ngrok-free.app/auth/firebase/signup', {}, {
      headers: {
        Authorization: `Bearer ${idToken}`,
      },
    });
  } catch (error) {
    console.error('Error sending token to backend:', error);
    throw error;
  }
}

// // async function saveIdTokenToFile(idToken) {
// //   try {
// //     const path = `${FileSystem.documentDirectory}idToken.txt`;
// //     await FileSystem.writeAsStringAsync(path, idToken, { encoding: FileSystem.EncodingType.UTF8 });
// //     console.log('ID token saved to', path);
// //   } catch (error) {
// //     console.error('Error saving ID token to file:', error);
// //     throw error;
// //   }
// // }
