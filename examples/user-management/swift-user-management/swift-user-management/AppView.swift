//
//  AppView.swift
//  UserManagement
//
//  Created by Guilherme Souza on 17/11/23.
//

import SwiftUI

struct AppView: View {
  @State var isAuthenticated = false

  var body: some View {
    Group {
      if isAuthenticated {
        ProfileView()
      } else {
        AuthView()
      }
    }
    .task {
      for await state in await supabase.auth.authStateChanges {
        if [.initialSession, .signedIn, .signedOut].contains(state.event) {
          isAuthenticated = state.session != nil
        }
      }
    }
  }
}

#if swift(>=5.9)
  #Preview {
    AppView()
  }
#endif
