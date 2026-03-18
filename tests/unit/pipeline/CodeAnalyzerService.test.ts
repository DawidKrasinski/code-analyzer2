import { withTempDir, makeFile } from "../../utils/testUtils";
import path from "path";
import { CodeAnalyzerService } from "../../../lib/pipeline/CodeAnalyzerService";

describe("CodeAnalyzerService", () => {
  it("runs the full pipeline and returns a UML graph", () => {
    withTempDir((tmpDir: string) => {
      const file = path.join(tmpDir, "A.ts");
      makeFile(file, `export class A {}\nexport function f() { return 1; }\n`);

      const graph = new CodeAnalyzerService(tmpDir).analyze();
      expect(graph.nodes).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ name: "A", type: "class" }),
          expect.objectContaining({ name: "f", type: "function" }),
        ]),
      );
    });
  });
});
