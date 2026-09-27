import { readdirSync } from "node:fs";
import { spawnSync } from "node:child_process";
// Tooling tests live beside the scripts they cover; product tests are discovered by product-tests.mjs.
const scripts = readdirSync("scripts").filter(n => n.endsWith(".test.mjs")).sort().map(n => `scripts/${n}`);
if (!scripts.length) { console.log("No platform tests."); process.exit(0); }
const result = spawnSync(process.execPath, ["--experimental-strip-types", "--test", ...scripts], { stdio: "inherit" });
process.exit(result.status ?? 1);
