# Tutorial
This document covers how to set up a project to run maps with the map engine in this repository. I will assume a basic level of understanding of miniSphere.

**What you'll need**
1. miniSphere version 5.0 (or later)
2. The map engine modules and dependency modules these can be found in the RunTime folder (you won't need to look at most of these to get going but all of these will need to be included in your project):
- MEngine.mjs - the core of the map engine
- SEngine.mjs - entity/sprite handling
- CEngine.mjs - collision handling
- PixelBuffer.mjs - low level graphics 
- input.mjs - input handling
- map-engine.mjs - easy to use wrapper this sits on top of the other modules giving a simpler interface to get started with (it is not required but offers a simpler starting point than using the other scripts directly and for many projects will be a suffiient interface)
NOTE: the folder also includes HUDSystem.mjs and MenuSystem.mjs - these are not required for running the map-engine
3. The map engine shaders - the folder called shaders - include this in your project
4. The cell tools - two scripts from the folder BuildTime:
- rmpLoader.mjs - converts .rmp files into the .mem format this engine uses
- rssLoader.mjs - converts .rss files into the .ses format this engine uses (NOTE this has to import PixelBuffer.mjs when it runs you may have to update the path for this import depending where you place the files - by default it expects a copy of PixelBuffer.mjs to be in the same folder as it)

**Making the project**
1. You'll need a main module - the simpleExample.mjs in the Templates folder gives an example version that should load a map and let you walk around - obviously you'd want to add more to this later
2. You'll need a sprite, this system currently uses sphere .rss files which it converts to its own .ses files when cell is run; only .rss version 3 is supported (any sprite made with the 1.5 editor or with sphere studio should be version 3 .rss, version 1 and 2 creation was discontinued in the editor over a decade ago though it still supports loading)
3. You'll need a map - .rmp is used but with a few limitations:
- Zones are not supported
- Obstruction segments are not supported (future pending feature) - you can leave these in they'll just be ignored, all obstructions need to be tile obstructions (or entities)
- All scripts in the map are ignored you must add a seperate scripts file. Note: as triggers don't have names by default but need a name for linking them to a script in the script file the text you enter as the trigger script in the map editor will be used as its name. See the templateMapScript.mjs file in the templates folder for an example map script.
- Note the map script must have the same name as the map file except for having the .mjs extension
4. You'll need a cellscript that runs the rmpLoader and rssLoader, see the Cellsscript.mjs in the Templates folder for a working example - you may have to change some file/folder names to get it to work for your project

**Go**
Having set up a project as described above run the cell script and run the resulting distributable with miniSphere and it should work :).

**What next?**
Feel free to ask me any quesitons on spheredev.org or via the issue tracker here or on the spheredev discord channel.

Have a look in map-engine.mjs for simple additional functions you can use, also look at the Entity object in SEngine - this describes the entity objects you're using in the map-engine and shows various methods available for use with them.

Note if you wish to set an update script/render script from your script rather than putting one in a mapscript file use either the Dispatch API or the thread.mjs system module (see miniSphere API documentation for how to use these).