console.log("Viz script loaded");

import { html, renderComponent } from "./js/preact-htm.js";
import { Vis1 } from "./js/Vis1.js";
import { Vis2 } from "./js/Vis2.js";

const Vis = async (props) => {
  // console.log("Rendering Vis component with props:", props);
  return html` <${props.component} ...${props} /> `;
};

function renderVis(vis) {
  const containerElement = document.getElementById(vis.id);
  if (containerElement) {
    // clear existing content before rendering
    containerElement.innerHTML = "";

    // wait for async Vis to resolve before rendering
    (async () => {
      const rendered = await Vis(vis);
      renderComponent(rendered, containerElement);
    })();
  } else {
    console.error(`Could not find container element for vis with id ${vis.id}`);
  }
}

renderVis({
  id: "vis-1",
  component: Vis1,
});

// renderVis({
//   id: "vis-2",
//   component: Vis2,
// });
