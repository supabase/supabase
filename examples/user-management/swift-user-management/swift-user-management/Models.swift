//
//  Models.swift
//  UserManagement
//
//  Created by Guilherme Souza on 17/11/23.
//

import Foundation

struct Profile: Codable {
  let username: String?
  let fullName: String?
  let website: String?
  let avatarURL: String?

  enum CodingKeys: String, CodingKey {
    case username
    case fullName = "full_name"
    case website
    case avatarURL = "avatar_url"
  }
}
