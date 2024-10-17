// ignore_for_file: public_member_api_docs, sort_constructors_first
import 'package:canvas/models/profile.dart';

class Project {
  final String id;
  final String name;
  final List<Profile> profiles;

  Map<String, dynamic> toJson() {
    return <String, dynamic>{
      'id': id,
      'name': name,
      'profiles': profiles.map((profile) => profile.toJson()).toList(),
    };
  }

  Project.fromJson(Map<String, dynamic> map)
      : id = map['id'] as String,
        name = map['name'] as String,
        profiles = List<Profile>.from(
          (map['profiles'] as List<dynamic>).map<Profile>(
            (profile) => Profile.fromJson(profile as Map<String, dynamic>),
          ),
        );
}
