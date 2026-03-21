import * as t from "@babel/types";

function isNodeLike(value: unknown): value is t.Node {
  return (
    !!value &&
    typeof value === "object" &&
    "type" in value &&
    typeof (value as { type?: unknown }).type === "string"
  );
}

function readStaticString(node: t.Node | null | undefined): string | null {
  if (!node) return null;

  if (t.isStringLiteral(node)) {
    return node.value;
  }

  if (t.isTemplateLiteral(node) && node.expressions.length === 0) {
    return node.quasis.map((part) => part.value.cooked ?? "").join("");
  }

  return null;
}

function normalizeApiRoute(route: string): string | null {
  if (route.startsWith("/api")) {
    return route;
  }

  try {
    const parsed = new URL(route);
    if (parsed.pathname.startsWith("/api")) {
      return parsed.pathname;
    }
  } catch {
    return null;
  }

  return null;
}

function getFetchMethod(args: t.CallExpression["arguments"]): string {
  const init = args[1];
  if (!init || !t.isExpression(init) || !t.isObjectExpression(init)) {
    return "GET";
  }

  for (const property of init.properties) {
    if (!t.isObjectProperty(property)) continue;

    const key = property.key;
    const keyName =
      t.isIdentifier(key) ? key.name : t.isStringLiteral(key) ? key.value : null;

    if (keyName !== "method") continue;

    const methodLiteral = readStaticString(
      t.isExpression(property.value) ? property.value : null,
    );

    if (!methodLiteral) {
      return "GET";
    }

    return methodLiteral.toUpperCase();
  }

  return "GET";
}

function isFetchCall(callee: t.Expression | t.V8IntrinsicIdentifier): boolean {
  if (t.isIdentifier(callee)) {
    return callee.name === "fetch";
  }

  if (t.isMemberExpression(callee) && !callee.computed) {
    return t.isIdentifier(callee.property) && callee.property.name === "fetch";
  }

  return false;
}

export function collectUsedApiEndpoints(
  node: t.Node | null | undefined,
): string[] {
  if (!node) {
    return [];
  }

  const usedApiEndpoints = new Set<string>();

  const visit = (currentNode: t.Node | null | undefined): void => {
    if (!currentNode) return;

    if (t.isCallExpression(currentNode) && isFetchCall(currentNode.callee)) {
      const route = readStaticString(
        currentNode.arguments[0] && t.isExpression(currentNode.arguments[0])
          ? currentNode.arguments[0]
          : null,
      );

      const normalizedRoute = route ? normalizeApiRoute(route) : null;
      if (normalizedRoute) {
        const method = getFetchMethod(currentNode.arguments);
        usedApiEndpoints.add(`${method} ${normalizedRoute}`);
      }
    }

    const visitorKeys = t.VISITOR_KEYS[currentNode.type] ?? [];
    for (const childKey of visitorKeys) {
      const value = currentNode[childKey as keyof t.Node];
      if (Array.isArray(value)) {
        for (const child of value) {
          if (isNodeLike(child)) {
            visit(child);
          }
        }
      } else if (isNodeLike(value)) {
        visit(value);
      }
    }
  };

  visit(node);

  return [...usedApiEndpoints];
}
