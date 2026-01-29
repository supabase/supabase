import type { ContentFileProps } from '@/components/interfaces/ConnectSheet/Connect.types'

import { SimpleCodeBlock } from 'ui'
import {
  MultipleCodeBlock,
  MultipleCodeBlockContent,
  MultipleCodeBlockTrigger,
  MultipleCodeBlockTriggers,
} from 'ui-patterns/multiple-code-block'

const ContentFile = ({ projectKeys }: ContentFileProps) => {
  return (
    <MultipleCodeBlock>
      <MultipleCodeBlockTriggers>
        <MultipleCodeBlockTrigger value="lib/main.dart" />
        <MultipleCodeBlockTrigger value="lib/main.dart (app)" />
      </MultipleCodeBlockTriggers>

      <MultipleCodeBlockContent value="lib/main.dart">
        <SimpleCodeBlock className="dart" parentClassName="min-h-72">
          {`
import 'package:supabase_flutter/supabase_flutter.dart';

Future<void> main() async {
  await Supabase.initialize(
    url: '${projectKeys.apiUrl ?? 'your-project-url'}',
    anonKey: '${projectKeys.publishableKey ?? '<prefer publishable key instead of anon key for mobile and desktop apps>'}',
  );
  runApp(MyApp());
}
        `}
        </SimpleCodeBlock>
      </MultipleCodeBlockContent>

      <MultipleCodeBlockContent value="lib/main.dart (app)">
        <SimpleCodeBlock className="dart" parentClassName="min-h-72">
          {`
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
      </MultipleCodeBlockContent>
    </MultipleCodeBlock>
  )
}

export default ContentFile
