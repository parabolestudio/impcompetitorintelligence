import { html, useRef } from "./lib.js";

export function Tooltip({ hoveredItem }) {
  const lastItemRef = useRef(null);

  // Keep the last known item so position/content doesn't jump while fading out
  if (hoveredItem && hoveredItem.tooltipContent) {
    lastItemRef.current = hoveredItem;
  }

  const displayItem = lastItemRef.current;
  const isVisible = hoveredItem !== null && hoveredItem.tooltipContent != null;

  if (!displayItem) {
    return html`<div class="tooltip" style="opacity: 0;"></div>`;
  }

  return html`<div
    class="tooltip"
    style="left: ${displayItem.x +
    20}px; top: ${displayItem.y}px; transform: translateY(-50%); opacity: ${isVisible
      ? 1
      : 0};"
  >
    ${"tooltipUpperContent" in displayItem
      ? displayItem.tooltipUpperContent
      : null}
    ${displayItem.tooltipContent.map(
      (item) =>
        html` <div>
          <p class="tooltip-label">${item.label}</p>
          <p class="tooltip-value">${item.value}</p>
        </div>`,
    )}
  </div>`;
}
