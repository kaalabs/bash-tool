import type {
  CommandResult,
  Sandbox,
  VercelSandboxInstance,
} from "../types.js";

/**
 * Check if an object is a @vercel/sandbox instance using duck-typing.
 */
export function isVercelSandbox(obj: unknown): obj is VercelSandboxInstance {
  if (!obj || typeof obj !== "object") return false;
  const candidate = obj as Record<string, unknown>;
  // @vercel/sandbox has characteristic properties like shells, kill, etc.
  return typeof candidate.kill === "function" && "shells" in candidate;
}

/**
 * Wraps a @vercel/sandbox instance to conform to our Sandbox interface.
 */
export function wrapVercelSandbox(
  vercelSandbox: VercelSandboxInstance,
): Sandbox {
  return {
    async executeCommand(command: string): Promise<CommandResult> {
      // @vercel/sandbox uses shells.spawn or similar
      const shells = vercelSandbox.shells as {
        spawn: (
          cmd: string,
          args?: string[],
        ) => Promise<{
          stdout: string;
          stderr: string;
          exitCode: number;
        }>;
      };

      const result = await shells.spawn("bash", ["-c", command]);
      return {
        stdout: result.stdout,
        stderr: result.stderr,
        exitCode: result.exitCode,
      };
    },

    async readFile(filePath: string): Promise<string> {
      const files = vercelSandbox.files as {
        read: (path: string) => Promise<string | null>;
      };

      const content = await files.read(filePath);
      if (content === null) {
        throw new Error(`File not found: ${filePath}`);
      }
      return content;
    },

    async writeFile(filePath: string, content: string): Promise<void> {
      const files = vercelSandbox.files as {
        write: (path: string, content: string) => Promise<void>;
      };

      await files.write(filePath, content);
    },

    async stop(): Promise<void> {
      if (typeof vercelSandbox.kill === "function") {
        await vercelSandbox.kill();
      }
    },
  };
}
