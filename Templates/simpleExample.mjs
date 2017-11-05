//Example main module for use with map-engine.mjs
//use with the example cellscript - you'll need your own map and sprite and mapscript as well as the shaders + other scripts from this repository
//make sure you update paths/names in the cellscript

import MapEngine from "./map-engine";

//instantiate the system
let mapSys = new MapEngine();

//make a character - numbers are coordinates x, y and layer
let hero = mapSys.createCharacter("hero", "hero.ses", 50, 100, 1);

//attach default input (4 arrow keys to walk)
mapSys.attachInput(hero);

//Add a key input for shutting down
mapSys.addInput(Key.Q, Sphere.shutDown);

//start the system - provide a first map and something to centre the screen on
mapSys.start("myMap.mem", hero);

//note start is an async function so any extra code here would run before the map is shown