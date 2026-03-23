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

  it("extracts top-level global variables and their usages", () => {
    withTempDir((tmpDir: string) => {
      const fileA = path.join(tmpDir, "globals.ts");
      makeFile(
        fileA,
        `
export function helper() { return 1; }
export class Store { value = helper(); }
const config = helper();
const mirrored = config;
function run() { return config + helper(); }
`,
      );

      const entities = new ParserFacade([fileA]).getEntities();

      expect(entities).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            kind: "variable",
            name: "config",
            usedFunctions: expect.arrayContaining(["helper"]),
          }),
          expect.objectContaining({
            kind: "variable",
            name: "mirrored",
            usedFunctions: expect.arrayContaining(["config"]),
          }),
          expect.objectContaining({
            kind: "function",
            name: "run",
            usedFunctions: expect.arrayContaining(["config", "helper"]),
          }),
          expect.objectContaining({
            kind: "class",
            name: "Store",
            usedFunctions: expect.arrayContaining(["helper"]),
          }),
        ]),
      );
    });
  });

  it("extracts exported global variables like EDGE_TYPES", () => {
    withTempDir((tmpDir: string) => {
      const fileA = path.join(tmpDir, "edges.ts");
      makeFile(
        fileA,
        `
function InheritanceEdge() { return 1; }
function UsageEdge() { return 2; }
export const EDGE_TYPES = {
  inheritance: InheritanceEdge,
  usage: UsageEdge,
};
`,
      );

      const entities = new ParserFacade([fileA]).getEntities();

      expect(entities).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            kind: "variable",
            name: "EDGE_TYPES",
            usedFunctions: expect.arrayContaining([
              "InheritanceEdge",
              "UsageEdge",
            ]),
          }),
        ]),
      );
    });
  });

  it("captures extractor dependencies used inside traverse callbacks", () => {
    withTempDir((tmpDir: string) => {
      const fileA = path.join(tmpDir, "ParserFacadeLike.ts");
      makeFile(
        fileA,
        `
class ParserFacadeLike {
  parseFile() {
    traverse(ast, {
      ClassDeclaration: (path) => {
        ClassExtractor.extract(path, ["x.ts"]);
      },
      FunctionDeclaration: (path) => {
        FunctionExtractor.extract(path, "x.ts", ["x.ts"]);
      },
    });
  }
}
`,
      );

      const entities = new ParserFacade([fileA]).getEntities();
      const parserFacadeClass = entities.find(
        (entity) =>
          entity.kind === "class" && entity.name === "ParserFacadeLike",
      );

      expect(parserFacadeClass).toEqual(
        expect.objectContaining({
          kind: "class",
          name: "ParserFacadeLike",
          usedFunctions: expect.arrayContaining([
            "ClassExtractor",
            "FunctionExtractor",
          ]),
        }),
      );
    });
  });

  it("keeps GET API handler name without route and tracks start dependency", () => {
    withTempDir((tmpDir: string) => {
      const indexFile = path.join(tmpDir, "index.ts");
      const routeFile = path.join(tmpDir, "app", "api", "route.ts");

      makeFile(indexFile, `export function start() { return 1; }\n`);
      makeFile(
        routeFile,
        `import { start } from "../../../index";\nexport async function GET() { return start(); }\n`,
      );

      const entities = new ParserFacade([indexFile, routeFile]).getEntities();
      const getHandler = entities.find(
        (entity) => entity.kind === "function" && entity.name === "GET /api",
      );

      expect(getHandler).toEqual(
        expect.objectContaining({
          kind: "function",
          name: "GET /api",
          usedFunctions: expect.arrayContaining(["start"]),
        }),
      );
    });
  });

  it("tracks getFetchMethod dependency from collectUsedApiEndpoints extractor", () => {
    const file = path.resolve(
      process.cwd(),
      "lib",
      "parser",
      "extractors",
      "collectUsedApiEndpoints.ts",
    );

    const entities = new ParserFacade([file]).getEntities();
    const collector = entities.find(
      (entity) =>
        entity.kind === "function" && entity.name === "collectUsedApiEndpoints",
    );

    expect(collector).toEqual(
      expect.objectContaining({
        kind: "function",
        name: "collectUsedApiEndpoints",
        usedFunctions: expect.arrayContaining(["getFetchMethod"]),
      }),
    );
  });

  it("tracks isNodeLike dependency from collectUsedApiEndpoints extractor", () => {
    const file = path.resolve(
      process.cwd(),
      "lib",
      "parser",
      "extractors",
      "collectUsedApiEndpoints.ts",
    );

    const entities = new ParserFacade([file]).getEntities();
    const collector = entities.find(
      (entity) =>
        entity.kind === "function" && entity.name === "collectUsedApiEndpoints",
    );

    expect(collector).toEqual(
      expect.objectContaining({
        kind: "function",
        name: "collectUsedApiEndpoints",
        usedFunctions: expect.arrayContaining(["isNodeLike"]),
      }),
    );
  });

  it("tracks shouldCountIdentifierAsUsage dependency from collectUsedEntities extractor", () => {
    const file = path.resolve(
      process.cwd(),
      "lib",
      "parser",
      "extractors",
      "collectUsedEntities.ts",
    );

    const entities = new ParserFacade([file]).getEntities();
    const collector = entities.find(
      (entity) =>
        entity.kind === "function" && entity.name === "collectUsedEntities",
    );

    expect(collector).toEqual(
      expect.objectContaining({
        kind: "function",
        name: "collectUsedEntities",
        usedFunctions: expect.arrayContaining(["shouldCountIdentifierAsUsage"]),
      }),
    );
  });

  it("tracks isNodeLike dependency from collectUsedEntities extractor", () => {
    const file = path.resolve(
      process.cwd(),
      "lib",
      "parser",
      "extractors",
      "collectUsedEntities.ts",
    );

    const entities = new ParserFacade([file]).getEntities();
    const collector = entities.find(
      (entity) =>
        entity.kind === "function" && entity.name === "collectUsedEntities",
    );

    expect(collector).toEqual(
      expect.objectContaining({
        kind: "function",
        name: "collectUsedEntities",
        usedFunctions: expect.arrayContaining(["isNodeLike"]),
      }),
    );
  });

  it("captures helper relations and recursion for collectParamNamesFromPattern", () => {
    const file = path.resolve(
      process.cwd(),
      "lib",
      "parser",
      "extractors",
      "ClassExtractor.ts",
    );

    const entities = new ParserFacade([file]).getEntities();
    const helperFn = entities.find(
      (entity) =>
        entity.kind === "function" &&
        entity.name === "collectParamNamesFromPattern",
    );
    const classExtractor = entities.find(
      (entity) => entity.kind === "class" && entity.name === "ClassExtractor",
    );

    expect(helperFn).toEqual(
      expect.objectContaining({
        kind: "function",
        name: "collectParamNamesFromPattern",
        usedFunctions: expect.arrayContaining(["collectParamNamesFromPattern"]),
      }),
    );

    expect(classExtractor).toEqual(
      expect.objectContaining({
        kind: "class",
        name: "ClassExtractor",
        usedFunctions: expect.arrayContaining(["collectParamNamesFromPattern"]),
      }),
    );
  });

  it("captures helper relations and recursion for FunctionExtractor collectParamNamesFromPattern", () => {
    const file = path.resolve(
      process.cwd(),
      "lib",
      "parser",
      "extractors",
      "FunctionExtractor.ts",
    );

    const entities = new ParserFacade([file]).getEntities();
    const helperFn = entities.find(
      (entity) =>
        entity.kind === "function" &&
        entity.name === "collectParamNamesFromPattern",
    );
    const functionExtractor = entities.find(
      (entity) =>
        entity.kind === "class" && entity.name === "FunctionExtractor",
    );

    expect(helperFn).toEqual(
      expect.objectContaining({
        kind: "function",
        name: "collectParamNamesFromPattern",
        usedFunctions: expect.arrayContaining(["collectParamNamesFromPattern"]),
      }),
    );

    expect(functionExtractor).toEqual(
      expect.objectContaining({
        kind: "class",
        name: "FunctionExtractor",
        usedFunctions: expect.arrayContaining(["collectParamNamesFromPattern"]),
      }),
    );
  });
});
