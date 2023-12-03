import { monaco } from "@/lib/monaco";

export interface EditorFile {
  id: string;
  name: string;
  content: string;
  isRemovable: boolean;
}

export interface InternalEditorFile {
  id: string;
  name: string;
  initialContent: string;
  isChanged: boolean;
  isRemovable: boolean;
  model: monaco.editor.ITextModel;
}

export interface FilesEditorState {
  editor: monaco.editor.IStandaloneCodeEditor | null;
  filesMap: Map<string, InternalEditorFile>;
  files: InternalEditorFile[];
  active: InternalEditorFile | null;
}

export function createInternalFile(file: EditorFile): InternalEditorFile {
  return {
    id: file.id,
    name: file.name,
    initialContent: file.content,
    isChanged: false,
    isRemovable: file.isRemovable,
    model: monaco.editor.createModel(file.content, "yaml"),
  };
}

export function updateInternalFile(
  internalFile: InternalEditorFile,
  file: EditorFile
) {
  internalFile.name = file.name;
  internalFile.initialContent = file.content;
  internalFile.isChanged = internalFile.model.getValue() !== file.content;
  return internalFile;
}

export function updateEditorState(
  state: FilesEditorState,
  editorFiles: EditorFile[]
) {
  const { filesMap } = state;
  const nextFilesIds = new Set<string>();
  const nextFiles: InternalEditorFile[] = [];
  let newFile: InternalEditorFile | undefined;
  for (const file of editorFiles) {
    nextFilesIds.add(file.id);
    const internalFile = filesMap.get(file.id);
    if (internalFile) {
      nextFiles.push(updateInternalFile(internalFile, file));
    } else {
      newFile = createInternalFile(file);
      filesMap.set(file.id, newFile);
      nextFiles.push(newFile);
    }
  }
  for (const id of filesMap.keys()) {
    if (!nextFilesIds.has(id)) {
      filesMap.get(id)!.model.dispose();
      filesMap.delete(id);
    }
  }
  state.files = nextFiles;
  if (newFile) {
    state.active = newFile;
  } else if (!state.active || !nextFilesIds.has(state.active.id)) {
    const activeFile = nextFiles.length > 0 ? nextFiles[0] : null;
    state.active = activeFile;
  }
}

export function saveActiveFile({
  files,
  active,
}: FilesEditorState): EditorFile[] {
  return files.map((f) => ({
    id: f.id,
    name: f.name,
    isRemovable: f.isRemovable,
    content: f.id === active?.id ? active.model.getValue() : f.initialContent,
  }));
}

export function saveAllFiles({ files }: FilesEditorState): EditorFile[] {
  return files.map((f) => ({
    id: f.id,
    name: f.name,
    isRemovable: f.isRemovable,
    content: f.isChanged ? f.model.getValue() : f.initialContent,
  }));
}

export function resetActiveFile({ active }: FilesEditorState) {
  if (!active) {
    return false;
  }
  active.model.setValue(active.initialContent);
  active.isChanged = false;
  return true;
}

export function resetAllFiles({ files }: FilesEditorState) {
  let updated = 0;
  for (const file of files) {
    if (file.isChanged) {
      file.model.setValue(file.initialContent);
      file.isChanged = false;
      updated++;
    }
  }
  return updated;
}

export function activeFileChanged(state: FilesEditorState) {
  return state.active && state.active.isChanged;
}

export function someFileChanged(state: FilesEditorState) {
  return activeFileChanged(state) || state.files.some((f) => f.isChanged);
}

export function activeFileRemovable({ active }: FilesEditorState) {
  return active && active.isRemovable && active.id
}
