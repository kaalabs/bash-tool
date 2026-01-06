import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { loadFiles } from "./loader.js";

describe("loadFiles", () => {
  let tempDir: string;

  beforeEach(async () => {
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "bash-tool-test-"));
  });

  afterEach(async () => {
    await fs.rm(tempDir, { recursive: true, force: true });
  });

  it("returns empty object with no options", async () => {
    const result = await loadFiles({});
    expect(result).toEqual({});
  });

  it("returns inline files as-is", async () => {
    const result = await loadFiles({
      files: {
        "src/index.ts": "export const x = 1;",
        "package.json": "{}",
      },
    });

    expect(result).toEqual({
      "src/index.ts": "export const x = 1;",
      "package.json": "{}",
    });
  });

  it("loads directory contents", async () => {
    // Create test files
    await fs.mkdir(path.join(tempDir, "src"), { recursive: true });
    await fs.writeFile(
      path.join(tempDir, "src/index.ts"),
      "export const x = 1;",
    );
    await fs.writeFile(path.join(tempDir, "package.json"), '{"name": "test"}');

    const result = await loadFiles({
      uploadDirectory: { source: tempDir },
    });

    expect(result["src/index.ts"]).toBe("export const x = 1;");
    expect(result["package.json"]).toBe('{"name": "test"}');
  });

  it("filters with include glob", async () => {
    // Create test files
    await fs.mkdir(path.join(tempDir, "src"), { recursive: true });
    await fs.writeFile(path.join(tempDir, "src/index.ts"), "typescript");
    await fs.writeFile(path.join(tempDir, "src/style.css"), "css");
    await fs.writeFile(path.join(tempDir, "readme.md"), "markdown");

    const result = await loadFiles({
      uploadDirectory: {
        source: tempDir,
        include: "**/*.ts",
      },
    });

    expect(Object.keys(result)).toEqual(["src/index.ts"]);
    expect(result["src/index.ts"]).toBe("typescript");
  });

  it("merges directory and inline files (inline wins)", async () => {
    // Create test file
    await fs.writeFile(path.join(tempDir, "config.json"), '{"original": true}');
    await fs.writeFile(path.join(tempDir, "data.txt"), "from disk");

    const result = await loadFiles({
      uploadDirectory: { source: tempDir },
      files: {
        "config.json": '{"overridden": true}',
        "new-file.txt": "only inline",
      },
    });

    expect(result["config.json"]).toBe('{"overridden": true}');
    expect(result["data.txt"]).toBe("from disk");
    expect(result["new-file.txt"]).toBe("only inline");
  });

  it("ignores node_modules and .git by default", async () => {
    // Create test files
    await fs.mkdir(path.join(tempDir, "node_modules/pkg"), { recursive: true });
    await fs.mkdir(path.join(tempDir, ".git/objects"), { recursive: true });
    await fs.writeFile(path.join(tempDir, "index.ts"), "source");
    await fs.writeFile(
      path.join(tempDir, "node_modules/pkg/index.js"),
      "module",
    );
    await fs.writeFile(path.join(tempDir, ".git/objects/abc"), "git object");

    const result = await loadFiles({
      uploadDirectory: { source: tempDir },
    });

    expect(Object.keys(result)).toEqual(["index.ts"]);
  });
});
