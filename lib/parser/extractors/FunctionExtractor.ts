import type { NodePath } from "@babel/traverse";
import * as t from "@babel/types";
import { ParamStringifier } from "../ParamStringifier";
import { TypeAnnotationSerializer } from "../TypeAnnotationSerializer";
import { ComponentInfo, FunctionInfo } from "../models";
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

function functionReturnsJSX(path: NodePath<t.FunctionDeclaration>): boolean {
  let hasJSX = false;
  path.traverse({
    ReturnStatement(retPath) {
      const arg = retPath.node.argument;
      if (t.isJSXElement(arg) || t.isJSXFragment(arg)) {
        hasJSX = true;
        retPath.stop();
      }
    },
  });
  return hasJSX;
}

export class FunctionExtractor {
  static extract(
    path: NodePath<t.FunctionDeclaration>,
    sourceFilePath: string,
    pathParts: string[],
  ): FunctionInfo | ComponentInfo | null {
    const functionName = path.node.id?.name;
    if (!functionName) {
      return null;
    }

    const args = path.node.params.map((param) =>
      ParamStringifier.stringify(param),
    );
    const returnType =
      path.node.returnType && !t.isNoop(path.node.returnType)
        ? TypeAnnotationSerializer.serialize(
            path.node.returnType.typeAnnotation,
          )
        : null;

    const isJSXFile = /\.(jsx|tsx)$/i.test(sourceFilePath);
    const isComponentName = /^[A-Z]/.test(functionName);
    const hasJSXReturn = functionReturnsJSX(path);
    const shouldIncludeNestedScopes =
      isJSXFile && isComponentName && hasJSXReturn;

    const paramNames = new Set<string>();
    for (const param of path.node.params) {
      collectParamNamesFromPattern(param, paramNames);
    }
    const usedFunctions = collectUsedEntities(path.node.body, {
      skipNestedScopes: !shouldIncludeNestedScopes,
      localDeclarations: [...paramNames],
    });
    const usedApiEndpoints = collectUsedApiEndpoints(path.node.body);

    if (isJSXFile && isComponentName && hasJSXReturn) {
      return {
        kind: "component",
        name: functionName,
        superClass: null,
        methods: [],
        properties: [],
        path: pathParts,
        usedFunctions,
        usedApiEndpoints,
      };
    }

    return {
      kind: "function",
      name: functionName,
      path: pathParts,
      args,
      returnType,
      usedFunctions,
      usedApiEndpoints,
    };
  }
}
