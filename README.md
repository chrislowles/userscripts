# userscripts
Various userscripts, made to varying degrees of quality (Issues welcomed)

## What are userscripts?
Userscripts are extensions written to be installed in userscript managers, the benefits of userscripts as opposed to standard extensions mainly lie in the fact that fixes can be pushed way faster and hotfixes can be dropped in on local copys if need be. My preferred manager is [Violentmonkey](https://violentmonkey.github.io/), [Tampermonkey](https://www.tampermonkey.net/) is another option but in my opinion it's really long in the tooth on its featureset.

## Versioning:
The versioning on the userscripts is defined by year.month.day-hotfix, for example 2024.12.25-1 would be a release for the 25th of December, 2024 with the first of any amount of possible additional patches, I don't know if this is a common format but I don't care, this is what works for me and the userscript managers don't seem to mind.

## Ones I've made:
### [canonical-redirector.user.js](https://raw.githubusercontent.com/chrislowles/userscripts/main/canonical-redirector.user.js)
Automatically redirect referral articles of supported outlets to their original source, based on MSN Redirector by Jamie Landeg-Jones.
### [gloves.user.js](https://raw.githubusercontent.com/chrislowles/userscripts/main/gloves.user.js)
Gloves for when you're made to read or interact with oligarch-run media.
### [ddgl-google-bing.user.js](https://raw.githubusercontent.com/chrislowles/userscripts/main/ddgl-google-bing.user.js)
Adds two link shortcuts to open any query made on DuckDuckGo Lite on either Google or Bing, the ebil search engines.
### [force-threads-feed-following.user.js](https://raw.githubusercontent.com/chrislowles/userscripts/main/force-threads-feed-following.user.js)
[LIKELY BROKEN] Uses multiple methods to ensure you never have to see For You on Threads, works on Mobile and Desktop.
### [give-up-x.user.js](https://raw.githubusercontent.com/chrislowles/userscripts/main/give-up-x.user.js)
Redirects any x.com (subdomains too) url to Rick Astleys smash hit.
### [redirect-peertube-video-embed.user.js](https://raw.githubusercontent.com/chrislowles/userscripts/main/redirect-peertube-video-embed.user.js)
Redirects PeerTube videos to a fullscreen embed url that autoplays, minimal QoL script for people that sub to PeerTube channels through Mastodon or other ActivityPub-compatible platforms.
### [unbuzzwordify-woke.user.js](https://raw.githubusercontent.com/chrislowles/userscripts/main/unbuzzwordify-woke.user.js)
Replaces specifically the word "woke" with other, more entertaining words.
### [unbuzzwordify.user.js](https://raw.githubusercontent.com/chrislowles/userscripts/main/unbuzzwordify.user.js)
Replaces certain buzzwords with other, more entertaining words.
### [yt-zero-out-timestamps.user.js](https://raw.githubusercontent.com/chrislowles/userscripts/main/yt-zero-out-timestamps.user.js)
Silently zeros any ?t= parameter on watch pages to force playback from the start.
### [yt-front-to-subs.user.js](https://raw.githubusercontent.com/chrislowles/userscripts/main/yt-front-to-subs.user.js)
Automatically redirects to the subfeed if you're on the YT front page.
### [yt-open-in-freetube.user.js](https://raw.githubusercontent.com/chrislowles/userscripts/main/yt-open-in-freetube.user.js)
Automatically opens any watch page on YT in Freetube (must have Freetube installed)

## Ones I've "made"
These are scripts that I've more or less ship-of-thesis'd (rewritten after initial prototyping) after messing with Claude or Gemini.
### [skipper.user.js](https://raw.githubusercontent.com/chrislowles/userscripts/main/skipper.user.js)
Marks various sections on YouTube's progress bar using the SponsorBlock API. Press a configurable key to skip the current segment manually.
### [yt-rss-parrot-subscribe.user.js](https://raw.githubusercontent.com/chrislowles/userscripts/main/yt-rss-parrot-subscribe.user.js)
(WIP) Injects a "Follow via RSS Parrot" button next to the Subscribe button on watch and channel pages.
### [meanwhile-on-reddit.user.js](https://raw.githubusercontent.com/chrislowles/userscripts/main/meanwhile-on-reddit.user.js)
Adds a sidebar widget on your Lemmy instance of choice showing a top 20 of today's Reddit among a configurable set of subreddits.
### [fediverse-ooo-redirector.user.js](https://raw.githubusercontent.com/chrislowles/userscripts/main/fediverse-ooo-redirector.user.js)
Redirects posts on instances of fediverse software to fediverse.ooo.
### [reddit-account-age.user.js](https://raw.githubusercontent.com/chrislowles/userscripts/main/reddit-account-age.user.js)
Displays the account age of a user next to their username in Reddit comments.
### [yt-autoexpand-comments.user.js](https://raw.githubusercontent.com/chrislowles/userscripts/main/yt-autoexpand-comments.user.js)
Automatically clicks "Read more" buttons on truncated YouTube comments.
### [gemini-link-fixer.user.js](https://raw.githubusercontent.com/chrislowles/userscripts/main/gemini-link-fixer.user.js)
Monitors Gemini for links that point to Google Search queries of URLs and converts them into direct links.
### [bandcamp-autoclose-mailing-list-modal.user.js](https://raw.githubusercontent.com/chrislowles/userscripts/main/bandcamp-autoclose-mailing-list-modal.user.js)
Automatically close the follow/mailing list modal on Bandcamp when it appears after you follow something.
### [letterboxd-review-autoexpander.user.js](https://raw.githubusercontent.com/chrislowles/userscripts/main/letterboxd-review-autoexpander.user.js)
Automatically expands all truncated reviews on Letterboxd film and reviews pages, including "more" links.

---

<sub>[oddsnends.user.js](https://raw.githubusercontent.com/chrislowles/userscripts/main/oddsnends.user.js): random odds and ends for personal my day to day.</sub>