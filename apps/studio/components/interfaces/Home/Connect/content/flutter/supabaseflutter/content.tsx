import type { ContentFileProps } from 'components/interfaces/Home/Connect/Connect.types'

import {
  ConnectTabs,
  ConnectTabTriggers,
  ConnectTabTrigger,
  ConnectTabContent,
} from 'components/interfaces/Home/Connect/ConnectTabs'
import SimpleCodeBlock from 'components/to-be-cleaned/SimpleCodeBlock'

const ContentFile = ({ projectKeys }: ContentFileProps) => {
  return (
    <ConnectTabs>
      <ConnectTabTriggers>
        <ConnectTabTrigger value="pubspec.yaml" />
        <ConnectTabTrigger value="lib/main.dart" />
      </ConnectTabTriggers>

      <ConnectTabContent value="pubspec.yaml">
        <SimpleCodeBlock className="bash" parentClassName="min-h-72">
          {`
name: supabase_todos
description: Sample app on how to get started with Supabase on Flutter.

publish_to: 'none'

version: 1.0.0+1

environment:
  sdk: '>=2.17.0 <4.0.0'

dependencies:
  flutter:
    sdk: flutter

  supabase_flutter: ^2.0.0

dev_dependencies:
  flutter_test:
    sdk: flutter
  lint: ^1.5.3

flutter:
  uses-material-design: true
  assets:
    - .env
        `}
        </SimpleCodeBlock>
      </ConnectTabContent>

      <ConnectTabContent value="lib/main.dart">
        <SimpleCodeBlock className="dart" parentClassName="min-h-72">
          {`
import 'package:supabase_flutter/supabase_flutter.dart';

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();

  await Supabase.initialize(
    url: ${projectKeys.apiUrl ?? 'your-project-url'},
    anonKey: ${projectKeys.anonKey ?? 'your-anon-key'},
  );
  runApp(MyApp());
}

class MyApp extends StatelessWidget {
  const MyApp({super.key});

  @override
  Widget build(BuildContext context) {
    return const MaterialApp(
      title: 'Todos',
      home: HomePage(),
    );
  }
}

class HomePage extends StatefulWidget {
  const HomePage({super.key});

  @override
  State<HomePage> createState() => _HomePageState();
}

class _HomePageState extends State<HomePage> {
  final _future = Supabase.instance.client
      .from('todos')
      .select();

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: FutureBuilder(
        future: _future,
        builder: (context, snapshot) {
          if (!snapshot.hasData) {
            return const Center(child: CircularProgressIndicator());
          }
          final todos = snapshot.data!;
          return ListView.builder(
            itemCount: todos.length,
            itemBuilder: ((context, index) {
              final todo = todos[index];
              return ListTile(
                title: Text(todo['name']),
              );
            }),
          );
        },
      ),
    );
  }
}
`}
        </SimpleCodeBlock>
      </ConnectTabContent>

    </ConnectTabs>
  )
}

export default ContentFile
