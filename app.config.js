// Extends app.json. Adds the Google Sign-In plugin with the URL scheme read from
// GoogleService-Info.plist, so the id never has to be copied by hand.
const fs = require("fs");
const path = require("path");
const appJson = require("./app.json");

function reversedClientId() {
  try {
    const plist = fs.readFileSync(path.join(__dirname, "GoogleService-Info.plist"), "utf8");
    const match = plist.match(/<key>REVERSED_CLIENT_ID<\/key>\s*<string>([^<]+)<\/string>/);
    return match ? match[1] : null;
  } catch {
    return null;
  }
}

module.exports = () => {
  const expo = { ...appJson.expo, plugins: [...appJson.expo.plugins] };
  const scheme = reversedClientId();
  if (scheme) {
    expo.plugins.push(["@react-native-google-signin/google-signin", { iosUrlScheme: scheme }]);
  } else {
    console.warn(
      "GoogleService-Info.plist has no REVERSED_CLIENT_ID: Google Sign-In will not work until the plist is re-downloaded from Firebase."
    );
  }
  return { expo };
};
