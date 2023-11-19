import { file, write } from "bun";

import { details } from "../src/options/docs";

try {
  const operatorsFile = file(import.meta.resolveSync("../public/operators.md"));
  const preface = await operatorsFile.text();
  await write(
    import.meta.resolveSync("../dist/operators.md"),
    `${preface}\n${details}`
  );
  console.log("wrote operators.md");
} catch (e) {
  console.error(e);
}
