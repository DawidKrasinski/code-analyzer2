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
});
