import 'package:supabase_flutter/supabase_flutter.dart';

import 'utils/constants.dart';

Future configureApp() async {
  // init Supabase singleton
  // no localStorage provided, fallback to use hive as default
  await Supabase.initialize(
    url: supabaseUrl,
    anonKey: supabaseAnnonKey,
    authCallbackUrlHostname: 'login-callback',
    debug: true,
  );
}
