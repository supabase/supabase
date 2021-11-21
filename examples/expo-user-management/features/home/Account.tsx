import React from "react";
import {
  Text,
  Button,
  Input,
  Box,
  VStack,
  useToast,
  KeyboardAvoidingView,
} from "native-base";
import { Image, Platform } from "react-native";
import { useAuth } from "../auth/AuthContext";
import Layout from "../../components/Layout";
import * as ImagePicker from "expo-image-picker";
import supabase from "../../services/supabase";
import { Profile } from "../../types/Profile";

export default function Account() {
  const { profile, signOut, setProfile } = useAuth();

  const [username, setUsername] = React.useState<string>();
  const [website, setWebsite] = React.useState<string>();
  const [isUploading, setUploading] = React.useState(false);
  const [isUpdating, setUpdating] = React.useState(false);

  const user = supabase.auth.user();

  const toast = useToast();

  React.useEffect(() => {
    if (profile) {
      setUsername(profile.username || "");
      setWebsite(profile.website || "");
    }
  }, [profile]);

  React.useEffect(() => {
    (async () => {
      if (Platform.OS !== "web") {
        const { status } =
          await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== "granted") {
          toast.show({
            placement: "top",
            title: "Upload",
            status: "warning",
            description:
              "Sorry, we need camera roll permissions to upload your profile photo!",
          });
        }
      }
    })();
  }, []);

  async function onUpload(imageUrl: string) {
    let { data, error } = await supabase
      .from<Profile>("profiles")
      .upsert({ id: user?.id, avatar_url: imageUrl });

    setUploading(false);
    if (data && data.length > 0) {
      setProfile(data[0]);
      toast.show({
        placement: "top",
        title: "Upload",
        status: "success",
        description: "Photo uploaded successfully",
      });
    } else {
      toast.show({
        placement: "top",
        title: "Upload",
        status: "error",
        description: "There was a problem updating your profile",
      });
    }
  }

  async function updateProfile() {
    setUpdating(true);
    let { data, error } = await supabase
      .from<Profile>("profiles")
      .upsert({ id: user?.id, username, website });

    setUpdating(false);
    if (data && data.length > 0) {
      setProfile(data[0]);
      toast.show({
        placement: "top",
        title: "Profile",
        status: "success",
        description: "Profile updated successfully",
      });
    }
  }

  async function uploadImageWeb(image: ImagePicker.ImagePickerResult) {
    if (!image.cancelled) {
      let filename = image.uri?.split("/").pop();
      // Why are we using XMLHttpRequest? See:
      // https://github.com/expo/expo/issues/2402#issuecomment-443726662
      const blob = await new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.onload = function () {
          resolve(xhr.response);
        };
        xhr.onerror = function (e) {
          console.log(e);
          reject(new TypeError("Network request failed"));
        };
        xhr.responseType = "blob";
        xhr.open("GET", image.uri, true);
        xhr.send(null);
      });

      // We're done with the blob, close and release it
      //blob.close();

      setUploading(true);
      supabase.storage
        .from("avatars")
        .upload(filename!, blob)
        .then((res) => {
          let result = supabase.storage.from("avatars").getPublicUrl(filename!);
          result.publicURL && onUpload(result.publicURL);
        })
        .catch((err) => {
          toast.show({
            placement: "top",
            title: "Upload",
            status: "error",
            description:
              err?.message || "There was a problem uploading your photo",
          });
        });
    }
  }

  function uploadImageMobile(image: ImagePicker.ImagePickerResult) {
    if (!image.cancelled) {
      let filename = image.uri?.split("/").pop();

      if (filename) {
        let matches = /\.(\w+)$/.exec(filename!);
        let type = matches ? `image/${matches[1]}` : `image`;

        const data = new FormData();

        data.append("file", {
          uri: Platform.select({
            ios: image.uri.replace("file://", ""),
            android: image.uri,
          }),
          name: filename,
          type: type,
        });

        setUploading(true);
        supabase.storage
          .from("avatars")
          .upload(filename, data)
          .then((res) => {
            let result = supabase.storage
              .from("avatars")
              .getPublicUrl(filename!);
            result.publicURL && onUpload(result.publicURL);
          })
          .catch((err) => {
            toast.show({
              placement: "top",
              title: "Upload",
              status: "error",
              description:
                err?.message || "There was a problem uploading your photo",
            });
          });
      }
    }
  }

  function selectPhoto() {
    ImagePicker.launchImageLibraryAsync({
      base64: false,
    }).then(Platform.OS === "web" ? uploadImageWeb : uploadImageMobile);
  }

  return (
    <KeyboardAvoidingView
      flex={1}
      behavior={Platform.OS == "ios" ? "padding" : undefined}
    >
      <Layout flex={1} justifyContent="flex-end">
        <VStack space={6}>
          <VStack space={4}>
            <Image
              source={{
                uri: profile?.avatar_url,
              }}
              style={{ width: 200, height: 200, alignSelf: "center" }}
            />
            <Button
              alignSelf="center"
              onPress={selectPhoto}
              isLoading={isUploading}
            >
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
