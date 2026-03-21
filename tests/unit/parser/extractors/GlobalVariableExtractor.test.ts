import * as parser from "@babel/parser";
import traverse from "@babel/traverse";
import { GlobalVariableExtractor } from "../../../../lib/parser/extractors/GlobalVariableExtractor";

describe("GlobalVariableExtractor", () => {
  it("extracts only top-level identifier declarations", () => {
    const code = `
function helper() { return 1; }
const top = helper();
export const mirrored = top;
const { ignored } = source;
function run() {
  const inner = helper();
  return inner;
}
`;

    const ast = parser.parse(code, {
      sourceType: "module",
      plugins: ["typescript"],
    });

    const extracted: Array<{ name: string; usedFunctions: string[] }> = [];

    traverse(ast, {
      VariableDeclaration(path) {
        const variables = GlobalVariableExtractor.extract(path, ["file.ts"]);
        extracted.push(
          ...variables.map((variable) => ({
            name: variable.name,
            usedFunctions: variable.usedFunctions ?? [],
          })),
        );
      },
    });

    expect(extracted).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          name: "top",
          usedFunctions: expect.arrayContaining(["helper"]),
        }),
        expect.objectContaining({
          name: "mirrored",
          usedFunctions: expect.arrayContaining(["top"]),
        }),
      ]),
    );

    expect(extracted.map((entry) => entry.name)).not.toContain("inner");
    expect(extracted.map((entry) => entry.name)).not.toContain("ignored");
  });
});
