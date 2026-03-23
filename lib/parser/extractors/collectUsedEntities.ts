import * as t from "@babel/types";

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

function collectBindingNamesFromPattern(
  pattern: t.LVal | t.PatternLike,
  localDeclarations: Set<string>,
): void {
  if (t.isIdentifier(pattern)) {
    localDeclarations.add(pattern.name);
    return;
  }

  if (t.isRestElement(pattern)) {
    if (t.isLVal(pattern.argument)) {
      collectBindingNamesFromPattern(pattern.argument, localDeclarations);
    }
    return;
  }

  if (t.isAssignmentPattern(pattern)) {
    collectBindingNamesFromPattern(pattern.left, localDeclarations);
    return;
  }

  if (t.isObjectPattern(pattern)) {
    for (const property of pattern.properties) {
      if (t.isRestElement(property)) {
        if (t.isLVal(property.argument)) {
          collectBindingNamesFromPattern(property.argument, localDeclarations);
        }
      } else if (t.isObjectProperty(property)) {
        if (t.isLVal(property.value)) {
          collectBindingNamesFromPattern(property.value, localDeclarations);
        }
      }
    }
    return;
  }

  if (t.isArrayPattern(pattern)) {
    for (const element of pattern.elements) {
      if (!element) continue;
      if (t.isLVal(element)) {
        collectBindingNamesFromPattern(element, localDeclarations);
      }
    }
  }
}

function shouldCountIdentifierAsUsage(
  identifier: t.Identifier,
  parent: t.Node | null,
  key: string | null,
): boolean {
  if (!parent || !key) {
    return false;
  }

  if (identifier.name === "undefined") {
    return false;
  }

  if (parent.type.startsWith("TS")) {
    return false;
  }

  if (t.isVariableDeclarator(parent) && key === "id") return false;
  if (t.isFunctionDeclaration(parent) && (key === "id" || key === "params"))
    return false;
  if (t.isFunctionExpression(parent) && (key === "id" || key === "params"))
    return false;
  if (t.isArrowFunctionExpression(parent) && key === "params") return false;
  if (t.isClassDeclaration(parent) && key === "id") return false;
  if (t.isClassExpression(parent) && key === "id") return false;
  if (t.isCatchClause(parent) && key === "param") return false;

  if (
    (t.isMemberExpression(parent) || t.isOptionalMemberExpression(parent)) &&
    key === "property" &&
    !parent.computed
  ) {
    return false;
  }

  if (
    (t.isObjectProperty(parent) || t.isObjectMethod(parent)) &&
    key === "key"
  ) {
    return false;
  }

  if (t.isClassMethod(parent) && key === "key") return false;
  if (t.isClassProperty(parent) && key === "key") return false;
  if (t.isClassPrivateProperty(parent) && key === "key") return false;

  if (
    t.isImportSpecifier(parent) ||
    t.isImportDefaultSpecifier(parent) ||
    t.isImportNamespaceSpecifier(parent)
  ) {
    return false;
  }

  if (
    t.isExportSpecifier(parent) ||
    t.isExportDefaultSpecifier(parent) ||
    t.isExportNamespaceSpecifier(parent)
  ) {
    return false;
  }

  if (t.isLabeledStatement(parent) && key === "label") return false;
  if (t.isBreakStatement(parent) && key === "label") return false;
  if (t.isContinueStatement(parent) && key === "label") return false;

  if (t.isJSXAttribute(parent) || t.isJSXOpeningElement(parent)) {
    return false;
  }

  return true;
}

function collectLocalDeclarations(
  currentNode: t.Node | null | undefined,
  localDeclarations: Set<string>,
  isRoot: boolean,
  skipNestedScopes: boolean,
): void {
  if (!currentNode) return;
  if (skipNestedScopes && !isRoot && isNestedScope(currentNode)) return;

  if (
    t.isFunctionDeclaration(currentNode) ||
    t.isFunctionExpression(currentNode) ||
    t.isArrowFunctionExpression(currentNode)
  ) {
    for (const param of currentNode.params) {
      collectBindingNamesFromPattern(param, localDeclarations);
    }
  }

  if (t.isFunctionDeclaration(currentNode) && t.isIdentifier(currentNode.id)) {
    localDeclarations.add(currentNode.id.name);
  } else if (
    t.isClassDeclaration(currentNode) &&
    t.isIdentifier(currentNode.id)
  ) {
    localDeclarations.add(currentNode.id.name);
  } else if (t.isVariableDeclarator(currentNode)) {
    collectBindingNamesFromPattern(currentNode.id, localDeclarations);
  }

  const visitorKeys = t.VISITOR_KEYS[currentNode.type] ?? [];
  for (const childKey of visitorKeys) {
    const value = currentNode[childKey as keyof t.Node];
    if (Array.isArray(value)) {
      for (const child of value) {
        if (isNodeLike(child)) {
          collectLocalDeclarations(
            child,
            localDeclarations,
            false,
            skipNestedScopes,
          );
        }
      }
    } else if (isNodeLike(value)) {
      collectLocalDeclarations(
        value,
        localDeclarations,
        false,
        skipNestedScopes,
      );
    }
  }
}

export function collectUsedEntities(
  node: t.Node | null | undefined,
  options?: { skipNestedScopes?: boolean; localDeclarations?: string[] },
): string[] {
  if (!node) {
    return [];
  }

  const skipNestedScopes = options?.skipNestedScopes ?? true;
  const usedEntities = new Set<string>();
  const localDeclarations = new Set<string>();

  for (const localName of options?.localDeclarations ?? []) {
    localDeclarations.add(localName);
  }

  collectLocalDeclarations(node, localDeclarations, true, skipNestedScopes);

  const stack: Array<{
    currentNode: t.Node;
    parent: t.Node | null;
    key: string | null;
    isRoot: boolean;
  }> = [{ currentNode: node, parent: null, key: null, isRoot: true }];

  while (stack.length > 0) {
    const frame = stack.pop();
    if (!frame) continue;

    const { currentNode, parent, key, isRoot } = frame;
    if (skipNestedScopes && !isRoot && isNestedScope(currentNode)) {
      continue;
    }

    if (t.isIdentifier(currentNode)) {
      const isRootIdentifier = parent === null;
      if (
        (isRootIdentifier ||
          shouldCountIdentifierAsUsage(currentNode, parent, key)) &&
        !localDeclarations.has(currentNode.name)
      ) {
        usedEntities.add(currentNode.name);
      }
    }

    if (t.isJSXElement(currentNode)) {
      const openingElement = currentNode.openingElement;
      if (t.isJSXIdentifier(openingElement.name)) {
        const name = openingElement.name.name;
        if (!localDeclarations.has(name)) {
          usedEntities.add(name);
        }
      }
    }

    const visitorKeys = t.VISITOR_KEYS[currentNode.type] ?? [];
    for (const childKey of visitorKeys) {
      const value = currentNode[childKey as keyof t.Node];
      if (Array.isArray(value)) {
        for (const child of value) {
          if (isNodeLike(child)) {
            stack.push({
              currentNode: child,
              parent: currentNode,
              key: childKey,
              isRoot: false,
            });
          }
        }
      } else if (isNodeLike(value)) {
        stack.push({
          currentNode: value,
          parent: currentNode,
          key: childKey,
          isRoot: false,
        });
      }
    }
  }

  return [...usedEntities];
}
