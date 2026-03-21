import path from "path";
import { withTempDir, makeFile } from "../../utils/testUtils";
import { ParserFacade } from "../../../lib/parser/ParserFacade";

describe("ParserFacade", () => {
  it("parses classes and functions from files", () => {
    withTempDir((tmpDir: string) => {
      const fileA = path.join(tmpDir, "A.ts");
      makeFile(
        fileA,
        `export function helper() { return 1; }\nexport class A { p = helper(); method() { return helper(); } }\nexport function f(x: string) { helper(); return x; }\n`,
      );

      const entities = new ParserFacade([fileA]).getEntities();
      expect(entities).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ kind: "function", name: "helper" }),
          expect.objectContaining({ kind: "class", name: "A" }),
          expect.objectContaining({
            kind: "function",
            name: "f",
            args: ["x: string"],
            usedFunctions: ["helper"],
          }),
        ]),
      );

      expect(entities).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            kind: "class",
            name: "A",
            usedFunctions: expect.arrayContaining(["helper"]),
          }),
        ]),
      );
    });
  });
});
