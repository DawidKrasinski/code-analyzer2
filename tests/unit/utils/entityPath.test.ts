import {
  getSharedPrefixSegments,
  joinPathParts,
  splitToCommonRelativePath,
} from "../../../lib/utils/entityPath";

describe("entityPath utils", () => {
  it("computes shared prefix and splits path to first different segment", () => {
    const filePaths = [
      "/home/dawid/Projects/code-analyzer3/template/app/page.tsx",
      "/home/dawid/Projects/code-analyzer3/template/components/UMLClassElement.tsx",
    ];

    const prefix = getSharedPrefixSegments(filePaths);
    const parts = splitToCommonRelativePath(filePaths[0], prefix);

    expect(parts).toEqual(["app", "page.tsx"]);
  });

  it("joins path parts using slash", () => {
    expect(joinPathParts(["template", "app", "page.tsx"])).toBe(
      "template/app/page.tsx",
    );
  });
});
