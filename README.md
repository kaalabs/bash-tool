# bash-tool

Generic bash tool for AI agents, compatible with [AI SDK](https://ai-sdk.dev/).

## Installation

```bash
npm install bash-tool just-bash
```

For full VM support, install `@vercel/sandbox` or another sandbox product instead of `just-bash`.

## Usage

```typescript
import { createBashTool } from "bash-tool";
import { generateText } from "ai";

const { tools, sandbox } = await createBashTool({
  files: {
    "src/index.ts": "export const hello = 'world';",
    "package.json": '{"name": "my-project"}',
  },
});

const result = await generateText({
  model: yourModel,
  tools,
  prompt: "List all TypeScript files",
});

await sandbox.stop();
```

## Options

```typescript
interface CreateBashToolOptions {
  // Directory on sandbox for files and working directory (default: "/workspace")
  destination?: string;

  // Inline files to write
  files?: Record<string, string>;

  // Upload directory from disk
  uploadDirectory?: {
    source: string;
    include?: string; // glob pattern, default "**/*"
  };

  // Custom sandbox (Sandbox interface or @vercel/sandbox instance)
  sandbox?: Sandbox | VercelSandboxInstance;

  // Additional instructions for LLM
  extraInstructions?: string;

  // Callback before each tool execution
  onCall?: (toolName: string, args: unknown) => void;
}
```

## Custom Sandbox

Implement the `Sandbox` interface to use your own execution environment:

```typescript
import { createBashTool, Sandbox } from "bash-tool";

const customSandbox: Sandbox = {
  async executeCommand(command) {
    // Return { stdout, stderr, exitCode }
  },
  async readFile(path) {
    // Return file contents
  },
  async writeFile(path, content) {
    // Write file
  },
  async stop() {
    // Cleanup
  },
};

const { tools } = await createBashTool({ sandbox: customSandbox });
```

## License

MIT
