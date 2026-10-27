Pod::Spec.new do |s|
  s.name           = 'PledgeActivityReport'
  s.version        = '1.0.0'
  s.summary        = 'Hosts a DeviceActivityReport (real Screen Time, rendered by the system) inside React Native.'
  s.description    = 'Local Expo module for the Pledge app.'
  s.license        = 'MIT'
  s.author         = 'Pledge'
  s.homepage       = 'https://github.com/mateoploquin/pledge-app'
  s.platforms      = { :ios => '16.0' }
  s.swift_version  = '5.4'
  s.source         = { git: '' }
  s.static_framework = true

  s.dependency 'ExpoModulesCore'

  s.pod_target_xcconfig = {
    'DEFINES_MODULE' => 'YES',
    'SWIFT_COMPILATION_MODE' => 'wholemodule'
  }

  s.source_files = "**/*.{h,m,swift}"
end
