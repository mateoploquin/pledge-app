// Terms of Service and Privacy Policy served as plain HTML pages.
// Review the bracketed items with a lawyer before launch.

const EFFECTIVE_DATE = "22 October 2026";
const CONTACT_EMAIL = "mateoploquina@gmail.com";
const CHARITY = "Make-A-Wish";
const JURISDICTION = "Spain";

function page(title: string, body: string): string {
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${title} · Pledge</title>
<style>
  :root { color-scheme: light dark; }
  body { font: 17px/1.6 -apple-system, system-ui, "Segoe UI", Roboto, sans-serif; margin: 0; padding: 28px 20px 60px; max-width: 720px; margin-inline: auto; color: #1d1d1f; background: #fff6f1; }
  @media (prefers-color-scheme: dark) { body { color: #f2f2f2; background: #1a1412; } a { color: #ff8a50; } }
  h1 { font-size: 28px; margin: 0 0 4px; }
  h2 { font-size: 19px; margin: 32px 0 8px; }
  p, li { margin: 8px 0; }
  .meta { color: #8a8a8e; font-size: 14px; margin-bottom: 24px; }
  a { color: #ff5900; }
  nav a { margin-right: 16px; }
</style>
</head>
<body>
<nav><a href="/terms">Terms</a><a href="/privacy">Privacy</a></nav>
<h1>${title}</h1>
<p class="meta">Effective ${EFFECTIVE_DATE}</p>
${body}
<p class="meta">Questions: <a href="mailto:${CONTACT_EMAIL}">${CONTACT_EMAIL}</a></p>
</body>
</html>`;
}

export const termsHtml = page(
  "Terms and Conditions",
  `
<p>These terms govern your use of the Pledge app ("Pledge", "we", "us"). By creating an account or starting a challenge you agree to them. If you do not agree, do not use the app.</p>

<h2>1. What Pledge does</h2>
<p>Pledge helps you reduce screen time. You choose apps, set a daily time limit and a money pledge, and start a challenge that runs for a number of days you choose (7, 15 or 30). When you reach your daily limit, Pledge blocks the selected apps for the rest of the day using Apple's Screen Time features. You can unlock the apps at any time by surrendering the challenge, which charges your pledge.</p>

<h2>2. Eligibility</h2>
<p>You must be at least 18 years old and able to enter a binding contract. The app is not intended for children, and Screen Time authorization is requested for your own device only.</p>

<h2>3. Your account</h2>
<p>You can sign in with email and password, Apple or Google. Keep your credentials safe; you are responsible for activity under your account.</p>

<h2>4. The pledge and payments</h2>
<ul>
  <li>Before a challenge starts you save a payment card. <strong>Nothing is charged at that point.</strong> Card details are handled by Stripe; we never see your full card number.</li>
  <li>Your pledge is charged <strong>only if you surrender</strong>, meaning you choose to unlock your blocked apps before the challenge period is over. Surrendering ends the challenge.</li>
  <li>If you complete the challenge period without surrendering, nothing is charged.</li>
  <li>Charges are in euros for the pledge amount you chose and are <strong>non-refundable</strong>, since the charge is the agreed consequence of ending the challenge early.</li>
  <li>Of each charged pledge, we donate the amount to ${CHARITY} after deducting a small fee that covers payment processing and the running of the app. [Confirm the exact fee and donation arrangement before launch.]</li>
  <li>If a charge fails, your apps remain blocked until the payment goes through or the challenge ends.</li>
</ul>

<h2>5. Challenge rules</h2>
<ul>
  <li><strong>Deleting the app, revoking Screen Time access, or otherwise disabling the blocking while a pledge is running counts as surrendering.</strong> Every running pledge is forfeited and charged, the same as if you had unlocked your apps. To detect this, the app registers an Apple push token with our server and reports in while it runs; the server pings the device once a day. If Apple reports the app as removed, or the app reports that Screen Time access was turned off, your running pledges are charged.</li>
  <li>Pledge relies on Apple's Screen Time system. We cannot guarantee blocking in every situation, for example after an iOS update or a device restore.</li>
</ul>

<h2>6. Not medical advice</h2>
<p>Pledge is a self-improvement tool. It does not provide medical, psychological or addiction treatment advice. If you are struggling, please consult a professional.</p>

<h2>7. Changes and termination</h2>
<p>We may update the app and these terms. Material changes will be shown in the app. We may suspend accounts that abuse the service or attempt to defraud payments. You can delete your account at any time by contacting us.</p>

<h2>8. Liability</h2>
<p>The app is provided "as is". To the extent permitted by law, we are not liable for indirect or consequential losses, and our total liability to you is limited to the amount you were charged in the twelve months before the claim.</p>

<h2>9. Governing law</h2>
<p>These terms are governed by the laws of ${JURISDICTION}. Mandatory consumer protections in your country of residence still apply.</p>
`
);

export const privacyHtml = page(
  "Privacy Policy",
  `
<p>This policy explains what Pledge collects, why, and who processes it on our behalf.</p>

<h2>1. What we collect</h2>
<ul>
  <li><strong>Account data:</strong> your email address, your name if you provide it or your Apple/Google account shares it, and a user ID. Stored with Google Firebase Authentication.</li>
  <li><strong>Challenge data:</strong> the pledge amount and daily time limit you chose, when the challenge started, and whether and when a pledge was charged. Stored in Google Cloud Firestore.</li>
  <li><strong>Payment data:</strong> your card is saved directly with Stripe. We store only Stripe's customer identifier and the status of charges. We never receive your full card number or security code.</li>
  <li><strong>Screen Time data stays on your device.</strong> Which apps you selected and how long you use them is processed by Apple's Screen Time framework on the phone. Apple only gives the app opaque tokens, so we cannot see which apps you chose, and no usage data is sent to our servers.</li>
  <li><strong>Technical data:</strong> standard server logs (IP address, time, request path) kept briefly by our hosting provider for security.</li>
</ul>

<h2>2. Why we use it</h2>
<p>To run your account and pledges, to charge your pledge when you surrender or forfeit, to detect that the app was deleted or Screen Time access removed during a pledge (Apple push token, last check-in time, Screen Time permission status), to prevent fraud, and to respond when you contact us. We do not sell your data and we do not use it for advertising.</p>

<h2>3. Who processes it</h2>
<ul>
  <li><strong>Google Firebase</strong> (authentication and database)</li>
  <li><strong>Stripe</strong> (payments)</li>
  <li><strong>Vercel</strong> (hosting of our server)</li>
  <li><strong>Apple</strong> (Sign in with Apple, Apple Pay and Screen Time, under Apple's own policies)</li>
</ul>

<h2>4. Retention</h2>
<p>Account and challenge data are kept while your account exists. Charge records are kept as long as required for accounting and tax purposes. Server logs are deleted within 30 days.</p>

<h2>5. Your rights</h2>
<p>You can ask us to access, correct, export or delete your data by emailing us. Deleting your account removes your Firebase account and Firestore records; Stripe retains payment records as required by law.</p>

<h2>6. Children</h2>
<p>Pledge is for adults. We do not knowingly collect data from anyone under 18.</p>

<h2>7. Changes</h2>
<p>If we change this policy in a meaningful way, we will show the update in the app.</p>
`
);
