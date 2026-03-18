import { CodeEntity } from "../../lib/parser/models";
import { Generator } from "../../lib/Generator";
import type { UMLGraph } from "../../lib/Generator";

describe("Generator", () => {
  it("should generate correct UML for simple class hierarchy and component", () => {
    const entities: CodeEntity[] = [
      {
        kind: "class",
        name: "A",
        superClass: null,
        methods: ["method1"],
        properties: ["prop1"],
        path: "A.ts",
      },
      {
        kind: "class",
        name: "B",
        superClass: "A",
        methods: ["method2"],
        properties: ["prop2"],
        path: "B.ts",
      },
      {
        kind: "function",
        name: "doWork",
        path: "A.ts",
        args: [],
        returnType: null,
      },
      {
        kind: "component",
        name: "MyComponent",
        superClass: "React.Component",
        methods: ["render"],
        properties: [],
        path: "A.ts",
      },
    ];

    const generator = new Generator(entities);
    const graph: UMLGraph = generator.generate();
    expect(graph).toEqual({
      nodes: [
        {
          id: "1",
          name: "A",
          type: "class",
          attributes: ["prop1"],
          methods: ["method1"],
          path: "A.ts",
        },
        {
          id: "2",
          name: "B",
          type: "class",
          attributes: ["prop2"],
          methods: ["method2"],
          path: "B.ts",
        },
        {
          id: "3",
          name: "doWork",
          type: "function",
          path: "A.ts",
          args: [],
          returnType: null,
        },
        {
          id: "4",
          name: "MyComponent",
          type: "component",
          attributes: [],
          methods: ["render"],
          path: "A.ts",
        },
      ],
      relations: [
        {
          id: "1",
          from: "2",
          to: "1",
          type: "inheritance",
        },
      ],
    } as UMLGraph);
  });
});
