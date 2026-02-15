import { html } from "./preact-htm.js";

export default function Fallback() {
  // TODO: add copy link functionality to the button
  return html`<div class="fallback">
    <img
      src="assets/fallback_image.svg"
      alt="Fallback image"
      class="fallback-image"
    />
    <p class="fallback-message">
      Designed for a bigger screen. <br />Visit on desktop to get the full
      picture.
    </p>
    <button class="fallback-button">Copy link</button>
  </div>`;
}
