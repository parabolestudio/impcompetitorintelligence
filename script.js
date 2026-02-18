console.log("Viz script loaded");

import { renderVis } from "./js/lib.js";
import { Vis1 } from "./js/Vis1.js";
import { Vis2 } from "./js/Vis2.js";

// renderVis({
//   id: "vis-1",
//   component: Vis1,
// });

renderVis({
  id: "vis-2",
  component: Vis2,
});
