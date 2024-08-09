import 'package:canvas/canvas/canvas_page.dart';
import 'package:canvas/main.dart';
import 'package:canvas/models/canvas_object.dart';
import 'package:canvas/models/project.dart';
import 'package:flutter/material.dart';

class ProjectsPage extends StatelessWidget {
  static route() =>
      MaterialPageRoute(builder: (context) => const ProjectsPage());
  const ProjectsPage({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Projects')),
      body: FutureBuilder<List<Project>>(
          future: supabase
              .from('projects')
              .select('*, profiles(*)')
              .withConverter((rows) => rows.map(Project.fromJson).toList()),
          builder: (context, snapshot) {
            if (snapshot.hasError) {
              return const Center(child: Text('An error occurred'));
            }
            if (!snapshot.hasData) {
              return const Center(child: CircularProgressIndicator());
            }
            final projects = snapshot.data!;

            if (projects.isEmpty) {
              return const Center(
                child: Text('You do not have any projects yet'),
              );
            }

            return Wrap(
              children: projects.map(
                (project) {
                  return ConstrainedBox(
                    constraints: const BoxConstraints(minWidth: 200),
                    child: Material(
                      elevation: 4,
                      borderRadius: BorderRadius.circular(8),
                      color: Colors.white,
                      child: InkWell(
                        onTap: () {
                          Navigator.of(context)
                              .push(CanvasPage.route(project.id));
                        },
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.stretch,
                          children: [
                            Text(
                              project.name,
                              style: Theme.of(context).textTheme.labelLarge,
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                            ),
                            Row(
                              children: project.profiles
                                  .map((profile) =>
                                      profile.username.substring(0, 2))
                                  .map(
                                    (id) => Align(
                                      widthFactor: 0.8,
                                      child: CircleAvatar(
                                        backgroundColor:
                                            RandomColor.getRandomFromId(id),
                                        child: Text(id.substring(0, 2)),
                                      ),
                                    ),
                                  )
                                  .toList(),
                            ),
                          ],
                        ),
                      ),
                    ),
                  );
                },
              ).toList(),
            );
          }),
    );
  }
}
