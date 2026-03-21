import { GraphGenerator } from "../../../lib/graph/GraphGenerator";
import { CodeEntity } from "../../../lib/parser/models";

describe("GraphGenerator", () => {
  it("builds nodes and inheritance relations", () => {
    const entities: CodeEntity[] = [
      {
        kind: "class",
        name: "A",
        superClass: null,
        methods: [],
        properties: [],
        path: ["A.ts"],
        usedFunctions: ["f", "f"],
      },
      {
        kind: "class",
        name: "B",
        superClass: "A",
        methods: [],
        properties: [],
        path: ["B.ts"],
        usedFunctions: ["f"],
      },
      {
        kind: "function",
        name: "f",
        path: ["A.ts"],
        args: [],
        returnType: null,
      },
    ];

    const g = new GraphGenerator(entities).generate();
    expect(g.nodes).toHaveLength(3);
    expect(g.relations).toEqual([
      { id: "1", from: "2", to: "1", type: "inheritance" },
      { id: "2", from: "1", to: "3", type: "usage" },
      { id: "3", from: "2", to: "3", type: "usage" },
    ]);
  });

  it("builds usage relations for global variables in both directions", () => {
    const entities: CodeEntity[] = [
      {
        kind: "function",
        name: "helper",
        path: ["globals.ts"],
        args: [],
        returnType: null,
      },
      {
        kind: "class",
        name: "Store",
        superClass: null,
        methods: [],
        properties: [],
        path: ["globals.ts"],
        usedFunctions: ["config"],
      },
      {
        kind: "variable",
        name: "config",
        path: ["globals.ts"],
        usedFunctions: ["helper", "Store"],
      },
    ];

    const g = new GraphGenerator(entities).generate();

    expect(g.nodes).toHaveLength(3);
    expect(g.relations).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ from: "2", to: "3", type: "usage" }),
        expect.objectContaining({ from: "3", to: "1", type: "usage" }),
        expect.objectContaining({ from: "3", to: "2", type: "usage" }),
      ]),
    );
  });

  it("maps GET fetch usage to GET API endpoint node", () => {
    const entities: CodeEntity[] = [
      {
        kind: "function",
        name: "Home",
        path: ["template", "app", "page.tsx"],
        args: [],
        returnType: null,
        usedApiEndpoints: ["GET /api"],
      },
      {
        kind: "function",
        name: "GET",
        path: ["template", "app", "api", "route.ts"],
        args: [],
        returnType: null,
        usedFunctions: ["start"],
      },
      {
        kind: "function",
        name: "start",
        path: ["index.ts"],
        args: [],
        returnType: "UMLGraph",
      },
    ];

    const g = new GraphGenerator(entities).generate();

    expect(g.relations).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ from: "1", to: "2", type: "api-usage" }),
        expect.objectContaining({ from: "2", to: "3", type: "usage" }),
      ]),
    );
  });
});
