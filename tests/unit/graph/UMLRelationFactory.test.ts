import { UMLRelationFactory } from "../../../lib/graph/UMLRelationFactory";

describe("UMLRelationFactory", () => {
  it("creates inheritance relation", () => {
    const rel = UMLRelationFactory.createInheritance("1", "child", "parent");
    expect(rel).toEqual({
      id: "1",
      from: "child",
      to: "parent",
      type: "inheritance",
    });
  });

  it("creates implementation relation", () => {
    const rel = UMLRelationFactory.createImplementation(
      "2",
      "class",
      "interface",
    );
    expect(rel).toEqual({
      id: "2",
      from: "class",
      to: "interface",
      type: "implementation",
    });
  });

  it("creates association relation", () => {
    const rel = UMLRelationFactory.createAssociation("3", "A", "B");
    expect(rel).toEqual({
      id: "3",
      from: "A",
      to: "B",
      type: "association",
    });
  });

  it("creates aggregation relation", () => {
    const rel = UMLRelationFactory.createAggregation("4", "whole", "part");
    expect(rel).toEqual({
      id: "4",
      from: "whole",
      to: "part",
      type: "aggregation",
    });
  });

  it("creates composition relation", () => {
    const rel = UMLRelationFactory.createComposition("5", "owner", "owned");
    expect(rel).toEqual({
      id: "5",
      from: "owner",
      to: "owned",
      type: "composition",
    });
  });

  it("creates dependency relation", () => {
    const rel = UMLRelationFactory.createDependency("6", "client", "supplier");
    expect(rel).toEqual({
      id: "6",
      from: "client",
      to: "supplier",
      type: "dependency",
    });
  });

  it("creates api-usage relation", () => {
    const rel = UMLRelationFactory.createApiUsage("7", "consumer", "endpoint");
    expect(rel).toEqual({
      id: "7",
      from: "consumer",
      to: "endpoint",
      type: "api-usage",
    });
  });

  describe("createFromClass", () => {
    it("returns inheritance relation when superClass exists in classMap", () => {
      const classInfo = {
        kind: "class" as const,
        name: "Child",
        superClass: "Parent",
        methods: [],
        properties: [],
        path: ["Child.ts"],
      };
      const classMap = new Map([
        ["Child", "1"],
        ["Parent", "2"],
      ]);

      const rel = UMLRelationFactory.createFromClass(classInfo, "1", classMap);

      expect(rel).toEqual({
        id: "3",
        from: "1",
        to: "2",
        type: "inheritance",
      });
    });

    it("returns null when superClass is null", () => {
      const classInfo = {
        kind: "class" as const,
        name: "Base",
        superClass: null,
        methods: [],
        properties: [],
        path: ["Base.ts"],
      };
      const classMap = new Map([["Base", "1"]]);

      const rel = UMLRelationFactory.createFromClass(classInfo, "1", classMap);

      expect(rel).toBeNull();
    });

    it("returns null when superClass is not in classMap", () => {
      const classInfo = {
        kind: "class" as const,
        name: "Child",
        superClass: "UnknownParent",
        methods: [],
        properties: [],
        path: ["Child.ts"],
      };
      const classMap = new Map([["Child", "1"]]);

      const rel = UMLRelationFactory.createFromClass(classInfo, "1", classMap);

      expect(rel).toBeNull();
    });
  });
});
