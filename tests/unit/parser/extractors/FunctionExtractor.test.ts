import * as parser from "@babel/parser";
import traverse from "@babel/traverse";
import { FunctionExtractor } from "../../../../lib/parser/extractors/FunctionExtractor";

describe("FunctionExtractor", () => {
  it("extracts function args and used functions", () => {
    const code = `function foo(x: number, ...rest: string[]) { helper(); const nested = () => internal(); return x; }`;
    const ast = parser.parse(code, {
      sourceType: "module",
      plugins: ["typescript"],
    });
    let info: any;

    traverse(ast, {
      FunctionDeclaration(path) {
        const extracted = FunctionExtractor.extract(path, "file.ts", [
          "file.ts",
        ]);
        if (extracted) info = extracted;
      },
    });

    expect(info).toMatchObject({
      kind: "function",
      name: "foo",
      args: expect.arrayContaining(["x: number"]),
      returnType: null,
      usedFunctions: ["helper"],
    });
  });
});
