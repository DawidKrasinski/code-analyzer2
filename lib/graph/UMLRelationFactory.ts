import { UMLRelation } from "../parser/models";
import { ClassInfo } from "../parser/models";

export class UMLRelationFactory {
  static createInheritance(id: string, from: string, to: string): UMLRelation {
    return {
      id,
      from,
      to,
      type: "inheritance",
    };
  }

  static createImplementation(
    id: string,
    from: string,
    to: string,
  ): UMLRelation {
    return {
      id,
      from,
      to,
      type: "implementation",
    };
  }

  static createAssociation(id: string, from: string, to: string): UMLRelation {
    return {
      id,
      from,
      to,
      type: "association",
    };
  }

  static createAggregation(id: string, from: string, to: string): UMLRelation {
    return {
      id,
      from,
      to,
      type: "aggregation",
    };
  }

  static createComposition(id: string, from: string, to: string): UMLRelation {
    return {
      id,
      from,
      to,
      type: "composition",
    };
  }

  static createDependency(id: string, from: string, to: string): UMLRelation {
    return {
      id,
      from,
      to,
      type: "dependency",
    };
  }

  static createApiUsage(id: string, from: string, to: string): UMLRelation {
    return {
      id,
      from,
      to,
      type: "api-usage",
    };
  }

  static createFromClass(
    superClass: ClassInfo,
    classId: string,
    classMap: Map<string, string>,
  ): UMLRelation | null {
    if (!superClass.superClass) return null;
    const toId = classMap.get(superClass.superClass);
    if (!toId) return null;
    return UMLRelationFactory.createInheritance(
      (classMap.size + 1).toString(),
      classId,
      toId,
    );
  }
}
