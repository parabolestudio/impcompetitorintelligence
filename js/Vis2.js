import { html, useEffect, useState } from "./preact-htm.js";
import { CompanyWithDiamondRotated } from "./Company.js";
import Fallback from "./Fallback.js";
import {
  numberMovesScale,
  colorMappingByContinent,
  REPO_BASE_URL,
  countryShapeMapping,
} from "./helpers.js";
import Diamond from "./Diamond.js";
import Country from "./Country.js";

export function Vis2() {
  const [firmsData, setFirmsData] = useState(null);
  const [countriesData, setCountriesData] = useState(null);
  const [countriesCentricData, setCountriesCentricData] = useState(null);
  const [hoveredObject, setHoveredObject] = useState(null);

  const MOBILE_THRESHOLD = 1200;
  const [showFallback, setShowFallback] = useState(
    window.innerWidth < MOBILE_THRESHOLD,
  );

  // on resize, clear hovered object to prevent tooltip from getting stuck in wrong position and render fallback if width is below threshold
  useEffect(() => {
    function handleResize() {
      setHoveredObject ? setHoveredObject(null) : null;
      setShowFallback(window.innerWidth < MOBILE_THRESHOLD);
    }
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // mobile fallback
  if (showFallback) {
    return html`<${Fallback} />`;
  }

  useEffect(() => {
    // Fetch data when the component mounts
    Promise.all([
      d3.csv(
        // `${REPO_BASE_URL}/data/data_vis2_firms.csv`,
        `./data/data_vis2_firms.csv`,
      ),
      d3.csv(
        // `${REPO_BASE_URL}/data/data_vis2_countries.csv`,
        `./data/data_vis2_countries.csv`,
      ),
    ]).then(([firmsDataRaw, countriesDataRaw]) => {
      firmsDataRaw.forEach((d) => {
        d["newFirm"] = d["New firm"];
        d["totalMoves"] = +d["Total moves"];
      });
      setFirmsData(firmsDataRaw);

      countriesDataRaw.forEach((d) => {
        d["newFirm"] = d["New firm"];
        d["country"] = d["Country"];
        d["continent"] = d["Continent"];
        d["cities"] = d["Cities"]
          ? d["Cities"].split(";").map((s) => s.trim())
          : [];
        d["movesNewFirmCountry"] = +d["Moves"];
        d["colorKey"] =
          colorMappingByContinent[d["Continent"]] || "neutral-grey2";
      });
      setCountriesData(countriesDataRaw);

      // get unique list of countries
      const uniqueCountries = Array.from(
        new Set(countriesDataRaw.map((d) => d["Country"])),
      ).filter((c) => c && c.trim() !== "");
      console.log("Unique countries: ", uniqueCountries);

      const countryCentricData = uniqueCountries.map((country) => {
        const moves = countriesDataRaw
          .filter((d) => d["country"] === country)
          .reduce((sum, d) => sum + d["movesNewFirmCountry"], 0);
        return {
          country,
          movesNewFirmCountry: moves,
          continent:
            countriesDataRaw.find((d) => d["Country"] === country)?.[
              "Continent"
            ] || "Unknown",
        };
      });
      setCountriesCentricData(countryCentricData);
    });
  }, []);

  if (!firmsData) {
    return html`<div>Loading data...</div>`;
  }

  console.log("Rendering vis 2 with ", {
    firmsData,
    countriesData,
    countriesCentricData,
  });

  // dimensions
  const visContainer = document.querySelector("#vis-2");
  const width =
    visContainer && visContainer.offsetWidth ? visContainer.offsetWidth : 600;
  const height1 = 145; // upper section with new company names
  const height2 = 300; // middle section (upper part) with lines connecting to diamond
  const height3 = 70; // middle section (lower part) from diamond to new countries
  const height4 = 320; // lower section with current company names and logos
  const height = height1 + height2 + height3 + height4;
  const margin = {
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
  };

  const innerWidth = width - margin.left - margin.right;
  const innerHeight = height - margin.top - margin.bottom;

  const config = window.customChartsConfig || {};

  // Bézier curve parameters (same principle as Vis1)
  const curveCpOffset = 0.3;
  const curveCpSkew = 0;
  const curveCpSpread = 0;

  // pre-calculate country positions grouped by continent
  const countryPositions = {};
  if (countriesCentricData) {
    // 1. Group countries by continent
    const continentGroups = {};
    countriesCentricData.forEach((d) => {
      if (!continentGroups[d.continent]) {
        continentGroups[d.continent] = [];
      }
      continentGroups[d.continent].push(d);
    });

    // 2. Calculate total moves per continent and sort continents descending
    const sortedContinents = Object.entries(continentGroups)
      .map(([continent, countries]) => ({
        continent,
        countries,
        totalMoves: countries.reduce(
          (sum, c) => sum + c.movesNewFirmCountry,
          0,
        ),
      }))
      .sort((a, b) => b.totalMoves - a.totalMoves);

    // 3. Sort countries within each continent by moves descending
    sortedContinents.forEach((group) => {
      group.countries.sort(
        (a, b) => b.movesNewFirmCountry - a.movesNewFirmCountry,
      );
    });

    // 4. Calculate diamond widths for spacing
    const countryDiamondWidth = (moves) =>
      numberMovesScale(moves) * Math.sqrt(2);

    // Total width of all diamonds
    const countryGap = 16; // spacing between diamonds within a continent group
    const totalDiamondWidth = countriesCentricData.reduce(
      (sum, d) => sum + countryDiamondWidth(d.movesNewFirmCountry),
      0,
    );
    const totalIntraGaps = sortedContinents.reduce(
      (sum, g) => sum + Math.max(0, g.countries.length - 1) * countryGap,
      0,
    );

    // Spacing between continent groups
    const numGaps = sortedContinents.length - 1;
    const continentGap =
      numGaps > 0
        ? Math.max(
            20,
            (innerWidth - totalDiamondWidth - totalIntraGaps) / (numGaps + 2),
          )
        : 0;

    // Total width including gaps
    const totalLayoutWidth =
      totalDiamondWidth + totalIntraGaps + numGaps * continentGap;
    let cursorX = (innerWidth - totalLayoutWidth) / 2;

    // 5. Assign positions
    sortedContinents.forEach((group, gi) => {
      group.countries.forEach((d, ci) => {
        const w = countryDiamondWidth(d.movesNewFirmCountry);
        countryPositions[d.country] = {
          centerX: cursorX + w / 2,
          centerY: height1 + height2,
          topY: height1 + height2 - w / 2,
        };
        cursorX += w;
        if (ci < group.countries.length - 1) {
          cursorX += countryGap;
        }
      });
      if (gi < sortedContinents.length - 1) {
        cursorX += continentGap;
      }
    });
  }

  // Sort firms by barycenter (weighted average x of connected countries) to minimize line crossings
  const sortedFirmsData = [...firmsData];
  if (countriesData && Object.keys(countryPositions).length > 0) {
    const firmBarycenter = {};
    sortedFirmsData.forEach((firm) => {
      const connections = countriesData.filter(
        (d) => d.newFirm === firm.newFirm,
      );
      if (connections.length > 0) {
        const weightedSum = connections.reduce((sum, d) => {
          const pos = countryPositions[d.country];
          return sum + (pos ? pos.x * d.movesNewFirmCountry : 0);
        }, 0);
        const totalWeight = connections.reduce(
          (sum, d) => sum + d.movesNewFirmCountry,
          0,
        );
        firmBarycenter[firm.newFirm] =
          totalWeight > 0 ? weightedSum / totalWeight : 0;
      } else {
        firmBarycenter[firm.newFirm] = 0;
      }
    });
    sortedFirmsData.sort(
      (a, b) => firmBarycenter[a.newFirm] - firmBarycenter[b.newFirm],
    );
  }

  // compute per-firm diamond widths and cumulative x positions (tightly packed, centered)
  const firmWidths = sortedFirmsData.map((d) => {
    const size = numberMovesScale(d.totalMoves);
    return size * Math.sqrt(2); // rotated square width
  });
  const totalGroupWidth = firmWidths.reduce((sum, w) => sum + w, 0);
  const groupStartX = (innerWidth - totalGroupWidth) / 2;

  // build a map from firm name to its center-x position
  const firmCenterX = {};
  let cumX = groupStartX;
  sortedFirmsData.forEach((d, i) => {
    firmCenterX[d.newFirm] = cumX + firmWidths[i] / 2;
    cumX += firmWidths[i];
  });
  // build a map from firm name to its diamond size for quick lookup when drawing lines
  const firmDiamondSize = {};
  sortedFirmsData.forEach((d) => {
    firmDiamondSize[d.newFirm] = numberMovesScale(d.totalMoves);
  });

  // Extract unique colors for gradient definitions
  const uniqueColors = Array.from(
    new Set(countriesData.map((d) => d.colorKey)),
  ).map((colorKey) => ({
    key: colorKey,
    cssVar: `var(--color-vis-${colorKey})`,
  }));

  return html`<div class="vis-container">
    <p class="vis-title">${config?.vis2?.title || "Title for Vis 2"}</p>
    <p class="vis-subtitle">
      ${config?.vis2?.subtitle || "Subtitle for Vis 2"}
    </p>
    <div class="vis-content">
      <svg viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
        <rect
          width="${innerWidth}"
          height="${innerHeight}"
          fill="#f2f2f2"
          stroke="none"
        />
        <defs>
          ${uniqueColors.map((colorObj) => {
            return html`
              <linearGradient
                id="gradient-${colorObj.key}"
                x1="0"
                y1="${height1}"
                x2="0"
                y2="${height1 + height2}"
                gradientUnits="userSpaceOnUse"
              >
                <stop stop-color="${colorObj.cssVar}" stop-opacity="0.3" />
                <stop offset="1" stop-color="${colorObj.cssVar}" />
              </linearGradient>
            `;
          })}
        </defs>

        <g transform="translate(${margin.left}, ${margin.top})">
          <g>
            <line
              x1="0"
              y1="${height1}"
              x2="${width}"
              y2="${height1}"
              stroke="var(--color-vis-neutral-grey2)"
            />
            <text class="axis-text" y="${height1 - 5}">New firms</text>
            <line
              x1="0"
              y1="${height1 + height2 + height3}"
              x2="${width}"
              y2="${height1 + height2 + height3}"
              stroke="var(--color-vis-neutral-grey2)"
            />
            <text class="axis-text" y="${height1 + height2 + height3 - 22}">
              <tspan>Country and city</tspan>
              <tspan x="0" dy="16">after move</tspan>
            </text>
          </g>
          <g id="lines-new-firms-to-countries-group">
            ${countriesData && countriesData.length > 0
              ? countriesData.map((d) => {
                  const firmX = firmCenterX[d.newFirm];
                  const firmY = height1 + firmDiamondSize[d.newFirm] / 2; // start from bottom corner of diamond

                  const pos = countryPositions[d.country];

                  const dx = pos.centerX - firmX;
                  const dy = pos.topY - firmY;
                  const cp1x = firmX + curveCpSkew - curveCpSpread;
                  const cp1y = firmY + dy * curveCpOffset;
                  const cp2x = pos.centerX + curveCpSkew + curveCpSpread;
                  const cp2y = pos.topY - dy * curveCpOffset;

                  return html`
                    <path
                      d="M ${firmX},${firmY} C ${cp1x},${cp1y} ${cp2x},${cp2y} ${pos.centerX},${pos.topY}"
                      stroke="url(#gradient-${d.colorKey})"
                      stroke-width="2"
                      fill="none"
                    />
                  `;
                })
              : null}
          </g>

          <g id="new-firms-group">
            ${sortedFirmsData.map((d) => {
              const x = firmCenterX[d.newFirm];
              const y = height1;

              return html`
                <g transform="translate(${x}, ${y})" class="new-company-group">
                  <${CompanyWithDiamondRotated}
                    name=${d.newFirm}
                    number=${d.totalMoves}
                    color="${null}"
                  />
                </g>
              `;
            })}
          </g>
          <g id="countries-group">
            ${countriesCentricData && countriesCentricData.length > 0
              ? countriesCentricData.map((d) => {
                  const pos = countryPositions[d.country];
                  return html`
                    <g
                      transform="translate(${pos.centerX}, ${pos.centerY})"
                      class="new-country-group ${d.country}"
                    >
                      <${Diamond}
                        number=${d.movesNewFirmCountry}
                        color="byContinent"
                        colorContinent=${d.continent}
                      />
                    </g>
                  `;
                })
              : null}
          </g>
          <g id="country-shapes-group">
            ${countriesCentricData && countriesCentricData.length > 0
              ? countriesCentricData.map((d) => {
                  const pos = countryPositions[d.country];
                  const continentColor =
                    colorMappingByContinent[d.continent] || "neutral-grey2";
                  console.log(
                    "Rendering country shape for ",
                    d.country,
                    " with color ",
                    continentColor,
                  );
                  return html`<g
                    transform="translate(${pos.centerX}, ${pos.centerY + 150})"
                  >
                    <${Country}
                      countryName=${d.country}
                      color=${continentColor}
                    />
                  </g>`;
                })
              : null}
          </g>
        </g>
      </svg>
    </div>
    <p class="vis-source">${config?.vis2?.source || "Source for Vis 2"}</p>
  </div>`;
}
