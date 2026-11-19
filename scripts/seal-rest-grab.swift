import AVFoundation
import AppKit
let a = CommandLine.arguments
let asset = AVURLAsset(url: URL(fileURLWithPath: a[1])); let out = a[2]
let t0 = Double(a[3])!, t1 = Double(a[4])!, fps = 30.0
let gen = AVAssetImageGenerator(asset: asset); gen.appliesPreferredTrackTransform = true
gen.requestedTimeToleranceBefore = .zero; gen.requestedTimeToleranceAfter = .zero
var i = 0; var t = t0
while t <= t1 + 1e-6 {
  let cg = try! gen.copyCGImage(at: CMTime(seconds: t, preferredTimescale: 600), actualTime: nil)
  let rep = NSBitmapImageRep(cgImage: cg)
  try! rep.representation(using: .png, properties: [:])!.write(to: URL(fileURLWithPath: String(format: "%@/g%03d.png", out, i)))
  i += 1; t += 1.0 / fps
}
print(i)
