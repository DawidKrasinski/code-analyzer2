import * as t from "@babel/types";
import { TypeAnnotationSerializer } from "./TypeAnnotationSerializer";

export class ParamStringifier {
  static stringify(param: t.FunctionDeclaration["params"][number]): string {
    if (t.isIdentifier(param)) {
      const typeName = param.typeAnnotation
        ? TypeAnnotationSerializer.serialize(param.typeAnnotation)
        : "any";
      return `${param.name}: ${typeName}`;
    }
    if (t.isAssignmentPattern(param) && t.isIdentifier(param.left)) {
      const typeName = param.left.typeAnnotation
        ? TypeAnnotationSerializer.serialize(param.left.typeAnnotation)
        : "any";
      return `${param.left.name}: ${typeName}`;
    }
    if (t.isRestElement(param) && t.isIdentifier(param.argument)) {
      const typeName = param.typeAnnotation
        ? TypeAnnotationSerializer.serialize(param.typeAnnotation)
        : "any";
      return `...${param.argument.name}: ${typeName}`;
    }
    if (t.isObjectPattern(param) || t.isArrayPattern(param)) {
      return "args";
    }
    return "arg";
  }
}
