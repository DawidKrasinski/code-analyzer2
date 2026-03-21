import path from "path";
import * as parser from "@babel/parser";
import * as traverse from "@babel/traverse";
import { ClassExtractor } from "../../../../lib/parser/extractors/ClassExtractor";

describe("ClassExtractor", () => {
  it("extracts class data", () => {
    const code = `class A { private x = createValue(); y = 2; protected method() { helper(); const nested = () => ignored(); } }`;
    const ast = parser.parse(code, {
      sourceType: "module",
      plugins: ["typescript"],
    });
    let classInfo: any;

    traverse.default(ast, {
      ClassDeclaration(path) {
        classInfo = ClassExtractor.extract(path, ["A.ts"]);
      },
    });

    expect(classInfo).toMatchObject({
      kind: "class",
      name: "A",
      properties: expect.arrayContaining(["private x", "y"]),
      methods: expect.arrayContaining(["protected method"]),
      usedFunctions: expect.arrayContaining(["createValue", "helper"]),
    });
  });
});
