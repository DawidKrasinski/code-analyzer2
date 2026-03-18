import * as t from "@babel/types";
import { ParamStringifier } from "../../../lib/parser/ParamStringifier";

describe("ParamStringifier", () => {
  it("formats simple identifier with type annotation", () => {
    const param = t.identifier("x");
    param.typeAnnotation = t.tsTypeAnnotation(t.tsStringKeyword());
    expect(ParamStringifier.stringify(param)).toBe("x: string");
  });

  it("formats rest params", () => {
    const param = t.restElement(t.identifier("args"));
    expect(ParamStringifier.stringify(param)).toBe("...args: any");
  });
});
