import type { ToolExecutionOptions } from "ai";
import { describe, expect, it } from "vitest";
import { createBashTool } from "./tool.js";

// AI SDK tool execute requires (args, options) - we provide test options
const opts: ToolExecutionOptions = { toolCallId: "test", messages: [] };

/**
 * Integration tests that verify the documented bash commands work correctly
 * with the real just-bash sandbox environment.
 */
describe("createBashTool integration", () => {
  const testFiles = {
    "src/index.ts": 'export const hello = "world";',
    "src/utils/helpers.ts":
      "export function add(a: number, b: number) { return a + b; }",
    "src/utils/format.ts":
      "export function format(s: string) { return s.trim(); }",
    "package.json": '{"name": "test-project", "version": "1.0.0"}',
    "README.md": "# Test Project\n\nThis is a test project.",
  };

  describe("ls command", () => {
    it("ls -la lists files with details", async () => {
      const { tools, sandbox } = await createBashTool({
        files: testFiles,
      });

      const result = await tools.bash.execute({ command: "ls -la" }, opts);

      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain("src");
      expect(result.stdout).toContain("package.json");
      expect(result.stdout).toContain("README.md");

      await sandbox.stop();
    });

    it("ls lists directory contents", async () => {
      const { tools, sandbox } = await createBashTool({
        files: testFiles,
      });

      const result = await tools.bash.execute({ command: "ls src" }, opts);

      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain("index.ts");
      expect(result.stdout).toContain("utils");

      await sandbox.stop();
    });
  });

  describe("find command", () => {
    it("find . -name '*.ts' finds TypeScript files", async () => {
      const { tools, sandbox } = await createBashTool({
        files: testFiles,
      });

      const result = await tools.bash.execute(
        { command: "find . -name '*.ts'" },
        opts,
      );

      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain("index.ts");
      expect(result.stdout).toContain("helpers.ts");
      expect(result.stdout).toContain("format.ts");
      expect(result.stdout).not.toContain("package.json");

      await sandbox.stop();
    });

    it("find . -name '*.json' finds JSON files", async () => {
      const { tools, sandbox } = await createBashTool({
        files: testFiles,
      });

      const result = await tools.bash.execute(
        { command: "find . -name '*.json'" },
        opts,
      );

      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain("package.json");
      expect(result.stdout).not.toContain("index.ts");

      await sandbox.stop();
    });
  });

  describe("grep command", () => {
    it("grep -r 'pattern' . searches file contents", async () => {
      const { tools, sandbox } = await createBashTool({
        files: testFiles,
      });

      const result = await tools.bash.execute(
        { command: "grep -r 'export' ." },
        opts,
      );

      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain("index.ts");
      expect(result.stdout).toContain("helpers.ts");
      expect(result.stdout).toContain("format.ts");

      await sandbox.stop();
    });

    it("grep finds specific patterns", async () => {
      const { tools, sandbox } = await createBashTool({
        files: testFiles,
      });

      const result = await tools.bash.execute(
        { command: "grep -r 'hello' ." },
        opts,
      );

      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain("index.ts");
      expect(result.stdout).toContain("world");

      await sandbox.stop();
    });
  });

  describe("cat command", () => {
    it("cat <file> views file contents", async () => {
      const { tools, sandbox } = await createBashTool({
        files: testFiles,
      });

      const result = await tools.bash.execute(
        { command: "cat src/index.ts" },
        opts,
      );

      expect(result.exitCode).toBe(0);
      expect(result.stdout).toBe('export const hello = "world";');

      await sandbox.stop();
    });

    it("cat package.json shows JSON content", async () => {
      const { tools, sandbox } = await createBashTool({
        files: testFiles,
      });

      const result = await tools.bash.execute(
        { command: "cat package.json" },
        opts,
      );

      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain('"name": "test-project"');
      expect(result.stdout).toContain('"version": "1.0.0"');

      await sandbox.stop();
    });
  });

  describe("working directory", () => {
    it("pwd shows correct working directory", async () => {
      const { tools, sandbox } = await createBashTool({
        files: testFiles,
        destination: "/workspace",
      });

      const result = await tools.bash.execute({ command: "pwd" }, opts);

      expect(result.exitCode).toBe(0);
      expect(result.stdout.trim()).toBe("/workspace");

      await sandbox.stop();
    });

    it("pwd shows custom destination", async () => {
      const { tools, sandbox } = await createBashTool({
        files: testFiles,
        destination: "/home/user/project",
      });

      const result = await tools.bash.execute({ command: "pwd" }, opts);

      expect(result.exitCode).toBe(0);
      expect(result.stdout.trim()).toBe("/home/user/project");

      await sandbox.stop();
    });
  });

  describe("readFile tool", () => {
    it("reads file content correctly", async () => {
      const { tools, sandbox } = await createBashTool({
        files: testFiles,
      });

      const result = await tools.readFile.execute(
        { path: "/workspace/src/index.ts" },
        opts,
      );

      expect(result.content).toBe('export const hello = "world";');

      await sandbox.stop();
    });
  });

  describe("writeFile tool", () => {
    it("writes file and can be read back", async () => {
      const { tools, sandbox } = await createBashTool({
        files: testFiles,
      });

      await tools.writeFile.execute(
        { path: "/workspace/newfile.txt", content: "Hello, World!" },
        opts,
      );

      const result = await tools.bash.execute(
        { command: "cat newfile.txt" },
        opts,
      );

      expect(result.exitCode).toBe(0);
      expect(result.stdout.trim()).toBe("Hello, World!");

      await sandbox.stop();
    });
  });
});
