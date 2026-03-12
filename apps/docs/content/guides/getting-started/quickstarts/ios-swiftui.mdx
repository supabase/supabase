---
title: 'Use Supabase with iOS and SwiftUI'
subtitle: 'Learn how to create a Supabase project, add some sample data to your database, and query the data from an iOS app.'
breadcrumb: 'Framework Quickstarts'
hideToc: true
---

<StepHikeCompact>

  <StepHikeCompact.Step step={1}>

    <$Partial path="quickstart_db_setup.mdx" />

  </StepHikeCompact.Step>

  <StepHikeCompact.Step step={2}>

    <StepHikeCompact.Details title="Create an iOS SwiftUI app with Xcode">

    Open Xcode > New Project > iOS > App. You can skip this step if you already have a working app.

    </StepHikeCompact.Details>

  </StepHikeCompact.Step>

  <StepHikeCompact.Step step={3}>

    <StepHikeCompact.Details title="Install the Supabase client library">

      Add the [supabase-swift](https://github.com/supabase/supabase-swift) package to your app using the Swift Package Manager.

      In Xcode, navigate to **File > Add Package Dependencies...** and enter the repository URL `https://github.com/supabase/supabase-swift` in the search bar. For detailed instructions, see Apple's [tutorial on adding package dependencies](https://developer.apple.com/documentation/xcode/adding-package-dependencies-to-your-app).

      Make sure to add `Supabase` product package as a dependency to your application target.

    </StepHikeCompact.Details>

  </StepHikeCompact.Step>

  <StepHikeCompact.Step step={4}>

    <StepHikeCompact.Details title="Initialize the Supabase client">

      Create a new `Supabase.swift` file add a new Supabase instance using your project URL and public API (anon) key:

      <ProjectConfigVariables variable="url" />
      <ProjectConfigVariables variable="publishable" />
      <ProjectConfigVariables variable="anon" />

    </StepHikeCompact.Details>

    <StepHikeCompact.Code>

      ```swift name=Supabase.swift
      import Supabase

      let supabase = SupabaseClient(
        supabaseURL: URL(string: "YOUR_SUPABASE_URL")!,
        supabaseKey: "YOUR_SUPABASE_PUBLISHABLE_KEY"
      )
      ```

      <$Partial path="api_settings_steps.mdx" variables={{ "framework": "swift", "tab": "mobiles" }} />

    </StepHikeCompact.Code>

  </StepHikeCompact.Step>

  <StepHikeCompact.Step step={5}>

    <StepHikeCompact.Details title="Create a data model for instruments">

    Create a decodable struct to deserialize the data from the database.

    Add the following code to a new file named `Instrument.swift`.

    </StepHikeCompact.Details>

    <StepHikeCompact.Code>

      ```swift name=Instrument.swift
      struct Instrument: Decodable, Identifiable {
        let id: Int
        let name: String
      }
      ```

    </StepHikeCompact.Code>

  </StepHikeCompact.Step>

  <StepHikeCompact.Step step={6}>

    <StepHikeCompact.Details title="Query data from the app">

      Use a `task` to fetch the data from the database and display it using a `List`.

      Replace the default `ContentView` with the following code.

    </StepHikeCompact.Details>

    <StepHikeCompact.Code>

      ```swift name=ContentView.swift
      import SwiftUI

      struct ContentView: View {

        @State var instruments: [Instrument] = []

        var body: some View {
          List(instruments) { instrument in
            Text(instrument.name)
          }
          .overlay {
            if instruments.isEmpty {
              ProgressView()
            }
          }
          .task {
            do {
              instruments = try await supabase.from("instruments").select().execute().value
            } catch {
              dump(error)
            }
          }
        }
      }
      ```

    </StepHikeCompact.Code>

  </StepHikeCompact.Step>

  <StepHikeCompact.Step step={7}>
    <StepHikeCompact.Details title="Start the app">

    Run the app on a simulator or a physical device by hitting `Cmd + R` on Xcode.

    </StepHikeCompact.Details>

  </StepHikeCompact.Step>

</StepHikeCompact>

## Setting up deep links

If you want to implement authentication features like magic links or OAuth, you need to set up deep links to redirect users back to your app. For instructions on configuring custom URL schemes for your iOS app, see the [deep linking guide](/docs/guides/auth/native-mobile-deep-linking?platform=swift).

## Next steps

- Learn how to build a complete user management app with authentication in the [Swift tutorial](/docs/guides/getting-started/tutorials/with-swift)
- Explore the [supabase-swift](https://github.com/supabase/supabase-swift) library on GitHub
