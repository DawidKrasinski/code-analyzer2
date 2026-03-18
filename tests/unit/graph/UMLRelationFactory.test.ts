import { UMLRelationFactory } from "../../../lib/graph/UMLRelationFactory";

describe("UMLRelationFactory", () => {
  it("creates inheritance relation", () => {
    const rel = UMLRelationFactory.createInheritance("1", "2", "3");
    expect(rel).toEqual({ id: "1", from: "2", to: "3", type: "inheritance" });
  });
});
