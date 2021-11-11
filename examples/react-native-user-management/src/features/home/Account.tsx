import React from 'react';
import {
  Text,
  Button,
  Input,
  Box,
  VStack,
  useToast,
  KeyboardAvoidingView,
} from 'native-base';
import {Image, Platform} from 'react-native';
import {NativeStackScreenProps} from '@react-navigation/native-stack';
import {HomeStackParamList} from '.';
import {useAuth} from '../auth/AuthContext';
import Layout from '../../components/Layout';
import ImagePicker, {ImageOrVideo} from 'react-native-image-crop-picker';
import supabase from '../../services/supabase';
import {Profile} from '../../types/Profile';

type AccountProps = NativeStackScreenProps<HomeStackParamList, 'Profile'>;

export default function Account({route}: AccountProps) {
  const {profile, signOut, setProfile} = useAuth();

  const [username, setUsername] = React.useState<string>();
  const [website, setWebsite] = React.useState<string>();
  const [isUploading, setUploading] = React.useState(false);
  const [isUpdating, setUpdating] = React.useState(false);

  const user = supabase.auth.user();

  const toast = useToast();

  React.useEffect(() => {
    if (profile) {
      setUsername(profile.username || '');
      setWebsite(profile.website || '');
    }
  }, [profile]);

  async function onUpload(imageUrl: string) {
    let {data, error} = await supabase
      .from<Profile>('profiles')
      .upsert({id: user?.id, avatar_url: imageUrl});

    setUploading(false);
    if (data && data.length > 0) {
      setProfile(data[0]);
      toast.show({
        placement: 'top',
        title: 'Upload',
        status: 'success',
        description: 'Photo uploaded successfully',
      });
    } else {
      toast.show({
        placement: 'top',
        title: 'Upload',
        status: 'error',
        description: 'There was a problem updating your profile',
      });
    }
  }

  async function updateProfile() {
    setUpdating(true);
    let {data, error} = await supabase
      .from<Profile>('profiles')
      .upsert({id: user?.id, username, website});

    setUpdating(false);
    if (data && data.length > 0) {
      setProfile(data[0]);
      toast.show({
        placement: 'top',
        title: 'Profile',
        status: 'success',
        description: 'Profile updated successfully',
      });
    }
  }

  function uploadImage(image: ImageOrVideo) {
    console.log({image});
    let pathSegments = image.path?.split('/');
    if (pathSegments) {
      let filename = pathSegments[pathSegments?.length - 1];

      const data = new FormData();
      data.append('file', {
        name: filename,
        type: image.mime,
        uri:
          Platform.OS === 'ios'
            ? image.path.replace('file://', '')
            : image.path,
      });

      setUploading(true);
      supabase.storage
        .from('avatars')
        .upload(filename, data)
        .then(res => {
          let result = supabase.storage.from('avatars').getPublicUrl(filename);
          result.publicURL && onUpload(result.publicURL);
        })
        .catch(err => {
          toast.show({
            placement: 'top',
            title: 'Upload',
            status: 'error',
            description:
              err?.message || 'There was a problem uploading your photo',
          });
        });
    }
  }

  function selectPhoto() {
    ImagePicker.openPicker({
      width: 300,
      height: 300,
      cropping: true,
      includeBase64: true,
    }).then(uploadImage);
  }

  return (
    <KeyboardAvoidingView
      flex={1}
      behavior={Platform.OS == 'ios' ? 'padding' : undefined}>
      <Layout flex={1} justifyContent="flex-end">
        <VStack space={6}>
          <VStack space={4}>
            <Image
              source={{
                uri: profile?.avatar_url,
              }}
              style={{width: 200, height: 200, alignSelf: 'center'}}
            />
            <Button
              alignSelf="center"
              onPress={selectPhoto}
              isLoading={isUploading}>
              Upload
            </Button>
          </VStack>

          <Box>
            <Text>User Name</Text>
            <Input
              autoCapitalize="none"
              value={username}
              onChangeText={setUsername}
            />
          </Box>

          <Box>
            <Text>Website</Text>
            <Input
              autoCapitalize="none"
              value={website}
              onChangeText={setWebsite}
            />
          </Box>

          <Button isLoading={isUpdating} onPress={updateProfile}>
            Update
          </Button>

          <Button onPress={signOut} variant="ghost">
            Sign Out
          </Button>
        </VStack>
      </Layout>
    </KeyboardAvoidingView>
  );
}
