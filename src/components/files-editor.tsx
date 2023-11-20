import {
  Dispatch,
  MutableRefObject,
  SetStateAction,
  useEffect,
  useRef,
  useState,
} from "react";
import { X, Plus, Pen, Undo, Save } from "lucide-react";

import { monaco } from "@/lib/monaco";
import { Editor } from "@/components/editor";

import classes from "./file-editor.module.css";

export interface EditorFile {
  id: string;
  name: string;
  content: string;
}

export interface FilesEditorProps {
  files: EditorFile[];
  onCreateFile: () => void;
  onRemoveFile: (fileId: string) => void;
}

interface InternalEditorFile {
  id: string;
  name: string;
  initialContent: string;
  isChanged: boolean;
  model: monaco.editor.ITextModel;
}

interface FilesEditorState {
  files: Map<string, InternalEditorFile>;
  active: InternalEditorFile | null;
}

interface StateButtonProps {
  stateRef: MutableRefObject<FilesEditorState>;
  file: InternalEditorFile;
  setActiveFile: Dispatch<SetStateAction<InternalEditorFile | null>>;
  setInternalFiles: Dispatch<SetStateAction<InternalEditorFile[]>>;
  onRemoveFile: (fileId: string) => void;
}

function StatusButton({
  file,
  stateRef,
  setActiveFile,
  setInternalFiles,
  onRemoveFile,
}: StateButtonProps) {
  const [isHovered, setIsHovered] = useState(false);
  const handleMouseEnter = () => {
    setIsHovered(true);
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
  };
  return (
    <button
      className="h-6 shrink-0 text-neutral-500 hover:bg-white/10 p-[3px] hover:text-neutral-300 rounded-md aspect-square"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onClick={(e) => {
        e.stopPropagation();
        const internalFile = stateRef.current.files.get(file.id);
        if (internalFile === undefined) {
          return;
        }
        if (internalFile.isChanged) {
          internalFile.isChanged = false;
          internalFile.model.setValue(internalFile.initialContent);
          if (stateRef.current.active === internalFile) {
            setActiveFile({ ...internalFile });
          } else {
            setInternalFiles((files) => files.slice());
          }
        } else {
          onRemoveFile(file.id);
        }
      }}
    >
      {file.isChanged ? (
        isHovered ? (
          <Undo size={18} />
        ) : (
          <Pen size={18} />
        )
      ) : (
        <X size={18} />
      )}
    </button>
  );
}

export function FilesEditor({
  files,
  onCreateFile,
  onRemoveFile,
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
  return (
    <div className="flex flex-col grow">
      <div className="flex flex-row items-center bg-neutral-950">
        <div
          className={`relative grow flex flex-row gap-[2px] flex-nowrap overflow-auto h-10 ${classes.tabs}`}
        >
          {internalFiles.map((file) => {
            const isActive = file.id === activeFile?.id;
            return (
              <div
                key={file.id}
                className={`relative shrink-0 flex flex-row gap-1 items-center max-w-[200px] h-full p-2 overflow-hidden ${
                  isActive ? "bg-neutral-800" : "bg-neutral-700"
                }`}
                onClick={() => {
                  stateRef.current.active = file;
                  setActiveFile(file);
                }}
              >
                <p className="text-neutral-200 truncate w-full">{file.name}</p>
                <StatusButton
                  file={file}
                  stateRef={stateRef}
                  setActiveFile={setActiveFile}
                  setInternalFiles={setInternalFiles}
                  onRemoveFile={onRemoveFile}
                />
              </div>
            );
          })}
        </div>
        <button
          key="add-button"
          className="shrink-0 aspect-square p-2 text-neutral-300 "
          onClick={onCreateFile}
        >
          <Plus className="p-[3px] hover:bg-white/10 rounded-md" />
        </button>
      </div>
      <Editor model={activeFile ? activeFile.model : null} />
    </div>
  );
}
