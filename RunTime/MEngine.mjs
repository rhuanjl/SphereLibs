/* File: MEngine.mjs
 * Author: Rhuan
 * Date: 27/10/2017
 * 2D Map Engine for miniSphere game engine
 * Usage: FIX ME - WRITE USAGE HERE OR EXTERNAL GUIDE DOC
 * License for MEngine.mjs, SEngine.mjs and CEngine.mjs and related files
 * Copyright (c) 2017 Richard Lawrence (Rhuan)
 * 
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 * 
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 * 
 * Except as contained in this notice, the name(s) of the above copyright holders
 * shall not be used in advertising or otherwise to promote the sale, use or other
 * dealings in this Software without prior written authorization.
 */


import {MapBuffer, TileBuffer} from "./PixelBuffer";
import DataStream from "data-stream";


//key class for external use
/**
 * Map Engine class
 * One MEngine can only draw one map at a time
 * create an instance - normally just one for your game
 * See documentaiton below
 * 
 * @export
 * @class MEngine
 */
export class MEngine
{
	/**
	 * Creates an instance of MEngine.
	 * @param {any} runTime - object to be given to map scripts when they're called - not currently used
	 * @param {any} SEngine - instance of SEngine class to handle sprites
	 * @param {any} [CEngine=null] - instance of CENgine class to handle collisions (must be shared with the SEngine instance)
	 * @param {string} [shaderPath="shaders/"] - path to customised shaders
	 * @param {any} [width=Surface.Screen.width] -dimensions of the surface this will draw on
	 * @param {any} [height=Surface.Screen.height]
	 * @memberof MEngine
	 */
	constructor(runTime, SEngine=null, CEngine=null, shaderPath="shaders/", width = Surface.Screen.width, height = Surface.Screen.height)
	{
		this.shader         = new Shader({
			fragmentFile: shaderPath + "customised.frag.glsl",
			vertexFile: shaderPath + "customised.vert.glsl"});
		this.s_width        = width;
		this.s_height       = height;
		this.useTransform   = false;
		this.transformation = null;
		this.map            = null;//current map - null at first
		this.folder         = "@";
		this.rmpScheme      = null;
		this.DEBUG_MODE     = false;
		this.col_tile_size  = 100;
		this.useSEngine     = false;
		if(SEngine !== null)
		{
			this.SEngine = SEngine;
			this.useSEngine = true;
		}
		if(CEngine !== null)
		{
			CEngine.MEngine = this;
		}
		this.runTime        = runTime;
	}

	/**
	 * update(centre=[0,0], zoom=1)
	 * Called to update the map should be done every frame designed to be used via Dispatch.onUpdate
	 * 
	 * If using SEngine this automatically calls SEngine#update
	 * 
	 * @param {any} [centre=[0,0]] - coordinates on map to attempt to centre the screen on
	 * @param {number} [zoom=1] - zoom scale factor, increase to make things bigger...
	 * @memberof MEngine
	 */
	update(centre=[0,0], zoom = 1)
	{
		zoom = Math.max(Math.min(this.map.height / this.s_height, this.map.width / this.s_width, zoom), 0.01);
		//#FIX ME this needs adjustment - to allow for repeating maps (other things do too :( - though mostly this + sprite coordinate code also Collision code)
		this.map.x = Math.min(Math.max(centre[0] - this.s_width * zoom  / 2, 0), this.map.width  - this.s_width * zoom);
		this.map.y = Math.min(Math.max(centre[1] - this.s_height * zoom  / 2, 0), this.map.height - this.s_height * zoom);
		this.map.zoom = zoom;
		
		if(this.map.entered === false)
		{
			this.map.mapScripts.onEnter(this.runTime, this.map);
			this.map.entered = true;
		}
		else if(this.map.leaving === true)
		{
			switch(this.map.dir)
			{
				case(0):
					this.map.mapScripts.onLeaveWest(this.runTime, this.map, this.map.player);
					break;
				case(1):
					this.map.mapScripts.onLeaveEast(this.runTime, this.map, this.map.player);
					break;
				case(2):
					this.map.mapScripts.onLeaveNorth(this.runTime, this.map, this.map.player);
					break;
				case(3):
					this.map.mapScripts.onLeaveSouth(this.runTime, this.map, this.map.player);
					break;
				
			}
		}
		
		this.map.mapScripts.onUpdate(this.runTime, this.map);

		if(this.useSEngine === true)
		{
			this.SEngine.update();
		}
	}

