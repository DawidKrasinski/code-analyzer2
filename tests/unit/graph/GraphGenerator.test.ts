import { GraphGenerator } from "../../../lib/graph/GraphGenerator";
import { CodeEntity } from "../../../lib/parser/models";

describe("GraphGenerator", () => {
  it("builds nodes and inheritance relations", () => {
    const entities: CodeEntity[] = [
      {
        kind: "class",
        name: "A",
        superClass: null,
        implements: [],
        methods: [],
        properties: [],
        path: ["A.ts"],
        usedFunctions: ["f", "f"],
      },
      {
        kind: "class",
        name: "B",
        superClass: "A",
        implements: [],
        methods: [],
        properties: [],
        path: ["B.ts"],
        usedFunctions: ["f"],
      },
      {
        kind: "function",
        name: "f",
        path: ["A.ts"],
        args: [],
        returnType: null,
      },
    ];

    const g = new GraphGenerator(entities).generate();
    expect(g.nodes).toHaveLength(3);
    expect(g.relations).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ from: "2", to: "1", type: "inheritance" }),
        expect.objectContaining({ from: "1", to: "3", type: "dependency" }),
        expect.objectContaining({ from: "2", to: "3", type: "dependency" }),
      ]),
    );
    expect(g.relations).toHaveLength(3);
  });

  it("maps all used-functions relations to dependency", () => {
    const entities: CodeEntity[] = [
      {
        kind: "function",
        name: "helper",
        path: ["globals.ts"],
        args: [],
        returnType: null,
      },
      {
        kind: "class",
        name: "Store",
        superClass: null,
        implements: [],
        methods: [],
        properties: [],
        path: ["globals.ts"],
        usedFunctions: ["config"],
      },
      {
        kind: "variable",
        name: "config",
        path: ["globals.ts"],
        usedFunctions: ["helper", "Store"],
      },
    ];

    const g = new GraphGenerator(entities).generate();

    expect(g.nodes).toHaveLength(3);
    expect(g.relations).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ from: "2", to: "3", type: "dependency" }),
        expect.objectContaining({ from: "3", to: "1", type: "dependency" }),
        expect.objectContaining({ from: "3", to: "2", type: "dependency" }),
      ]),
    );
  });

  it("maps GET fetch usage to GET API endpoint node", () => {
    const entities: CodeEntity[] = [
      {
        kind: "function",
        name: "Home",
        path: ["template", "app", "page.tsx"],
        args: [],
        returnType: null,
        usedApiEndpoints: ["GET /api"],
      },
      {
        kind: "function",
        name: "GET /api",
        path: ["template", "app", "api", "route.ts"],
        args: [],
        returnType: null,
        usedFunctions: ["start"],
      },
      {
        kind: "function",
        name: "start",
        path: ["index.ts"],
        args: [],
        returnType: "UMLGraph",
      },
    ];

    const g = new GraphGenerator(entities).generate();

    expect(g.relations).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ from: "1", to: "2", type: "api-usage" }),
        expect.objectContaining({ from: "2", to: "3", type: "dependency" }),
      ]),
    );
  });

  it("creates self dependency for recursive function", () => {
    const entities: CodeEntity[] = [
      {
        kind: "function",
        name: "factorial",
        path: ["math.ts"],
        args: ["n: number"],
        returnType: "number",
        usedFunctions: ["factorial"],
      },
    ];

    const g = new GraphGenerator(entities).generate();

    expect(g.relations).toEqual([
      expect.objectContaining({
        from: "1",
        to: "1",
        type: "dependency",
      }),
    ]);
  });

  describe("relation type classification", () => {
    it("creates implementation relation when class implements an interface", () => {
      const entities: CodeEntity[] = [
        {
          kind: "class",
          name: "IRepository",
          superClass: null,
          methods: [],
          properties: [],
          path: ["IRepository.ts"],
        },
        {
          kind: "class",
          name: "UserRepository",
          superClass: null,
          methods: [],
          properties: [],
          path: ["UserRepository.ts"],
          implements: ["IRepository"],
        },
      ];

      const g = new GraphGenerator(entities).generate();

      expect(g.relations).toEqual([
        expect.objectContaining({
          from: "2",
          to: "1",
          type: "implementation",
        }),
      ]);
    });

    it("creates composition relation when class instantiates another with new", () => {
      const entities: CodeEntity[] = [
        {
          kind: "class",
          name: "Engine",
          superClass: null,
          methods: [],
          properties: [],
          path: ["Engine.ts"],
        },
        {
          kind: "class",
          name: "Car",
          superClass: null,
          methods: [],
          properties: [],
          path: ["Car.ts"],
          usedFunctions: ["Engine"],
          newExpressions: ["Engine"],
        },
      ];

      const g = new GraphGenerator(entities).generate();

      expect(g.relations).toEqual([
        expect.objectContaining({ from: "2", to: "1", type: "composition" }),
      ]);
    });

    it("creates aggregation relation when class receives another via constructor param type", () => {
      const entities: CodeEntity[] = [
        {
          kind: "class",
          name: "Logger",
          superClass: null,
          methods: [],
          properties: [],
          path: ["Logger.ts"],
        },
        {
          kind: "class",
          name: "Service",
          superClass: null,
          methods: [],
          properties: [],
          path: ["Service.ts"],
          constructorParamTypes: ["Logger"],
        },
      ];

      const g = new GraphGenerator(entities).generate();

      expect(g.relations).toEqual([
        expect.objectContaining({ from: "2", to: "1", type: "aggregation" }),
      ]);
    });

    it("creates association relation when class has property typed as another class", () => {
      const entities: CodeEntity[] = [
        {
          kind: "class",
          name: "Address",
          superClass: null,
          methods: [],
          properties: [],
          path: ["Address.ts"],
        },
        {
          kind: "class",
          name: "Person",
          superClass: null,
          methods: [],
          properties: [],
          path: ["Person.ts"],
          propertyTypes: ["Address"],
        },
      ];

      const g = new GraphGenerator(entities).generate();

      expect(g.relations).toEqual([
        expect.objectContaining({ from: "2", to: "1", type: "association" }),
      ]);
    });

    it("creates dependency relation when method parameter is typed as another class", () => {
      const entities: CodeEntity[] = [
        {
          kind: "class",
          name: "Request",
          superClass: null,
          methods: [],
          properties: [],
          path: ["Request.ts"],
        },
        {
          kind: "class",
          name: "Handler",
          superClass: null,
          methods: [],
          properties: [],
          path: ["Handler.ts"],
          methodParamTypes: ["Request"],
        },
      ];

      const g = new GraphGenerator(entities).generate();

      expect(g.relations).toEqual([
        expect.objectContaining({ from: "2", to: "1", type: "dependency" }),
      ]);
    });

    it("prefers composition over dependency when both new and used-function exist", () => {
      const entities: CodeEntity[] = [
        {
          kind: "class",
          name: "Database",
          superClass: null,
          methods: [],
          properties: [],
          path: ["Database.ts"],
        },
        {
          kind: "class",
          name: "App",
          superClass: null,
          methods: [],
          properties: [],
          path: ["App.ts"],
          usedFunctions: ["Database"],
          newExpressions: ["Database"],
        },
      ];

      const g = new GraphGenerator(entities).generate();

      expect(g.relations).toEqual([
        expect.objectContaining({ from: "2", to: "1", type: "composition" }),
      ]);
      expect(g.relations).not.toEqual(
        expect.arrayContaining([
          expect.objectContaining({ type: "dependency" }),
        ]),
      );
    });

    it("prefers aggregation over association when constructor param type matches property type", () => {
      const entities: CodeEntity[] = [
        {
          kind: "class",
          name: "Logger",
          superClass: null,
          methods: [],
          properties: [],
          path: ["Logger.ts"],
        },
        {
          kind: "class",
          name: "Service",
          superClass: null,
          methods: [],
          properties: [],
          path: ["Service.ts"],
          propertyTypes: ["Logger"],
          constructorParamTypes: ["Logger"],
        },
      ];

      const g = new GraphGenerator(entities).generate();

      expect(g.relations).toEqual([
        expect.objectContaining({ from: "2", to: "1", type: "aggregation" }),
      ]);
    });

    it("creates separate relations for different targets with different types", () => {
      const entities: CodeEntity[] = [
        {
          kind: "class",
          name: "Engine",
          superClass: null,
          methods: [],
          properties: [],
          path: ["Engine.ts"],
        },
        {
          kind: "class",
          name: "Logger",
          superClass: null,
          methods: [],
          properties: [],
          path: ["Logger.ts"],
        },
        {
          kind: "class",
          name: "Request",
          superClass: null,
          methods: [],
          properties: [],
          path: ["Request.ts"],
        },
        {
          kind: "class",
          name: "Car",
          superClass: null,
          methods: [],
          properties: [],
          path: ["Car.ts"],
          usedFunctions: ["Engine"],
          newExpressions: ["Engine"],
          constructorParamTypes: ["Logger"],
          methodParamTypes: ["Request"],
        },
      ];

      const g = new GraphGenerator(entities).generate();

      expect(g.relations).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            from: "4",
            to: "1",
            type: "composition",
          }),
          expect.objectContaining({
            from: "4",
            to: "2",
            type: "aggregation",
          }),
          expect.objectContaining({
            from: "4",
            to: "3",
            type: "dependency",
          }),
        ]),
      );
    });

    it("keeps inheritance separate from other relation types", () => {
      const entities: CodeEntity[] = [
        {
          kind: "class",
          name: "Base",
          superClass: null,
          methods: [],
          properties: [],
          path: ["Base.ts"],
        },
        {
          kind: "class",
          name: "Logger",
          superClass: null,
          methods: [],
          properties: [],
          path: ["Logger.ts"],
        },
        {
          kind: "class",
          name: "Child",
          superClass: "Base",
          methods: [],
          properties: [],
          path: ["Child.ts"],
          constructorParamTypes: ["Logger"],
        },
      ];

      const g = new GraphGenerator(entities).generate();

      expect(g.relations).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            from: "3",
            to: "1",
            type: "inheritance",
          }),
          expect.objectContaining({
            from: "3",
            to: "2",
            type: "aggregation",
          }),
        ]),
      );
    });
  });
});
