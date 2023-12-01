// ==UserScript==
// @name Tweaks for Phanpy.social
// @namespace https://github.com/chrislowles
// @version 1.0.0
// @description Small tweaks for Phanpy.social, a minimal Mastodon client.
// @source https://github.com/chrislowles
// @updateURL https://raw.githubusercontent.com/chrislowles/userscripts/main/phanpy-tweaks.user.js
// @downloadURL https://raw.githubusercontent.com/chrislowles/userscripts/main/phanpy-tweaks.user.js
// @author Chris Lowles
// @icon https://www.google.com/s2/favicons?sz=64&domain=phanpy.social
// @match http*://phanpy.social/*
// ==/UserScript==

setTimeout(function() {
  let stylesEl = document.createElement("style");
  stylesEl.innerHTML = `
*, * * {
  animation: unset !important;
  transition: unset !important;
}

#generic-accounts-container .accounts-list li {
    flex-basis: 100% !important;
}
  `;
  document.querySelector("head").prepend(stylesEl);
}, 1);