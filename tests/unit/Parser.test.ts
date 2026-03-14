import path from "path";
import { Parser } from "../../lib/Parser";
import { makeFile, withTempDir } from "../utils/testUtils";

describe("Parser", () => {
  it("should parse class declarations from each provided file", () => {
    withTempDir((tmpDir) => {
      const fileA = path.join(tmpDir, "A.ts");
      const fileB = path.join(tmpDir, "sub", "B.ts");

      makeFile(
        fileA,
        `export class A {\n  value = 1;\n  method() { return this.value; }\n}\n`,
      );

      makeFile(
        fileB,
        `export class B extends A {\n  other = "x";\n  compute() { return 2; }\n}\n`,
      );

      const parsed = new Parser([fileA, fileB]).getClasses();

      expect(parsed).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            name: "A",
            superClass: null,
            methods: expect.arrayContaining(["method"]),
            properties: expect.arrayContaining(["value"]),
          }),
          expect.objectContaining({
            name: "B",
            superClass: "A",
            methods: expect.arrayContaining(["compute"]),
            properties: expect.arrayContaining(["other"]),
          }),
        ]),
      );
      expect(parsed).toHaveLength(2);
    });
  });

  it("should include classes from files with no exports and parse anonymous classes if present", () => {
    withTempDir((tmpDir) => {
      const file = path.join(tmpDir, "C.ts");
      makeFile(
        file,
        `class Local {\n  p = 1;\n}\n\nexport default class extends Local {\n  x = 2;\n}\n`,
      );

      const parsed = new Parser([file]).getClasses();

      expect(parsed).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            name: "Local",
            superClass: null,
            properties: expect.arrayContaining(["p"]),
          }),
          expect.objectContaining({
            name: "Anonymous",
            superClass: "Local",
            properties: expect.arrayContaining(["x"]),
          }),
        ]),
      );
      expect(parsed).toHaveLength(2);
    });
  });
});
