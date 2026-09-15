const POST_ID_ALPHABET = "abcdefghijklmnopqrstuvwxyz0123456789";

export const POST_ID_LENGTH = 6;
export const POST_ID_PATTERN = /^[a-z0-9]{6}$/;

export function createPostId(randomValues?: Uint8Array) {
  const values =
    randomValues ?? crypto.getRandomValues(new Uint8Array(POST_ID_LENGTH));
  if (values.length !== POST_ID_LENGTH)
    throw new Error("POST_ID_RANDOM_LENGTH_INVALID");
  return Array.from(
    values,
    (value) => POST_ID_ALPHABET[value % POST_ID_ALPHABET.length],
  ).join("");
}

export function isPostId(value: string) {
  return POST_ID_PATTERN.test(value);
}
