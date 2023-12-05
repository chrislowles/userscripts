// ==UserScript==
// @name Tweaks for Phanpy.social
// @namespace https://github.com/chrishazfun
// @version 1.0.4
// @description Small tweaks for Phanpy.social, a minimal Mastodon client.
// @source https://github.com/chrishazfun
// @updateURL https://raw.githubusercontent.com/chrishazfun/userscripts/main/phanpy-tweaks.user.js
// @downloadURL https://raw.githubusercontent.com/chrishazfun/userscripts/main/phanpy-tweaks.user.js
// @author chrishazfun
// @icon https://www.google.com/s2/favicons?sz=64&domain=phanpy.social
// @match http*://phanpy.social/*
// ==/UserScript==

setTimeout(function() {
  let phanpyStyles = document.createElement("style");
  phanpyStyles.innerHTML = `
*, * * {
  animation: unset !important;
  transition: unset !important;
}

#compose-container .status-preview {
  max-height: unset;
}

#generic-accounts-container .accounts-list li {
    flex-basis: 100% !important;
}
  `;
  document.querySelector("head").prepend(phanpyStyles);
}, 1);