import { UMLNodeFactory } from "../../../lib/graph/UMLNodeFactory";
import { CodeEntity } from "../../../lib/parser/models";

describe("UMLNodeFactory", () => {
  it("creates class and function nodes", () => {
    const classEntity: CodeEntity = {
      kind: "class",
      name: "A",
      superClass: null,
      methods: ["m"],
      properties: ["p"],
      path: "A.ts",
    };
    const fnEntity: CodeEntity = {
      kind: "function",
      name: "doIt",
      path: "A.ts",
      args: ["x: number"],
      returnType: "void",
    };

    expect(UMLNodeFactory.create(classEntity, "1")).toEqual(
      expect.objectContaining({ type: "class" }),
    );
    expect(UMLNodeFactory.create(fnEntity, "2")).toEqual(
      expect.objectContaining({ type: "function" }),
    );
  });
});
