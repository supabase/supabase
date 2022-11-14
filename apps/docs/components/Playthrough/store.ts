import { createWatcher } from "./watcher";

// file tree
type FileTree = FileTreeEntry[];
type DirEntry = {
  name: string;
  path: string;
  type: "directory";
  children: FileTreeEntry[];
};
type FileEntry = {
  name: string;
  path: string;
  type: "file";
};
type FileTreeEntry = FileEntry | DirEntry;
export const fileTreeWatcher = createWatcher<FileTree>();

// current file
type FileWithContents = {
  contents: string;
  path: string;
};
export const currentFileWatcher = createWatcher<FileWithContents>();

// steps
type Step = {
  type: "step";
  header: string;
  intro?: any[];
  solution: any;
  show: () => React.ReactNode;
  children: React.ReactNode;
  // added by withStepIndex function
  loading?: boolean;
  stepIndex: number;
  chapterIndex: number;
};
export const stepWatcher = createWatcher<Step>();

// commands
export const runningWatcher = createWatcher<string>();
export const runWatcher = createWatcher<{ line: string; exitCode: number }>();