	/**
	 * render(surface=Surface.Screen, start_layer=0, end_layer=(this.map.layers.length-1))
	 * Draw the whole map onto surface
	 * Intended to be used via Dispatch.onRender
	 * start_layer and end_layer allow you to draw a specified range of layers only if wanted
	 * Note if using SEngine the call to this.renderLayer calls on to SEngine.renderLayer as well
	 * See below for more detail
	 * @param {any} [surface=Surface.Screen] 
	 * @param {number} [start_layer=0] 
	 * @param {number} [end_layer=(this.map.layers.length-1)] 
	 * @memberof MEngine
	 */
	render(surface=Surface.Screen, start_layer=0, end_layer=(this.map.layers.length-1))
	{

		if(this.DEBUG_MODE === true)
		{
			this.map.obsTransform.identity();
			this.map.obsTransform.translate(-this.map.x, -this.map.y);
		}

		//for(let i = 0; i < this.map.layers.length; ++i)
		//{
		this.shader.setFloatVector("tex_move", [this.map.x / this.map.width, 1 - this.map.y/this.map.height, this.map.zoom]);
		//}
		
		++end_layer;
		for(let i = start_layer; i < end_layer; ++i)
		{
			this.renderLayer(surface, i);
		}
		if(this.DEBUG_MODE === true)
		{
			this.map.layers[1].obsModel.draw();
		}
		this.map.mapScripts.onRender(this.runTime, this.map);
	}


	/**
	 * Draw one layer of the map onto the specified surface
	 * 
	 * If using SEngine this also draws the entities for the layer via calling SEngine#renderLayer
	 * 
	 * @param {any} [surface=Surface.Screen] 
	 * @param {number} [layer=0] 
	 * @memberof MEngine
	 */
	renderLayer(surface=Surface.Screen, layer=0)
	{
		let thisLayer = this.map.layers[layer];
		if(this.useTransformation)
		{
			thisLayer.transform2.identity();
			thisLayer.transform2.compose(this.transformation);
			thisLayer.transform2.compose(thisLayer.transform);
		}
		thisLayer.model.draw(surface);
		if(this.useSEngine === true)
		{
			this.SEngine.renderLayer([this.map.x, this.map.y], this.map.zoom, surface, layer);
		}
	}

	//#IMPROVE ME - could the next two methods be combined and made into a setter?

	/**
	 * Attach a transformation object to the whole map
	 * Use this to rotate or translate or scale the rectangle the map is drawn in
	 * For transititions or shrinking to a miniMap or the like
	 * 
	 * #EXPERIMENTAL feature - not fully tested
	 * 
	 * @param {object} transformation - a Sphere Transform object
	 * @memberof MEngine
	 */
	attachTransformation(transformation)
	{
		this.useTransformation = true;
		this.transformation = transformation;
		for(let i = 0; i < this.map.layers.length; ++i)
		{
			this.map.layers[i].transform2 = new Transform();
			this.map.layers[i].model.transform = this.map.layers[i].transform2;
		}
	}

	/**
	 * Use this to remove a Transfom that was set with attachTransformation
	 * 
	 * @memberof MEngine
	 */
	detachTransformation()
	{
		this.useTransformation = false;
		this.transformation = null;
		for(let i = 0; i < this.map.layers.length; ++i)
		{	
			this.map.layers[i].model.transform = this.map.layers[i].transform;
			this.map.layers[i].transform2 = null;
		}
	}



