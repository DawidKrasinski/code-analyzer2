import type { ClassInfo } from "./Parser.js";

type RelationType =
  | "inheritance"
  | "implementation"
  | "association"
  | "aggregation"
  | "composition"
  | "dependency";

interface UMLNode {
  id: string;
  name: string;
  type: "class" | "interface" | "abstract";
  attributes?: string[];
  methods?: string[];
}

interface UMLRelation {
  id: string;
  from: string; // node id
  to: string; // node id
  type: RelationType;
}

export interface UMLGraph {
  nodes: UMLNode[];
  relations: UMLRelation[];
}

export class Generator {
  private classes: ClassInfo[];

  constructor(classes: ClassInfo[]) {
    this.classes = classes;
  }

  generate(): UMLGraph {
    const nodes: UMLNode[] = [];
    const relations: UMLRelation[] = [];
    const classToId = new Map<string, string>();
    let idCounter = 1;

    // Create nodes
    for (const cls of this.classes) {
      const id = (idCounter++).toString();
      classToId.set(cls.name, id);
      nodes.push({
        id,
        name: cls.name,
        type: "class",
        attributes: cls.properties,
        methods: cls.methods,
      });
    }

    // Create inheritance relations
    let relIdCounter = 1;
    for (const cls of this.classes) {
      if (cls.superClass) {
        const fromId = classToId.get(cls.name)!;
        const toId = classToId.get(cls.superClass);
        if (toId) {
          relations.push({
            id: (relIdCounter++).toString(),
            from: fromId,
            to: toId,
            type: "inheritance",
          });
        }
      }
    }

    return { nodes, relations };
  }
}
