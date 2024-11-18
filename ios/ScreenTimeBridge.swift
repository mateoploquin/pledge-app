//
//  ScreenTimeBridge.swift
//  Pledge
//
//  Created by juan alonso allende on 29/10/24.
//

import Foundation
import DeviceActivity
import FamilyControls

@objc(ScreenTimeBridge)
class ScreenTimeBridge: NSObject {

    @objc func getInstagramUsage(_ resolve: @escaping RCTPromiseResolveBlock, reject: @escaping RCTPromiseRejectBlock) {
        FamilyControls.AuthorizationCenter.shared.requestAuthorization { result in
            switch result {
            case .success():
                self.fetchInstagramUsage(resolve: resolve, reject: reject)
            case .failure(let error):
                reject("AUTH_ERROR", "Authorization failed", error)
            }
        }
    }

    private func fetchInstagramUsage(resolve: @escaping RCTPromiseResolveBlock, reject: @escaping RCTPromiseRejectBlock) {
        let activityCenter = DeviceActivityCenter()
        let instagramActivity = DeviceActivityName("InstagramUsage")

        activityCenter.activityReports(for: instagramActivity, during: .lastWeek) { report, error in
            if let error = error {
                reject("FETCH_ERROR", "Failed to fetch activity report", error)
                return
            }

            guard let report = report, let instagramUsage = report.totalUsage(for: ["com.burbn.instagram"]) else {
                resolve("No data available")
                return
            }

            let hours = Int(instagramUsage / 3600)
            let minutes = Int(instagramUsage.truncatingRemainder(dividingBy: 3600) / 60)
            resolve("\(hours)h \(minutes)m")
        }
    }
}
