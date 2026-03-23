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

  describe("implements extraction", () => {
    it("extracts single implements clause", () => {
      const code = `class Service implements IService { }`;
      const ast = parser.parse(code, {
        sourceType: "module",
        plugins: ["typescript"],
      });
      let classInfo: any;

      traverse.default(ast, {
        ClassDeclaration(path) {
          classInfo = ClassExtractor.extract(path, ["Service.ts"]);
        },
      });

      expect(classInfo).toMatchObject({
        implements: ["IService"],
      });
    });

    it("extracts multiple implements clauses", () => {
      const code = `class Service implements IService, Disposable { }`;
      const ast = parser.parse(code, {
        sourceType: "module",
        plugins: ["typescript"],
      });
      let classInfo: any;

      traverse.default(ast, {
        ClassDeclaration(path) {
          classInfo = ClassExtractor.extract(path, ["Service.ts"]);
        },
      });

      expect(classInfo).toMatchObject({
        implements: ["IService", "Disposable"],
      });
    });

    it("returns empty implements when class has no implements clause", () => {
      const code = `class Plain { }`;
      const ast = parser.parse(code, {
        sourceType: "module",
        plugins: ["typescript"],
      });
      let classInfo: any;

      traverse.default(ast, {
        ClassDeclaration(path) {
          classInfo = ClassExtractor.extract(path, ["Plain.ts"]);
        },
      });

      expect(classInfo.implements).toEqual([]);
    });
  });

  describe("new expressions extraction", () => {
    it("extracts new expression from property initializer", () => {
      const code = `class A { service = new Service(); }`;
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

      expect(classInfo.newExpressions).toContain("Service");
    });

    it("extracts new expression from method body", () => {
      const code = `class A { create() { return new Factory(); } }`;
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

      expect(classInfo.newExpressions).toContain("Factory");
    });

    it("extracts multiple new expressions without duplicates", () => {
      const code = `class A { a = new B(); method() { new B(); new C(); } }`;
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

      expect(classInfo.newExpressions).toEqual(
        expect.arrayContaining(["B", "C"]),
      );
      expect(
        classInfo.newExpressions.filter((n: string) => n === "B"),
      ).toHaveLength(1);
    });
  });

  describe("constructor parameter types extraction", () => {
    it("extracts constructor parameter type", () => {
      const code = `class A { constructor(service: Service) {} }`;
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

      expect(classInfo.constructorParamTypes).toContain("Service");
    });

    it("extracts TypeScript parameter property types", () => {
      const code = `class A { constructor(private service: Service, public repo: Repository) {} }`;
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

      expect(classInfo.constructorParamTypes).toEqual(
        expect.arrayContaining(["Service", "Repository"]),
      );
    });

    it("ignores primitive types in constructor params", () => {
      const code = `class A { constructor(name: string, count: number) {} }`;
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

      expect(classInfo.constructorParamTypes).toEqual([]);
    });
  });

  describe("property types extraction", () => {
    it("extracts property type annotation", () => {
      const code = `class A { service: Service; }`;
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

      expect(classInfo.propertyTypes).toContain("Service");
    });

    it("extracts optional property type", () => {
      const code = `class A { logger?: Logger; }`;
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

      expect(classInfo.propertyTypes).toContain("Logger");
    });
  });

  describe("method parameter types extraction", () => {
    it("extracts method parameter type", () => {
      const code = `class A { process(item: Item): void {} }`;
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

      expect(classInfo.methodParamTypes).toContain("Item");
    });

    it("does not include constructor param types in method param types", () => {
      const code = `class A { constructor(s: Service) {} process(item: Item): void {} }`;
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

      expect(classInfo.methodParamTypes).toContain("Item");
      expect(classInfo.methodParamTypes).not.toContain("Service");
      expect(classInfo.constructorParamTypes).toContain("Service");
    });
  });
});
