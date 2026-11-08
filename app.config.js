// Extends app.json.
const appJson = require("./app.json");

module.exports = () => {
  const expo = { ...appJson.expo, plugins: [...appJson.expo.plugins] };
  if (process.env.PLEDGE_WITHOUT_REPORT === "1") {
    // Store builds while Apple reviews the report extension's Family Controls
    // approval (docs/release.md): .easignore keeps targets/ReportExtension out
    // of the upload, and this keeps EAS from expecting credentials for it.
    expo.plugins.push(withoutReportExtension);
  }
  return { expo };
};

function withoutReportExtension(config) {
  const ios = config.extra?.eas?.build?.experimental?.ios;
  if (ios?.appExtensions) {
    ios.appExtensions = ios.appExtensions.filter((e) => e.targetName !== "ReportExtension");
  }
  return config;
}
