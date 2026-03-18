import * as t from "@babel/types";

export class TypeAnnotationSerializer {
  static serialize(type: any): string {
    if (!type) return "any";
    return TypeAnnotationSerializer.serializeType(type);
  }

  private static serializeType(type: any): string {
    if (!type) return "any";

    if (t.isTSTypeAnnotation(type)) {
      return TypeAnnotationSerializer.serializeType(type.typeAnnotation);
    }
    if (t.isTSStringKeyword(type)) return "string";
    if (t.isTSNumberKeyword(type)) return "number";
    if (t.isTSBooleanKeyword(type)) return "boolean";
    if (t.isTSAnyKeyword(type)) return "any";
    if (t.isTSVoidKeyword(type)) return "void";
    if (t.isTSUnknownKeyword(type)) return "unknown";
    if (t.isTSNeverKeyword(type)) return "never";

    if (t.isTSTypeReference(type)) {
      const typeName = type.typeName;
      const name = t.isIdentifier(typeName) ? typeName.name : "unknown";
      if (type.typeParameters?.params?.length) {
        const params = type.typeParameters.params
          .map((p: any) => TypeAnnotationSerializer.serializeType(p))
          .join(", ");
        return `${name}<${params}>`;
      }
      return name;
    }

    if (t.isTSUnionType(type)) {
      return type.types
        .map((entry: any) => TypeAnnotationSerializer.serializeType(entry))
        .join(" | ");
    }

    if (t.isTSLiteralType(type)) {
      const lit = type.literal;
      if (t.isStringLiteral(lit)) return JSON.stringify(lit.value);
      if (t.isNumericLiteral(lit)) return `${lit.value}`;
      if (t.isBooleanLiteral(lit)) return `${lit.value}`;
      return "literal";
    }

    if (t.isTSArrayType(type)) {
      return `${TypeAnnotationSerializer.serializeType(type.elementType)}[]`;
    }

    if (t.isTSParenthesizedType(type)) {
      return `(${TypeAnnotationSerializer.serializeType(type.typeAnnotation)})`;
    }

    if (t.isTSQualifiedName(type)) {
      const left = t.isIdentifier(type.left) ? type.left.name : "?";
      const right = t.isIdentifier(type.right) ? type.right.name : "?";
      return `${left}.${right}`;
    }

    if (t.isTSTypeLiteral(type)) {
      return "{ ... }";
    }

    return "any";
  }
}
