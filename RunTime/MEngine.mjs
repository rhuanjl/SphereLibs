//@ts-check

/* File: MEngine.mjs
 * Author: Rhuan
 * Date: 17/09/2017
 * 2D map engine for miniSphere game engine
 * Usage: FIX ME - WRITE USAGE HERE OR EXTERNAL GUIDE DOC
 * License for MEngine.mjs, SEngine.mjs and CEngine.mjs
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

/* to do list
- make an RMP loader
- complete/test polygon functions
- write comments

*/

import {MapBuffer, TileBuffer} from "$/PixelBuffer";
import DataStream from "dataStream";
//import  "@/maps/scripts/Albrook.mjs";//#FIX MEdelete this when dynamic import works MUST BE FIXED before release



//key class for external use
export class MEngine
{
	constructor(runTime, SEngine, shaderPath="shaders/", useSEngine = true, width = screen.width, height = screen.height)
	{
		this.shader         = new Shader({
			fragment: shaderPath + "customised.frag.glsl",
			vertex: shaderPath + "customised.vert.glsl"});
		this.s_width        = width;
		this.s_height       = height;
		this.useTransform   = false;
		this.transformation = null;
		this.map            = null;//current map - null at first
		this.folder         = "@";
		this.rmpScheme      = null;
		this.DEBUG_MODE     = false;
		this.col_tile_size  = 100;
		this.useSEngine     = useSEngine;
		if(useSEngine === true)
		{
			this.SEngine = SEngine;
		}
		this.runTime        = runTime;
	}


	//Update the map
	//must be called once before the map can be drawn
	//must be called again if the zoom factor has changed OR if the point to centre the map on has changed
	//in a "normal" game you would call this in an update script that runs every frame
	//centre = [x, y] - on map x and y coordinates to aim to focus camera on
	//map coordinates will be adjusted to centre on this point
	//unless distance from point to edge of map is less than distance from centre of surface to edge of surface
	//in that case nearest point that means map edge reaches surface edge will be chosen

	update(centre, zoom)
	{
		zoom = Math.min(this.map.height / this.s_height, this.map.width / this.s_width, zoom);
		//#FIX ME this needs adjustment - to allow for repeating maps (other things do too :( - though mostly this + sprite coordinate code also Collision code)
		this.map.x = Math.min(this.map.width  - this.s_width * zoom, Math.max(-this.s_width * zoom  / (2.1) + centre[0],0));
		this.map.y = Math.min(this.map.height - this.s_height * zoom, Math.max(-this.s_height * zoom  / (2.1) + centre[1],0));
		this.map.zoom = zoom;

		if(this.DEBUG_MODE === true)
		{
			this.map.obsTransform.identity();
			this.map.obsTransform.translate(-this.map.x, -this.map.y);
		}

		//for(let i = 0; i < this.map.layers.length; ++i)
		//{
		this.shader.setFloatVector("tex_move", [this.map.x / this.map.width, 1 - this.map.y/this.map.height, zoom]);
		//}
		if(this.useSEngine === true)
		{
			this.SEngine.update([this.map.x, this.map.y], zoom);
		}
	}

	renderLayer(surface, layer)
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
			this.SEngine.renderLayer(surface, layer);
		}
	}

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

	//draw the map
	//make sure you call the update function first
	//surface = surface to draw to (normally "screen")
	//start_layer = first layer to draw
	//end_layer = last layer to draw
	//you can do ranges if you wish to draw part of the map under other entities and part on top
	//transformation = a transformation to apply to the whole map, points to note:
	//**if no transofmration is needed pass an identity i.e. foo as created by: (var foo = new Transform(); foo.identity();)
	//**if using SEngine you must pass the same transformation to the SEngine render function
	//**you don't need to pass a transformation for zooming and moving around the map
	//**a transofmraiton here is for things like making the map slide off the edge of the screen e.g. as a transition into a battle
	render(surface=screen, start_layer=0, end_layer=(this.map.layers.length-1))
	{
		++end_layer;
		for(let i = start_layer; i < end_layer; ++i)
		{
			this.renderLayer(surface, i);
		}
		if(this.DEBUG_MODE === true)
		{
			this.map.layers[1].obsModel.draw();
		}
	}

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

	async setMap(fileName)
	{
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
		let mapScripts = await import(identifier);
		this.SEngine.reset(fullWidth, fullHeight, numLayers);
		this.SEngine.loadMapEntities(entities, mapScripts.entityScripts);

		this.map =
		{
			layers : layers,
			tiles  : tiles,
			x      : 0,
			y      : 0,
			z      : 1,
			width  : fullWidth,
			height : fullHeight,
			tile_w : tileWidth,
			tile_h : tileHeight,
			triggerScripts : mapScripts.triggerScripts
		};

		if(this.DEBUG_MODE === true)
		{
			this.map.obsTransform = new Transform();
			for(let i = 0; i < this.map.layers.length; ++i)
			{
				this.map.layers[i].obsModel.transform = this.map.obsTransform;
			}
		}

	}

	static error(description)
	{
		throw "MEngine error: " + description;
	}
}


//#FIX ME this doesn't work - should do it with Uint32 (or 8) arrays instead
//ideally should be able to do it at runtime - though would need to think
//how to interopt with other things being drawn
function scale(image, mode)
{
	var scaler = new Shader({vertex:"shaders/"+mode+"vertex.glsl",fragment:"shaders/"+mode+"fragment.glsl"});

	var output = new Surface(image.width*2, image.height*2, new Color(0,0,0,0));

	var verts = new VertexList([
		{x:0,            y:0,             u:0, v:1, Color:Color.White},
		{x:output.width, y:0,             u:1, v:1, Color:Color.White},
		{x:0,            y:output.height, u:0, v:0, Color:Color.White},
		{x:output.width, y:output.height, u:1, v:0, Color:Color.White}]);
	var shape = new Shape(ShapeType.TriStrip, image, verts);
	var mod = new Model([shape],scaler);
	mod.setIntArray("textureDimensions",[image.width, image.height]);
	mod.draw(output);
	return output.toTexture();
}