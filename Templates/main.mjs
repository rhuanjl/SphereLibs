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

//Sphere.frameRate = 60;//Map speed is controlled by sphere framerate defaults to 60, set something else if you want to go fasterslower

class MapSystem
{
	constructor(runTime)
	{
		this.collisionSystem = new CEngine();//initiate collisionSysyem
		this.spriteSystem = new SEngine(runTime, this.collisionSystem, 50);//initiate SEngine
		this.mapSystem = new MEngine(runTime, this.spriteSystem, this.collisionSystem);//initiate MEngine
		this.started = false;
		this.paused = false;
	}

	createCharacter(name, spriteSet, x, y, layer)
	{
		return this.spriteSystem.addEntity(name, [loadSES(spriteSet)],true,x, y, [1,1], layer);
	}

	start(firstMap, mainCharacter)
	{
		//Make Q = close down
		this.spriteSystem.addInput(Key.Q, true, null, ()=>Sphere.shutDown());
		//attach standard movement to the hero
		this.spriteSystem.addDefaultInput(mainCharacter);
		this.mainCharacter = mainCharacter;
		this.mapSystem.setMap(firstMap).then(()=>
		{
			this.updateToken = Dispatch.onUpdate(()=>this.update());
			this.renderToken = Dispatch.onRender(()=>this.render());
			this.started = true;
		});
	}

	async changeMap(newMap)
	{
		await this.mapSystem.setMap(newMap);
	}

	pause()
	{
		if(this.started && !this.paused)
		{
			this.updateToken.cancel();
			this.renderToken.cancel();
		}
		else
		{
			//error message here?
		}
	}

	resume()
	{
		if(this.started && this.paused)
		{
			this.updateToken = Dispatch.onUpdate(()=>this.update());
			this.renderToken = Dispatch.onRender(()=>this.render());
		}
		else
		{
			//error message here
		}
	}

	update()
	{
		this.mapSystem.update([this.mainCharacter.x, this.mainCharacter.y], 1);//update the map and center it on the hero - second parameter is zoom		
	}

	render()
	{
		this.mapSystem.render();
		//draw anything on top of the map (e.g. a HUD) here
	}

}




//first param = highest number of layers in all game maps, second param = always 1 (mode polygons or tiles but tile mode is broken)
//initiate the sprite system, give it a runtime object (for a simple example - talking) and a collision system
//3rd param = how big segments to use for tracking sprite collisions - leave at 50 unless you know what you're doing

//initiate mapSystem, takes runTIme object (NOT USED AT THE MOMENT) and spriteSystem

//Debug mode = draw collisions at runtime it's very slow - must be on before you load a map if you want it
//spriteSystem.DEBUG_MODE = true;
//mapSystem.DEBUG_MODE = true;

//add a window to the HUD
HUD.addStatic(window.renderWindow(10, 10, 100, 40, true, new Color(0.8,1,1,0.7)));
//add some text to the hud
let textRef = HUD.addVariableText("Text in top corner\n" + "00:00:00",20, 15, 100);
//get access to the text so you can change it
let textAccess = HUD.getDynamic(textRef);


//Make a person see SEngine for parameters
let hero = 




async function setup1()
{


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
