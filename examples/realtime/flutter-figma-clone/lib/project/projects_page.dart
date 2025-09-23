import 'package:canvas/main.dart';
import 'package:canvas/models/canvas_object.dart';
import 'package:canvas/models/project.dart';
import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

class ProjectsPage extends StatelessWidget {
  const ProjectsPage({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      extendBody: true,
      appBar: AppBar(title: const Text('Projects')),
      body: FutureBuilder<List<Project>>(
          future: supabase
              .from('projects')
              .select('*, profiles(*)')
              .order('created_at')
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

            return Align(
              alignment: Alignment.topCenter,
              child: Padding(
                padding: const EdgeInsets.all(16.0),
                child: Wrap(
                  runAlignment: WrapAlignment.spaceAround,
                  spacing: 16,
                  runSpacing: 16,
                  children: projects.map(
                    (project) {
                      return ConstrainedBox(
                        constraints: const BoxConstraints(maxWidth: 300),
                        child: Material(
                          elevation: 4,
                          borderRadius: BorderRadius.circular(8),
                          color: Colors.white,
                          child: InkWell(
                            onTap: () {
                              context.go('/canvas/${project.id}');
                            },
                            child: Padding(
                              padding: const EdgeInsets.all(8.0),
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.stretch,
                                children: [
                                  Text(
                                    project.name,
                                    style: Theme.of(context)
                                        .textTheme
                                        .titleMedium!
                                        .copyWith(fontWeight: FontWeight.bold),
                                    maxLines: 1,
                                    overflow: TextOverflow.ellipsis,
                                  ),
                                  Row(
                                    mainAxisAlignment: MainAxisAlignment.end,
                                    children: project.profiles
                                        .map(
                                          (profile) => Align(
                                            widthFactor: 0.8,
                                            child: CircleAvatar(
                                              backgroundColor:
                                                  RandomColor.getRandomFromId(
                                                profile.username,
                                              ),
                                              child: Text(profile.username
                                                  .substring(0, 2)),
                                            ),
                                          ),
                                        )
                                        .toList(),
                                  ),
                                ],
                              ),
                            ),
                          ),
                        ),
                      );
                    },
                  ).toList(),
                ),
              ),
            );
          }),
      floatingActionButton: ElevatedButton.icon(
        onPressed: () async {
          final projectId = await supabase.rpc('create_new_project');
          context.go('/canvas/$projectId');
        },
        label: const Text('Create a Project'),
        icon: const Icon(Icons.add),
      ),
    );
  }
}
