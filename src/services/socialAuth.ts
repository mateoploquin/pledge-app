import * as AppleAuthentication from "expo-apple-authentication";
import * as Crypto from "expo-crypto";
import {
  OAuthProvider,
  signInWithCredential,
  updateProfile,
  type User,
} from "firebase/auth";
import { auth } from "../firebaseConfig";
import { registerWithBackend } from "./auth";

/** Thrown when the user dismisses the native sign-in sheet. Callers should stay silent. */
export class SignInCancelled extends Error {
  constructor() {
    super("Sign-in cancelled");
    this.name = "SignInCancelled";
  }
}

export const isAppleSignInAvailable = () => AppleAuthentication.isAvailableAsync();

export async function signInWithApple(): Promise<User> {
  const rawNonce = Crypto.randomUUID().replace(/-/g, "");
  const hashedNonce = await Crypto.digestStringAsync(
    Crypto.CryptoDigestAlgorithm.SHA256,
    rawNonce
  );

  let credential: AppleAuthentication.AppleAuthenticationCredential;
  try {
    credential = await AppleAuthentication.signInAsync({
      requestedScopes: [
        AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
        AppleAuthentication.AppleAuthenticationScope.EMAIL,
      ],
      nonce: hashedNonce,
    });
  } catch (e: any) {
    if (e?.code === "ERR_REQUEST_CANCELED") throw new SignInCancelled();
    throw e;
  }
  if (!credential.identityToken) {
    throw new Error("Apple did not return an identity token");
  }

  const firebaseCredential = new OAuthProvider("apple.com").credential({
    idToken: credential.identityToken,
    rawNonce,
  });
  const { user } = await signInWithCredential(auth, firebaseCredential);

  // Apple only sends the name on the very first authorization.
  const name = [credential.fullName?.givenName, credential.fullName?.familyName]
    .filter(Boolean)
    .join(" ");
  if (name && !user.displayName) {
    await updateProfile(user, { displayName: name });
  }

  await registerWithBackend(user, name || user.displayName);
  return user;
}
