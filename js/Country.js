import { html, useEffect, useRef, useState } from "./lib.js";
import { countryShapeMapping, REPO_BASE_URL, isLocal } from "./helpers.js";

const svgShapeCache = new Map();
let svgInstanceCount = 0;

function loadCountryShape(shapeFile) {
  if (!svgShapeCache.has(shapeFile)) {
    const shapeUrl = isLocal
      ? `./assets/countryShapes/${shapeFile}`
      : `${REPO_BASE_URL}/assets/countryShapes/${shapeFile}`;

    svgShapeCache.set(
      shapeFile,
      fetch(shapeUrl)
        .then((response) => {
          if (!response.ok) {
            throw new Error(`Failed to load country shape: ${shapeFile}`);
          }
          return response.text();
        })
        .then((svgText) => {
          const doc = new DOMParser().parseFromString(svgText, "image/svg+xml");
          const svgEl = doc.querySelector("svg");
          if (!svgEl) {
            throw new Error(`Invalid SVG for country shape: ${shapeFile}`);
          }

          return {
            content: svgEl.innerHTML,
            viewBox: svgEl.getAttribute("viewBox") || "0 0 1 1",
          };
        }),
    );
  }

  return svgShapeCache.get(shapeFile);
}

function scopeSvgMarkup(content, instanceId, visibleCities = []) {
  const doc = new DOMParser().parseFromString(
    `<svg xmlns="http://www.w3.org/2000/svg">${content}</svg>`,
    "image/svg+xml",
  );
  const svgEl = doc.querySelector("svg");
  const idMap = new Map();
  const visibleCitySet = new Set(visibleCities);

  svgEl.querySelectorAll("[id]").forEach((node) => {
    const originalId = node.getAttribute("id");
    const scopedId = `${instanceId}-${originalId}`;
    idMap.set(originalId, scopedId);
    node.setAttribute("id", scopedId);
  });

  const referenceAttributes = [
    "href",
    "xlink:href",
    "clip-path",
    "filter",
    "fill",
    "stroke",
    "mask",
  ];

  svgEl.querySelectorAll("*").forEach((node) => {
    referenceAttributes.forEach((attributeName) => {
      const value = node.getAttribute(attributeName);
      if (!value) {
        return;
      }

      let updatedValue = value;
      idMap.forEach((scopedId, originalId) => {
        updatedValue = updatedValue
          .replaceAll(`url(#${originalId})`, `url(#${scopedId})`)
          .replaceAll(`#${originalId}`, `#${scopedId}`);
      });

      if (updatedValue !== value) {
        node.setAttribute(attributeName, updatedValue);
      }
    });

    const inlineStyle = node.getAttribute("style");
    if (inlineStyle) {
      let updatedStyle = inlineStyle;
      idMap.forEach((scopedId, originalId) => {
        updatedStyle = updatedStyle.replaceAll(
          `url(#${originalId})`,
          `url(#${scopedId})`,
        );
      });

      if (updatedStyle !== inlineStyle) {
        node.setAttribute("style", updatedStyle);
      }
    }
  });

  const citiesGroup =
    svgEl.querySelector('g[class="cities"]') || svgEl.querySelector(".cities");
  if (citiesGroup) {
    Array.from(citiesGroup.children).forEach((cityGroup) => {
      const cityName =
        cityGroup.getAttribute("class") || cityGroup.getAttribute("id");
      if (!cityName) {
        return;
      }

      cityGroup.setAttribute("data-city-marker", "true");
      cityGroup.setAttribute("data-city-name", cityName);
      cityGroup.setAttribute(
        "data-has-data-marker",
        visibleCitySet.has(cityName) ? "true" : "false",
      );
    });
  }

  return svgEl.innerHTML;
}

export default function Country({
  countryName,
  color,
  width: propWidth,
  height: propHeight,
  visibleCities: propVisibleCities = [],
  renderLabel = true,
}) {
  const [svgShape, setSvgShape] = useState(null);
  const [svgLoadError, setSvgLoadError] = useState(false);
  const instanceIdRef = useRef(null);
  const visibleCities = Array.from(
    new Set(propVisibleCities.filter((cityName) => cityName)),
  );
  const visibleCitiesKey = visibleCities.slice().sort().join("||");

  if (!instanceIdRef.current) {
    svgInstanceCount += 1;
    instanceIdRef.current = `country-shape-${svgInstanceCount}`;
  }

  const countryConfig = countryShapeMapping[countryName];
  const shapeFile = countryConfig?.shapeFile;

  useEffect(() => {
    if (!shapeFile) {
      setSvgShape(null);
      setSvgLoadError(false);
      return;
    }

    let isActive = true;

    setSvgShape(null);
    setSvgLoadError(false);
    loadCountryShape(shapeFile)
      .then((shapeData) => {
        if (!isActive) {
          return;
        }

        setSvgShape({
          ...shapeData,
          content: scopeSvgMarkup(
            shapeData.content,
            instanceIdRef.current,
            visibleCities,
          ),
        });
      })
      .catch((error) => {
        console.error(error);
        if (isActive) {
          setSvgLoadError(true);
        }
      });

    return () => {
      isActive = false;
    };
  }, [shapeFile, visibleCitiesKey]);

  if (countryConfig) {
    const { aspectRatio, countryLabel } = countryConfig;
    const displayName = countryLabel || countryName;
    // Use props if provided, otherwise derive from aspectRatio with a default area
    const width = propWidth || (aspectRatio >= 1 ? 80 : 80 * aspectRatio);
    const height = propHeight || (aspectRatio >= 1 ? 80 / aspectRatio : 80);

    const countryMiniDiamondSize = 7;
    return html`<g class="country ${countryName}">
      ${svgShape
        ? html`<svg
            class="country-shape"
            data-country="${countryName}"
            data-shape-file="${shapeFile}"
            x="-${width / 2}"
            y="0"
            width="${width}"
            height="${height}"
            viewBox="${svgShape.viewBox}"
            preserveAspectRatio="xMidYMid meet"
            dangerouslySetInnerHTML=${{ __html: svgShape.content }}
          />`
        : svgLoadError
          ? html`<rect
              x="-${width / 2}"
              y="0"
              width="${width}"
              height="${height}"
              fill="transparent"
            />`
          : null}
      ${renderLabel
        ? html`<text
            class="country-name"
            text-anchor="middle"
            y="${height + 20}"
            >${displayName}</text
          >`
        : null}
      ${!countryConfig.showCities
        ? html` <rect
            y="${height / 2 - countryMiniDiamondSize / 2}"
            x="-${countryMiniDiamondSize / 2}"
            width="${countryMiniDiamondSize}"
            height="${countryMiniDiamondSize}"
            fill="var(--color-vis-${color})"
            transform="rotate(45)"
            transform-origin="0 ${height / 2}px"
          />`
        : null}
    </g>`;
  }

  return null;
}
