console.log("Viz script loaded");

import { renderVis } from "./js/lib.js";
import { Vis1 } from "./js/Vis1.js";
import { Vis2 } from "./js/Vis2.js";

renderVis({
  id: "vis-1",
  component: Vis1,
});

renderVis({
  id: "vis-2",
  component: Vis2,
});

// with JavaScript detect a div with the min-height of 880px and the class bubble-element and "CustomElement" and adjust the inline style setting of height to 985px
const bubbleElements = document.querySelectorAll(
  ".bubble-element.CustomElement",
);
bubbleElements.forEach((element) => {
  const minHeight = parseInt(window.getComputedStyle(element).minHeight);
  if (minHeight === 880) {
    element.style.height = "985px";
  }
});
