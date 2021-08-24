import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

import 'utils/constants.dart';

void configureApp() {
  // user flutter_secure_storage to persist user session
  final localStorage = LocalStorage(hasAccessToken: () {
    print('Use FlutterSecureStorage hasAccessToken');
    const storage = FlutterSecureStorage();
    return storage.containsKey(key: supabasePersistSessionKey);
  }, accessToken: () {
    print('Use FlutterSecureStorage accessToken');
    const storage = FlutterSecureStorage();
    return storage.read(key: supabasePersistSessionKey);
  }, removePersistedSession: () {
    print('Use FlutterSecureStorage removePersistedSession');
    const storage = FlutterSecureStorage();
    return storage.delete(key: supabasePersistSessionKey);
  }, persistSession: (String value) {
    print('Use FlutterSecureStorage persistSession');
    const storage = FlutterSecureStorage();
    return storage.write(key: supabasePersistSessionKey, value: value);
  });
  print('configureApp for Android, iOS');
  // init Supabase singleton
  Supabase.initialize(
    url: supabaseUrl,
    anonKey: supabaseAnnonKey,
    authCallbackUrlHostname: 'login-callback',
    debug: true,
    localStorage: localStorage,
  );
}
