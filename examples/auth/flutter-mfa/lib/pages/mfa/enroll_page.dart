import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_svg/flutter_svg.dart';
import 'package:go_router/go_router.dart';
import 'package:mfa_app/main.dart';
import 'package:mfa_app/pages/auth/register_page.dart';
import 'package:mfa_app/pages/home_page.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

class MFAEnrollPage extends StatefulWidget {
  static const route = '/mfa/enroll';
  const MFAEnrollPage({super.key});

  @override
  State<MFAEnrollPage> createState() => _MFAEnrollPageState();
}

class _MFAEnrollPageState extends State<MFAEnrollPage> {
  final _enrollFuture = supabase.auth.mfa.enroll();

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Setup MFA'),
        actions: [
          TextButton(
            onPressed: () {
              supabase.auth.signOut();
              context.go(RegisterPage.route);
            },
            child: Text(
              'Logout',
              style: TextStyle(color: Theme.of(context).colorScheme.onPrimary),
            ),
          ),
        ],
      ),
      body: FutureBuilder(
        future: _enrollFuture,
        builder: (context, snapshot) {
          if (snapshot.hasError) {
            return Center(child: Text(snapshot.error.toString()));
          }
          if (!snapshot.hasData) {
            return const Center(child: CircularProgressIndicator());
          }

          final response = snapshot.data!;
          final qrCodeUrl = response.totp.qrCode;
          final secret = response.totp.secret;
          final factorId = response.id;

          return ListView(
            padding: const EdgeInsets.symmetric(
              horizontal: 20,
              vertical: 24,
            ),
            children: [
              const Text(
                'Open your authentication app and add this app via QR code or by pasting the code below.',
                style: TextStyle(
                  fontWeight: FontWeight.bold,
                ),
              ),
              const SizedBox(height: 16),
              SvgPicture.string(
                qrCodeUrl,
                width: 150,
                height: 150,
              ),
              const SizedBox(height: 16),
              Row(
                children: [
                  Expanded(
                    child: Text(
                      secret,
                      style: const TextStyle(
                        fontWeight: FontWeight.bold,
                        fontSize: 18,
                      ),
                    ),
                  ),
                  IconButton(
                    onPressed: () {
                      Clipboard.setData(ClipboardData(text: secret));
                      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(
                          content: Text('Copied to your clip board')));
                    },
                    icon: const Icon(Icons.copy),
                  ),
                ],
              ),
              const SizedBox(height: 16),
              const Text('Enter the code shown in your authentication app.'),
              const SizedBox(height: 16),
              TextFormField(
                decoration: const InputDecoration(
                  hintText: '000000',
                ),
                style: const TextStyle(fontSize: 24),
                textAlign: TextAlign.center,
                keyboardType: TextInputType.number,
                onChanged: (value) async {
                  if (value.length != 6) return;

                  // kick off the verification process once 6 characters are entered
                  try {
                    final challenge =
                        await supabase.auth.mfa.challenge(factorId: factorId);
                    await supabase.auth.mfa.verify(
                      factorId: factorId,
                      challengeId: challenge.id,
                      code: value,
                    );
                    await supabase.auth.refreshSession();
                    if (mounted) {
                      context.go(HomePage.route);
                    }
                  } on AuthException catch (error) {
                    ScaffoldMessenger.of(context)
                        .showSnackBar(SnackBar(content: Text(error.message)));
                  } catch (error) {
                    ScaffoldMessenger.of(context).showSnackBar(const SnackBar(
                        content: Text('Unexpected error occurred')));
                  }
                },
              ),
            ],
          );
        },
      ),
    );
  }
}
