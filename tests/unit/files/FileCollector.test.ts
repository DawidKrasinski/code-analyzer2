import path from "path";
import { withTempDir, makeFile } from "../../utils/testUtils";
import { FileCollector } from "../../../lib/files/FileCollector";

describe("FileCollector", () => {
  it("collects ts/js/jsx/tsx files recursively and excludes node_modules", () => {
    withTempDir((tmpDir: string) => {
      const nested = path.join(tmpDir, "nested");
      const files = [
        path.join(tmpDir, "a.ts"),
        path.join(tmpDir, "b.js"),
        path.join(nested, "c.jsx"),
        path.join(nested, "d.tsx"),
      ];
      files.forEach((f) => makeFile(f));
      makeFile(path.join(tmpDir, "node_modules", "skip.js"));

      const collector = new FileCollector(tmpDir);
      const collected = collector.getPaths();

      expect(collected).toEqual(expect.arrayContaining(files));
      expect(collected).not.toContain(
        path.join(tmpDir, "node_modules", "skip.js"),
      );
    });
  });

  it("throws when path does not exist", () => {
    const missingPath = path.join(
      process.cwd(),
      `collector-test-missing-${Date.now()}`,
    );

    expect(() => new FileCollector(missingPath).getPaths()).toThrow();
  });

  it("does not include files with unsupported extensions", () => {
    withTempDir((tmpDir: string) => {
      const validFile = path.join(tmpDir, "valid.ts");
      const invalidFile = path.join(tmpDir, "invalid.txt");

      makeFile(validFile);
      makeFile(invalidFile, "hello world\n");

      const collected = new FileCollector(tmpDir).getPaths();

      expect(collected).toContain(validFile);
      expect(collected).not.toContain(invalidFile);
    });
  });

  it("does not include files inside .git, dist and .next", () => {
    withTempDir((tmpDir: string) => {
      const included = path.join(tmpDir, "src", "ok.ts");
      const gitFile = path.join(tmpDir, ".git", "hooks", "x.ts");
      const distFile = path.join(tmpDir, "dist", "compiled.js");
      const nextFile = path.join(tmpDir, ".next", "server", "page.js");

      makeFile(included);
      makeFile(gitFile);
      makeFile(distFile);
      makeFile(nextFile);

      const collected = new FileCollector(tmpDir).getPaths();

      expect(collected).toContain(included);
      expect(collected).not.toContain(gitFile);
      expect(collected).not.toContain(distFile);
      expect(collected).not.toContain(nextFile);
    });
  });
});
