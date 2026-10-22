import {
  createUserWithEmailAndPassword,
  updateProfile,
  getIdToken,
} from "firebase/auth";
import axios from "axios";
import { auth } from "../firebaseConfig";
import { API_URL } from "../config";

export async function signUp(email: string, password: string, displayName: string) {
  const userCredential = await createUserWithEmailAndPassword(auth, email, password);
  const user = userCredential.user;

  await updateProfile(user, { displayName });
  await user.reload();
  const idToken = await getIdToken(user, true);

  // Registers the user with the backend. Not fatal: the backend upserts the
  // user again on the first authenticated call.
  try {
    await axios.post(
      `${API_URL}/auth/firebase/signup`,
      { displayName },
      { headers: { Authorization: `Bearer ${idToken}` } }
    );
  } catch (error) {
    console.warn("Backend signup failed, will retry on next request:", error);
  }
}
