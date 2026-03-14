import os from "os";
import path from "path";
import { Analyzer } from "../../lib/Analyzer";
import { makeFile, withTempDir } from "../utils/testUtils";

describe("Analyzer", () => {
  it("should collect file paths recursively for js/ts/jsx/tsx", () => {
    withTempDir((tmpDir) => {
      const nested = path.join(tmpDir, "nested");
      const files = [
        path.join(tmpDir, "a.ts"),
        path.join(tmpDir, "b.js"),
        path.join(nested, "c.jsx"),
        path.join(nested, "d.tsx"),
      ];

      files.forEach((file) => makeFile(file));

      const paths = new Analyzer(tmpDir).getPaths();

      expect(paths).toEqual(expect.arrayContaining(files));
      expect(paths).toHaveLength(files.length);
    });
  });

  it("should throw when analyzer path does not exist", () => {
    const missingPath = path.join(
      os.tmpdir(),
      `analyzer-test-missing-${Date.now()}`,
    );
    expect(() => new Analyzer(missingPath).getPaths()).toThrow();
  });

  it("should not include files inside node_modules", () => {
    withTempDir((tmpDir) => {
      const validFile = path.join(tmpDir, "valid.js");
      const nodeModulesFile = path.join(tmpDir, "node_modules", "skip.js");
      makeFile(validFile);
      makeFile(nodeModulesFile);

      const paths = new Analyzer(tmpDir).getPaths();

      expect(paths).toContain(validFile);
      expect(paths).not.toContain(nodeModulesFile);
    });
  });

  it("should not include files with unsupported extensions", () => {
    withTempDir((tmpDir) => {
      const validFile = path.join(tmpDir, "valid.ts");
      const invalidFile = path.join(tmpDir, "invalid.txt");
      makeFile(validFile);
      makeFile(invalidFile, "hello world\n");

      const paths = new Analyzer(tmpDir).getPaths();

      expect(paths).toContain(validFile);
      expect(paths).not.toContain(invalidFile);
    });
  });

  //   it("should throw when encountering unsupported file extension", () => {
  //     withTempDir((tmpDir) => {
  //       const validFile = path.join(tmpDir, "valid.js");
  //       const invalidFile = path.join(tmpDir, "invalid.txt");
  //       makeFile(validFile);
  //       makeFile(invalidFile, "hello world\n");

  //       expect(() => new Analyzer(tmpDir).getPaths()).toThrow(
  //         /Unsupported file extension/,
  //       );
  //     });
  //   });
});
