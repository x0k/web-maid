import { file, write } from "bun";
import path from "node:path";

import { details } from "../src/shared/config/docs";

try {
  const operatorsFile = file(import.meta.resolveSync("../public/operators.md"));
  const preface = await operatorsFile.text();
  await write(
    path.join(import.meta.dir, "../dist/operators.md"),
    `${preface}\n${details}`
  );
  await write(
    path.join(import.meta.dir, "../docs/operators.md"),
    `${preface}\n${details}`
  );
  console.log("wrote operators.md");
} catch (e) {
  console.error(e);
}
