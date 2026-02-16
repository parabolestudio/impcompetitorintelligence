import { html } from "./preact-htm.js";

export default function Fallback() {
  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      // Optional: Show feedback to user
      const button = document.querySelector(".fallback-button");
      if (button) {
        const originalText = button.textContent;
        button.textContent = "Copied!";
        setTimeout(() => {
          button.textContent = originalText;
        }, 2000);
      }
    } catch (err) {
      console.error("Failed to copy link:", err);
    }
  };

  return html`<div class="fallback">
    <img
      src="assets/fallback_image2.svg"
      alt="Fallback image"
      class="fallback-image"
    />
    <p class="fallback-message">
      Designed for a bigger screen. <br />Visit on desktop to get the full
      picture.
    </p>
    <button class="fallback-button" onClick=${handleCopyLink}>Copy link</button>
  </div>`;
}
