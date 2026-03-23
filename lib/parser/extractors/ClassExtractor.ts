import type { NodePath } from "@babel/traverse";
import * as t from "@babel/types";
import { ClassInfo, ComponentInfo } from "../models";
import { collectUsedApiEndpoints } from "./collectUsedApiEndpoints";
import { collectUsedEntities } from "./collectUsedEntities";

const PRIMITIVE_TS_TYPES = new Set([
  "string",
  "number",
  "boolean",
  "void",
  "any",
  "never",
  "unknown",
  "object",
  "null",
  "undefined",
  "symbol",
  "bigint",
  "Array",
  "Promise",
  "Record",
  "Map",
  "Set",
  "ReadonlyArray",
]);

function extractTypeRefIdentifiers(
  node: t.TSType | null | undefined,
  result: Set<string>,
): void {
  if (!node) return;

  if (t.isTSTypeReference(node) && t.isIdentifier(node.typeName)) {
    const name = node.typeName.name;
    if (!PRIMITIVE_TS_TYPES.has(name)) {
      result.add(name);
    }
    if (node.typeParameters) {
      for (const param of node.typeParameters.params) {
        extractTypeRefIdentifiers(param, result);
      }
    }
    return;
  }

  if (t.isTSArrayType(node)) {
    extractTypeRefIdentifiers(node.elementType, result);
    return;
  }

  if (t.isTSUnionType(node) || t.isTSIntersectionType(node)) {
    for (const type of node.types) {
      extractTypeRefIdentifiers(type, result);
    }
    return;
  }

  if (t.isTSParenthesizedType(node)) {
    extractTypeRefIdentifiers(node.typeAnnotation, result);
    return;
  }

  if (t.isTSOptionalType(node)) {
    extractTypeRefIdentifiers(node.typeAnnotation, result);
    return;
  }
}

function extractAnnotationTypes(
  annotation: t.TSTypeAnnotation | t.Noop | null | undefined,
  result: Set<string>,
): void {
  if (!annotation || t.isNoop(annotation)) return;
  extractTypeRefIdentifiers(annotation.typeAnnotation, result);
}

function collectNewExpressionNames(
  node: t.Node | null | undefined,
  result: Set<string>,
): void {
  if (!node) return;

  if (t.isNewExpression(node) && t.isIdentifier(node.callee)) {
    result.add(node.callee.name);
  }

  const visitorKeys = t.VISITOR_KEYS[node.type] ?? [];
  for (const key of visitorKeys) {
    const child = (node as unknown as Record<string, unknown>)[key];
    if (Array.isArray(child)) {
      for (const c of child) {
        if (
          c !== null &&
          typeof c === "object" &&
          "type" in c &&
          typeof (c as { type: unknown }).type === "string" &&
          (c as { type: string }).type in t.VISITOR_KEYS
        ) {
          collectNewExpressionNames(c as t.Node, result);
        }
      }
    } else if (
      child !== null &&
      typeof child === "object" &&
      "type" in child &&
      typeof (child as { type: unknown }).type === "string" &&
      (child as { type: string }).type in t.VISITOR_KEYS
    ) {
      collectNewExpressionNames(child as t.Node, result);
    }
  }
}

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

    // Extract implements clause names
    const implementsNames: string[] = (path.node.implements ?? [])
      .map((impl) => {
        if (t.isTSExpressionWithTypeArguments(impl)) {
          if (t.isIdentifier(impl.expression)) return impl.expression.name;
          if (
            t.isTSQualifiedName(impl.expression) &&
            t.isIdentifier(impl.expression.right)
          ) {
            return impl.expression.right.name;
          }
        }
        return null;
      })
      .filter((n): n is string => n !== null);

    const methods: string[] = [];
    const properties: string[] = [];
    const usedFunctions = new Set<string>();
    const usedApiEndpoints = new Set<string>();
    const newExpressions = new Set<string>();
    const constructorParamTypes = new Set<string>();
    const propertyTypes = new Set<string>();
    const methodParamTypes = new Set<string>();

    path.node.body.body.forEach((classElement) => {
      if (t.isClassMethod(classElement)) {
        const isConstructor = classElement.kind === "constructor";
        const methodParamNames = new Set<string>();

        for (const param of classElement.params) {
          collectParamNamesFromPattern(param, methodParamNames);

          // Extract TypeScript type annotations from constructor vs regular method params
          const actualParam = t.isTSParameterProperty(param)
            ? param.parameter
            : param;
          const typeAnnotation = t.isIdentifier(actualParam)
            ? actualParam.typeAnnotation
            : t.isObjectPattern(actualParam) ||
                t.isArrayPattern(actualParam) ||
                t.isRestElement(actualParam) ||
                t.isAssignmentPattern(actualParam)
              ? (actualParam as any).typeAnnotation
              : null;

          if (isConstructor) {
            extractAnnotationTypes(typeAnnotation, constructorParamTypes);
          } else {
            extractAnnotationTypes(typeAnnotation, methodParamTypes);
          }
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

        collectNewExpressionNames(classElement.body, newExpressions);

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
        // Extract type annotation from property declaration
        extractAnnotationTypes(
          classElement.typeAnnotation as t.TSTypeAnnotation | null,
          propertyTypes,
        );

        for (const entityName of collectUsedEntities(classElement.value)) {
          usedFunctions.add(entityName);
        }

        for (const endpointName of collectUsedApiEndpoints(
          classElement.value,
        )) {
          usedApiEndpoints.add(endpointName);
        }

        collectNewExpressionNames(classElement.value, newExpressions);

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
        implements: implementsNames,
        methods,
        properties,
        path: pathParts,
        newExpressions: [...newExpressions],
        constructorParamTypes: [...constructorParamTypes],
        propertyTypes: [...propertyTypes],
        methodParamTypes: [...methodParamTypes],
        usedFunctions: [...usedFunctions],
        usedApiEndpoints: [...usedApiEndpoints],
      };
    }

    return {
      kind: "class",
      name: className,
      superClass,
      implements: implementsNames,
      methods,
      properties,
      path: pathParts,
      newExpressions: [...newExpressions],
      constructorParamTypes: [...constructorParamTypes],
      propertyTypes: [...propertyTypes],
      methodParamTypes: [...methodParamTypes],
      usedFunctions: [...usedFunctions],
      usedApiEndpoints: [...usedApiEndpoints],
    };
  }
}
