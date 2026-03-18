import { UMLNode } from "../parser/models";
import { CodeEntity } from "../parser/models";

export class UMLNodeFactory {
  static create(entity: CodeEntity, id: string): UMLNode {
    if (entity.kind === "class") {
      return {
        id,
        name: entity.name,
        type: "class",
        attributes: entity.properties,
        methods: entity.methods,
        path: entity.path,
      };
    }

    if (entity.kind === "component") {
      return {
        id,
        name: entity.name,
        type: "component",
        attributes: entity.properties,
        methods: entity.methods,
        path: entity.path,
      };
    }

    return {
      id,
      name: entity.name,
      type: "function",
      path: entity.path,
      args: entity.args,
      returnType: entity.returnType,
    };
  }
}
