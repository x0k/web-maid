import { loader } from '@monaco-editor/react';

import * as monaco from 'monaco-editor';
import EditorWorker from 'monaco-editor/esm/vs/editor/editor.worker?worker';
import YamlWorker from 'monaco-yaml/yaml.worker?worker'

self.MonacoEnvironment = {
  getWorker(_, label) {
    console.log('GET WORKER', label)
    switch (label) {
      case "yaml":
        return new YamlWorker();
      case "editorWorkerService":
        return new EditorWorker();
      default:
        throw new Error(`Unknown label ${label}`);
    }
  },
};

loader.config({ monaco });

export const editorLoader = loader.init()
