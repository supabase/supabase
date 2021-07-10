import 'dart:io';
import 'dart:typed_data';

import 'package:supabase_demo/components/auth_required_state.dart';
import 'package:supabase_demo/utils/helpers.dart';
import 'package:flutter/cupertino.dart';
import 'package:flutter/material.dart';
import 'package:gotrue/gotrue.dart';
import 'package:path/path.dart';
import 'package:rounded_loading_button/rounded_loading_button.dart';
import 'package:image_picker/image_picker.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

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

  @override
  void initState() {
    super.initState();

    final _user = Supabase().client.auth.user();
    if (_user != null) {
      setState(() {
        _appBarTitle = 'Welcome ${_user.email}';
        user = _user;
      });
      loadProfile(_user.id);
    }
  }

  Future<bool> loadProfile(String userId) async {
    final response = await Supabase()
        .client
        .from('profiles')
        .select('username, website, avatar_url')
        .eq('id', userId)
        .single()
        .execute();
    if (response.error == null && response.data != null) {
      setState(() {
        username = response.data['username'] as String? ?? '';
        website = response.data['website'] as String? ?? '';
        avatarUrl = response.data['avatar_url'] as String? ?? '';
        loadingProfile = false;
      });
    } else {
      setState(() {
        loadingProfile = false;
      });
    }
    return true;
  }

  final picker = ImagePicker();

  Future updateAvatar(BuildContext context) async {
    final pickedFile = await _picker.getImage(source: ImageSource.camera);
    if (pickedFile != null) {
      final file = File(pickedFile.path);
      final fileExt = extension(file.path);
      final fileName = '${randomString(15)}$fileExt';

      final response = await Supabase()
          .client
          .storage
          .from('avatars')
          .upload(fileName, file);
      if (response.error == null) {
        setState(() {
          avatarUrl = fileName;
        });
        _onUpdateProfilePress(context);
      } else {
        print(response.error!.message);
      }
    }
  }

  Future<bool> _onSignOutPress(BuildContext context) async {
    await Supabase().client.auth.signOut();
    Navigator.pushNamedAndRemoveUntil(context, '/signIn', (route) => false);
    return true;
  }

  Future<bool> _onUpdateProfilePress(BuildContext context) async {
    FocusScope.of(context).unfocus();

    final updates = {
      'id': user?.id,
      'username': username,
      'website': website,
      'avatar_url': avatarUrl,
      'updated_at': DateTime.now().toString(),
    };

    final response =
        await Supabase().client.from('profiles').upsert(updates).execute();
    if (response.error != null) {
      showMessage("Update profile failed: ${response.error!.message}");
      _updateProfileBtnController.reset();
      return false;
    } else {
      _updateProfileBtnController.reset();
      showMessage("Profile updated!");
      return true;
    }
  }

  void showMessage(String message) {
    final snackbar = SnackBar(content: Text(message));
    ScaffoldMessenger.of(scaffoldKey.currentContext!).showSnackBar(snackbar);
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      key: scaffoldKey,
      resizeToAvoidBottomInset: false,
      appBar: AppBar(
        title: Text(_appBarTitle),
      ),
      body: loadingProfile
          ? SizedBox(
              height: MediaQuery.of(context).size.height / 1.3,
              child: const Center(
                child: CircularProgressIndicator(),
              ),
            )
          : Padding(
              padding: const EdgeInsets.all(15.0),
              child: Column(
                children: <Widget>[
                  AvatarContainer(
                    url: avatarUrl,
                    onUpdatePressed: () => updateAvatar(context),
                    key: Key(avatarUrl),
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
                    child: const Text(
                      'Sign out',
                      style: TextStyle(fontSize: 20, color: Colors.white),
                    ),
                  ),
                ],
              ),
            ),
    );
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

  bool loadingImage = true;
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
        await Supabase().client.storage.from('avatars').download(path);
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
                radius: 18,
                backgroundColor: Colors.white70,
                child: Icon(CupertinoIcons.camera),
              ),
              onPressed: () => widget.onUpdatePressed(),
            ),
          ),
        ]),
      );
    }
  }
}
