import path from "path";
import type { Dirent } from "fs";
import { readdir } from "fs/promises";
import { FunctionArtifact, NewFunctionArtifactStore, IFunctionsArtifactStore } from "./types";
import { pathToFileURL } from "url";

export class FileSystemFunctionsArtifactStore implements IFunctionsArtifactStore {

  constructor(private folderPath: string) { }

  static new(): NewFunctionArtifactStore {
    const folder = process.env.EDGE_FUNCTIONS_MANAGEMENT_FOLDER;
    if (!folder)
      return { store: undefined, error: "'EDGE_FUNCTIONS_MANAGEMENT_FOLDER' is required to use 'FileSystemFunctionsArtifactStore'" }

    return { store: new FileSystemFunctionsArtifactStore(folder), error: undefined };
  }

  async getFunctions(): Promise<FunctionArtifact[]> {
    const dirEntries = await readdir(this.folderPath, { withFileTypes: true });

    const functionsFolders = dirEntries.filter(dir => dir.isDirectory() && dir.name !== "main");
    const functionsArtifacts = await Promise.all(functionsFolders.map(parseFolderToFunctionArtifact))

    return functionsArtifacts.filter(f => f !== undefined);
  }
}

async function parseFolderToFunctionArtifact(folder: Dirent): Promise<FunctionArtifact | undefined> {
  const folderFullpath = path.join(folder.parentPath, folder.name);
  const files = await readdir(folderFullpath, { withFileTypes: true });
  const entrypoint = files.find(file => file.isFile() && file.name.startsWith("index"));

  if (!entrypoint) return;

  return {
    slug: folder.name,
    entrypoint_url: pathToFileURL(path.join(folderFullpath, entrypoint.name)).href
  };
}


