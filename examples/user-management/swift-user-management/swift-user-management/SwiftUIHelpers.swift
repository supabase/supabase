//
//  SwiftUIHelpers.swift
//  UserManagement
//
//  Created by Guilherme Souza on 17/11/23.
//

import SwiftUI

extension View {
  func onMac(_ block: (Self) -> some View) -> some View {
    #if os(macOS)
      return block(self)
    #else
      return self
    #endif
  }
}
