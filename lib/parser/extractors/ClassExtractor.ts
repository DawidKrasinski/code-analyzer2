import type { NodePath } from "@babel/traverse";
import * as t from "@babel/types";
import { ClassInfo } from "../models";

export class ClassExtractor {
  static extract(
    path: NodePath<t.ClassDeclaration>,
    filePath: string,
  ): ClassInfo {
    const className = path.node.id?.name ?? "Anonymous";
    let superClass: string | null = null;

    if (path.node.superClass) {
      if (t.isIdentifier(path.node.superClass)) {
        superClass = path.node.superClass.name;
      } else if (t.isMemberExpression(path.node.superClass)) {
        superClass =
          path.node.superClass.property.type === "Identifier"
            ? path.node.superClass.property.name
            : "<complex>";
      } else {
        superClass = "<complex>";
      }
    }

    const methods: string[] = [];
    const properties: string[] = [];

    path.node.body.body.forEach((classElement) => {
      if (t.isClassMethod(classElement)) {
        if (t.isIdentifier(classElement.key)) {
          const name = classElement.key.name;
          const accessibility = (classElement as any).accessibility;
          if (accessibility === "private") methods.push(`private ${name}`);
          else if (accessibility === "protected")
            methods.push(`protected ${name}`);
          else if (accessibility === "public") methods.push(`public ${name}`);
          else methods.push(name);
        }
      } else if (t.isClassProperty(classElement)) {
        if (t.isIdentifier(classElement.key)) {
          const name = classElement.key.name;
          const accessibility = (classElement as any).accessibility;
          if (accessibility === "private") properties.push(`private ${name}`);
          else if (accessibility === "protected")
            properties.push(`protected ${name}`);
          else if (accessibility === "public")
            properties.push(`public ${name}`);
          else properties.push(name);
        }
      }
    });

    return {
      kind: "class",
      name: className,
      superClass,
      methods,
      properties,
      path: filePath,
    };
  }
}
