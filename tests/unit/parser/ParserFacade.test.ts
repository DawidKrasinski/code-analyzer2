import path from "path";
import { withTempDir, makeFile } from "../../utils/testUtils";
import { ParserFacade } from "../../../lib/parser/ParserFacade";

describe("ParserFacade", () => {
  it("parses classes and functions from files", () => {
    withTempDir((tmpDir: string) => {
      const fileA = path.join(tmpDir, "A.ts");
      makeFile(
        fileA,
        `export class A { p = 1; method() { return 1; } }\nexport function f(x: string) { return x; }\n`,
      );

      const entities = new ParserFacade([fileA]).getEntities();
      expect(entities).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ kind: "class", name: "A" }),
          expect.objectContaining({
            kind: "function",
            name: "f",
            args: ["x: string"],
          }),
        ]),
      );
    });
  });
});
