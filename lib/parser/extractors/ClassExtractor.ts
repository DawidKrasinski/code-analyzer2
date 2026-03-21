import type { NodePath } from "@babel/traverse";
import * as t from "@babel/types";
import { ClassInfo, ComponentInfo } from "../models";
import { collectUsedApiEndpoints } from "./collectUsedApiEndpoints";
import { collectUsedEntities } from "./collectUsedEntities";

function collectParamNamesFromPattern(
  pattern: t.Node | null | undefined,
  names: Set<string>,
): void {
  if (!pattern) {
    return;
  }

  if (t.isIdentifier(pattern)) {
    names.add(pattern.name);
    return;
  }

  if (t.isAssignmentPattern(pattern)) {
    if (t.isLVal(pattern.left)) {
      collectParamNamesFromPattern(pattern.left, names);
    }
    return;
  }

  if (t.isRestElement(pattern)) {
    if (t.isIdentifier(pattern.argument)) {
      names.add(pattern.argument.name);
    } else if (t.isArrayPattern(pattern.argument)) {
      for (const element of pattern.argument.elements) {
        if (!element) continue;
        collectParamNamesFromPattern(element, names);
      }
    } else if (t.isObjectPattern(pattern.argument)) {
      for (const property of pattern.argument.properties) {
        if (t.isRestElement(property)) {
          collectParamNamesFromPattern(property, names);
        } else if (
          t.isObjectProperty(property) &&
          t.isPatternLike(property.value)
        ) {
          collectParamNamesFromPattern(property.value, names);
        }
      }
    }
    return;
  }

  if (t.isArrayPattern(pattern)) {
    for (const element of pattern.elements) {
      if (!element) continue;
      collectParamNamesFromPattern(element, names);
    }
    return;
  }

  if (t.isObjectPattern(pattern)) {
    for (const property of pattern.properties) {
      if (t.isRestElement(property)) {
        collectParamNamesFromPattern(property, names);
      } else if (
        t.isObjectProperty(property) &&
        t.isPatternLike(property.value)
      ) {
        collectParamNamesFromPattern(property.value, names);
      }
    }
  }
}

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
    const usedFunctions = new Set<string>();
    const usedApiEndpoints = new Set<string>();

    path.node.body.body.forEach((classElement) => {
      if (t.isClassMethod(classElement)) {
        const methodParamNames = new Set<string>();
        for (const param of classElement.params) {
          collectParamNamesFromPattern(param, methodParamNames);
        }

        for (const entityName of collectUsedEntities(classElement.body, {
          skipNestedScopes: false,
          localDeclarations: [...methodParamNames],
        })) {
          usedFunctions.add(entityName);
        }

        for (const endpointName of collectUsedApiEndpoints(classElement.body)) {
          usedApiEndpoints.add(endpointName);
        }

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
        for (const entityName of collectUsedEntities(classElement.value)) {
          usedFunctions.add(entityName);
        }

        for (const endpointName of collectUsedApiEndpoints(
          classElement.value,
        )) {
          usedApiEndpoints.add(endpointName);
        }

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
        usedFunctions: [...usedFunctions],
        usedApiEndpoints: [...usedApiEndpoints],
      };
    }

    return {
      kind: "class",
      name: className,
      superClass,
      methods,
      properties,
      path: pathParts,
      usedFunctions: [...usedFunctions],
      usedApiEndpoints: [...usedApiEndpoints],
    };
  }
}
