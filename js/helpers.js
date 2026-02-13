export const REPO_BASE_URL =
  "https://raw.githubusercontent.com/parabolestudio/impcompetitorintelligence/refs/heads/main/";

// see color variable definitions in styles.css for actual color values
// 15+ -> black
// 13-14 -> pink
// 11-12 -> purple
// 9-10 -> orange
// 7-8 -> green
// 5-6 -> blue
// 4 -> dark grey
// 3 -> light grey
export const colorMapping = {
  1: "neutral-grey2",
  2: "neutral-grey2",
  3: "neutral-grey2",
  4: "neutral-grey1",
  5: "secondary-teal",
  6: "secondary-teal",
  7: "secondary-green",
  8: "secondary-green",
  9: "secondary-orange",
  10: "secondary-orange",
  11: "secondary-purple",
  12: "secondary-purple",
  13: "secondary-pink",
  14: "secondary-pink",
  15: "main-dark-blue",
};

export function numberMovesScale(number) {
  const scaleSize = d3.scaleLinear().domain([3, 15]).range([17, 38]);
  const size = scaleSize(number);
  return size;
}
