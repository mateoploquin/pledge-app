import AVFoundation
import AppKit
let a = CommandLine.arguments
let dir = a[1], out = URL(fileURLWithPath: a[2]), repeats = Int(a[3]) ?? 1
let files = try! FileManager.default.contentsOfDirectory(atPath: dir).filter { $0.hasPrefix("r") && $0.hasSuffix(".png") }.sorted()
let W = 720, H = 1280
try? FileManager.default.removeItem(at: out)
let w = try! AVAssetWriter(outputURL: out, fileType: .mp4)
let input = AVAssetWriterInput(mediaType: .video, outputSettings: [
  AVVideoCodecKey: AVVideoCodecType.h264, AVVideoWidthKey: W, AVVideoHeightKey: H,
  AVVideoCompressionPropertiesKey: [AVVideoAverageBitRateKey: 5_000_000, AVVideoMaxKeyFrameIntervalKey: 30, AVVideoProfileLevelKey: AVVideoProfileLevelH264HighAutoLevel]])
let ad = AVAssetWriterInputPixelBufferAdaptor(assetWriterInput: input, sourcePixelBufferAttributes: [
  kCVPixelBufferPixelFormatTypeKey as String: kCVPixelFormatType_32BGRA, kCVPixelBufferWidthKey as String: W, kCVPixelBufferHeightKey as String: H])
w.add(input); w.startWriting(); w.startSession(atSourceTime: .zero)
let imgs = files.map { NSImage(contentsOfFile: dir + "/" + $0)!.cgImage(forProposedRect: nil, context: nil, hints: nil)! }
var n = 0
for _ in 0..<repeats { for img in imgs {
  var pb: CVPixelBuffer?; CVPixelBufferPoolCreatePixelBuffer(nil, ad.pixelBufferPool!, &pb); let b = pb!
  CVPixelBufferLockBaseAddress(b, [])
  let ctx = CGContext(data: CVPixelBufferGetBaseAddress(b), width: W, height: H, bitsPerComponent: 8, bytesPerRow: CVPixelBufferGetBytesPerRow(b), space: CGColorSpaceCreateDeviceRGB(), bitmapInfo: CGImageAlphaInfo.premultipliedFirst.rawValue | CGBitmapInfo.byteOrder32Little.rawValue)!
  ctx.draw(img, in: CGRect(x: 0, y: 0, width: W, height: H)); CVPixelBufferUnlockBaseAddress(b, [])
  while !input.isReadyForMoreMediaData { usleep(2000) }
  ad.append(b, withPresentationTime: CMTime(value: CMTimeValue(n), timescale: 30)); n += 1
} }
input.markAsFinished(); let sem = DispatchSemaphore(value: 0); w.finishWriting { sem.signal() }; sem.wait()
print(n, w.status.rawValue)
