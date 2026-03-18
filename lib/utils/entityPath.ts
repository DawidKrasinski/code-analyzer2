import path from "path";

function splitPathSegments(filePath: string): string[] {
  const normalized = path.normalize(filePath);
  return normalized.split(path.sep).filter(Boolean);
}

function commonPrefixLength(paths: string[][]): number {
  if (paths.length === 0) return 0;

  const minLen = Math.min(...paths.map((parts) => parts.length));
  let index = 0;

  while (index < minLen) {
    const expected = paths[0][index];
    if (!paths.every((parts) => parts[index] === expected)) {
      break;
    }
    index += 1;
  }

  return index;
}

export function getSharedPrefixSegments(filePaths: string[]): string[] {
  const splitPaths = filePaths.map(splitPathSegments);
  const prefixLen = commonPrefixLength(splitPaths);
  return splitPaths[0]?.slice(0, prefixLen) ?? [];
}

export function splitToCommonRelativePath(
  filePath: string,
  sharedPrefixSegments: string[],
): string[] {
  const segments = splitPathSegments(filePath);
  const prefixLen = sharedPrefixSegments.length;
  const withoutPrefix = segments.slice(prefixLen);

  if (withoutPrefix.length > 0) {
    return withoutPrefix;
  }

  return segments.length > 0 ? [segments[segments.length - 1]] : [filePath];
}

export function joinPathParts(parts: string[]): string {
  return parts.join("/");
}
