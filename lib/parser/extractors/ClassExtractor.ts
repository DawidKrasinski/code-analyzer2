import type { NodePath } from "@babel/traverse";
import * as t from "@babel/types";
import { ClassInfo, ComponentInfo } from "../models";

function isComponentClass(
  className: string,
  superClass: t.Expression | null | undefined,
) {
  if (className.endsWith("Component")) return true;
  if (!superClass) return false;
  if (t.isMemberExpression(superClass)) {
    return (
      t.isIdentifier(superClass.object) &&
      superClass.object.name === "React" &&
      t.isIdentifier(superClass.property) &&
      superClass.property.name === "Component"
    );
  }
  if (t.isIdentifier(superClass) && superClass.name === "Component")
    return true;
  return false;
}

export class ClassExtractor {
  static extract(
    path: NodePath<t.ClassDeclaration>,
    pathParts: string[],
  ): ClassInfo | ComponentInfo {
    const className = path.node.id?.name ?? "Anonymous";
    let superClass: string | null = null;

    if (path.node.superClass) {
      if (t.isIdentifier(path.node.superClass)) {
        superClass = path.node.superClass.name;
      } else if (t.isMemberExpression(path.node.superClass)) {
        superClass = t.isIdentifier(path.node.superClass.property)
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

    const isComponent = isComponentClass(className, path.node.superClass);

    if (isComponent) {
      return {
        kind: "component",
        name: className,
        superClass,
        methods,
        properties,
        path: pathParts,
      };
    }

    return {
      kind: "class",
      name: className,
      superClass,
      methods,
      properties,
      path: pathParts,
    };
  }
}
