/**
 * DeviceActivityReport extension: renders the user's real Screen Time inside
 * Pledge. Apple runs it in a sandbox, so the numbers never reach our JS code;
 * they are only ever drawn on screen. The "device-activity-report" type comes
 * from patches/@kingstinct+expo-apple-targets.
 */
module.exports = {
  type: "device-activity-report",
  name: "ReportExtension",
  bundleIdentifier: ".ReportExtension",
  deploymentTarget: "16.0",
  entitlements: {
    "com.apple.developer.family-controls": true,
    "com.apple.security.application-groups": ["group.com.pledgecompany.pledge"],
  },
};
