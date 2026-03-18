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
        path: "A.ts",
      },
      {
        kind: "class",
        name: "B",
        superClass: "A",
        methods: [],
        properties: [],
        path: "B.ts",
      },
      { kind: "function", name: "f", path: "A.ts", args: [], returnType: null },
    ];

    const g = new GraphGenerator(entities).generate();
    expect(g.nodes).toHaveLength(3);
    expect(g.relations).toEqual([
      { id: "1", from: "2", to: "1", type: "inheritance" },
    ]);
  });
});
