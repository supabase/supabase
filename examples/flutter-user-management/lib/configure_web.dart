import 'package:supabase_flutter/supabase_flutter.dart';

import 'utils/constants.dart';

void configureApp() {
  // init Supabase singleton
  // no localStorage provided, fallback to use shared_preferences
  Supabase.initialize(
    url: supabaseUrl,
    anonKey: supabaseAnnonKey,
    authCallbackUrlHostname: 'login-callback',
    debug: true,
  );
}
