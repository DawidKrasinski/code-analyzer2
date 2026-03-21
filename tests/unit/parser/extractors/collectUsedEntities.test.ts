import * as parser from "@babel/parser";
import traverse from "@babel/traverse";
import { collectUsedEntities } from "../../../../lib/parser/extractors/collectUsedEntities";
import { collectUsedApiEndpoints } from "../../../../lib/parser/extractors/collectUsedApiEndpoints";

describe("collectUsedEntities", () => {
  it("ignores local declarations, params and nested scopes by default", () => {
    const code = `
function demo(param: number) {
  const local = make();
  helper(local);
  const nested = () => inner();
  return external + param;
}
`;

    const ast = parser.parse(code, {
      sourceType: "module",
      plugins: ["typescript"],
    });

    let used: string[] = [];

    traverse(ast, {
      FunctionDeclaration(path) {
        if (path.node.id?.name !== "demo") {
          return;
        }

        used = collectUsedEntities(path.node.body, {
          localDeclarations: path.node.params
            .flatMap((param) =>
              param.type === "Identifier" ? [param.name] : [],
            )
            .filter(Boolean),
        });
      },
    });

    expect(used).toEqual(
      expect.arrayContaining(["make", "helper", "external"]),
    );
    expect(used).not.toEqual(
      expect.arrayContaining(["param", "local", "inner"]),
    );
  });

  it("can include nested-scope usages when skipNestedScopes is false", () => {
    const code = `
function demo() {
  const nested = () => inner();
  return outside();
}
`;

    const ast = parser.parse(code, {
      sourceType: "module",
      plugins: ["typescript"],
    });

    let used: string[] = [];

    traverse(ast, {
      FunctionDeclaration(path) {
        if (path.node.id?.name !== "demo") {
          return;
        }

        used = collectUsedEntities(path.node.body, {
          skipNestedScopes: false,
        });
      },
    });

    expect(used).toEqual(expect.arrayContaining(["outside", "inner"]));
  });

  it("extracts API endpoints from fetch calls", () => {
    const code = `
function demo() {
  fetch("/api/open-file", { method: "POST" });
  fetch("https://example.com/api/health", { method: "GET" });
  fetch("/users", { method: "GET" });
}
`;

    const ast = parser.parse(code, {
      sourceType: "module",
      plugins: ["typescript"],
    });

    let usedEndpoints: string[] = [];

    traverse(ast, {
      FunctionDeclaration(path) {
        if (path.node.id?.name !== "demo") {
          return;
        }

        usedEndpoints = collectUsedApiEndpoints(path.node.body);
      },
    });

    expect(usedEndpoints).toEqual(
      expect.arrayContaining(["POST /api/open-file", "GET /api/health"]),
    );
    expect(usedEndpoints).not.toContain("GET /users");
  });
});