	/**
	 * changeRes(width, height)
	 * 
	 * Change the standard width and height of the box the map is drawn in
	 * 
	 * #Experimental feature, not full tested
	 * 
	 * @param {any} width 
	 * @param {any} height 
	 * @memberof MEngine
	 */
	changeRes(width, height)
	{
		if(width >= this.map.width && height >= this.map.height)
		{
			this.s_width  = width;
			this.s_height = height;
			var new_vertices = new VertexList([
				{x:0,     y:0,      z:0, u:0,                    v:1,                            color:Color.White},
				{x:width, y:0,      z:0, u:width/this.map.width, v:1,                            color:Color.White},
				{x:0,     y:height, z:0, u:0,                    v:1 - (height/this.map.height), color:Color.White},
				{x:width, y:height, z:0, u:width/this.map.width, v:1 - (height/this.map.height), color:Color.White}]);
			for (var i = 0; i < this.map.layers.length; ++i)
			{
				this.map.layers[i].shape.vertexList = new_vertices;
			}
		}
		else
		{
			MEngine.error("Requested screen resolution too large for map");
		}
	}

	/**
	 * setMap(fileName)
	 * 
	 * Set a map - used to set the first map and to change map later
	 * Note this is an async function use it with an await or a .then
	 * if you wish to chedule anything to happen after the map loads
	 * 
	 * This should take 1 tick of the event loop/one frame to resolve 
	 * I note however that if you do
	 * MEngine#setMap("new map");
	 * //other function calls
	 * 
	 * That the "other function calls" will resolve BEFORE the map is set
	 * 
	 * @param {string} fileName -path/name of map to load
	 * @memberof MEngine
	 */
	async setMap(fileName)
	{
		if(this.map !== null)
		{
			if(this.map.entered === true)
			{
				await this.map.mapScripts.onExit(this.runTime, this.map);
			}
		}
		
		let inputFile = new DataStream(fileName, FileOp.Read);
		//lead out with the tile data
		let numTiles     = inputFile.readUint16(true);
		let tileWidth    = inputFile.readUint16(true);
		let tileHeight   = inputFile.readUint16(true);
		let tileBuffer   = new TileBuffer(inputFile, tileWidth, tileHeight, numTiles);
		let tiles        = new Array(numTiles);
		let triggerID    = 0;
		let triggerNames = [];

		for(let i = 0, j = 0; i < numTiles; ++i, j = 0)
		{
			tiles[i] = {
				name     : inputFile.readString16(true),
				animated : inputFile.readUint8(),
				nextTile : inputFile.readUint16(true),
				delay    : inputFile.readUint16(true),
				obs      : new Array(inputFile.readUint16(true))
			};
			let tempBuffer = new DataView(inputFile.read(9 * tiles[i].obs.length));
			for(;j < tiles[i].obs.length; ++j)
			{
				tiles[i].obs[j] = {
					type : tempBuffer.getUint8(9 * j),//inputFile.readUint8(),
					x    : tempBuffer.getUint16(9 * j + 1, true),//inputFile.readUint16(true),
					y    : tempBuffer.getUint16(9 * j + 3, true),
					w    : tempBuffer.getUint16(9 * j + 5, true),
					h    : tempBuffer.getUint16(9 * j + 7, true)
				};
			}
		}
		let repeating = inputFile.readUint8(); //#FIX ME implement repeating
		let width = inputFile.readUint16(true);
		let height = inputFile.readUint16(true);
		let numLayers = inputFile.readUint8();
		let layers = new Array(numLayers);
		let fullWidth = width * tileWidth;
		let fullHeight = height * tileHeight;
		let screenWidth = this.s_width;
		let screenHeight = this.s_height;
		let mapBuffer = new MapBuffer(width, height, tileBuffer);
		let VBO = new VertexList([
			{x:0,           y:0,            u:0,                     v:1,                             color:Color.White},
			{x:screenWidth, y:0,            u:screenWidth/fullWidth, v:1,                             color:Color.White},
			{x:0,           y:screenHeight, u:0,                     v:1 - (screenHeight/fullHeight), color:Color.White},
			{x:screenWidth, y:screenHeight, u:screenWidth/fullWidth, v:1 - (screenHeight/fullHeight), color:Color.White}]);
		//var obs_shapes = [];
		var debugColour = new Color(0.9, 0.6, 0);
		for(let i = 0, j = 0, k = 0, l = 0; i < numLayers; ++i, j = 0, k = 0, l = 0)
		{
			layers[i] = {
				x          : 0,
				y          : 0,
				width      : inputFile.readUint16(true),
				height     : inputFile.readUint16(true),
				flags      : inputFile.readUint16(true),
				parallaxX  : inputFile.readFloat32(true),//#FIX ME implement parallaxx and scroll
				parallaxY  : inputFile.readFloat32(true),
				scrollX    : inputFile.readFloat32(true),
				scrollY    : inputFile.readFloat32(true),
				reflective : inputFile.readUint8(),//#FIX ME implement reflective
				segments   : new Array(inputFile.readUint32(true)),
				zones      : new Array(inputFile.readUint16(true)),
				triggers   : new Array(inputFile.readUint16(true)),
				tileMap    : new Array(width),
				transform  : new Transform(),
				transform2 : null,
				shape      : null,
				model      : null
			};
			if(this.DEBUG_MODE === true)
			{
				layers[i].obsShapes = [];
			}
			let tempBuffer = new DataView(inputFile.read(layers[i].width * layers[i].height * 2));
			for(; j < height; ++ j, k = 0)
			{
				layers[i].tileMap[j] = new Array(width);

				for(; k < width; ++k, ++l)
				{
					layers[i].tileMap[j][k] = tempBuffer.getInt16(l*2, true);
					mapBuffer.setTileInBuffer(layers[i].tileMap[j][k], l);
				}
			}
			if(this.DEBUG_MODE === true)
			{
				for(j = 0; j < height; ++ j, k = 0)
				{
					for(; k < width; ++k, ++l)
					{
						for(let m = 0; m < tiles[layers[i].tileMap[j][k]].obs.length; ++m)
						{
							let tempX = tileWidth * k;
							let tempY = tileHeight * j;
							let obsP  = tiles[layers[i].tileMap[j][k]].obs[m];
							layers[i].obsShapes.push(new Shape(ShapeType.LineLoop, null, new VertexList([
								{x:tempX + obsP.x         , y:tempY + obsP.y,          color:debugColour},
								{x:tempX + obsP.x + obsP.w, y:tempY + obsP.y,          color:debugColour},
								{x:tempX + obsP.x         , y:tempY + obsP.y + obsP.h, color:debugColour},
								{x:tempX + obsP.x + obsP.w, y:tempY + obsP.y + obsP.h, color:debugColour}])));		
						}
					}
				}
				layers[i].obsModel = new Model(layers[i].obsShapes);
			}
			let finalBuffer = mapBuffer.tileBufferToTexture();
			layers[i].shape = new Shape(ShapeType.TriStrip, 
				new Texture(finalBuffer.width, finalBuffer.height, finalBuffer.data), VBO);

			layers[i].model = new Model([layers[i].shape], this.shader);
			layers[i].model.transform = layers[i].transform;

			
			tempBuffer = new DataView(inputFile.read(9 * layers[i].segments.length));
			for(j = 0; j < layers[i].segments.length; ++j)
			{
				layers[i].segments[j] = {
					type : tempBuffer.getUint8(9 * j),//inputFile.readUint8(),
					x : tempBuffer.getUint16(9 * j + 1,true),//inputFile.readUint16(true),
					y : tempBuffer.getUint16(9 * j + 3,true),//inputFile.readUint16(true),
					w : tempBuffer.getUint16(9 * j + 5,true),//inputFile.readUint16(true),
					h : tempBuffer.getUint16(9 * j + 7,true),//inputFile.readUint16(true)
				};
			}
			for(j = 0; j < layers[i].zones.length; ++j)
			{
				layers[i].zones[j] = {
					name : inputFile.readString16(true),
					steps : inputFile.readUint16(true),
					poly :  {
						type : inputFile.readUint8(),
						x : inputFile.readUint16(true),
						y : inputFile.readUint16(true),
						w : inputFile.readUint16(true),
						h : inputFile.readUint16(true)
					}
				};
			}
			for(j = 0; j < layers[i].triggers.length; ++j)
			{
				let name = inputFile.readString16(true);
				triggerID = triggerNames.indexOf(name);
				if(triggerID === -1)
				{
					triggerID = triggerNames.length;
					triggerNames.push(name);
				}
				layers[i].triggers[j] = {
					name  : name,
					id    : triggerID,
					index : inputFile.readUint16(true) + inputFile.readUint16(true) * width
				};
			}
			layers[i].triggers.sort(function (a, b)
			{
				return a.index - b.index;
			});
		}
		let entities = new Array(inputFile.readUint16(true));
		for(let i = 0; i < entities.length; ++i)
		{
			entities[i] = {
				name   : inputFile.readString16(true),
				x      : inputFile.readUint16(true),
				y      : inputFile.readUint16(true),
				layer  : inputFile.readUint8(),
				sprite : inputFile.readString16(true)
			};
		}

		this.shader.setFloatVector("tex_move", [0,0,1]);
		this.shader.setInt("mask_mode",0);

		let startingName = inputFile.fileName;
		let splitPoint = startingName.lastIndexOf("/")+1;
		let identifier = startingName.slice(0,splitPoint) + "scripts/" + startingName.slice(splitPoint, startingName.length - 4) + ".mjs";
		//bring in the scripts
		let scripts = await import(identifier);
		let loadedScripts = {};

		if(scripts.triggerScripts === undefined)
		{
			loadedScripts.triggerScripts = {};
		}
		else
		{
			loadedScripts.triggerScripts = scripts.triggerScripts;
		}

		if(scripts.mapScripts === undefined)
		{
			loadedScripts.mapScripts = templateScripts;
		}
		else
		{
			loadedScripts.mapScripts = cripts.mapScripts;
		}


		if(this.useSEngine === true)
		{
			if(scripts.entityScripts === undefined)
			{
				loadedScripts.entityScripts = {};
			}
			else
			{
				loadedScripts.entityScripts = scripts.entityScripts;
			}
			this.SEngine.reset(fullWidth, fullHeight, numLayers);
			this.SEngine.loadMapEntities(entities, loadedScripts.entityScripts);
		}


		this.map =
		{
			layers  : layers,
			tiles   : tiles,
			x       : 0,
			y       : 0,
			z       : 1,
			entered : false,
			leaving : false,
			player  : null,
			dir     : 0,
			width   : fullWidth,
			height  : fullHeight,
			tile_w  : tileWidth,
			tile_h  : tileHeight,
			mapScripts     : loadedScripts.mapScripts,
			triggerScripts : loadedScripts.triggerScripts
		};

		if(this.DEBUG_MODE === true)
		{
			this.map.obsTransform = new Transform();
			for(let i = 0; i < this.map.layers.length; ++i)
			{
				this.map.layers[i].obsModel.transform = this.map.obsTransform;
			}
		}
		return true;
	}

	static error(description)
	{
		throw "MEngine error: " + description;
	}
}

//template for map scripts also used as blank version if none supplied
const templateScripts = 
{
	onExit : function (runTime, map){},
	onEnter : function (runTime, map){},
	onUpdate : function (runTime, map){},
	onRender : function (runTime, map){},
	onLeaveEast : function (runTime, map, player){},
	onLeaveWest : function (runTime, map, player){},
	onLeaveNorth : function (runTime, map, player){},
	onLeaveSouth : function (runTime, map, player){}
};
