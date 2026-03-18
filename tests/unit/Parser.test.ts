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
        `export class A {\n  value = 1;\n  private hidden = 2;\n  private method() { return this.value; }\n}\n`,
      );

      makeFile(
        fileB,
        `export class B extends A {\n  other = "x";\n  compute() { return 2; }\n}\nexport class MyComponent extends React.Component { render() { return null; } }\n`,
      );

      const parsed = new Parser([fileA, fileB]).getEntities();

      expect(parsed).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            name: "A",
            superClass: null,
            methods: expect.arrayContaining(["private method"]),
            properties: expect.arrayContaining(["value", "private hidden"]),
          }),
          expect.objectContaining({
            name: "B",
            superClass: "A",
            methods: expect.arrayContaining(["compute"]),
            properties: expect.arrayContaining(["other"]),
          }),
          expect.objectContaining({
            kind: "component",
            name: "MyComponent",
          }),
        ]),
      );
      expect(parsed).toHaveLength(3);
    });
  });

  it("should parse top-level functions across the project", () => {
    withTempDir((tmpDir) => {
      const file = path.join(tmpDir, "F.ts");
      makeFile(
        file,
        `export function compute() { return 5; }\nfunction localHelper() { return 1; }\n`,
      );

      const parsed = new Parser([file]).getEntities();
      expect(parsed).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            kind: "function",
            name: "compute",
            args: [],
            returnType: null,
          }),
          expect.objectContaining({
            kind: "function",
            name: "localHelper",
            args: [],
            returnType: null,
          }),
        ]),
      );
      expect(parsed.filter((e) => e.kind === "function")).toHaveLength(2);
    });
  });

  it("should include classes from files with no exports and parse anonymous classes if present", () => {
    withTempDir((tmpDir) => {
      const file = path.join(tmpDir, "C.ts");
      makeFile(
        file,
        `class Local {\n  p = 1;\n}\n\nexport default class extends Local {\n  x = 2;\n}\n`,
      );

      const parsed = new Parser([file]).getEntities();

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
