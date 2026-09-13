export function markdownToPlainText(markdown: string) {
  return markdown
    .replace(/!\[([^\]]*)\]\([^)]*\)/g, "$1")
    .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
    .replace(/<[^>]+>/g, "")
    .replace(/^\s{0,3}(#{1,6}|>|[-+*]|\d+\.)\s+/gm, "")
    .replace(/(\*\*|__|~~|`|\*|_)/g, "")
    .replace(/\s+/g, " ")
    .trim();
}
