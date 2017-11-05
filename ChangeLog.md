# Changelog

**05/11/2017**
1. Added a show/hide layer boolean
2. Added map-engine.mjs a simple wrapper class to present a less complex starting point
3. added simpleExample.mjs - an example main module using map-engine.mjs
4. fixed a bug where the system would crash on loading mapScripts (typo)
5. added a simple tutorial

**04/11/2017**
Initial version of Changelog, but not the first commit.
Changes in current commit:
1. Introduce support for animated tiles
2. Minor tidy up

**WARNING**: the addition of animated tiles involved a change to the .mem format - to use this updated version of the scripts you must re-create your .mem files with the new version of the rmpLoader script via cell.