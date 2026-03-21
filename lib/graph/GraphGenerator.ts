import { CodeEntity, UMLGraph } from "../parser/models";
import { UMLNodeFactory } from "./UMLNodeFactory";
import { UMLRelationFactory } from "./UMLRelationFactory";

export class GraphGenerator {
  constructor(private entities: CodeEntity[]) {}

  private static normalizeApiEndpointName(endpointName: string): string {
    const [method] = endpointName.split(" ");
    if (method === "GET") {
      return "GET";
    }

    return endpointName;
  }

  generate(): UMLGraph {
    const nodes = [];
    const relations = [];
    const entityToId = new Map<string, string>();
    const apiEndpointNames = new Set<string>();
    let idCounter = 1;

    for (const entity of this.entities) {
      const id = (idCounter++).toString();
      entityToId.set(entity.name, id);
      nodes.push(UMLNodeFactory.create(entity, id));

      if (
        entity.kind === "function" &&
        /^(GET|POST|PUT|PATCH|DELETE)(?: \/api(?:\/.*)?)?$/.test(entity.name)
      ) {
        apiEndpointNames.add(entity.name);
      }
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

      for (const usedEntity of entity.usedFunctions ?? []) {
        // Look for the used entity in all entities (classes, components, functions)
        // not just functions
        const toId = entityToId.get(usedEntity);
        if (!toId || toId === fromId) {
          continue;
        }

        const relationKey = `${fromId}:${toId}:usage`;
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

    for (const entity of this.entities) {
      const fromId = entityToId.get(entity.name);
      if (!fromId) {
        continue;
      }

      for (const endpointName of entity.usedApiEndpoints ?? []) {
        const normalizedEndpointName =
          GraphGenerator.normalizeApiEndpointName(endpointName);

        if (!apiEndpointNames.has(normalizedEndpointName)) {
          continue;
        }

        const toId = entityToId.get(normalizedEndpointName);
        if (!toId || toId === fromId) {
          continue;
        }

        const relationKey = `${fromId}:${toId}:api-usage`;
        if (!relationKeys.has(relationKey)) {
          relationKeys.add(relationKey);
          relations.push(
            UMLRelationFactory.createApiUsage(
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
