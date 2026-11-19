// Makes the seal's sunset clip from the owner's footage of the sun setting
// behind a hill (19 Nov 2026, 720 × 1280, 13.9 s):
//   swiftc -O scripts/make-seal-clips.swift -o /tmp/make-seal-clips
//   /tmp/make-seal-clips <footage.mp4> assets/video/seal-set.mp4 set
// set: 5.4 s (the sun in the upper sky) to 13.9 s (gone, the sky dark) in
// 4 s at 30 fps, every frame a keyframe so letting go can scrub it back.
// Its first frame is assets/video/seal-still.jpg, the screen at rest.
// (idle mode is the old resting loop, no longer used.)

import AVFoundation
import CoreGraphics
import Foundation

// usage: make <in> <out> <mode: idle|set> 
let args = CommandLine.arguments
let asset = AVURLAsset(url: URL(fileURLWithPath: args[1]))
let out = URL(fileURLWithPath: args[2])
let mode = args[3]
let W = 720, H = 1280
let gen = AVAssetImageGenerator(asset: asset)
gen.requestedTimeToleranceBefore = .zero
gen.requestedTimeToleranceAfter = .zero
gen.appliesPreferredTrackTransform = true

var times: [Double] = []
if mode == "idle" {
  // 4 s at real speed, forward then back: a seamless 8 s loop of the shimmer.
  let fwd = (0..<120).map { Double($0) / 30 }
  times = fwd + fwd.reversed().dropFirst().dropLast()
} else {
  // From the sun in the upper sky until it is gone behind the hill, in 120
  // frames (4 s at 30 fps).
  times = (0..<120).map { 5.4 + Double($0) * 8.5 / 119.0 }
}

try? FileManager.default.removeItem(at: out)
let writer = try! AVAssetWriter(outputURL: out, fileType: .mp4)
let settings: [String: Any] = [
  AVVideoCodecKey: AVVideoCodecType.h264,
  AVVideoWidthKey: W, AVVideoHeightKey: H,
  AVVideoCompressionPropertiesKey: [
    AVVideoAverageBitRateKey: mode == "idle" ? 3_500_000 : 6_000_000,
    AVVideoMaxKeyFrameIntervalKey: mode == "idle" ? 30 : 1,
    AVVideoProfileLevelKey: AVVideoProfileLevelH264HighAutoLevel,
  ],
]
let input = AVAssetWriterInput(mediaType: .video, outputSettings: settings)
input.expectsMediaDataInRealTime = false
let adaptor = AVAssetWriterInputPixelBufferAdaptor(assetWriterInput: input, sourcePixelBufferAttributes: [
  kCVPixelBufferPixelFormatTypeKey as String: kCVPixelFormatType_32BGRA,
  kCVPixelBufferWidthKey as String: W, kCVPixelBufferHeightKey as String: H,
])
writer.add(input)
writer.startWriting()
writer.startSession(atSourceTime: .zero)

var cache: [Double: CGImage] = [:]
for (i, t) in times.enumerated() {
  let img: CGImage
  if let c = cache[t] { img = c } else {
    img = try! gen.copyCGImage(at: CMTime(seconds: t, preferredTimescale: 600), actualTime: nil)
    if mode == "idle" { cache[t] = img }
  }
  var pb: CVPixelBuffer?
  CVPixelBufferPoolCreatePixelBuffer(nil, adaptor.pixelBufferPool!, &pb)
  let buf = pb!
  CVPixelBufferLockBaseAddress(buf, [])
  let ctx = CGContext(data: CVPixelBufferGetBaseAddress(buf), width: W, height: H, bitsPerComponent: 8,
                      bytesPerRow: CVPixelBufferGetBytesPerRow(buf), space: CGColorSpaceCreateDeviceRGB(),
                      bitmapInfo: CGImageAlphaInfo.premultipliedFirst.rawValue | CGBitmapInfo.byteOrder32Little.rawValue)!
  ctx.draw(img, in: CGRect(x: 0, y: 0, width: W, height: H))
  CVPixelBufferUnlockBaseAddress(buf, [])
  while !input.isReadyForMoreMediaData { usleep(2000) }
  adaptor.append(buf, withPresentationTime: CMTime(value: CMTimeValue(i), timescale: 30))
}
input.markAsFinished()
let sem = DispatchSemaphore(value: 0)
writer.finishWriting { sem.signal() }
sem.wait()
print(mode, times.count, "frames", writer.status.rawValue, writer.error as Any)
