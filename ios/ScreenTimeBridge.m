//
//  ScreenTimeBridge.m
//  Pledge
//
//  Created by mrallende on 29/10/24.
//

#import <Foundation/Foundation.h>
#import <React/RCTBridgeModule.h>

@interface RCT_EXTERN_MODULE(ScreenTimeBridge, NSObject)

RCT_EXTERN_METHOD(getInstagramUsage:(RCTPromiseResolveBlock)resolve reject:(RCTPromiseRejectBlock)reject)

@end
