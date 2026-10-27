import {
  createUserWithEmailAndPassword,
  updateProfile,
  getIdToken,
  type User,
} from "firebase/auth";
import axios from "axios";
import { auth } from "../firebaseConfig";
import { API_URL } from "../config";

/**
 * Registers (or refreshes) the user with the backend. Not fatal: the backend
 * upserts the user again on the first authenticated call.
 */
export async function registerWithBackend(user: User, displayName?: string | null) {
  try {
    const idToken = await getIdToken(user, true);
    await axios.post(
      `${API_URL}/auth/firebase/signup`,
      { displayName: displayName ?? user.displayName ?? undefined },
      { headers: { Authorization: `Bearer ${idToken}` } }
    );
  } catch (error) {
    console.warn("Backend signup failed, will retry on next request:", error);
  }
}

export async function signUp(email: string, password: string, displayName: string) {
  const userCredential = await createUserWithEmailAndPassword(auth, email, password);
  const user = userCredential.user;

  await updateProfile(user, { displayName });
  await user.reload();
  await registerWithBackend(user, displayName);
}
