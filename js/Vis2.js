import { html, useEffect, useState } from "./preact-htm.js";
// import { REPO_BASE_URL } from "./helpers.js";

export function Vis2() {
  const [data, setData] = useState(null);

  useEffect(() => {
    // Fetch data when the component mounts
    d3.csv(
      //   `${REPO_BASE_URL}/data/vis2_data.csv`,
      `./data/data_vis2.csv`,
    ).then((fetchedData) => {
      //   fetchedData.forEach((d) => {
      //     d["uninstallRate"] = +d["uninstall_rate"].replace("%", "");
      //   });

      setData(fetchedData);
    });
  }, []);

  if (!data) {
    return html`<div>Loading data...</div>`;
  }

  console.log("Rendering vis 2 with ", {
    data,
  });

  // dimensions
  const visContainer = document.querySelector("#vis-2");
  const width =
    visContainer && visContainer.offsetWidth ? visContainer.offsetWidth : 600;
  const height = 400;
  const margin = {
    top: 20,
    right: 20,
    bottom: 20,
    left: 20,
  };

  const innerWidth = width - margin.left - margin.right;
  const innerHeight = height - margin.top - margin.bottom;

  return html`<div>
    <svg viewBox="0 0 ${width} ${height}">
      <g transform="translate(${margin.left}, ${margin.top})">
        <rect
          width="${innerWidth}"
          height="${innerHeight}"
          fill="#f2f2f2"
          stroke="none"
        />
      </g>
    </svg>
  </div>`;
}
