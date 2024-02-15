import { MutableRefObject, DragEvent } from "react";

import { monaco } from "@/lib/monaco";
import { moveItemBeforeInPlace } from '@/lib/array';

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
  indicatorRef: MutableRefObject<HTMLDivElement | null>;
}

export interface FilesEditorState {
  editor: monaco.editor.IStandaloneCodeEditor | null;
  filesMap: Map<string, InternalEditorFile>;
  files: InternalEditorFile[];
  activeFileIndex: number;
  freeIndicatorRef: MutableRefObject<HTMLDivElement | null>;
}

export const FREE_INDICATOR_ID = "free";

export function createInternalFile(file: EditorFile): InternalEditorFile {
  return {
    id: file.id,
    name: file.name,
    initialContent: file.content,
    isChanged: false,
    isRemovable: file.isRemovable,
    model: monaco.editor.createModel(file.content, "yaml"),
    indicatorRef: { current: null },
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
  const { filesMap, files, activeFileIndex } = state;
  const nextFilesIds = new Set<string>();
  const nextFiles: InternalEditorFile[] = [];
  let newFileIndex = -1;
  let newActiveFileIndex = activeFileIndex > -1 ? -1 : -2;
  for (const file of editorFiles) {
    nextFilesIds.add(file.id);
    const internalFile = filesMap.get(file.id);
    if (internalFile) {
      const l = nextFiles.push(updateInternalFile(internalFile, file));
      if (newActiveFileIndex === -1 && files[activeFileIndex].id === file.id) {
        newActiveFileIndex = l - 1;
      }
    } else {
      const newFile = createInternalFile(file);
      filesMap.set(file.id, newFile);
      newFileIndex = nextFiles.push(newFile);
    }
  }
  newFileIndex -= 1;
  for (const id of filesMap.keys()) {
    if (!nextFilesIds.has(id)) {
      filesMap.get(id)!.model.dispose();
      filesMap.delete(id);
    }
  }
  state.files = nextFiles;
  if (nextFiles.length === 0) {
    state.activeFileIndex = -1;
  } else if (files.length === 0) {
    state.activeFileIndex = 0;
  } else if (newFileIndex > -1) {
    state.activeFileIndex = newFileIndex;
  } else if (newActiveFileIndex > -1) {
    state.activeFileIndex = newActiveFileIndex;
  } else {
    let i = activeFileIndex - 1;
    while (i >= 0 && !filesMap.has(files[i].id)) {
      i--;
    }
    if (i < 0) {
      i = activeFileIndex + 1;
      while (i < files.length && !filesMap.has(files[i].id)) {
        i++;
      }
    }
    state.activeFileIndex = Math.min(i, nextFiles.length - 1);
  }
}

export function saveActiveFile({
  files,
  activeFileIndex,
}: FilesEditorState): EditorFile[] {
  return files.map((f, i) => ({
    id: f.id,
    name: f.name,
    isRemovable: f.isRemovable,
    content: i === activeFileIndex ? f.model.getValue() : f.initialContent,
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

export function resetActiveFile({ activeFileIndex, files }: FilesEditorState) {
  if (activeFileIndex < 0) {
    return false;
  }
  const active = files[activeFileIndex];
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

export function activeFileChanged({
  activeFileIndex,
  files,
}: FilesEditorState) {
  return activeFileIndex > -1 && files[activeFileIndex].isChanged;
}

export function someFileChanged(state: FilesEditorState) {
  return activeFileChanged(state) || state.files.some((f) => f.isChanged);
}

export function activeFile({ activeFileIndex, files }: FilesEditorState) {
  return activeFileIndex > -1 ? files[activeFileIndex] : null;
}

export function activeFileWithoutBoundaryCheck({
  files,
  activeFileIndex,
}: FilesEditorState) {
  return files[activeFileIndex];
}

export function activeFileRemovable({
  activeFileIndex,
  files,
}: FilesEditorState) {
  return activeFileIndex > -1 && files[activeFileIndex].isRemovable;
}

export function setActiveFile(state: FilesEditorState, index: number) {
  state.activeFileIndex = index;
}

export function getNearestIndicator<T>(
  { files, freeIndicatorRef: { current: freeIndicator } }: FilesEditorState,
  e: DragEvent<T>
) {
  if (freeIndicator === null) {
    return null;
  }
  return files.reduce(
    (acc, { indicatorRef: { current } }, index) => {
      if (current === null) {
        return acc;
      }
      const box = current.getBoundingClientRect();
      const offset = Math.abs(e.clientX - box.left);
      if (offset < acc.offset) {
        return {
          index,
          offset,
          element: current,
        };
      }
      return acc;
    },
    {
      index: files.length,
      offset: Math.abs(e.clientX - freeIndicator.getBoundingClientRect().left),
      element: freeIndicator,
    }
  );
}

export function getNearestIndicatorElement<T>(
  state: FilesEditorState,
  e: DragEvent<T>
) {
  return getNearestIndicator(state, e)?.element || null;
}

export function moveFileBefore(
  state: FilesEditorState,
  fileIndex: number,
  beforeIndex: number
) {
  const { files } = state
  const newFileIndex = moveItemBeforeInPlace(files, fileIndex, beforeIndex);
  if (fileIndex === newFileIndex) {
    return false
  }
  state.activeFileIndex = newFileIndex
  return true
}
