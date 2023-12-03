import { file, write } from "bun";
import path from "node:path";

import { data, renderOperator } from "../src/shared/config/docs";

try {
  await write(
    path.join(import.meta.dir, "../dist/operators.json"),
    JSON.stringify(data)
  );
  console.log("dist/operators.json ok");
  const operatorsFile = file(
    import.meta.resolveSync("../src/shared/config/docs-preface.md")
  );
  const preface = await operatorsFile.text();
  const details = data.map(renderOperator).join("\n\n");
  await write(
    path.join(import.meta.dir, "../docs/operators.md"),
    `${preface}\n${details}`
  );
  console.log("docs/operators.md ok");
} catch (e) {
  console.error(e);
}
