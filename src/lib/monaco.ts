import * as monaco from "monaco-editor";
import EditorWorker from "monaco-editor/esm/vs/editor/editor.worker?worker";
import HtmlWorker from "monaco-editor/esm/vs/language/html/html.worker?worker";
import { configureMonacoYaml } from "monaco-yaml";
import YamlWorker from "@/lib/yaml.worker?worker";

self.MonacoEnvironment = {
  getWorker(_, label) {
    switch (label) {
      case "yaml":
        return new YamlWorker();
      case "html":
      case "handlebars":
      case "razor":
        return new HtmlWorker();
      case "editorWorkerService":
        return new EditorWorker();
      default:
        throw new Error(`Unknown label ${label}`);
    }
  },
};

configureMonacoYaml(monaco, {});

export { monaco };
