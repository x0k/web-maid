import {
  forwardRef,
  DragEvent,
  useCallback,
  MutableRefObject,
  useRef,
  Fragment,
} from "react";
import { Pen, Dot } from "lucide-react";

import {
  EditorFile,
  FilesEditorState,
  InternalEditorFile,
  getNearestIndicator,
  getNearestIndicatorElement,
  moveFileBefore,
  saveAllFiles,
  setActiveFile,
} from "./core";

import classes from "./styles.module.css";

interface DropIndicatorProps {}

const DropIndicator = forwardRef<HTMLDivElement, DropIndicatorProps>(function (
  _: DropIndicatorProps,
  ref
) {
  return <div ref={ref} className="w-0.5 h-full bg-violet-400 opacity-0" />;
});

interface FileTabProps {
  file: InternalEditorFile;
  isActive: boolean;
  onClick?: () => void;
  onDragStart?: (e: DragEvent<HTMLDivElement>) => void;
}

function FileTab({ file, isActive, onClick, onDragStart }: FileTabProps) {
  return (
    <div
      key={file.id}
      draggable="true"
      className={`cursor-pointer active:cursor-grabbing relative shrink-0 flex flex-row gap-2 items-center max-w-[200px] h-full p-2 overflow-hidden ${
        isActive ? "bg-neutral-800" : "bg-neutral-700"
      }`}
      onClick={onClick}
      onDragStart={onDragStart}
    >
      <p className="text-neutral-200 truncate w-full">{file.name}</p>
      {file.isChanged ? (
        <Pen className="text-neutral-500" />
      ) : isActive ? (
        <Dot className="text-neutral-500" />
      ) : null}
    </div>
  );
}

export interface TabsProps {
  stateRef: MutableRefObject<FilesEditorState>;
  onSaveFiles: (files: EditorFile[]) => void;
  rerender: () => void
}

export function Tabs({ stateRef, onSaveFiles, rerender }: TabsProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const lastHighlightedElementRef = useRef<HTMLDivElement | null>(null);
  const handleDragOver = useCallback((e: DragEvent<unknown>) => {
    e.preventDefault();
    const indicator = getNearestIndicatorElement(stateRef.current, e);
    const last = lastHighlightedElementRef.current;
    if (last !== indicator) {
      if (indicator) {
        indicator.style.opacity = "1";
      }
      if (last) {
        last.style.opacity = "0";
      }
      lastHighlightedElementRef.current = indicator;
    }
  }, [stateRef]);
  const clearHighlight = useCallback(() => {
    const indicator = lastHighlightedElementRef.current;
    if (indicator) {
      indicator.style.opacity = "0";
      lastHighlightedElementRef.current = null;
    }
  }, []);
  const handleDragLeave = useCallback(
    (e: DragEvent<unknown>) => {
      if (e.target !== rootRef.current) {
        return;
      }
      clearHighlight();
    },
    [clearHighlight]
  );
  const handleDrop = useCallback(
    (e: DragEvent<unknown>) => {
      e.preventDefault();
      clearHighlight();
      const fileIndex = e.dataTransfer.getData("fileIndex");
      if (fileIndex === "") {
        return;
      }
      const indicatorData = getNearestIndicator(stateRef.current, e);
      if (!indicatorData) {
        return;
      }
      if (
        moveFileBefore(stateRef.current, Number(fileIndex), indicatorData.index)
      ) {
        onSaveFiles(saveAllFiles(stateRef.current));
      }
    },
    [stateRef, onSaveFiles, clearHighlight]
  );
  const { files, activeFileIndex, freeIndicatorRef } = stateRef.current;
  return (
    <div
      ref={rootRef}
      className={`relative grow flex flex-row flex-nowrap overflow-auto h-10 ${classes.tabs}`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {files.map((file, i) => {
        const isActive = i === activeFileIndex;
        return (
          <Fragment key={file.id}>
            <DropIndicator ref={file.indicatorRef} />
            <FileTab
              file={file}
              isActive={isActive}
              onDragStart={(e) => {
                e.dataTransfer.setData("fileIndex", i.toString());
              }}
              onClick={() => {
                setTimeout(() => stateRef.current.editor?.focus(), 100);
                if (isActive) {
                  return;
                }
                setActiveFile(stateRef.current, i);
                rerender();
              }}
            />
          </Fragment>
        );
      })}
      <DropIndicator ref={freeIndicatorRef} />
    </div>
  );
}
