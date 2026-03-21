import { UMLRelationFactory } from "../../../lib/graph/UMLRelationFactory";

describe("UMLRelationFactory", () => {
  it("creates inheritance relation", () => {
    const rel = UMLRelationFactory.createInheritance("1", "2", "3");
    expect(rel).toEqual({ id: "1", from: "2", to: "3", type: "inheritance" });
  });

  it("creates dependency relation", () => {
    const rel = UMLRelationFactory.createDependency("2", "3", "4");
    expect(rel).toEqual({ id: "2", from: "3", to: "4", type: "dependency" });
  });
});
