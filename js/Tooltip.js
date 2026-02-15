import { html } from "./preact-htm.js";

export function Tooltip({ hoveredItem }) {
  if (!hoveredItem || !hoveredItem.tooltipContent) return null;

  return html`<div
    class="tooltip"
    style="left: ${hoveredItem.x +
    20}px; top: ${hoveredItem.y}px; transform: translateY(-50%);"
  >
    ${"tooltipUpperContent" in hoveredItem
      ? hoveredItem.tooltipUpperContent
      : null}
    ${hoveredItem.tooltipContent.map(
      (item) =>
        html` <div>
          <p class="tooltip-label">${item.label}</p>
          <p class="tooltip-value">${item.value}</p>
        </div>`,
    )}
  </div>`;
}
