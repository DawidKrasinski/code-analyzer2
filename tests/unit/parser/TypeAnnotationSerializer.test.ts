import * as t from "@babel/types";
import { TypeAnnotationSerializer } from "../../../lib/parser/TypeAnnotationSerializer";

describe("TypeAnnotationSerializer", () => {
  it("serializes TS primitives", () => {
    expect(TypeAnnotationSerializer.serialize(t.tsStringKeyword())).toBe(
      "string",
    );
    expect(TypeAnnotationSerializer.serialize(t.tsNumberKeyword())).toBe(
      "number",
    );
    expect(TypeAnnotationSerializer.serialize(t.tsBooleanKeyword())).toBe(
      "boolean",
    );
  });

  it("serializes TS array and union types", () => {
    const arr = t.tsArrayType(t.tsStringKeyword());
    expect(TypeAnnotationSerializer.serialize(arr)).toBe("string[]");

    const union = t.tsUnionType([t.tsStringKeyword(), t.tsNumberKeyword()]);
    expect(TypeAnnotationSerializer.serialize(union)).toBe("string | number");
  });
});
