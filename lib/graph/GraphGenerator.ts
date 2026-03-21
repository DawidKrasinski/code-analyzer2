import { CodeEntity, UMLGraph } from "../parser/models";
import { UMLNodeFactory } from "./UMLNodeFactory";
import { UMLRelationFactory } from "./UMLRelationFactory";

export class GraphGenerator {
  constructor(private entities: CodeEntity[]) {}

  generate(): UMLGraph {
    const nodes = [];
    const relations = [];
    const entityToId = new Map<string, string>();
    const functionToId = new Map<string, string>();
    let idCounter = 1;

    for (const entity of this.entities) {
      const id = (idCounter++).toString();
      entityToId.set(entity.name, id);
      if (entity.kind === "function") {
        functionToId.set(entity.name, id);
      }
      nodes.push(UMLNodeFactory.create(entity, id));
    }

    let relCounter = 1;
    const relationKeys = new Set<string>();

    for (const entity of this.entities) {
      if (entity.kind === "class" && entity.superClass) {
        const fromId = entityToId.get(entity.name);
        const toId = entityToId.get(entity.superClass);
        if (fromId && toId) {
          const relationKey = `${fromId}:${toId}:inheritance`;
          if (!relationKeys.has(relationKey)) {
            relationKeys.add(relationKey);
            relations.push(
              UMLRelationFactory.createInheritance(
                (relCounter++).toString(),
                fromId,
                toId,
              ),
            );
          }
        }
      }
    }

    for (const entity of this.entities) {
      const fromId = entityToId.get(entity.name);
      if (!fromId) {
        continue;
      }

      for (const usedFunction of entity.usedFunctions ?? []) {
        const toId = functionToId.get(usedFunction);
        if (!toId || toId === fromId) {
          continue;
        }

        const relationKey = `${fromId}:${toId}:dependency`;
        if (!relationKeys.has(relationKey)) {
          relationKeys.add(relationKey);
          relations.push(
            UMLRelationFactory.createUsage(
              (relCounter++).toString(),
              fromId,
              toId,
            ),
          );
        }
      }
    }

    return { nodes, relations };
  }
}
