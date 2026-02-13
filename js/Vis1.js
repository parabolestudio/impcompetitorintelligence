import { html, useEffect, useState } from "./preact-htm.js";
import Diamond from "./Diamond.js";
import { Company, CompanyWithDiamond } from "./Company.js";
// import { REPO_BASE_URL } from "./helpers.js";

export function Vis1() {
  const [data, setData] = useState(null);

  useEffect(() => {
    // Fetch data when the component mounts
    d3.csv(
      //   `${REPO_BASE_URL}/data/vis1_data.csv`,
      `./data/data_vis1.csv`,
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

  console.log("Rendering vis 1 with ", {
    data,
  });

  // dimensions
  const visContainer = document.querySelector("#vis-1");
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

  const config = window.customChartsConfig || {};

  return html`<div class="vis-container">
    <p class="vis-title">${config?.vis1?.title || "Title for Vis 1"}</p>
    <p class="vis-subtitle">
      ${config?.vis1?.subtitle || "Subtitle for Vis 1"}
    </p>
    <svg viewBox="0 0 ${width} ${height}" style="background: #ccc;">
      <g transform="translate(${margin.left}, ${margin.top})">
        <rect
          width="${innerWidth}"
          height="${innerHeight}"
          fill="#f2f2f2"
          stroke="none"
        />
        <g transform="translate(100, 100)">
          <${Diamond} number=${8} />
          <${Company} name="Ares Management Corporation" />
          <circle cx="0" cy="0" r="5" fill="lightblue" />
        </g>
        <g transform="translate(300, 100)">
          <${CompanyWithDiamond}
            name="Ares Management Corporation"
            number=${8}
          />
          <circle cx="0" cy="0" r="5" fill="red" />
        </g>
      </g>
    </svg>
    <p class="vis-source">${config?.vis1?.source || "Source for Vis 1"}</p>
  </div>`;
}
