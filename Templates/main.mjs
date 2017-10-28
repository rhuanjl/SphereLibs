//Example main module for use with MEngine.mjs and SEngine.mjs

//Update paths here if needed $/ = main module folder

//import the SpriteEngine
import {SEngine, loadSES} from "$/SEngine";
//import the MapEngine
import{MEngine} from "$/MEngine";
//import the collision Engine
import{CEngine} from "$/CEngine";

//import the HUDSystem
import {HUDSystem, WindowStyle} from "$/HUDSystem";

//import the example async talk function
import {Talking} from "./talk";

//import the example async menusystem
import {MenuSystem} from "./MenuSystem";

//Make a HUD
let HUD = new HUDSystem(true);
//Load an rws file with the HUDSystem
let window = new WindowStyle("windows/InsertNameHere.rws");
//make a talking object - give it the windowstyle and HUD object
let talking = new Talking(HUD, window);

//make a menu
let menu = new MenuSystem(200, 20);
//add vertical list keys to menu
menu.addVListKeys();
//add some text options to the menu
menu.addTextOption("Fun times");
menu.addTextOption("Boring times");
menu.addTextOption("Weird times");
menu.addTextOption("Just why?");

Sphere.frameRate = 120;//Map speed is controlled by sphere framerate

//initiate collisionSysyem
let collisionSystem = new CEngine();
//first param = highest number of layers in all game maps, second param = always 1 (mode polygons or tiles but tile mode is broken)
//initiate the sprite system, give it a runtime object (for a simple example - talking) and a collision system
//3rd param = how big segments to use for tracking sprite collisions - leave at 50 unless you know what you're doing
let spriteSystem = new SEngine(talking, collisionSystem, 50);
//initiate mapSystem, takes runTIme object (NOT USED AT THE MOMENT) and spriteSystem
let mapSystem = new MEngine({}, spriteSystem, collisionSystem);
//Debug mode = draw collisions at runtime it's very slow - must be on before you load a map if you want it
//spriteSystem.DEBUG_MODE = true;
//mapSystem.DEBUG_MODE = true;

//add a window to the HUD
HUD.addStatic(window.renderWindow(10, 10, 100, 40, true, [0.8,1,1,0.7]));
//add some text to the hud
let textRef = HUD.addVariableText("Text in top corner\n" + "00:00:00",20, 15, 100);
//get access to the text so you can change it
let textAccess = HUD.getDynamic(textRef);


//Make a person see SEngine for parameters
let hero = spriteSystem.addEntity("Scum", [loadSES("sprites/Theif01.ses")],true,500, 900, [1,1], 1);

//Make Q = close down
spriteSystem.addInput(Key.Q, true, hero, ()=>Sphere.shutDown());


async function setup1()
{
	//attach stabdard movement to the hero
	spriteSystem.addDefaultInput(hero);

	await mapSystem.setMap("maps/NameOfMapHere.mem");

	//GO
	Dispatch.onRender(rendering);
	Dispatch.onUpdate(updating);

	//run the menu (will show over map)
	let choice = await menu.start();
	//choice will be a number representing what was chosen
	//do somethign with it here

}


function updating()
{
	mapSystem.update([hero.x, hero.y], 1);//update the map and center it on the hero - second parameter is zoom
	textAccess.text = "Text in top corner\n" + "00:00:00"//change the text every frame if you want to
}


function rendering()
{
	mapSystem.render();//draw map
	HUD.draw();//draw HUD
}

//call the setup function from above
setup1();
