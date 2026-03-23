import { withTempDir, makeFile } from "../../utils/testUtils";
import path from "path";
import { CodeAnalyzerService } from "../../../lib/pipeline/CodeAnalyzerService";

describe("CodeAnalyzerService", () => {
  it("runs the full pipeline and returns a UML graph", () => {
    withTempDir((tmpDir: string) => {
      const file = path.join(tmpDir, "A.ts");
      makeFile(file, `export class A {}\nexport function f() { return 1; }\n`);

      const graph = new CodeAnalyzerService(tmpDir).analyze();
      expect(graph.nodes).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ name: "A", type: "class" }),
          expect.objectContaining({ name: "f", type: "function" }),
        ]),
      );
    });
  });

  it("parses and maps all class relation types from source code", () => {
    withTempDir((tmpDir: string) => {
      const file = path.join(tmpDir, "relations.ts");
      makeFile(
        file,
        `
export class Parent {}
export class Contract {}
export class Engine {}
export class Logger {}
export class Address {}
export class Request {}

export function helper() { return 1; }

export class Child extends Parent implements Contract {
  engine = new Engine();
  address!: Address;

  constructor(private logger: Logger) {}

  handle(request: Request) {
    return helper() + (request ? 1 : 0);
  }
}
`,
      );

      const graph = new CodeAnalyzerService(tmpDir).analyze();

      const getNodeId = (name: string) =>
        graph.nodes.find((node) => node.name === name)?.id;

      const childId = getNodeId("Child");
      const parentId = getNodeId("Parent");
      const contractId = getNodeId("Contract");
      const engineId = getNodeId("Engine");
      const loggerId = getNodeId("Logger");
      const addressId = getNodeId("Address");
      const requestId = getNodeId("Request");
      const helperId = getNodeId("helper");

      expect(childId).toBeDefined();
      expect(parentId).toBeDefined();
      expect(contractId).toBeDefined();
      expect(engineId).toBeDefined();
      expect(loggerId).toBeDefined();
      expect(addressId).toBeDefined();
      expect(requestId).toBeDefined();
      expect(helperId).toBeDefined();

      expect(graph.relations).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            from: childId,
            to: parentId,
            type: "inheritance",
          }),
          expect.objectContaining({
            from: childId,
            to: contractId,
            type: "implementation",
          }),
          expect.objectContaining({
            from: childId,
            to: engineId,
            type: "composition",
          }),
          expect.objectContaining({
            from: childId,
            to: loggerId,
            type: "aggregation",
          }),
          expect.objectContaining({
            from: childId,
            to: addressId,
            type: "association",
          }),
          expect.objectContaining({
            from: childId,
            to: requestId,
            type: "dependency",
          }),
          expect.objectContaining({
            from: childId,
            to: helperId,
            type: "dependency",
          }),
        ]),
      );
    });
  });

  it("treats dependency as fallback when stronger relation exists for same pair", () => {
    withTempDir((tmpDir: string) => {
      const file = path.join(tmpDir, "fallback.ts");
      makeFile(
        file,
        `
export class Engine {}

export class App {
  create() {
    const local = new Engine();
    return local ? Engine : null;
  }
}
`,
      );

      const graph = new CodeAnalyzerService(tmpDir).analyze();

      const appId = graph.nodes.find((node) => node.name === "App")?.id;
      const engineId = graph.nodes.find((node) => node.name === "Engine")?.id;

      expect(appId).toBeDefined();
      expect(engineId).toBeDefined();

      expect(graph.relations).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            from: appId,
            to: engineId,
            type: "composition",
          }),
        ]),
      );
      expect(graph.relations).not.toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            from: appId,
            to: engineId,
            type: "dependency",
          }),
        ]),
      );
    });
  });
});
