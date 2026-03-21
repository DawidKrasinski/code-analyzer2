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

  static createDependency(id: string, from: string, to: string): UMLRelation {
    return {
      id,
      from,
      to,
      type: "dependency",
    };
  }

  static createUsage(id: string, from: string, to: string): UMLRelation {
    return {
      id,
      from,
      to,
      type: "usage",
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
