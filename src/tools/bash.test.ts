import { describe, expect, it, vi } from "vitest";
import { createBashExecuteTool } from "./bash.js";

// Mock AI SDK
vi.mock("ai", () => ({
  tool: vi.fn((config) => ({
    description: config.description,
    parameters: config.parameters,
    execute: config.execute,
  })),
}));

const mockSandbox = {
  executeCommand: vi.fn(),
  readFile: vi.fn(),
  writeFile: vi.fn(),
  stop: vi.fn(),
};

describe("createBashExecuteTool", () => {
  it("generates description with cwd only", () => {
    const tool = createBashExecuteTool({
      sandbox: mockSandbox,
      cwd: "/workspace",
    });

    expect(
      tool.description,
    ).toBe(`Execute bash commands in the sandbox environment.

WORKING DIRECTORY: /workspace
All commands execute from this directory. Use relative paths from here.

Common operations:
  ls -la              # List files with details
  find . -name '*.ts' # Find files by pattern
  grep -r 'pattern' . # Search file contents
  cat <file>          # View file contents`);
  });

  it("generates description with files list", () => {
    const tool = createBashExecuteTool({
      sandbox: mockSandbox,
      cwd: "/workspace",
      files: ["src/index.ts", "src/utils.ts", "package.json"],
    });

    expect(
      tool.description,
    ).toBe(`Execute bash commands in the sandbox environment.

WORKING DIRECTORY: /workspace
All commands execute from this directory. Use relative paths from here.

Available files:
  src/index.ts
  src/utils.ts
  package.json

Common operations:
  ls -la              # List files with details
  find . -name '*.ts' # Find files by pattern
  grep -r 'pattern' . # Search file contents
  cat <file>          # View file contents`);
  });

  it("generates description with truncated files list when more than 8", () => {
    const tool = createBashExecuteTool({
      sandbox: mockSandbox,
      cwd: "/app",
      files: [
        "src/index.ts",
        "src/utils.ts",
        "src/types.ts",
        "src/config.ts",
        "src/api.ts",
        "src/db.ts",
        "src/auth.ts",
        "src/routes.ts",
        "src/middleware.ts",
        "src/helpers.ts",
        "package.json",
      ],
    });

    expect(
      tool.description,
    ).toBe(`Execute bash commands in the sandbox environment.

WORKING DIRECTORY: /app
All commands execute from this directory. Use relative paths from here.

Available files:
  src/index.ts
  src/utils.ts
  src/types.ts
  src/config.ts
  src/api.ts
  src/db.ts
  src/auth.ts
  src/routes.ts
  ... and 3 more files

Common operations:
  ls -la              # List files with details
  find . -name '*.ts' # Find files by pattern
  grep -r 'pattern' . # Search file contents
  cat <file>          # View file contents`);
  });

  it("generates description with extra instructions", () => {
    const tool = createBashExecuteTool({
      sandbox: mockSandbox,
      cwd: "/workspace",
      extraInstructions: "Focus on TypeScript files only.",
    });

    expect(
      tool.description,
    ).toBe(`Execute bash commands in the sandbox environment.

WORKING DIRECTORY: /workspace
All commands execute from this directory. Use relative paths from here.

Common operations:
  ls -la              # List files with details
  find . -name '*.ts' # Find files by pattern
  grep -r 'pattern' . # Search file contents
  cat <file>          # View file contents

Focus on TypeScript files only.`);
  });

  it("generates description with files and extra instructions", () => {
    const tool = createBashExecuteTool({
      sandbox: mockSandbox,
      cwd: "/home/user/project",
      files: ["main.py", "requirements.txt"],
      extraInstructions: "This is a Python project.",
    });

    expect(
      tool.description,
    ).toBe(`Execute bash commands in the sandbox environment.

WORKING DIRECTORY: /home/user/project
All commands execute from this directory. Use relative paths from here.

Available files:
  main.py
  requirements.txt

Common operations:
  ls -la              # List files with details
  find . -name '*.ts' # Find files by pattern
  grep -r 'pattern' . # Search file contents
  cat <file>          # View file contents

This is a Python project.`);
  });

  it("generates description with empty files array", () => {
    const tool = createBashExecuteTool({
      sandbox: mockSandbox,
      cwd: "/workspace",
      files: [],
    });

    expect(
      tool.description,
    ).toBe(`Execute bash commands in the sandbox environment.

WORKING DIRECTORY: /workspace
All commands execute from this directory. Use relative paths from here.

Common operations:
  ls -la              # List files with details
  find . -name '*.ts' # Find files by pattern
  grep -r 'pattern' . # Search file contents
  cat <file>          # View file contents`);
  });
});
