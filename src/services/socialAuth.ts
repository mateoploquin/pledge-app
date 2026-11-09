import * as AppleAuthentication from "expo-apple-authentication";
import * as Crypto from "expo-crypto";
import { GoogleSignin, statusCodes } from "@react-native-google-signin/google-signin";
import {
  GoogleAuthProvider,
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

let googleConfigured = false;
function ensureGoogleConfigured() {
  if (googleConfigured) return;
  // On iOS the client id is read from GoogleService-Info.plist bundled by Expo.
  GoogleSignin.configure({});
  googleConfigured = true;
}

export async function signInWithGoogle(): Promise<User> {
  ensureGoogleConfigured();
  await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });

  let idToken: string | null | undefined;
  let name: string | null | undefined;
  try {
    const response = await GoogleSignin.signIn();
    if (response.type === "cancelled") throw new SignInCancelled();
    idToken = response.data.idToken;
    name = response.data.user.name;
  } catch (e: any) {
    if (e instanceof SignInCancelled || e?.code === statusCodes.SIGN_IN_CANCELLED) {
      throw new SignInCancelled();
    }
    throw e;
  }
  if (!idToken) {
    throw new Error("Google did not return an ID token");
  }

  const { user } = await signInWithCredential(auth, GoogleAuthProvider.credential(idToken));
  if (name && !user.displayName) {
    await updateProfile(user, { displayName: name });
  }
  await registerWithBackend(user, name ?? user.displayName);
  return user;
}
