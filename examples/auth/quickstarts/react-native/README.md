# Supabase Auth with React Native

This example demonstrates how to use Supabase Auth with React Native and Expo.

## Getting started

### 1. Create a Supabase project

[Launch a new project](https://supabase.com/dashboard) in the Supabase Dashboard.

### 2. Configure environment variables

Create a `.env` file and populate with your Supabase connection variables:

You can find these in your [Supabase Dashboard](https://supabase.com/dashboard/project/_/settings/api) under Settings > API.

### 3. Install dependencies

```bash
npm install
```

### 4. Start the app

```bash
npm start
```

Follow the instructions in the terminal to open the app on your device or emulator.

## Project structure

```
├── App.tsx                 # Main app component
├── components/
│   └── Auth.tsx            # Authentication form component
├── lib/
│   └── supabase.ts         # Supabase client configuration
├── app.json                # Expo configuration
├── package.json            # Dependencies
└── tsconfig.json           # TypeScript configuration
```

## Features

- Email/password sign up
- Email/password sign in
- Session persistence with AsyncStorage
- Automatic token refresh

## Learn more

- [Supabase Auth Documentation](https://supabase.com/docs/guides/auth)
- [React Native Quickstart](https://supabase.com/docs/guides/auth/quickstarts/react-native)
