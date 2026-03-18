import { CodeAnalyzerService } from "./lib/pipeline/CodeAnalyzerService";

export function main(path: string = process.cwd()) {
  try {
    const service = new CodeAnalyzerService(path);
    return service.analyze();
  } catch (err) {
    console.error("Błąd podczas analizy:", err);
    throw err;
  }
}

if (process.argv[1] && process.argv[1].endsWith("index.js")) {
  const graph = main();
  console.log(JSON.stringify(graph, null, 2));
}
