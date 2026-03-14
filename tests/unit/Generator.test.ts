import { ClassInfo } from "../../lib/Parser";
import { Generator } from "../../lib/Generator";
import type { UMLGraph } from "../../lib/Generator";

describe("Generator", () => {
  it("should generate correct UML for simple class hierarchy", () => {
    const classes: ClassInfo[] = [
      {
        name: "A",
        superClass: null,
        methods: ["method1"],
        properties: ["prop1"],
      },
      {
        name: "B",
        superClass: "A",
        methods: ["method2"],
        properties: ["prop2"],
      },
    ];

    const generator = new Generator(classes);
    const graph: UMLGraph = generator.generate();
    expect(graph).toEqual({
      nodes: [
        {
          id: "1",
          name: "A",
          type: "class",
          attributes: ["prop1"],
          methods: ["method1"],
        },
        {
          id: "2",
          name: "B",
          type: "class",
          attributes: ["prop2"],
          methods: ["method2"],
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
