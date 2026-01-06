import { describe, expect, it, vi } from "vitest";
import { isVercelSandbox, wrapVercelSandbox } from "./vercel.js";

describe("isVercelSandbox", () => {
  it("returns false for null/undefined", () => {
    expect(isVercelSandbox(null)).toBe(false);
    expect(isVercelSandbox(undefined)).toBe(false);
  });

  it("returns false for plain objects", () => {
    expect(isVercelSandbox({})).toBe(false);
    expect(isVercelSandbox({ foo: "bar" })).toBe(false);
  });

  it("returns false for objects without kill function", () => {
    expect(isVercelSandbox({ shells: {} })).toBe(false);
  });

  it("returns true for objects with shells and kill function", () => {
    const mockVercelSandbox = {
      shells: {},
      kill: async () => {},
    };
    expect(isVercelSandbox(mockVercelSandbox)).toBe(true);
  });
});

describe("wrapVercelSandbox", () => {
  it("wraps executeCommand", async () => {
    const mockSpawn = vi.fn().mockResolvedValue({
      stdout: "output",
      stderr: "",
      exitCode: 0,
    });

    const mockVercelSandbox = {
      shells: { spawn: mockSpawn },
      files: {
        read: vi.fn(),
        write: vi.fn(),
      },
      kill: vi.fn(),
    };

    const sandbox = wrapVercelSandbox(mockVercelSandbox);
    const result = await sandbox.executeCommand("ls -la");

    expect(mockSpawn).toHaveBeenCalledWith("bash", ["-c", "ls -la"]);
    expect(result).toEqual({ stdout: "output", stderr: "", exitCode: 0 });
  });

  it("wraps readFile", async () => {
    const mockRead = vi.fn().mockResolvedValue("file content");

    const mockVercelSandbox = {
      shells: { spawn: vi.fn() },
      files: {
        read: mockRead,
        write: vi.fn(),
      },
      kill: vi.fn(),
    };

    const sandbox = wrapVercelSandbox(mockVercelSandbox);
    const content = await sandbox.readFile("/test.txt");

    expect(mockRead).toHaveBeenCalledWith("/test.txt");
    expect(content).toBe("file content");
  });

  it("throws on readFile when file not found", async () => {
    const mockRead = vi.fn().mockResolvedValue(null);

    const mockVercelSandbox = {
      shells: { spawn: vi.fn() },
      files: {
        read: mockRead,
        write: vi.fn(),
      },
      kill: vi.fn(),
    };

    const sandbox = wrapVercelSandbox(mockVercelSandbox);
    await expect(sandbox.readFile("/missing.txt")).rejects.toThrow(
      "File not found",
    );
  });

  it("wraps writeFile", async () => {
    const mockWrite = vi.fn().mockResolvedValue(undefined);

    const mockVercelSandbox = {
      shells: { spawn: vi.fn() },
      files: {
        read: vi.fn(),
        write: mockWrite,
      },
      kill: vi.fn(),
    };

    const sandbox = wrapVercelSandbox(mockVercelSandbox);
    await sandbox.writeFile("/test.txt", "content");

    expect(mockWrite).toHaveBeenCalledWith("/test.txt", "content");
  });

  it("wraps stop", async () => {
    const mockKill = vi.fn().mockResolvedValue(undefined);

    const mockVercelSandbox = {
      shells: { spawn: vi.fn() },
      files: {
        read: vi.fn(),
        write: vi.fn(),
      },
      kill: mockKill,
    };

    const sandbox = wrapVercelSandbox(mockVercelSandbox);
    await sandbox.stop();

    expect(mockKill).toHaveBeenCalled();
  });
});
