import { CodeEntity, UMLGraph } from "../parser/models";
import { UMLNodeFactory } from "./UMLNodeFactory";
import { UMLRelationFactory } from "./UMLRelationFactory";

export class GraphGenerator {
  constructor(private entities: CodeEntity[]) {}

  generate(): UMLGraph {
    const nodes = [];
    const relations = [];
    const classToId = new Map<string, string>();
    let idCounter = 1;

    for (const entity of this.entities) {
      const id = (idCounter++).toString();
      classToId.set(entity.name, id);
      nodes.push(UMLNodeFactory.create(entity, id));
    }

    let relCounter = 1;
    for (const entity of this.entities) {
      if (entity.kind === "class" && entity.superClass) {
        const fromId = classToId.get(entity.name);
        const toId = classToId.get(entity.superClass);
        if (fromId && toId) {
          relations.push({
            id: (relCounter++).toString(),
            from: fromId,
            to: toId,
            type: "inheritance" as const,
          });
        }
      }
    }

    return { nodes, relations };
  }
}
