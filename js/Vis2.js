import { html, useEffect, useState, csv } from "./lib.js";
import { CompanyWithDiamondRotated } from "./Company.js";
import Fallback from "./Fallback.js";
import { Tooltip } from "./Tooltip.js";
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
  const [cityMovesData, setCityMovesData] = useState(null);
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
      csv(
        `${REPO_BASE_URL}/data/data_vis2_firms.csv`,
        // `./data/data_vis2_firms.csv`,
      ),
      csv(
        `${REPO_BASE_URL}/data/data_vis2_countries.csv`,
        // `./data/data_vis2_countries.csv`,
      ),
      csv(
        `${REPO_BASE_URL}/data/data_vis2_cities.csv`,
        // `./data/data_vis2_cities.csv`,
      ),
    ]).then(([firmsDataRaw, countriesDataRaw, cityMovesDataRaw]) => {
      firmsDataRaw.forEach((d) => {
        d["newFirm"] = d["New firm"];
        d["totalMoves"] = +d["Total moves"];
      });

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

      // add country to firms data for easier access when rendering and interactions
      firmsDataRaw.forEach((firm) => {
        const countryConnections = countriesDataRaw.filter(
          (d) => d.newFirm === firm.newFirm,
        );
        firm.countries = countryConnections.map((d) => d.country);
      });

      setFirmsData(firmsDataRaw);
      setCountriesData(countriesDataRaw);

      // parse city moves data
      cityMovesDataRaw.forEach((d) => {
        d["country"] = d["Country"];
        d["city"] = d["City"];
        d["moves"] = +d["Moves"];
      });
      setCityMovesData(cityMovesDataRaw);

      // get unique list of countries
      const uniqueCountries = Array.from(
        new Set(countriesDataRaw.map((d) => d["Country"])),
      ).filter((c) => c && c.trim() !== "");

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

  // console.log("Rendering vis 2 with ", {
  //   firmsData,
  //   countriesData,
  //   countriesCentricData,
  // });

  // dimensions
  const visContainer = document.querySelector("#vis-2");
  const width =
    visContainer && visContainer.offsetWidth ? visContainer.offsetWidth : 600;
  const height1 = 145; // upper section with new company names
  const height2 = 300; // middle section (upper part) with lines connecting to diamond
  const height3 = 70; // middle section (lower part) from diamond to new countries
  let height4 = 220; // lower section
  const height5 = 50; // continent labels below country shapes
  let height = height1 + height2 + height3 + height4 + height5;
  const margin = {
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
  };

  const innerWidth = width - margin.left - margin.right;
  // let innerHeight = height - margin.top - margin.bottom;

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
    const countryWidth = (moves) => numberMovesScale(moves) * Math.sqrt(2);

    // Total width of all diamonds
    const countryGap = 16; // spacing between diamonds within a continent group
    const totalDiamondWidth = countriesCentricData.reduce(
      (sum, d) => sum + countryWidth(d.movesNewFirmCountry),
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
        const w = countryWidth(d.movesNewFirmCountry);
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

  // Pre-calculate country shape positions in a single row, grouped by continent
  // All country shapes get roughly equal visual area, sized to fit within the available width
  const countryShapePositions = {};
  if (countriesCentricData && Object.keys(countryPositions).length > 0) {
    const shapeGapX = 25; // horizontal gap between shapes within a continent
    const sectionTopY = height1 + height2 + height3; // top of the country shapes section
    const textHeight = 25; // approximate height of country name text below shape
    const targetShapeArea = 6000; // target visual area (w*h) for each country shape

    // Per-country size multipliers for fine-tuning (1.0 = default)
    // TODO: could be data-dependent, but needs fine-tuning for high value outlier
    const countrySizeOverrides = {
      USA: 8,
      UK: 5,
      Australia: 3,
    };

    // Get countries with shape mappings, grouped by continent (same order as diamonds)
    const continentGroups = {};
    countriesCentricData.forEach((d) => {
      if (!countryShapeMapping[d.country]) return;
      if (!continentGroups[d.continent]) continentGroups[d.continent] = [];
      continentGroups[d.continent].push(d);
    });

    // Sort continents by total moves descending (same order as diamond layout)
    const sortedContinentEntries = Object.entries(continentGroups)
      .map(([continent, countries]) => ({
        continent,
        countries,
        totalMoves: countries.reduce((s, c) => s + c.movesNewFirmCountry, 0),
      }))
      .sort((a, b) => b.totalMoves - a.totalMoves);

    // Sort countries within each continent by moves descending
    sortedContinentEntries.forEach((g) =>
      g.countries.sort((a, b) => b.movesNewFirmCountry - a.movesNewFirmCountry),
    );

    // Compute shape dimensions from equal area + aspect ratio
    const shapeItems = [];
    sortedContinentEntries.forEach((group) => {
      group.countries.forEach((d) => {
        const cfg = countryShapeMapping[d.country];
        const ar = cfg.aspectRatio || 1;
        const sizeMultiplier = countrySizeOverrides[d.country] || 1;
        const area = targetShapeArea * sizeMultiplier;
        // area = w * h, ar = w / h  =>  h = sqrt(area / ar), w = h * ar
        const h = Math.sqrt(area / ar);
        const w = h * ar;
        shapeItems.push({
          country: d.country,
          continent: d.continent,
          shapeW: w,
          shapeH: h,
          totalH: h + textHeight,
        });
      });
    });

    // Calculate total width needed and check if we need to scale down
    const numContinentGaps = sortedContinentEntries.length - 1;
    const continentShapeGap = 30; // gap between continent groups
    const totalShapeWidth =
      shapeItems.reduce((s, item) => s + item.shapeW + shapeGapX, 0) -
      shapeGapX +
      numContinentGaps * (continentShapeGap - shapeGapX);

    // Scale down if total width exceeds available width
    const maxWidth = innerWidth - 40; // leave some margin
    const scaleFactor =
      totalShapeWidth > maxWidth ? maxWidth / totalShapeWidth : 1;

    // Apply scale factor to all items if needed
    if (scaleFactor < 1) {
      shapeItems.forEach((item) => {
        item.shapeW *= scaleFactor;
        item.shapeH *= scaleFactor;
        item.totalH = item.shapeH + textHeight;
      });
    }

    // Position items in a single row, centered horizontally
    const scaledTotalWidth =
      shapeItems.reduce((s, item) => s + item.shapeW + shapeGapX, 0) -
      shapeGapX +
      numContinentGaps * (continentShapeGap - shapeGapX);
    let cursorX = (innerWidth - scaledTotalWidth) / 2;

    const tallestItem = Math.max(...shapeItems.map((item) => item.totalH));

    let prevContinent = null;
    shapeItems.forEach((item) => {
      // Add extra gap between continent groups
      if (prevContinent !== null && item.continent !== prevContinent) {
        cursorX += continentShapeGap - shapeGapX;
      }

      // Vertically center each item individually within height4
      const itemCenterOffset = Math.max(0, (height4 - item.totalH) / 2);

      countryShapePositions[item.country] = {
        x: cursorX + item.shapeW / 2,
        y: sectionTopY + itemCenterOffset,
        shapeW: item.shapeW,
        shapeH: item.shapeH,
      };
      cursorX += item.shapeW + shapeGapX;
      prevContinent = item.continent;
    });
  }

  // Compute continent label positions (centered horizontally under each continent's country shapes)
  const continentLabelPositions = [];
  if (countriesCentricData && Object.keys(countryShapePositions).length > 0) {
    // Group countries by continent
    const continentCountries = {};
    countriesCentricData.forEach((d) => {
      if (!continentCountries[d.continent]) {
        continentCountries[d.continent] = [];
      }
      if (countryShapePositions[d.country]) {
        continentCountries[d.continent].push(d.country);
      }
    });

    Object.entries(continentCountries).forEach(([continent, countries]) => {
      if (countries.length === 0) return;
      const xs = countries.map((c) => countryShapePositions[c].x);
      const minX = Math.min(...xs);
      const maxX = Math.max(...xs);
      continentLabelPositions.push({
        continent,
        centerX: (minX + maxX) / 2,
      });
    });
  }

  // Recalculate total height after potential height4 adjustment
  height = height1 + height2 + height3 + height4 + height5;
  innerHeight = height - margin.top - margin.bottom;

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

  const hoverCountry = (event, d) => {
    const container = event.currentTarget.closest(".vis-content");
    const rect = container.getBoundingClientRect();

    // Build per-city move counts for this country from the dedicated dataset
    const citiesInCountry = (cityMovesData || [])
      .filter((c) => c.country === d.country)
      .map((c) => `${c.city} (${c.moves})`)
      .join("; ");

    setHoveredObject({
      hoverType: "country",
      country: d.country,
      x: event.clientX - rect.left,
      y: event.clientY - rect.top,
      tooltipContent: [
        {
          label: "Firms involved",
          value: countriesData
            .filter((c) => c.country === d.country)
            .map((c) => c.newFirm)
            .join(", "),
        },
        {
          label: "Number of moves",
          value: d.movesNewFirmCountry,
        },
        { label: "Country after move", value: d.country },
        {
          label: "Cities after move",
          value: citiesInCountry || "N/A",
        },
      ],
    });
  };

  return html`<div class="vis-container">
    <p class="vis-title">${config?.vis2?.title || "Title for Vis 2"}</p>
    <p class="vis-subtitle">
      ${config?.vis2?.subtitle || "Subtitle for Vis 2"}
    </p>
    <div class="vis-content">
      <svg viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
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
              x2="${sortedFirmsData.length > 0
                ? firmCenterX[sortedFirmsData[0].newFirm] -
                  firmWidths[0] / 2 -
                  2
                : width}"
              y2="${height1}"
              stroke="var(--color-vis-neutral-grey2)"
            />
            <line
              x1="${sortedFirmsData.length > 0
                ? firmCenterX[
                    sortedFirmsData[sortedFirmsData.length - 1].newFirm
                  ] +
                  firmWidths[sortedFirmsData.length - 1] / 2 +
                  2
                : width}"
              y1="${height1}"
              x2="${sortedFirmsData.length > 0
                ? firmCenterX[
                    sortedFirmsData[sortedFirmsData.length - 1].newFirm
                  ] +
                  firmWidths[sortedFirmsData.length - 1] / 2 +
                  20
                : width}"
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
                  const firmY = height1 + firmDiamondSize[d.newFirm] / 2 + 4; // start from bottom corner of diamond

                  const pos = countryPositions[d.country];

                  // const dx = pos.centerX - firmX;
                  const dy = pos.topY - firmY;
                  const cp1x = firmX + curveCpSkew - curveCpSpread;
                  const cp1y = firmY + dy * curveCpOffset;
                  const cp2x = pos.centerX + curveCpSkew + curveCpSpread;
                  const cp2y = pos.topY - dy * curveCpOffset;

                  // check if hovered object is a different new company to determine if this line should be faded
                  const isFaded = hoveredObject
                    ? (hoveredObject.hoverType === "newCompany" &&
                        hoveredObject.newCompany !== d.newFirm) ||
                      (hoveredObject.hoverType === "newCompanyCountryLine" &&
                        (hoveredObject.newCompany !== d.newFirm ||
                          hoveredObject.country !== d.country)) ||
                      (hoveredObject.hoverType === "country" &&
                        hoveredObject.country !== d.country)
                    : false;

                  return html`
                    <path
                      d="M ${firmX},${firmY} C ${cp1x},${cp1y} ${cp2x},${cp2y} ${pos.centerX},${pos.topY}"
                      stroke="url(#gradient-${d.colorKey})"
                      stroke-width="2"
                      fill="none"
                      opacity="${isFaded ? 0.2 : 1}"
                      style="transition: opacity 0.3s;cursor: pointer;"
                      onmouseenter=${(event) => {
                        const container =
                          event.currentTarget.closest(".vis-content");
                        const rect = container.getBoundingClientRect();

                        setHoveredObject({
                          hoverType: "newCompanyCountryLine",
                          newCompany: d.newFirm,
                          country: d.country,
                          x: event.clientX - rect.left,
                          y: event.clientY - rect.top,
                          tooltipContent: [
                            { label: "New firm", value: d.newFirm },
                            { label: "Country", value: d.country },
                            {
                              label: "Number of moves",
                              value: d.movesNewFirmCountry,
                            },
                            {
                              label: "Cities after move",
                              value: d.cities.join(", "),
                            },
                          ],
                        });
                      }}
                      onmouseleave=${() => setHoveredObject(null)}
                    />
                  `;
                })
              : null}
          </g>

          <g id="new-firms-group">
            ${sortedFirmsData.map((d) => {
              const x = firmCenterX[d.newFirm];
              const y = height1;

              const isFaded = hoveredObject
                ? (hoveredObject.hoverType === "newCompany" &&
                    hoveredObject.newCompany !== d.newFirm) ||
                  (hoveredObject.hoverType === "newCompanyCountryLine" &&
                    hoveredObject.newCompany !== d.newFirm) ||
                  (hoveredObject.hoverType === "country" &&
                    !d.countries.includes(hoveredObject.country))
                : false;

              return html`
                <g
                  transform="translate(${x}, ${y})"
                  class="new-company-group"
                  onmouseenter=${(event) => {
                    const container =
                      event.currentTarget.closest(".vis-content");
                    const rect = container.getBoundingClientRect();

                    setHoveredObject({
                      hoverType: "newCompany",
                      newCompany: d.newFirm,
                      countries: d.countries,
                      x: event.clientX - rect.left,
                      y: event.clientY - rect.top,
                      tooltipContent: [
                        { label: "New firm", value: d.newFirm },

                        {
                          label: "Number of moves",
                          value: d.totalMoves,
                        },
                        {
                          label: "Countries after move",
                          value: d.countries.join(", "),
                        },
                      ],
                    });
                  }}
                  onmouseleave=${() => setHoveredObject(null)}
                  opacity="${isFaded ? 0.2 : 1}"
                >
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

                  // check if hovered object is a different country to determine if this country's diamond should be faded
                  const isFaded = hoveredObject
                    ? (hoveredObject.hoverType === "newCompany" &&
                        !countriesData.some(
                          (c) =>
                            c.newFirm === hoveredObject.newCompany &&
                            c.country === d.country,
                        )) ||
                      (hoveredObject.hoverType === "newCompanyCountryLine" &&
                        hoveredObject.country !== d.country) ||
                      (hoveredObject.hoverType === "country" &&
                        hoveredObject.country !== d.country)
                    : false;

                  return html`
                    <g
                      transform="translate(${pos.centerX}, ${pos.centerY})"
                      class="new-country-group ${d.country}"
                      opacity="${isFaded ? 0.2 : 1}"
                      style="transition: opacity 0.3s;cursor: pointer;"
                      onmouseenter=${(event) => hoverCountry(event, d)}
                      onmouseleave=${() => setHoveredObject(null)}
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
                  const shapePos = countryShapePositions[d.country];
                  if (!shapePos) return null;
                  const continentColor =
                    colorMappingByContinent[d.continent] || "neutral-grey2";

                  // check if hovered object is a different country to determine if this shape should be faded
                  const isFaded = hoveredObject
                    ? (hoveredObject.hoverType === "newCompany" &&
                        !countriesData.some(
                          (c) =>
                            c.newFirm === hoveredObject.newCompany &&
                            c.country === d.country,
                        )) ||
                      (hoveredObject.hoverType === "newCompanyCountryLine" &&
                        hoveredObject.country !== d.country) ||
                      (hoveredObject.hoverType === "country" &&
                        hoveredObject.country !== d.country)
                    : false;

                  return html`<g
                    transform="translate(${shapePos.x}, ${shapePos.y})"
                    opacity="${isFaded ? 0.2 : 1}"
                    style="transition: opacity 0.3s;cursor: pointer;"
                    onmouseenter=${(event) => hoverCountry(event, d)}
                    onmouseleave=${() => setHoveredObject(null)}
                  >
                    <${Country}
                      countryName=${d.country}
                      color=${continentColor}
                      width=${shapePos.shapeW}
                      height=${shapePos.shapeH}
                    />
                  </g>`;
                })
              : null}
          </g>
          <g id="diamond-to-country-lines-group">
            ${countriesCentricData && countriesCentricData.length > 0
              ? countriesCentricData.map((d) => {
                  const shapePos = countryShapePositions[d.country];
                  if (!shapePos) return null;
                  const diamondPos = countryPositions[d.country];
                  const diamondSize = numberMovesScale(d.movesNewFirmCountry);
                  const diamondBottomY =
                    diamondPos.centerY + (diamondSize * Math.sqrt(2)) / 2;
                  const miniDiamondCenterY = shapePos.y + shapePos.shapeH / 2;
                  const continentColor =
                    colorMappingByContinent[d.continent] || "neutral-grey2";

                  // check if hovered object is a different country to determine if this line should be faded
                  const isFaded = hoveredObject
                    ? (hoveredObject.hoverType === "newCompany" &&
                        !countriesData.some(
                          (c) =>
                            c.newFirm === hoveredObject.newCompany &&
                            c.country === d.country,
                        )) ||
                      (hoveredObject.hoverType === "newCompanyCountryLine" &&
                        hoveredObject.country !== d.country) ||
                      (hoveredObject.hoverType === "country" &&
                        hoveredObject.country !== d.country)
                    : false;

                  return html`
                    <path
                      d="M ${diamondPos.centerX},${diamondBottomY} C ${diamondPos.centerX +
                      curveCpSkew -
                      curveCpSpread},${diamondBottomY +
                      (miniDiamondCenterY - diamondBottomY) *
                        curveCpOffset} ${shapePos.x +
                      curveCpSkew +
                      curveCpSpread},${miniDiamondCenterY -
                      (miniDiamondCenterY - diamondBottomY) *
                        curveCpOffset} ${shapePos.x},${miniDiamondCenterY}"
                      stroke="var(--color-vis-${continentColor})"
                      stroke-width="2"
                      fill="none"
                      opacity="${isFaded ? 0.2 : 1}"
                      style="transition: opacity 0.3s;cursor: pointer;"
                      onmouseenter=${(event) => hoverCountry(event, d)}
                      onmouseleave=${() => setHoveredObject(null)}
                    />
                  `;
                })
              : null}
          </g>
          <g id="continent-labels-group">
            ${continentLabelPositions.map((cl) => {
              const labelY =
                height1 + height2 + height3 + height4 + height5 / 2;
              return html`
                <text
                  x="${cl.centerX}"
                  y="${labelY}"
                  text-anchor="middle"
                  dominant-baseline="central"
                  class="continent-label-text"
                >
                  ${cl.continent}
                </text>
              `;
            })}
          </g>
        </g>
      </svg>
      <${Tooltip} hoveredItem=${hoveredObject} />
    </div>
    <p class="vis-source">${config?.vis2?.source || "Source for Vis 2"}</p>
  </div>`;
}
