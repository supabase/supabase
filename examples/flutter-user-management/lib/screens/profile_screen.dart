import 'dart:typed_data';

import 'package:flutter/cupertino.dart';
import 'package:flutter/foundation.dart';
import 'package:supabase/supabase.dart';
import 'package:flutter/material.dart';
import 'package:rounded_loading_button/rounded_loading_button.dart';
import 'package:image_picker/image_picker.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

import '/components/auth_required_state.dart';
import '/utils/helpers.dart';

class ProfileScreen extends StatefulWidget {
  @override
  _ProfileScreenState createState() => _ProfileScreenState();
}

class _ProfileScreenState extends AuthRequiredState<ProfileScreen> {
  _ProfileScreenState();

  final scaffoldKey = GlobalKey<ScaffoldState>();

  final RoundedLoadingButtonController _signOutBtnController =
      RoundedLoadingButtonController();
  final RoundedLoadingButtonController _updateProfileBtnController =
      RoundedLoadingButtonController();

  final _picker = ImagePicker();

  User? user;
  bool loadingProfile = true;
  String _appBarTitle = '';
  String username = '';
  String website = '';
  String avatarUrl = '';
  String avatarKey = '';

  @override
  void onAuthenticated(Session session) {
    final _user = session.user;
    if (_user != null) {
      setState(() {
        _appBarTitle = 'Welcome ${_user.email}';
        user = _user;
      });
      _loadProfile(_user.id);
    }
  }

  Future _loadProfile(String userId) async {
    try {
      final response = await Supabase.instance.client
          .from('profiles')
          .select('username, website, avatar_url, updated_at')
          .eq('id', userId)
          .maybeSingle()
          .execute();
      if (response.error != null) {
        throw "Load profile failed: ${response.error!.message}";
      }

      setState(() {
        print(response.data);
        username = response.data?['username'] as String? ?? '';
        website = response.data?['website'] as String? ?? '';
        avatarUrl = response.data?['avatar_url'] as String? ?? '';
        final updatedAt = response.data?['updated_at'] as String? ?? '';
        avatarKey = '$avatarUrl-$updatedAt';
      });
    } catch (e) {
      showMessage(e.toString());
    } finally {
      setState(() {
        loadingProfile = false;
      });
    }
  }

  Future _onSignOutPress(BuildContext context) async {
    await Supabase.instance.client.auth.signOut();
    Navigator.pushNamedAndRemoveUntil(context, '/signIn', (route) => false);
  }

  Future _updateAvatar(BuildContext context) async {
    try {
      final pickedFile = await _picker.pickImage(
        source: ImageSource.gallery,
        maxHeight: 600,
        maxWidth: 600,
      );
      if (pickedFile == null) {
        return;
      }

      final size = await pickedFile.length();
      if (size > 1000000) {
        throw "The file is too large. Allowed maximum size is 1 MB.";
      }

      final bytes = await pickedFile.readAsBytes();
      final fileName = avatarUrl == '' ? '${randomString(15)}.jpg' : avatarUrl;
      const fileOptions = FileOptions(upsert: true);
      final uploadRes = await Supabase.instance.client.storage
          .from('avatars')
          .uploadBinary(fileName, bytes, fileOptions: fileOptions);

      if (uploadRes.error != null) {
        throw uploadRes.error!.message;
      }

      final updatedAt = DateTime.now().toString();
      final res = await Supabase.instance.client.from('profiles').upsert({
        'id': user!.id,
        'avatar_url': fileName,
        'updated_at': updatedAt,
      }).execute();
      if (res.error != null) {
        throw res.error!.message;
      }

      setState(() {
        avatarUrl = fileName;
        avatarKey = '$fileName-$updatedAt';
      });
      showMessage("Avatar updated!");
    } catch (e) {
      showMessage(e.toString());
    }
  }

  Future _onUpdateProfilePress(BuildContext context) async {
    try {
      FocusScope.of(context).unfocus();

      final updates = {
        'id': user?.id,
        'username': username,
        'website': website,
        'updated_at': DateTime.now().toString(),
      };

      final response = await Supabase.instance.client
          .from('profiles')
          .upsert(updates)
          .execute();
      if (response.error != null) {
        throw "Update profile failed: ${response.error!.message}";
      }

      showMessage("Profile updated!");
    } catch (e) {
      showMessage(e.toString());
    } finally {
      _updateProfileBtnController.reset();
    }
  }

