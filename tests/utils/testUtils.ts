import fs from "fs";
import os from "os";
import path from "path";

type WithTempDirFn = <T>(fn: (tmpDir: string) => T) => T;

export const withTempDir: WithTempDirFn = <T>(fn: (tmpDir: string) => T): T => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "test-tmp-"));
  try {
    return fn(tmpDir);
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
};

export const makeFile = (
  filePath: string,
  content = "export const x = 1;\n",
) => {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, content);
};
