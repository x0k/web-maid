import {
  forwardRef,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
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
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import classes from "./styles.module.css";
import {
  EditorFile,
  FilesEditorState,
  InternalEditorFile,
  activeFileChanged,
  resetAllFiles,
  resetActiveFile,
  saveAllFiles,
  saveActiveFile,
  someFileChanged,
  updateEditorState,
  activeFileRemovable,
  setActiveFile,
  activeFile,
  activeFileWithoutBoundaryCheck,
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
      editor: null,
      filesMap: new Map<string, InternalEditorFile>(),
      files: [],
      activeFileIndex: -1,
    });
    const setEditorRef = useCallback((ref: monaco.editor.IStandaloneCodeEditor | null) => {
      stateRef.current.editor = ref;
    }, [])
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
    const activeFileModel = activeFile(stateRef.current)?.model;
    useEffect(() => {
      if (!activeFileModel) {
        return;
      }
      const disposable = activeFileModel.onDidChangeContent((e) => {
        const active = activeFile(stateRef.current);
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
      // the model change itself does not trigger the effect
      // but the condition will be checked on other component updates
    }, [activeFileModel, rerender]);

    const { save, saveAll, reset, resetAll, remove } = useMemo(
      () => ({
        save() {
          {
            if (activeFileChanged(stateRef.current)) {
              onSaveFiles(saveActiveFile(stateRef.current));
            }
          }
        },
        saveAll() {
          if (someFileChanged(stateRef.current)) {
            onSaveFiles(saveAllFiles(stateRef.current));
          }
        },
        reset() {
          if (!activeFileChanged(stateRef.current)) {
            return;
          }
          if (resetActiveFile(stateRef.current)) {
            rerender();
          }
        },
        resetAll() {
          if (!someFileChanged(stateRef.current)) {
            return;
          }
          if (resetAllFiles(stateRef.current) > 0) {
            rerender();
          }
        },
        remove() {
          if (activeFileRemovable(stateRef.current)) {
            onRemoveFile(activeFileWithoutBoundaryCheck(stateRef.current).id);
          }
        },
      }),
      [rerender, onRemoveFile, onSaveFiles]
    );
    const actions: monaco.editor.IActionDescriptor[] = useMemo(
      () => [
        {
          id: "files-editor-create-file",
          label: "Create file",
          keybindings: [monaco.KeyMod.Alt | monaco.KeyCode.KeyN],
          run: onCreateFile,
        },
        {
          id: "files-editor-save-file",
          label: "Save file",
          keybindings: [monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS],
          run: save,
        },
        {
          id: "files-editor-save-all-files",
          label: "Save all files",
          keybindings: [
            monaco.KeyMod.CtrlCmd | monaco.KeyMod.Shift | monaco.KeyCode.KeyS,
          ],
          run: saveAll,
        },
        {
          id: "files-editor-reset-file",
          label: "Reset file",
          keybindings: [monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyR],
          run: reset,
        },
        {
          id: "files-editor-reset-all-files",
          label: "Reset all files",
          keybindings: [
            monaco.KeyMod.CtrlCmd | monaco.KeyMod.Shift | monaco.KeyCode.KeyR,
          ],
          run: resetAll,
        },
        {
          id: "files-editor-remove-file",
          label: "Remove file",
          keybindings: [monaco.KeyMod.Alt | monaco.KeyCode.KeyD],
          run: remove,
        },
      ],
      [onCreateFile, save, saveAll, reset, resetAll, remove]
    );
    const {
      current: { activeFileIndex, files },
    } = stateRef;
    const hasActive = activeFileIndex > -1;
    const isActiveRemovable = hasActive && files[activeFileIndex].isRemovable;
    const isActiveChanged = activeFileChanged(stateRef.current);
    const isSomeFileChanged = someFileChanged(stateRef.current);
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
                <DropdownMenuShortcut>Alt+N</DropdownMenuShortcut>
              </DropdownMenuItem>
              <DropdownMenuItem disabled={!isActiveChanged} onClick={save}>
                <Save className="mr-2 h-4 w-4" />
                <span>Save</span>
                <DropdownMenuShortcut>⌘S</DropdownMenuShortcut>
              </DropdownMenuItem>
              <DropdownMenuItem disabled={!isSomeFileChanged} onClick={saveAll}>
                <SaveAll className="mr-2 h-4 w-4" />
                <span>Save All</span>
                <DropdownMenuShortcut>⇧⌘S</DropdownMenuShortcut>
              </DropdownMenuItem>
              <DropdownMenuItem disabled={!isActiveChanged} onClick={reset}>
                <Undo className="mr-2 h-4 w-4" />
                <span>Reset</span>
                <DropdownMenuShortcut>⌘R</DropdownMenuShortcut>
              </DropdownMenuItem>
              <DropdownMenuItem
                disabled={!isSomeFileChanged}
                onClick={resetAll}
              >
                <Undo2 className="mr-2 h-4 w-4" />
                <span>Reset All</span>
                <DropdownMenuShortcut>⇧⌘R</DropdownMenuShortcut>
              </DropdownMenuItem>
              <DropdownMenuItem disabled={!isActiveRemovable} onClick={remove}>
                <Trash className="mr-2 h-4 w-4" />
                <span>Delete</span>
                <DropdownMenuShortcut>Alt+D</DropdownMenuShortcut>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <div
            className={`relative grow flex flex-row gap-[2px] flex-nowrap overflow-auto h-10 ${classes.tabs}`}
          >
            {files.map((file, i) => {
              const isActive = i === activeFileIndex;
              return (
                <div
                  key={file.id}
                  className={`cursor-pointer relative shrink-0 flex flex-row gap-2 items-center max-w-[200px] h-full p-2 overflow-hidden ${
                    isActive ? "bg-neutral-800" : "bg-neutral-700"
                  }`}
                  onClick={() => {
                    setTimeout(() => stateRef.current.editor?.focus(), 100);
                    if (isActive) {
                      return;
                    }
                    setActiveFile(stateRef.current, i);
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
        <Editor
          ref={setEditorRef}
          actions={actions}
          model={activeFile(stateRef.current)?.model ?? null}
        />
      </div>
    );
  }
);
