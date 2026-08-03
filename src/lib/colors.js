// VGA 16-colour palette, darkened where the true values were unreadable against
// the chatroom's white log background -- yellow especially.
export const NAME_COLORS = {
  blue: "#0000AA",
  red: "#AA0000",
  green: "#008000",
  pink: "#CC00AA",
  gray: "#555555",
  yellow: "#8A6D00",
  purple: "#7700CC",
  orange: "#CC5500",
};

export const DEFAULT_COLOR_KEY = "blue";

/**
 * Always returns a valid key, so callers can index NAME_COLORS unguarded.
 *
 * @param {unknown} value
 * @returns {keyof typeof NAME_COLORS}
 */
export function toColorKey(value) {
  return typeof value === "string" && Object.hasOwn(NAME_COLORS, value)
    ? value
    : DEFAULT_COLOR_KEY;
}
