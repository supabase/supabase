// ignore_for_file: public_member_api_docs, sort_constructors_first

class Profile {
  final String id;
  final String username;

  Map<String, dynamic> toJson() {
    return <String, dynamic>{
      'id': id,
      'username': username,
    };
  }

  Profile.fromJson(Map<String, dynamic> map)
      : id = map['id'] as String,
        username = map['username'] as String;
}
