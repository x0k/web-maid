import { forwardRef, useCallback, useEffect, useRef, useState } from "react";
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

import { Editor } from "@/components/editor";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import classes from "./styles.module.css";
import {
  EditorFile,
  FilesEditorState,
  InternalEditorFile,
  resetAllFiles,
  resetFile,
  saveAllFiles,
  saveFile,
  updateEditorState,
} from "./core";

export interface FilesEditorProps {
  files: EditorFile[];
  onCreateFile: () => void;
  onRemoveFile: (fileId: string) => void;
  onSaveFiles: (files: EditorFile[]) => void;
}

export const FilesEditor = forwardRef<FilesEditorState, FilesEditorProps>(
  ({ files: editorFiles, onCreateFile, onRemoveFile, onSaveFiles }, ref) => {
    const stateRef = useRef<FilesEditorState>({
      active: null,
      filesMap: new Map<string, InternalEditorFile>(),
      files: [],
    });
    const [, setState] = useState(0);
    const rerender = useCallback(() => setState(Date.now()), []);
    useEffect(() => {
      if (ref) {
        if (typeof ref === "function") {
          ref(stateRef.current);
        } else {
          ref.current = stateRef.current;
        }
      }
    }, [ref]);
    useEffect(() => {
      updateEditorState(stateRef.current, editorFiles);
      rerender();
    }, [editorFiles, rerender]);
    useEffect(() => {
      const {
        current: { active },
      } = stateRef;
      if (active) {
        const disposable = active.model.onDidChangeContent((e) => {
          const { active } = stateRef.current;
          if (active === null || e.isFlush) {
            return;
          }
          if (active.isChanged) {
            if (e.isUndoing) {
              if (active.model.getValue() == active!.initialContent) {
                active.isChanged = false;
                rerender();
              }
            }
          } else {
            active.isChanged = true;
            rerender();
          }
        });
        return () => disposable.dispose();
      }
    }, [stateRef.current.active?.model, rerender]);
    const {
      current: { active, files },
    } = stateRef;
    const hasActive = active !== null;
    const isActiveChanged = hasActive && active.isChanged;
    const isSomeFileChanged = isActiveChanged || files.some((f) => f.isChanged);
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
                  if (active?.isChanged) {
                    onSaveFiles(saveFile(active, stateRef.current));
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
                    onSaveFiles(saveAllFiles(stateRef.current));
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
                  if (!active?.isChanged) {
                    return;
                  }
                  resetFile(active);
                  rerender();
                }}
              >
                <Undo className="mr-2 h-4 w-4" />
                <span>Reset</span>
              </DropdownMenuItem>
              <DropdownMenuItem
                disabled={!isSomeFileChanged}
                onClick={() => {
                  if (!isSomeFileChanged) {
                    return;
                  }
                  const changed = resetAllFiles(stateRef.current);
                  if (changed > 0) {
                    rerender();
                  }
                }}
              >
                <Undo2 className="mr-2 h-4 w-4" />
                <span>Reset All</span>
              </DropdownMenuItem>
              <DropdownMenuItem
                disabled={!hasActive}
                onClick={() => {
                  if (active) {
                    onRemoveFile(active.id);
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
            {files.map((file) => {
              const isActive = file.id === active?.id;
              return (
                <div
                  key={file.id}
                  className={`cursor-pointer relative shrink-0 flex flex-row gap-2 items-center max-w-[200px] h-full p-2 overflow-hidden ${
                    isActive ? "bg-neutral-800" : "bg-neutral-700"
                  }`}
                  onClick={() => {
                    if (active === file) {
                      return;
                    }
                    stateRef.current.active = file;
                    rerender();
                  }}
                >
                  <p className="text-neutral-200 truncate w-full">
                    {file.name}
                  </p>
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
        <Editor model={active ? active.model : null} />
      </div>
    );
  }
);
