import * as monaco from "monaco-editor";
import EditorWorker from "monaco-editor/esm/vs/editor/editor.worker?worker";
import { configureMonacoYaml } from "monaco-yaml";
import YamlWorker from "@/lib/yaml.worker?worker";

self.MonacoEnvironment = {
  getWorker(_, label) {
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

configureMonacoYaml(monaco, {});

export { monaco };
