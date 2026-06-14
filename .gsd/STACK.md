# Stack

This document details the technologies and dependencies used in Quintasch.

## Frontend & Runtime
- **HTML5**: Native semantic markup and DOM interfaces.
- **CSS3**: Custom layout variables, flexbox/grid, keyframe animations, and 3D transforms (`transform-style: preserve-3d`).
- **JavaScript (ES6+)**: ES Modules (native imports/exports) running directly in-browser.

## Libraries (CDN Integration)
- **PeerJS (v1.5.5)**: WebRTC P2P networking API. Loaded via JSDelivr.
- **qrcode.js**: Client-side QR Code rendering. Loaded via GitHub CDN.

## Browser API Integrations
- **Web Audio API**: Native synthesis of retro drinking game sound effects (frequencies, white noise nodes, sweep envelopes).
- **LocalStorage API**: Local database persistence on the Host device for match history and leaderboard.
- **Service Workers**: Local offline assets caching.
- **Web App Manifest**: Home screen install capability.