  void showMessage(String message) {
    final snackbar = SnackBar(content: Text(message));
    ScaffoldMessenger.of(scaffoldKey.currentContext!).showSnackBar(snackbar);
  }

  @override
  Widget build(BuildContext context) {
    if (loadingProfile) {
      return Scaffold(
        appBar: AppBar(
          title: Text(_appBarTitle),
        ),
        body: SizedBox(
          height: MediaQuery.of(context).size.height / 1.3,
          child: const Center(
            child: CircularProgressIndicator(),
          ),
        ),
      );
    } else {
      return Scaffold(
        key: scaffoldKey,
        resizeToAvoidBottomInset: false,
        appBar: AppBar(
          title: Text(_appBarTitle),
        ),
        body: Padding(
          padding: const EdgeInsets.all(15.0),
          child: Column(
            children: <Widget>[
              AvatarContainer(
                url: avatarUrl,
                onUpdatePressed: () => _updateAvatar(context),
                key: Key(avatarKey),
              ),
              TextFormField(
                onChanged: (value) => setState(() {
                  username = value;
                }),
                initialValue: username,
                keyboardType: TextInputType.emailAddress,
                decoration: const InputDecoration(
                  labelText: 'Username',
                  hintText: '',
                ),
              ),
              TextFormField(
                onChanged: (value) => setState(() {
                  website = value;
                }),
                initialValue: website,
                keyboardType: TextInputType.emailAddress,
                decoration: const InputDecoration(
                  labelText: 'Website',
                  hintText: '',
                ),
              ),
              const SizedBox(height: 35.0),
              RoundedLoadingButton(
                color: Colors.green,
                controller: _updateProfileBtnController,
                onPressed: () {
                  _onUpdateProfilePress(context);
                },
                child: const Text('Update profile',
                    style: TextStyle(fontSize: 20, color: Colors.white)),
              ),
              const SizedBox(height: 35.0),
              RoundedLoadingButton(
                color: Colors.red,
                controller: _signOutBtnController,
                onPressed: () {
                  _onSignOutPress(context);
                },
                child: const Text('Sign out',
                    style: TextStyle(fontSize: 20, color: Colors.white)),
              ),
            ],
          ),
        ),
      );
    }
  }
}

class AvatarContainer extends StatefulWidget {
  final String url;
  final void Function() onUpdatePressed;
  const AvatarContainer(
      {required this.url, required this.onUpdatePressed, Key? key})
      : super(key: key);

  @override
  _AvatarContainerState createState() => _AvatarContainerState();
}

class _AvatarContainerState extends State<AvatarContainer> {
  _AvatarContainerState();

  bool loadingImage = false;
  Uint8List? image;

  @override
  void initState() {
    super.initState();

    if (widget.url != '') {
      downloadImage(widget.url);
    }
  }

  Future<bool> downloadImage(String path) async {
    setState(() {
      loadingImage = true;
    });

    final response =
        await Supabase.instance.client.storage.from('avatars').download(path);
    if (response.error == null) {
      setState(() {
        image = response.data;
        loadingImage = false;
      });
    } else {
      print(response.error!.message);
      setState(() {
        loadingImage = false;
      });
    }
    return true;
  }

  ImageProvider<Object> _getImage() {
    if (image != null) {
      return MemoryImage(image!);
    } else {
      return const AssetImage('assets/images/noavatar.jpeg');
    }
  }

  @override
  Widget build(BuildContext context) {
    if (loadingImage) {
      return const CircleAvatar(
        radius: 65,
        child: Align(
          child: CircularProgressIndicator(),
        ),
      );
    } else {
      return CircleAvatar(
        radius: 65,
        backgroundImage: _getImage(),
        child: Stack(children: [
          Align(
            alignment: Alignment.bottomRight,
            child: IconButton(
              icon: const CircleAvatar(
                radius: 25,
                backgroundColor: Colors.white70,
                child: Icon(
                  CupertinoIcons.camera,
                  size: 18,
                ),
              ),
              onPressed: () => widget.onUpdatePressed(),
            ),
          ),
        ]),
      );
    }
  }
}
