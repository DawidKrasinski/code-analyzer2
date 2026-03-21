import type { NodePath } from "@babel/traverse";
import * as t from "@babel/types";
import { ParamStringifier } from "../ParamStringifier";
import { TypeAnnotationSerializer } from "../TypeAnnotationSerializer";
import { ComponentInfo, FunctionInfo } from "../models";

function isNestedScope(node: t.Node): boolean {
  return (
    t.isFunctionDeclaration(node) ||
    t.isFunctionExpression(node) ||
    t.isArrowFunctionExpression(node) ||
    t.isClassDeclaration(node) ||
    t.isClassExpression(node)
  );
}

function isNodeLike(value: unknown): value is t.Node {
  return (
    !!value &&
    typeof value === "object" &&
    "type" in value &&
    typeof (value as { type?: unknown }).type === "string"
  );
}

function collectUsedEntities(node: t.Node | null | undefined): string[] {
  if (!node) {
    return [];
  }

  const usedEntities = new Set<string>();
  const localDeclarations = new Set<string>();

  // First pass: collect locally declared names (parameters, variable/function/class declarations)
  const collectLocalDeclarations = (currentNode: t.Node | null | undefined, isRoot = false) => {
    if (!currentNode) return;
    if (!isRoot && isNestedScope(currentNode)) return;

    // Collect function parameters
    if (t.isFunctionDeclaration(currentNode) || t.isFunctionExpression(currentNode) || t.isArrowFunctionExpression(currentNode)) {
      if ((currentNode as any).params) {
        for (const param of (currentNode as any).params) {
          if (t.isIdentifier(param)) {
            localDeclarations.add(param.name);
          }
        }
      }
    }

    // Collect function/class/variable declarations
    if (t.isFunctionDeclaration(currentNode) && t.isIdentifier(currentNode.id)) {
      localDeclarations.add(currentNode.id.name);
    } else if (t.isClassDeclaration(currentNode) && t.isIdentifier(currentNode.id)) {
      localDeclarations.add(currentNode.id.name);
    } else if (t.isVariableDeclarator(currentNode) && t.isIdentifier(currentNode.id)) {
      localDeclarations.add(currentNode.id.name);
    }

    const visitorKeys = t.VISITOR_KEYS[currentNode.type] ?? [];
    for (const key of visitorKeys) {
      const value = currentNode[key as keyof t.Node];
      if (Array.isArray(value)) {
        for (const child of value) {
          if (isNodeLike(child)) collectLocalDeclarations(child, false);
        }
      } else if (isNodeLike(value)) {
        collectLocalDeclarations(value, false);
      }
    }
  };

  // Second pass: collect used entities
  const visit = (currentNode: t.Node | null | undefined, isRoot = false) => {
    if (!currentNode) return;
    if (!isRoot && isNestedScope(currentNode)) return;

    // Collect function calls: funcName()
    if (t.isCallExpression(currentNode) || t.isOptionalCallExpression(currentNode)) {
      const callee = currentNode.callee;
      if (t.isIdentifier(callee)) {
        if (!localDeclarations.has(callee.name)) {
          usedEntities.add(callee.name);
        }
      }
    }

    // Collect JSX element usage: <ComponentName />
    if (t.isJSXElement(currentNode)) {
      const openingElement = currentNode.openingElement;
      if (t.isJSXIdentifier(openingElement.name)) {
        const name = openingElement.name.name;
        if (!localDeclarations.has(name)) {
          usedEntities.add(name);
        }
      }
    }

    // Collect class instantiation: new ClassName()
    if (t.isNewExpression(currentNode)) {
      const callee = currentNode.callee;
      if (t.isIdentifier(callee)) {
        if (!localDeclarations.has(callee.name)) {
          usedEntities.add(callee.name);
        }
      }
    }

    const visitorKeys = t.VISITOR_KEYS[currentNode.type] ?? [];
    for (const key of visitorKeys) {
      const value = currentNode[key as keyof t.Node];
      if (Array.isArray(value)) {
        for (const child of value) {
          if (isNodeLike(child)) visit(child);
        }
      } else if (isNodeLike(value)) {
        visit(value);
      }
    }
  };

  collectLocalDeclarations(node, true);
  visit(node, true);
  return [...usedEntities];
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
    const usedFunctions = collectUsedEntities(path.node.body);

    const isJSXFile = /\.(jsx|tsx)$/i.test(sourceFilePath);
    const isComponentName = /^[A-Z]/.test(functionName);
    const hasJSXReturn = functionReturnsJSX(path);

    if (isJSXFile && isComponentName && hasJSXReturn) {
      return {
        kind: "component",
        name: functionName,
        superClass: null,
        methods: [],
        properties: [],
        path: pathParts,
        usedFunctions,
      };
    }

    return {
      kind: "function",
      name: functionName,
      path: pathParts,
      args,
      returnType,
      usedFunctions,
    };
  }
}
