//
//  Supabase.swift
//  UserManagement
//
//  Created by Guilherme Souza on 17/11/23.
//

import Foundation
import Supabase

let supabase = SupabaseClient(
  supabaseURL: URL(string: "https://PROJECT_ID.supabase.co")!,
  supabaseKey: "YOUR_SUPABASE_ANON_KEY"
)
