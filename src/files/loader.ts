import fs from "node:fs/promises";
import path from "node:path";
import fg from "fast-glob";

export interface LoadFilesOptions {
  files?: Record<string, string>;
  uploadDirectory?: {
    source: string;
    include?: string;
  };
}

/**
 * Load files from inline definitions and/or a directory on disk.
 * Returns a record of relative paths to file contents.
 * If both are provided, inline files take precedence (override directory files).
 */
export async function loadFiles(
  options: LoadFilesOptions,
): Promise<Record<string, string>> {
  const result: Record<string, string> = {};

  // Load from directory first (so inline can override)
  if (options.uploadDirectory) {
    const { source, include = "**/*" } = options.uploadDirectory;
    const absoluteSource = path.resolve(source);

    const files = await fg(include, {
      cwd: absoluteSource,
      dot: true,
      onlyFiles: true,
      ignore: ["**/node_modules/**", "**/.git/**"],
    });

    await Promise.all(
      files.map(async (relativePath) => {
        const absolutePath = path.join(absoluteSource, relativePath);
        const content = await fs.readFile(absolutePath, "utf-8");
        result[relativePath] = content;
      }),
    );
  }

  // Merge inline files (override directory files)
  if (options.files) {
    for (const [relativePath, content] of Object.entries(options.files)) {
      result[relativePath] = content;
    }
  }

  return result;
}
