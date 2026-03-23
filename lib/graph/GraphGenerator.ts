import { CodeEntity, UMLGraph } from "../parser/models";
import { UMLNodeFactory } from "./UMLNodeFactory";
import { UMLRelationFactory } from "./UMLRelationFactory";

// Ordered from highest to lowest priority for a given (from, to) pair.
type RelationPriority =
  | "implementation"
  | "composition"
  | "aggregation"
  | "association"
  | "dependency";

const RELATION_PRIORITY: RelationPriority[] = [
  "implementation",
  "composition",
  "aggregation",
  "association",
  "dependency",
];

export class GraphGenerator {
  constructor(private entities: CodeEntity[]) {}

  generate(): UMLGraph {
    const nodes = [];
    const entityToId = new Map<string, string>();
    const apiEndpointNames = new Set<string>();
    let idCounter = 1;

    for (const entity of this.entities) {
      const id = (idCounter++).toString();
      entityToId.set(entity.name, id);
      nodes.push(UMLNodeFactory.create(entity, id));

      if (
        entity.kind === "function" &&
        /^(GET|POST|PUT|PATCH|DELETE) \/api(?:\/.*)?$/.test(entity.name)
      ) {
        apiEndpointNames.add(entity.name);
      }
    }

    let relCounter = 1;
    // Map from "fromId:toId" to the highest-priority relation type assigned
    const pairRelation = new Map<string, RelationPriority>();
    // Track inheritance and api-usage separately (they don't compete with others)
    const inheritanceKeys = new Set<string>();
    const apiUsageKeys = new Set<string>();

    // --- Inheritance ---
    for (const entity of this.entities) {
      if (
        (entity.kind === "class" || entity.kind === "component") &&
        entity.superClass
      ) {
        const fromId = entityToId.get(entity.name);
        const toId = entityToId.get(entity.superClass);
        if (fromId && toId) {
          const key = `${fromId}:${toId}`;
          if (!inheritanceKeys.has(key)) {
            inheritanceKeys.add(key);
          }
        }
      }
    }

    // --- Class-level structural relations (implementation, composition, aggregation, association, dependency) ---
    for (const entity of this.entities) {
      const fromId = entityToId.get(entity.name);
      if (!fromId) continue;

      const assign = (
        toName: string,
        type: RelationPriority,
        options?: { allowSelf?: boolean },
      ) => {
        const toId = entityToId.get(toName);
        if (!toId) return;
        if (toId === fromId && !options?.allowSelf) return;
        const key = `${fromId}:${toId}`;
        const current = pairRelation.get(key);
        if (
          current === undefined ||
          RELATION_PRIORITY.indexOf(type) < RELATION_PRIORITY.indexOf(current)
        ) {
          pairRelation.set(key, type);
        }
      };

      if (entity.kind === "class" || entity.kind === "component") {
        for (const iface of entity.implements ?? []) {
          assign(iface, "implementation");
        }
        for (const name of entity.newExpressions ?? []) {
          assign(name, "composition");
        }
        for (const name of entity.constructorParamTypes ?? []) {
          assign(name, "aggregation");
        }
        for (const name of entity.propertyTypes ?? []) {
          assign(name, "association");
        }
        for (const name of entity.methodParamTypes ?? []) {
          assign(name, "dependency");
        }
      }

      for (const usedEntity of entity.usedFunctions ?? []) {
        assign(usedEntity, "dependency", {
          allowSelf: usedEntity === entity.name,
        });
      }
    }

    // --- API Usage ---
    for (const entity of this.entities) {
      const fromId = entityToId.get(entity.name);
      if (!fromId) continue;

      for (const endpointName of entity.usedApiEndpoints ?? []) {
        if (!apiEndpointNames.has(endpointName)) continue;
        const toId = entityToId.get(endpointName);
        if (!toId || toId === fromId) continue;
        const key = `${fromId}:${toId}`;
        if (!apiUsageKeys.has(key)) {
          apiUsageKeys.add(key);
        }
      }
    }

    const relations = [];

    // Emit inheritance relations
    for (const key of inheritanceKeys) {
      const [fromId, toId] = key.split(":");
      relations.push(
        UMLRelationFactory.createInheritance(
          (relCounter++).toString(),
          fromId,
          toId,
        ),
      );
    }

    // Emit structural relations (highest priority per pair)
    for (const [key, type] of pairRelation) {
      const [fromId, toId] = key.split(":");
      switch (type) {
        case "implementation":
          relations.push(
            UMLRelationFactory.createImplementation(
              (relCounter++).toString(),
              fromId,
              toId,
            ),
          );
          break;
        case "composition":
          relations.push(
            UMLRelationFactory.createComposition(
              (relCounter++).toString(),
              fromId,
              toId,
            ),
          );
          break;
        case "aggregation":
          relations.push(
            UMLRelationFactory.createAggregation(
              (relCounter++).toString(),
              fromId,
              toId,
            ),
          );
          break;
        case "association":
          relations.push(
            UMLRelationFactory.createAssociation(
              (relCounter++).toString(),
              fromId,
              toId,
            ),
          );
          break;
        case "dependency":
          relations.push(
            UMLRelationFactory.createDependency(
              (relCounter++).toString(),
              fromId,
              toId,
            ),
          );
          break;
      }
    }

    // Emit api-usage relations
    for (const key of apiUsageKeys) {
      const [fromId, toId] = key.split(":");
      relations.push(
        UMLRelationFactory.createApiUsage(
          (relCounter++).toString(),
          fromId,
          toId,
        ),
      );
    }

    return { nodes, relations };
  }
}
