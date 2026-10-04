# userscripts
Various userscripts, made to varying degrees of quality (Issues welcomed)

## What are userscripts?
Userscripts are extensions written to be installed in userscript managers, the benefits of userscripts as opposed to standard extensions mainly lie in the fact that fixes can be pushed way faster and hotfixes can be dropped in on local copys if need be. My preferred manager is [Violentmonkey](https://violentmonkey.github.io/), [Tampermonkey](https://www.tampermonkey.net/) is another option but in my opinion it's really long in the tooth on its featureset.

## Versioning:
The versioning on the userscripts is defined by year.month.day-hotfix, for example 2024.12.25-1 would be a release for the 25th of December, 2024 with the first of any amount of possible additional patches, I don't know if this is a common format but I don't care, this is what works for me and the userscript managers don't seem to mind.

## Scripts:
### [breezewiki-tweaks.user.js](https://raw.githubusercontent.com/chrislowles/userscripts/main/breezewiki-tweaks.user.js)
Detects BreezeWiki instances and applies minimal layout cleanup CSS.
### [bsky-to-blueviewer.user.js](https://raw.githubusercontent.com/chrislowles/userscripts/main/bsky-to-blueviewer.user.js)
Redirects Bluesky post URLs to blueviewer.pages.dev. Useful for posts linked from ActivityPub-syndicated content via Bridgy.
### [canonical-redirector.user.js](https://raw.githubusercontent.com/chrislowles/userscripts/main/canonical-redirector.user.js)
Automatically redirect referral articles of supported outlets to their original source.
### [fediverse-ooo-redirector.user.js](https://raw.githubusercontent.com/chrislowles/userscripts/main/fediverse-ooo-redirector.user.js)
Redirects posts on instances of fediverse software to your local server through fediverse.ooo.
### [unbuzzwordify.user.js](https://raw.githubusercontent.com/chrislowles/userscripts/main/unbuzzwordify.user.js)
Replaces buzzwords with other, more entertaining words.
### [unbuzzwordify-woke.user.js](https://raw.githubusercontent.com/chrislowles/userscripts/main/unbuzzwordify-woke.user.js)
Replaces **specifically the word woke** with other, more entertaining words.
### [yt-front-to-subs.user.js](https://raw.githubusercontent.com/chrislowles/userscripts/main/yt-front-to-subs.user.js)
Redirects the YouTube Front Page to the Subfeed, by adjusting links in elements that direct there as well as simple checking for the path upon load.
### [yt-open-in-freetube.user.js](https://raw.githubusercontent.com/chrislowles/userscripts/main/yt-open-in-freetube.user.js)
Fires the freetube:// protocol handler whenever a watch page loads on YouTube.
### [yt-zero-out-timestamps.user.js](https://raw.githubusercontent.com/chrislowles/userscripts/main/yt-zero-out-timestamps.user.js)
Silently zeros out any youtube.com timestamp on load, forcing playback from the start while cleanly removing the parameter.

## Vibe Coded Scripts:
I won't lie when and say that I'm not a little lazy, these scripts are almost fully made with Gemini and Claude, I've audited each of them and I can say with 99% certainty that they actually work.
### [gemini-link-fixer.user.js](https://raw.githubusercontent.com/chrislowles/userscripts/main/gemini-link-fixer.user.js)
Monitors Gemini for links that point to Google Search queries of URLs and converts them into direct links.
### [letterboxd-review-autoexpander.user.js](https://raw.githubusercontent.com/chrislowles/userscripts/main/letterboxd-review-autoexpander.user.js)
Automatically expands all truncated reviews on Letterboxd film and reviews pages, including "more" links.
### [phanpy-auto-local.user.js](https://raw.githubusercontent.com/chrislowles/userscripts/main/phanpy-auto-local.user.js)
Automatically clicks "Switch to my instance" button in Phanpy.
### [reddit-account-age.user.js](https://raw.githubusercontent.com/chrislowles/userscripts/main/reddit-account-age.user.js)
Displays the account age of a user next to their username in Reddit comments.
### [skipper.user.js](https://raw.githubusercontent.com/chrislowles/userscripts/main/skipper.user.js)
Marks various sections on YouTube's progress bar using the SponsorBlock API. Press a configurable key to skip the current segment manually.
### [yt-autoexpand-comments.user.js](https://raw.githubusercontent.com/chrislowles/userscripts/main/yt-autoexpand-comments.user.js)
Automatically clicks truncated "Read more" or "Show more" buttons on YouTube.

---

<sub>[oddsnends.user.js](https://raw.githubusercontent.com/chrislowles/userscripts/main/oddsnends.user.js): random odds and ends for personal my day to day.</sub>