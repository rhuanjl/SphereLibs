//Example main module for use with MEngine.mjs and SEngine.mjs

//Update paths here if needed 

//import the SpriteEngine
import {SEngine, loadSES} from "./SEngine";
//import the MapEngine
import{MEngine} from "./MEngine";
//import the collision Engine
import{CEngine} from "./CEngine";

import{HUDSystem, WindowStyle} from "./HUDSystem";
import{Talking} from "./talk";


//Sphere.frameRate = 60;//Map speed is controlled by sphere framerate defaults to 60, set something else if you want to go fasterslower

class MapSystem
{
	constructor(runTime)
	{
		this.runTime = runTime;
		this.collisionSystem = new CEngine();//initiate collisionSysyem
		this.spriteSystem = new SEngine(runTime, this.collisionSystem, 50);//initiate SEngine
		this.mapSystem = new MEngine(runTime, this.spriteSystem, this.collisionSystem);//initiate MEngine
		this.HUD = new HUDSystem(true);//include a HUD in the MapSystem object - for drawing windows and text over the map
		this.started = false;
		this.paused = false;
	}

	createCharacter(name, spriteSet, x, y, layer)
	{
		return this.spriteSystem.addEntity(name, loadSES(spriteSet), true, x, y, layer);
	}

	attachInput(character)
	{
		this.spriteSystem.addDefaultInput(character);
	}

	async start(firstMap, cameraObject = {x: 0, y: 0, zoom: 1})
	{
		//Make Q = close down - this is a quick exit feature for testing
		this.spriteSystem.addInput(Key.Q, true, null, ()=>Sphere.shutDown());
		//attach standard movement to the camera object (mainCharacter is a good object to supply here)
		this.camera = cameraObject;
		if(!this.camera.zoom)//if this supplied camera object doesn't have a zoom property give it one
		{
			this.camera.zoom = 1;
		}
		try
		{
			await this.mapSystem.setMap(firstMap);//load the map
		}
		catch(e)
		{
			Dispatch.now(()=>{throw e;});//throw the error if there was one
		}

		this.updateToken = Dispatch.onUpdate(()=>this.update());
		this.renderToken = Dispatch.onRender(()=>this.render());
		this.started = true;
	}

	changeMap(newMap)
	{
		return this.mapSystem.setMap(newMap);
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
		this.mapSystem.update([this.camera.x, this.camera.y], this.camera.zoom);//update the map and center it on the hero - second parameter is zoom
		textAccess.text = "Hero speed is\n" + ourHero.speed;//update the HUD - see below for setup
	}

	render()
	{
		this.mapSystem.render();
		//draw anything on top of the map (e.g. a HUD) here
		this.HUD.draw();
	}

}


//lets run the above - as modules have locale scope no need to make a function


//1.Make a window style
let window = new WindowStyle("windows/reddishfetish.rws");

//2. make a HUD
let HUD = new HUDSystem(true);

//example HUD contents
HUD.addStatic(window.renderWindow(10, 10, 130, 30, new Color(0.8,1,1,0.7)));
let textRef = HUD.addVariableText("Hero speed is\n128",20, 15, 100);
let textAccess = HUD.getDynamic(textRef);

//2.Set up a talking object
let talking = new Talking(HUD, window);

//3. instantiate the system
let system = new MapSystem(talking);

//4. hook the HUD object onto the system
system.HUD = HUD;

//5. Make a character
let ourHero = system.createCharacter("Some Hero", "sprites/Theif01.ses", 250, 600, 1);

//6. attach input to the character
system.attachInput(ourHero);

//7. Give the character a zoom property so he can be used as the camera object for the map
//note zoom is an optional feature, just update the update function above to always send 1 if you don't want it
ourHero.zoom = 1;
//Set up some other input keys for "fun"
system.spriteSystem.addInput(Key.A, true, null, ()=>{ourHero.speed = ourHero.speed +5;});
system.spriteSystem.addInput(Key.S, true, null, ()=>{ourHero.speed = ourHero.speed -5;});
system.spriteSystem.addInput(Key.Z, true, null, ()=>{ourHero.zoom = ourHero.zoom +0.01;});
system.spriteSystem.addInput(Key.X, true, null, ()=>{ourHero.zoom = ourHero.zoom -0.01;});

//8. Start the system
system.start("maps/albrook.mem", ourHero);


