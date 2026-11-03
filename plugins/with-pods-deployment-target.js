// Lifts every CocoaPods target to a modern iOS minimum after
// react_native_post_install has run (it resets pods to 13.4). Xcode 27 turns
// a deployment target below 15.0 into a hard error, and many third-party
// pods, resource bundles included, still declare 9.0 to 14.0.
const { withDangerousMod } = require("expo/config-plugins");
const fs = require("fs");
const path = require("path");

const MIN_IOS = "15.1";
const MARKER = "# Lift pod deployment targets";
const ANCHOR = "    # This is necessary for Xcode 14";

const HOOK = `    ${MARKER} (plugins/with-pods-deployment-target.js).
    installer.pods_project.targets.each do |target|
      target.build_configurations.each do |config|
        current = config.build_settings['IPHONEOS_DEPLOYMENT_TARGET']
        if current.nil? || Gem::Version.new(current.to_s) < Gem::Version.new('${MIN_IOS}')
          config.build_settings['IPHONEOS_DEPLOYMENT_TARGET'] = '${MIN_IOS}'
        end
      end
    end

`;

module.exports = function withPodsDeploymentTarget(config) {
  return withDangerousMod(config, [
    "ios",
    (c) => {
      const podfile = path.join(c.modRequest.platformProjectRoot, "Podfile");
      let contents = fs.readFileSync(podfile, "utf8");
      if (!contents.includes(MARKER)) {
        if (!contents.includes(ANCHOR)) {
          throw new Error("with-pods-deployment-target: Podfile post_install anchor not found; update ANCHOR.");
        }
        contents = contents.replace(ANCHOR, HOOK + ANCHOR);
        fs.writeFileSync(podfile, contents);
      }
      return c;
    },
  ]);
};
