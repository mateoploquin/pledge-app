import {
  createUserWithEmailAndPassword,
  updateProfile,
  getIdToken,
} from "firebase/auth";
import axios from "axios";
import { auth } from "../firebaseConfig";

export async function signUp(email, password, displayName) {
  try {
    const userCredential = await createUserWithEmailAndPassword(
      auth,
      email,
      password
    );
    const user = userCredential.user;

    await updateProfile(user, { displayName });

    await user.reload();
    const idToken = await getIdToken(user, true);

    await sendTokenToBackend(idToken);
  } catch (error) {
    console.error("Error during sign-up:", error);
    throw error;
  }
}

async function sendTokenToBackend(idToken) {
  try {
    await axios.post(
      "https://pledgecontainer--o7wsrym.lemonbay-3b8260a5.spaincentral.azurecontainerapps.io/auth/firebase/signup",
      {},
      {
        headers: {
          Authorization: `Bearer ${idToken}`,
        },
      }
    );
  } catch (error) {
    console.error("Error sending token to backend:", error);
    throw error;
  }
}
