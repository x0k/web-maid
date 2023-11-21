import { useEffect, useRef, useState } from "react";
import {
  Plus,
  Pen,
  Undo,
  Dot,
  Save,
  SaveAll,
  Undo2,
  Trash,
} from "lucide-react";

import { monaco } from "@/lib/monaco";
import { Editor } from "@/components/editor";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import classes from "./file-editor.module.css";

export interface EditorFile {
  id: string;
  name: string;
  content: string;
  isRemovable: boolean;
}

export interface FilesEditorProps {
  files: EditorFile[];
  onCreateFile: () => void;
  onRemoveFile: (fileId: string) => void;
  onSaveFiles: (files: EditorFile[]) => void;
}

interface InternalEditorFile {
  id: string;
  name: string;
  initialContent: string;
  isChanged: boolean;
  isRemovable: boolean;
  model: monaco.editor.ITextModel;
}

interface FilesEditorState {
  files: Map<string, InternalEditorFile>;
  active: InternalEditorFile | null;
}

export function FilesEditor({
  files,
  onCreateFile,
  onRemoveFile,
  onSaveFiles,
}: FilesEditorProps) {
  const stateRef = useRef<FilesEditorState>({
    active: null,
    files: new Map<string, InternalEditorFile>(),
  });
  const [internalFiles, setInternalFiles] = useState<InternalEditorFile[]>([]);
  const [activeFile, setActiveFile] = useState<InternalEditorFile | null>(null);
  useEffect(() => {
    const {
      current,
      current: { files: ifs },
    } = stateRef;
    const visited = new Set<string>();
    const nextFiles: InternalEditorFile[] = [];
    let newFile: InternalEditorFile | undefined;
    for (const file of files) {
      visited.add(file.id);
      const internalFile = ifs.get(file.id);
      if (!internalFile) {
        newFile = {
          id: file.id,
          name: file.name,
          initialContent: file.content,
          isRemovable: file.isRemovable,
          model: monaco.editor.createModel(file.content, "yaml"),
          isChanged: false,
        };
        ifs.set(file.id, newFile);
        nextFiles.push(newFile);
      } else {
        internalFile.name = file.name;
        internalFile.initialContent = file.content;
        internalFile.isChanged = internalFile.model.getValue() !== file.content;
        nextFiles.push(internalFile);
      }
    }
    for (const id of ifs.keys()) {
      if (!visited.has(id)) {
        ifs.get(id)!.model.dispose();
        ifs.delete(id);
      }
    }
    setInternalFiles(nextFiles);
    if (newFile) {
      current.active = newFile;
      setActiveFile(newFile);
    } else if (!current.active || !visited.has(current.active.id)) {
      const activeFile = nextFiles.length > 0 ? nextFiles[0] : null;
      current.active = activeFile;
      setActiveFile(activeFile);
    }
  }, [files]);
  useEffect(() => {
    if (activeFile) {
      const disposable = activeFile.model.onDidChangeContent((e) => {
        const { active } = stateRef.current;
        if (active === null || e.isFlush) {
          return;
        }
        if (active.isChanged) {
          if (e.isUndoing) {
            if (active.model.getValue() == active!.initialContent) {
              active.isChanged = false;
              setActiveFile({ ...active });
            }
          }
        } else {
          active.isChanged = true;
          setActiveFile({ ...active });
        }
      });
      return () => disposable.dispose();
    }
  }, [activeFile?.model]);
  const hasActive = activeFile !== null;
  const isActiveChanged = hasActive && activeFile.isChanged;
  const isSomeFileChanged =
    isActiveChanged || internalFiles.some((f) => f.isChanged);
  return (
    <div className="flex flex-col grow">
      <div className="flex flex-row items-center bg-neutral-950">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button className="dark rounded-none" variant="link">
              File
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="dark w-48">
            <DropdownMenuItem onClick={onCreateFile}>
              <Plus className="mr-2 h-4 w-4" />
              <span>New</span>
              {/* <DropdownMenuShortcut>⌘N</DropdownMenuShortcut> */}
            </DropdownMenuItem>
            <DropdownMenuItem
              disabled={!isActiveChanged}
              onClick={() => {
                if (activeFile) {
                  onSaveFiles(
                    internalFiles.map((f) => ({
                      id: f.id,
                      name: f.name,
                      isRemovable: f.isRemovable,
                      content:
                        f.id === activeFile.id
                          ? f.model.getValue()
                          : f.initialContent,
                    }))
                  );
                }
              }}
            >
              <Save className="mr-2 h-4 w-4" />
              <span>Save</span>
              {/* <DropdownMenuShortcut>⌘S</DropdownMenuShortcut> */}
            </DropdownMenuItem>
            <DropdownMenuItem
              disabled={!isSomeFileChanged}
              onClick={() => {
                if (isSomeFileChanged) {
                  onSaveFiles(
                    internalFiles.map((f) => ({
                      id: f.id,
                      name: f.name,
                      isRemovable: f.isRemovable,
                      content: f.isChanged
                        ? f.model.getValue()
                        : f.initialContent,
                    }))
                  );
                }
              }}
            >
              <SaveAll className="mr-2 h-4 w-4" />
              <span>Save All</span>
              {/* <DropdownMenuShortcut>⇧⌘S</DropdownMenuShortcut> */}
            </DropdownMenuItem>
            <DropdownMenuItem
              disabled={!isActiveChanged}
              onClick={() => {
                const { active } = stateRef.current;
                if (!active?.isChanged) {
                  return;
                }
                active.isChanged = false;
                active.model.setValue(active.initialContent);
                setActiveFile({ ...active });
              }}
            >
              <Undo className="mr-2 h-4 w-4" />
              <span>Reset</span>
            </DropdownMenuItem>
            <DropdownMenuItem
              disabled={!isSomeFileChanged}
              onClick={() => {
                let changed = 0;
                for (const file of internalFiles) {
                  if (file.isChanged) {
                    changed++;
                    file.isChanged = false;
                    file.model.setValue(file.initialContent);
                  }
                }
                if (changed > 0) {
                  const { active } = stateRef.current;
                  if (active) {
                    setActiveFile({ ...active });
                  } else {
                    setInternalFiles((fs) => fs.slice());
                  }
                }
              }}
            >
              <Undo2 className="mr-2 h-4 w-4" />
              <span>Reset All</span>
            </DropdownMenuItem>
            <DropdownMenuItem
              disabled={!hasActive}
              onClick={() => {
                if (activeFile) {
                  onRemoveFile(activeFile.id);
                }
              }}
            >
              <Trash className="mr-2 h-4 w-4" />
              <span>Delete</span>
              {/* <DropdownMenuShortcut>⌫</DropdownMenuShortcut> */}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <div
          className={`relative grow flex flex-row gap-[2px] flex-nowrap overflow-auto h-10 ${classes.tabs}`}
        >
          {internalFiles.map((file) => {
            const isActive = file.id === activeFile?.id;
            return (
              <div
                key={file.id}
                className={`cursor-pointer relative shrink-0 flex flex-row gap-2 items-center max-w-[200px] h-full p-2 overflow-hidden ${
                  isActive ? "bg-neutral-800" : "bg-neutral-700"
                }`}
                onClick={() => {
                  stateRef.current.active = file;
                  setActiveFile(file);
                }}
              >
                <p className="text-neutral-200 truncate w-full">{file.name}</p>
                {file.isChanged ? (
                  <Pen className="text-neutral-500" />
                ) : isActive ? (
                  <Dot className="text-neutral-500" />
                ) : null}
              </div>
            );
          })}
        </div>
      </div>
      <Editor model={activeFile ? activeFile.model : null} />
    </div>
  );
}
