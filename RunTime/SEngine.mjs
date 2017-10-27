//@ts-check

/* File: MSngine.mjs
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


/*key class for external use
**Params are:
**shader: a reference to the correct shader object
**layers: number of layers to display entities on - seperate layers don"t collide and higher numbered layers are drawn later
**use_MEngine: a boolean, true if you want the SEngine to interact with MEngine
**use_CEngine: a boolean, true if you want the SEngine to interact with CEngine (to have collisions)
**tileMovement: a boolean, true for tile based movement, false for direction/pixel based
**CONDITIONAL: IF tileMovement is true
**tSize: an integer, width/height of tiles your map uses (I've assumed square tiles only)
**m_tiles_accross: largest number of tiles accross for any map your intending to use - only used if doing tile based collisions
** IF tileMovement is false
**tSize: an integer width/height to use for collision segments for sprites - should be 2-3x the size of your sprites
**m_tiles_accross: the maximum/width of a map you intend to use when divided by tSize
**max_per_segment: a number higher than the most sprites you expect to fit in a segment
*/


import DataStream from "dataStream";
import {Input} from "$/input";

//Queued action types
export const spriteMOVE = 0;
export const spriteANIMATE = 1;
export const spriteSCRIPT = 2;
export const spriteFACE = 3;
const spriteDESTROY = 7;
const spriteY = 8;
const spriteX = 9;
const spriteLAYER = 10;//not exported as should not be used externally



export class SEngine
{
	constructor(runTime, CEngine, tSize, useCEngine=true, tileMovement=false, maxPerSeg=20, shaderPath="shaders/")
	{
		this.entities     = [];
		this._renders     = [];
		this.waiting      = 0;
		this.shader       = new Shader({
			fragment: shaderPath + "customised.frag.glsl",
			vertex: shaderPath + "customised.vert.glsl"});
		this.useCEngine   = useCEngine;
		if(useCEngine)
		{
			this.CEngine  = CEngine;
		}
		this.ready        = false;
		this.tSize        = tSize;
		this.layers       = 0;
		this.tileMovement = tileMovement;
		this.runTime      = runTime;
		this.folder       = "@";
		this.sprites      = {};
		this.offset       = [0,0];
		this.scale        = 1;
		this.width        = 0;
		this.height       = 0;
		this.transform    = null;
		this.transformed  = false;
		this.DEBUG_MODE   = false;
		this.talking      = false;
		this.input        = new Input();
		this.inputs       = [];
		this.maxPerSeg    = maxPerSeg;
	}

	static error (description)
	{
		throw new Error("SEngine error: " + description);
	}


	addEntity (id, sprites, persist=false, x=0, y=0, scale=[1, 1], layer=0, scripts=blankScripts)
	{
		if(scale[0] < 0 || scale[1] < 0)
		{
			SEngine.error("negative scale specified for entity" + id);
		}
		let newEntity = new Entity(id, sprites, x, y, persist, scale, scripts, this, this.shader, this.tSize, layer, this.tileMovement, this.DEBUG_MODE);
		newEntity.queueMove(newEntity.dir, 1, spriteSCRIPT, scripts.onSetup);
		this.entities.push(newEntity);
		if(this.ready === true)
		{
			this.initEntity(newEntity);
		}
		else if(persist === false)
		{
			SEngine.error("Cannot create non-persistant entity when SEngine not yet set");
		}
		return newEntity;
	}


	reset(mapWidth, mapHeight, mapLayers, surface = screen)
	{
		this.width = surface.width;
		this.height = surface.height;
		this.layers = mapLayers;
		let persistantEntities = [];
		for(let i = 0,length = this.entities.length; i < length; ++i)
		{
			if(this.entities[i].persist === true)
			{
				persistantEntities.push(this.entities[i]);
			}
		}
		this.entities = [];
		for(let i = 0; i < mapLayers; ++i)
		{
			this._renders[i] = [];
		}
		if(this.useCEngine === true)
		{
			this.initColisions(mapWidth, mapHeight, mapLayers);
		}
		for(let i = 0, length = persistantEntities.length; i < length; ++i)
		{
			let entity = persistantEntities[i];
			entity.internalLayer = Math.min(entity.layer, mapLayers - 1);
			this.entities.push(entity);
			this.initEntity(entity);
		}
		this.ready = true;
	}

	getEntity(id)
	{
		for(var i = 0; i < this.entities.length && this.entities[i].id !== id; ++i);
		return this.entities[i];
	}

	addInput(key, continuous, parameter, script)
	{
		this.inputs.push({
			key : key,
			continuous : continuous,
			parameter : parameter,
			script : script,
			active : false
		});
		return this.inputs.length - 1;
	}

	//probably a waste of time making this a function....
	//does a simple logic check to tell you if all movement/animation queues are empty
	idle ()
	{
		return (this.waiting === this.entities.length);
	}

	addDefaultInput(entity)
	{
		this.input.takeInput();
		entity.attached = true;
		this.addInput(Key.Up, true, entity, function(runTime, entity)
		{
			if(entity.waiting === true)
			{//this could be optimised - but would be uglier
				entity.queueMove("north");
			}
		});
		this.addInput(Key.Down, true, entity, function(runTime, entity)
		{
			if(entity.waiting === true)
			{
				entity.queueMove("south");
			}
		});
		this.addInput(Key.Left, true, entity, function(runTime, entity)
		{
			if(entity.waiting === true)
			{
				entity.queueMove("west");
			}
		});
		this.addInput(Key.Right, true, entity, function(runTime, entity)
		{
			if(entity.waiting === true)
			{
				entity.queueMove("east");
			}
		});

		if(this.useCEngine === true)
		{
			for(var i = 0; i < this.entities.length && this.entities[i].id !== entity.id; ++i);
			this.addInput(Key.Enter, false, {CEngine:this.CEngine, entity:entity, ref: i, entities: this.entities}, function(runTime, inputs)
			{
				let entity = inputs.entity;
				let vec = entity.sprites[entity.sprite].dirs[entity.dir].vector;
				let target = inputs.CEngine.collide(inputs.ref, entity.internalLayer, entity._x, entity._y, vec[0], vec[1], entity.poly);
				for(let j = 0, done = false; j < target.length && done === false; ++j)
				{
					if(target[j].type === 0)
					{
						inputs.entities[target[j].ref].scripts.onTalk(runTime, inputs.entities[target[j].ref], inputs.entity);
						done = true;
					}
				}
			});
		}
	}

	//update the system, process everyone's queues etc
	update (offset = [0, 0], scale = 1)
	{
		if(this.useCEngine === true)
		{
			var cType = this.CEngine.cType;
		}
		let inputSys = this.input;
		for (let i = 0; i < this.inputs.length; ++i)
		{
			let input = this.inputs[i];
			if (input.continuous === true || input.active === false)
			{
				if (inputSys.isPressed(input.key) === true)
				{
					input.active = true;
					input.script(this.runTime, input.parameter);
				}
			}
			else if (inputSys.isPressed(input.key) === false)
			{
				input.active = false;
			}
		}

		let entity;
		let stopped = false;
		let vec = [0, 0, 0];
		let collisions;
		this.waiting = 0;
		for (let i = 0; i < this.entities.length; ++i)
		{
			stopped = false;
			entity = this.entities[i];
			if (entity.frozen === true) 
			{
				if (entity.frame !== 0 && entity.sprites[entity.sprite].dirs[entity.dir].reset > -1)
				{
					if (entity.ticks > entity.sprites[entity.sprite].dirs[entity.dir].reset)
					{
						entity.frame = 0;
						entity.ticks = 0;
						entity.needsUpdate = true;
					}
					else
					{
						++entity.ticks;
					}
				}
			}
			else if (entity.end === entity.insert)
			{
				entity.scripts.onIdle(this.runTime, entity);
				if (entity.end === entity.insert)
				{
					if (entity.frame !== 0 && entity.sprites[entity.sprite].dirs[entity.dir].reset > -1)
					{
						if (entity.ticks > entity.sprites[entity.sprite].dirs[entity.dir].reset)
						{
							entity.frame = 0;
							entity.ticks = 0;
							entity.needsUpdate = true;
						}
						else
						{
							++entity.ticks;
						}
					}
					++this.waiting;
				}
			}
			else
			{
				let action = entity.queue[entity.end];
				if (action.type === spriteMOVE || action.type === spriteANIMATE)
				{//individual conditions to avoid dependence on ordering
					if (entity.sprites[entity.sprite].dir_Id[entity.queue[entity.end].direction] !== entity.dir)
					{
						entity.ticks = 0;
						entity.frame = 0;
						entity.dir = entity.sprites[entity.sprite].dir_Id[entity.queue[entity.end].direction];
						entity.needsUpdate = true;
					}
					else
					{
						entity.ticks = (entity.ticks + 1) % entity.sprites[entity.sprite].dirs[entity.dir].dt;
						if (entity.ticks === 0)
						{
							entity.frame = (entity.frame + 1) % (entity.sprites[entity.sprite].dirs[entity.dir].frames.length);
							entity.needsUpdate = true;
						}
					}
				}
				if (action.type === spriteMOVE)//add in trigger handler here + CEngine also do check to prevent retrigger
				{
					vec = entity.sprites[entity.sprite].dirs[entity.dir].vector;
					if ((this.tileMovement === true) && action.pos < this.tSize)
					{
						if (action.pos === 0 && this.useCEngine === true)
						{//#FIX ME the +1 stuff should be gone
							collisions = this.CEngine.collide(i + 1, entity.internalLayer, entity._x, entity._y, vec[0], vec[1], entity.poly);
							if (collisions.length > 0)
							{
								for (let j = 0; j < collisions.length; ++j)
								{
									if (collisions[j].type === 0)
									{
										stopped = true;
										let collidedWith = this.entities[collisions[j].ref];
										if (collidedWith.attached === true)
										{
											entity.scripts.onTouchPlayer(this.runTime, entity, collidedWith);
										}
										else
										{
											entity.scripts.onTouchOther(this.runTime, entity, collidedWith);
										}
									}
									else if (collisions[j].type === 1)
									{
										stopped = true;
									}
									else if (collisions[j].type === 2)
									{
										let collidedWith = this.entities[collisions[j].ref];
										if (collidedWith.attached === true)
										{
											collisions[j].scripts.onPlayer(this.runTime, entity);
										}
										else
										{
											collisions[j].scripts.onOther(this.runTime, entity);
										}
									}
								}
							}
							if (stopped === true)
							{
								--action.ticks;
							}
							else
							{
								if (cType === 0)
								{
									if (entity.tile_x + vec[0] >= 0 && entity.tile_y + vec[1] >= 0)
									{
										this.tObs[entity.internalLayer][entity.tile_x + vec[0]][entity.tile_y + vec[1]] = i + 1;
									}
								}
								else if (cType === 1)
								{
									SEngine.error("attempt to use tile based movement with polygon based collisions - this is not yet supported");
								}
							}
						}
						if (stopped === false)
						{
							++action.pos;
						}
					}
					else
					{
						--action.ticks;
						action.pos = 0;
						if (this.tileMovement === true)
						{
							if (this.useCEngine && entity.tile_x >= 0 && entity.tile_y >= 0)
							{
								this.tObs[entity.internalLayer][entity.tile_x][entity.tile_y] = 0;
							}
							entity.tile_x = (entity._x / this.tSize) | 0;
							entity.tile_y = (entity._y / this.tSize) | 0;
							stopped = true;
						}
						else if (this.useCEngine === true)
						{
							collisions = this.CEngine.collide(i, entity.internalLayer, entity._x, entity._y, vec[0], vec[1], entity.poly);
							if (collisions.length > 0)
							{
								for (let j = 0; j < collisions.length; ++j)
								{
									if (collisions[j].type === 0)
									{
										stopped = true;
										let collidedWith = this.entities[collisions[j].ref];
										if (collidedWith.attached === true)
										{
											entity.scripts.onTouchPlayer(this.runTime, entity, collidedWith);
										}
										else
										{
											entity.scripts.onTouchOther(this.runTime, entity, collidedWith);
										}
									}
									else if (collisions[j].type === 1)
									{
										stopped = true;
									}
									else if (collisions[j].type === 2)
									{
										try//#FIX ME remove this checking
										{
											if (entity.attached === true)
											{
												collisions[j].scripts.onPlayer(this.runTime, entity);
											}
											else
											{
												collisions[j].scripts.onOther(this.runTime, entity);
											}
										}
										catch (e)
										{
											if (entity.attached === true)
											{
												SSj.log(e);
											}
										}
									}
								}
							}
						}
					}
					if (stopped === false)
					{
						if (this.useCEngine)
						{
							if (cType === 1)
							{
								this.updateCollisions(i, entity._x, entity._y, vec[0], vec[1], entity.internalLayer, entity.internalLayer, false);
							}

							for (let j = 0; j < entity.poly.length; ++j)
							{
								entity.poly[j].x += vec[0];
								entity.poly[j].y += vec[1];
							}
						}
						entity._x += vec[0];
						entity._y += vec[1];
						//temp.z += temp.sprites[temp.sprite].dirs[temp.dir].vector[2];
					}

				}
				else if (action.type === spriteSCRIPT)
				{
					action.script(this.runTime, entity);
					--action.ticks;
				}
				else if (action.type == spriteY)
				{
					if (entity._y !== action.pos)
					{
						if (cType === 1)
						{
							this.updateCollisions(i, entity._x, entity._y, 0, action.pos - entity._y, entity.internalLayer, entity.internalLayer, false);
						}
						else if (cType === 0)
						{
							let newTileY = Math.floor(action.pos / this.tSize);
							this.tObs[entity.internalLayer][entity.tile_x][newTileY] = i + 1;
							this.tObs[entity.internalLayer][entity.tile_x][entity.tile_y] = 0;
						}
						entity._x = action.pos;
					}
					action.ticks = 0;
					--i;//when the action is teleporting let them take another action
				}
				else if (action.type == spriteX)
				{
					if (entity._x !== action.pos)
					{
						if (cType === 1)
						{
							this.updateCollisions(i, entity._x, entity._y, action.pos - entity._x, 0, entity.internalLayer, entity.internalLayer, false);
						}
						else if (cType === 0)
						{
							let newTileX = Math.floor(action.pos / this.tSize);
							this.tObs[entity.internalLayer][newTileX][entity.tile_y] = i + 1;
							this.tObs[entity.internalLayer][entity.tile_x][entity.tile_y] = 0;
						}
						entity._x = action.pos;
					}
					action.ticks = 0;
					--i;//when the action is teleporting let them take another action
				}
				else if (action.type == spriteLAYER)
				{
					if (entity.internalLayer !== action.pos)
					{
						this._renders[entity.internalLayer].splice(entity.position, 1);
						this._renders[action.pos].push(entity);
						entity.position = 0;
						if (cType === 1)
						{
							this.updateCollisions(i, entity._x, entity._y, 0, 0, entity.internalLayer, action.pos, false);
						}
						else if (cType === 0)
						{
							this.tObs[action.pos][entity.tile_x][entity.tile_y] = i + 1;
							this.tObs[entity.internalLayer][entity.tile_x][entity.tile_y] = 0;
						}
						entity.internalLayer = action.pos;
					}
					action.ticks = 0;
					--i;//when the action is just changing layer let them take another action
				}
				else if (action.type === spriteDESTROY)
				{
					entity.scripts.onDestroy(this.runTime, entity);
					if (this.CEngine.ctype === 1) {
						this.updateCollisions(i, entity._x, entity._y, 0, 0, entity.internalLayer, entity.internalLayer, false, true);
					}
					else if (cType === 0) {
						this.tObs[entity.internalLayer][entity.tile_x][entity.tile_y] = 0;
					}
					this._renders[entity.internalLayer].splice(entity.position, 1);
					entity.inUse = false;
					//this.entities.splice(i,1);//#FIX ME should we actually remove?
					//at the moment splicing the entity from the array will break stuff
				}
				if (action.ticks === 0)
				{
					++entity.end;
					if (entity.end === entity.insert)
					{
						entity.end = 0;
						entity.insert = 0;
					}
				}
			}
		}
		//re-order the render queue - #FIX-ME, consider if this should be done by moving inidividual entities
		//currently made stable with added position value - probably a tad slow
		for (let i = 0; i < this.layers; ++i)
		{
			this._renders[i].sort(function (entity_one, entity_two)
			{
				let test = entity_one._y - entity_two._y;
				if (test !== 0) 
				{
					return test;
				}
				else
				{
					return (entity_one.position - entity_two.position);
				}
			});
		}
		this.scale = scale;
		this.offset = offset;
	}

	renderLayer(surface, layer)
	{
		let thisLength = this._renders[layer].length;
		let currentRender;
		let offset = this.offset;
		let sScale = this.scale;
		let coords = [0, 0];
		let transformed = this.transformed;
		let renderQueue = this._renders[layer];
		let sWidth = this.width;
		let sHeight = this.height;
		if(transformed === true)
		{
			var transformation = this.transform;
		}
		for(let j = 0; j < thisLength; ++j)
		{
			currentRender = renderQueue[j];
			currentRender.position = j;
			if(currentRender.visible === true)
			{
				coords = [Math.floor((currentRender._x - (currentRender.scale[0] *  currentRender.sprites[currentRender.sprite].o[0])) / sScale) - offset[0],
					Math.floor((currentRender._y - (currentRender.scale[1] *  currentRender.sprites[currentRender.sprite].o[1])) / sScale) - offset[1]];

				let w_scale = (currentRender.scale[0] / sScale);
				let h_scale = (currentRender.scale[1] / sScale);
				if (coords[0] < sWidth &&
					coords[1] < sHeight &&
					(coords[0] + w_scale * currentRender.sprites[currentRender.sprite].w) > 0 &&
					(coords[1] + h_scale * currentRender.sprites[currentRender.sprite].h) > 0 )
				{
					//Future idea: should have a method for z coordinates
					if(currentRender.needsUpdate === true)
					{
						currentRender.models[currentRender.sprite].shader.setFloatVector("tex_move", currentRender.sprites[currentRender.sprite].frames[currentRender.dir][currentRender.frame]);//here be magic
						currentRender.needsUpdate = false;
					}
					currentRender.trans.identity();
					currentRender.trans.scale(w_scale, h_scale);
					currentRender.trans.translate(coords[0], coords[1]);
					if(transformed === true)
					{
						currentRender.trans.compose(transformation);
					}
					currentRender.models[currentRender.sprite].draw(surface);
					if(this.DEBUG_MODE === true)
					{
						currentRender.trans.identity();
						currentRender.trans.scale(1 / sScale, 1 / sScale);
						currentRender.trans.translate(currentRender._x / sScale - offset[0], currentRender._y / sScale - offset[1]);
						if(transformed === true)
						{
							currentRender.trans.compose(transformation);
						}
						currentRender.obs_model.draw(surface);
					}
				}
			}
		}
	}

	//load a list of entities (i.e. from a map or other data file)
	loadMapEntities (list, scripts)
	{//#FIX ME add exception catching
		let length = list.length;
		let scriptSet;
		for(let i = 0; i < length; ++i)
		{
			if(scripts[list[i].name])
			{
				scriptSet = scripts[list[i].name];
			}
			else
			{
				scriptSet = blankScripts;
			}
			this.addEntity(list[i].name, [this.lazyLoadSprite("sprites/" + list[i].sprite)], false, list[i].x, list[i].y, [1,1], list[i].layer, scriptSet);
		}
	}

	//lazy load spritesets
	lazyLoadSprite (fileName)
	{//#FIX ME add exception catching
		let name = fileName.substring(fileName.lastIndexOf("/") + 1);
		if(!this.sprites[name])
		{
			this.sprites[name] = loadSES(fileName);
		}
		return this.sprites[name];
	}

	//for internal use only - this function initialises collision information
	//pulled out into a seperate function from reset() for neatness/intelligibility
	initColisions(mapWidth, mapHeight, mapLayers)
	{
		let tilesAccross = Math.max(Math.ceil(mapWidth / this.tSize), Math.ceil(mapHeight / this.tSize)) + 1;
		this.tilesAccross = tilesAccross;
		this.layers = mapLayers;
		let CEngineCall = {};
		CEngineCall.entities = this.entities;
		switch(this.CEngine.cType)
		{
		case(0):
			//setup a tile map for colisions
			if(this.tileMovement !== true)
			{
				SEngine.error("tile based colisions but pixel based movement - this combination isn't supported yet.");
			}
			this.tObs = new Array(mapLayers);
			for(let i = 0; i < mapLayers; ++i)
			{
				this.tObs[i] = new Array(tilesAccross);
				for(let j = 0; j < tilesAccross; ++j)
				{
					this.tObs[i][j] = new Array(tilesAccross);
					this.tObs[i].fill(0);
				}
			}
			CEngineCall.table = this.tObs;
			break;
		case(1):
			//set up segments for collisions
			this.sObs = new Array(mapLayers);
			for(let i = 0; i < mapLayers; ++ i)
			{
				this.sObs[i] = new Array(tilesAccross);
				for(let j = 0; j < tilesAccross; ++j)
				{
					this.sObs[i][j] = new Array(tilesAccross);
					for(let k = 0; k < tilesAccross; ++ k)
					{
						this.sObs[i][j][k] =
						{
							list:new Array(this.maxPerSeg),
							end:0
						};
						this.sObs[i][j][k].list.fill(0);
					}
				}
			}
			CEngineCall.table = this.sObs;
			break;
		}
		this.CEngine.SEngine = CEngineCall;
		this.CEngine.tSize = this.tSize;
	}

	//function for internal use only
	//used when adding new entities to the engine AND when changing map
	//called from SEngine#addEntity and from SEngine#reset, should not be used anywhere else
	initEntity(entity)
	{
		let layer = entity.layer;
		if(layer < 0 || layer >= this.layers)
		{
			SEngine.error("out of range layer specified for entity" + entity.id);
		}
		if(this.useCEngine)
		{
			switch(this.CEngine.cType)
			{
			case(0):
				this.tObs[layer][entity.tile_x][entity.tile_y] = this.entities.length;//the apparent error here is intentional
				break;
			case(1):
				this.updateCollisions(this.entities.length-1, entity._x, entity._y, 0, 0, layer, layer, true);
			}
		}	
		this._renders[layer].push(entity);
	}


	//function for internal use only
	//updates which collision segment an entity is in
	//note this does not check for collisions
	updateCollisions (ref, x, y, d_x, d_y, layer1, layer2, initial=false, destroy=false)
	{
		let polygons = this.entities[ref].poly;
		let tSize = this.tSize;
		
		//where did we start - this will break if a polygon goes above the top or off to the left of a sprite
		//such behaviour should not be expected so won't allow for it
		//#FIX ME add in an error message to ENtity creation for out of bounds polys
		let start_x1 = Math.floor(x / tSize);
		let start_y1 = Math.floor(y / tSize);
		
		let max_w = 0, max_h = 0;
		
		for(let i = 0; i < polygons.length; ++i)
		{
			if(polygons[i].type === 1)
			{
				max_w = Math.max(polygons[i].w, max_w);
				max_h = Math.max(polygons[i].h, max_h);
			}
			else if (polygons[i].type === 0)
			{//note the use of w for both directions here is intentional as if this is a circle it's the radius
				max_w = (polygons[i].w * 2) > max_w ? (polygons[i].w * 2) : max_w;
				max_h = (polygons[i].w * 2) > max_h ? (polygons[i].w * 2) : max_h;
			}
		}
		
		let start_x2 = Math.ceil((x + max_w)/ tSize);
		let start_y2 = Math.ceil((y + max_h)/ tSize);
		
		let end_x1   = Math.floor((x + d_x) / tSize);
		let end_y1   = Math.floor((y + d_y) / tSize);
		let end_x2   = Math.ceil((x + max_w + d_x)/ tSize);
		let end_y2   = Math.ceil((y + max_h + d_y)/ tSize);
		
		let i = Math.max(Math.min(start_x1, end_x1)-1, 0);
		max_w = Math.max(start_x2, end_x2) + 1;
		
		let min_h = Math.max(Math.min(start_y1, end_y1)-1, 0);
		max_h  = Math.max(start_y2, end_y2) + 1;

		for(let j = min_h; i < max_w; ++ i, j = min_h)
		{
			for(; j < max_h; ++j)
			{
				if(initial === false && i >= start_x1 && i <= start_x2 && j >= start_y1 && j <= start_y2)
				{
					if(i < end_x1 || i > end_x2 || j < end_y1 || j > end_y2 || layer1 !== layer2 || destroy === true)
					{
						this.popSegment(i, j, layer1, ref);
					}
				}
				else if(i >= end_x1 && i <= end_x2 && j >= end_y1 && j <= end_y2 && destroy === false)
				{
					this.pushSegment(i, j, layer2, ref);
				}
			}
		}
	}

	//popSegment and pushSegment - these are part of updateColisions
	//should never be used anywhere else
	//inlining these two functions in the above could optimise
	//but would be a pain - particularly if supporting layer changes
	//hopefully JIT should inline these
	popSegment (i, j, layer, ref)
	{
		let sOb = this.sObs[layer][i][j];
		let location = sOb.end;
		for(let k = 0; k < location; ++ k)
		{
			if(sOb.list[k] === ref)
			{
				location = k;
			}
		}
		if(sOb[location] === ref)
		{
			--sOb.end;
			sOb.list[location] = sOb.list[sOb.end];
		}
	}

	pushSegment (i, j, layer, ref)
	{
		let sOb = this.sObs[layer][i][j];
		sOb.list[sOb.end] = ref;
		++sOb.end;
	}



}

//this class is intentionally not exported
//always create Entities via the SEngine#addEntity method
//it uses this constructor and returns the object but sets lots of default values based on the SEngine instance
class Entity
{
	constructor (id, sprites, x, y, persist, scale, scripts, SEngine, shader, tSize, layer, tileMovement, DEBUG_MODE)
	{
		this.id = id;
		this.sprites = sprites;//add lazy loading here
		this.models = [];
		this.trans = new Transform();
		for(var i = 0; i < sprites.length; ++i)
		{
			this.models[i] = new Model([sprites[i].shape],shader.clone());
			this.models[i].transform = this.trans;
			this.models[i].shader.setFloatVector("tex_move", [0,0,1]);
			this.models[i].shader.setInt("mask_mode",0);
		}

		this.tile_x = ((x - sprites[0].o[0]) / tSize)|0;
		this.tile_y = ((y - sprites[0].o[1]) / tSize)|0;
		if(tileMovement)
		{//snap to tile grid if using tile movement
			this._x = this.tile_x * tSize;
			this._y = this.tile_y * tSize;
		}
		else
		{
			this._x = x;
			this._y = y;
		}
		this.scripts = 
		{
			onDestroy     : scripts.onDestroy,
			onTouchPlayer : scripts.onTouchPlayer,
			onTouchOther  : scripts.onTouchOther,
			onIdle        : scripts.onIdle,
			onTalk        : scripts.onTalk
		};

		this.persist = persist;
		this.frozen = false;
		this.visible = true;
		this.scale = scale;
		this.sprite = 0;
		this.frame = 0;
		this.ticks = 0;
		this.dir = 0;
		this.queue = new Array({},{},{},{});
		this.end = 0;
		this.insert = 0;
		this.internalLayer = layer;
		this.position = 0;
		this.needsUpdate = true;
		if(DEBUG_MODE)
		{
			var obs_shapes = new Array(this.sprites[this.sprite].col.length);
			var debugColour = new Color(0.9, 0.1, 0);
		}

		if(typeof(SEngine) === "object")
		{
			this.SEngine = SEngine;
			this.inUse = true;
		}
		else
		{
			this.inUse = false;
		}


		this.poly = new Array(this.sprites[this.sprite].col.length);
		for(i = 0; i < this.poly.length; ++i)
		{
			this.poly[i] =
			{
				type: this.sprites[this.sprite].col[i].type,
				x:    this.sprites[this.sprite].col[i].x * scale[0] + x,
				y:    this.sprites[this.sprite].col[i].y * scale[1] + y,
				w:    this.sprites[this.sprite].col[i].w * scale[0],
				h:    this.sprites[this.sprite].col[i].h * scale[1]
			};
			if(DEBUG_MODE)
			{
				obs_shapes[i] = new Shape(ShapeType.LineLoop, null, new VertexList([
					{x:this.poly[i].x                  - x, y:this.poly[i].y - y,                  color:debugColour},
					{x:this.poly[i].x                  - x, y:this.poly[i].y + this.poly[i].h - y, color:debugColour},
					{x:this.poly[i].x + this.poly[i].w - x, y:this.poly[i].y + this.poly[i].h - y, color:debugColour},
					{x:this.poly[i].x + this.poly[i].w - x, y:this.poly[i].y - y,                  color:debugColour}]));
			}
		}
		if(DEBUG_MODE)
		{
			this.obs_model = new Model(obs_shapes);
			this.obs_model.transform = this.trans;
		}
		this.attached = false;
	}

	//#FINISH ME need similar mechanism for sprite swaps
	//#REFACTOR ME should we bin the sprite array?

	faceEntity(entity, immediate = true)
	{
		let dx = entity._x - this._x;
		let dy = entity._y - this._y;
		let dirs = this.sprites[this.sprite].dirs;
		let options = [];
		let i = 0, length = dirs.length;
		for(; i < length; ++i)
		{
			let temp1 = dx - dirs[i].vector[0];
			let temp2 = dy - dirs[i].vector[1];
			options[i] = ((temp1 * temp1) + (temp2 * temp2));
		}
		let target = Math.min(...options);
		for(i=0; options[i] !== target; ++i);
		if(immediate === true)
		{
			this.dir = i;
			this.needsUpdate = true;
		}
		else
		{
			this.queueMove(dirs[i].id, 0, spriteFACE);
		}

	}
	//#FIX Me this will show triggers as obstructions, could that be misleading?
	get obstructions ()
	{
		if(this.inUse === true)
		{
			let dirs = this.sprites[this.sprite].dirs;
			let obstructions = [];
			let collisionTest = this.SEngine.CEngine.collide;
			let id = this.id;
			let layer = this.internalLayer;
			let x = this._x;
			let y = this._y;
			let poly = this.poly;
			for(let i = 0, length = dirs.length; i < length; ++i)
			{
				obstructions.push({direction : dirs[i].id, collisions : collisionTest(id, layer, x, y, dirs[i].vector[0], dirs[i].vector[1], poly)});
			}
			return obstructions;
		}
		else
		{
			SEngine.error("obstructions requested for entity that is not in use.");
		}
	}

	//#Finalise me - experimental method
	obstructedOnLayer(layer)
	{
		if(this.inUse === true)
		{
			return (this.SEngine.CEngine.collide(this.id, layer, this._x, this._y, 0, 0, this.poly).length > 0);
		}
		else
		{
			SEngine.error("obstructions requested for entity that is not in use.");
		}
	}

	obstructionsInDirection(direction)
	{
		let dirs = this.sprites[this.sprite].dirs;
		for(var i = 0; dirs[i].id !== direction; ++i);
		if(dirs[i].id !== direction)
		{
			SEngine.error("obstructions test requested for non-existent direction");
		}
		let vec = dirs[i].vector;
		return this.SEngine.CEngine.collide(this.id, this.internalLayer, this._x, this._y, vec[0], vec[1], this.poly);
	}
	
	set layer(value)
	{
		if(value !== this.internalLayer)
		{
			//need SEngine to process this so queue it
			this.queueMove(this.dir, value, spriteLAYER);
		}
	}

	set x (value)
	{
		if(value !== this._x)
		{
			this.queueMove(this.dir, value, spriteX);
		}
	}

	get x()
	{
		return this._x;
	}

	set y (value)
	{
		if(value !== this._y)
		{
			this.queueMove(this.dir, value, spriteY);
		}
	}

	get y ()
	{
		return this._y;
	}

	get layer()
	{
		return this.internalLayer;
	}

	get waiting()
	{
		return (this.queueLength === 0);
	}

	get queueLength()
	{
		if(this.insert === this.end)
		{
			return 0;
		}
		else
		{//remove layer changes from queueLength as they don't take up a tick
			let _return = 0;
			let queue = this.queue;
			for(let i = this.end, insert = this.insert; i < insert; ++i )
			{
				if(queue[i].type < spriteY)//values above this are instant teleports
				{
					++_return;
				}
			}
			return _return;
		}
	}

	//wipe out an entity's queue - cancels any planned actions
	clearQueue()
	{
		this.insert = 0;
		this.end = 0;
	}

	get direction()
	{
		return this.sprites[this.sprite].dirs[this.dir].id;
	}

	set direction(value)
	{
		if(value !== this.sprites[this.sprite].dirs[this.dir].id)
		{
			this.dir = this.sprites[this.sprite].dirs_ID[value];
			this.needsUpdate = true;//have to set this so that the render function knows to update the sprite
		}
	}

	//remove entity from SEngine
	//if processQueue is true any remaining actions are completed first
	//if it's false or omitted remaining actions are cancelled 
	destroy(processQueue = false)
	{
		if(processQueue === false)
		{
			this.clearQueue();
		}
		this.queueMove(this.dir, 1, spriteDESTROY);
	}

	//function for queuing movement commands
	//dir = name of direction
	//units = how far to move
	//note specifying 0 (or negative )units = move forever or untill clearQueue is called
	//type 0 (or no specified type) = move
	//type 1 = animate without moving
	//type 2 = execute the function passed as the script parameter
	//			- note 1 : assumed to be a function already - don't pass a string,
	//          - note 2 : it will be executed with runTime passed as a parameter (property of SEngine object)
	//type 3 = face specified direction
	//...space for future options
	//type 10 is reserved for layers changes 0 don't use it directly though
	//- just do entity.layer = new_layer to trigger the setter
	//NOTE in tile movement mode units = number of tiles
	//when not in tile movement mode units = number of vectors
	//(most directions should be defined with 1 or 2 pixel vectors)
	queueMove (dir, units = 1, type = 0, script)
	{//TEST ME - OTT optimisation because why not
		if(this.insert === this.queue.length)
		{
			if(this.end > 0)
			{
				let size = this.insert - this.end;
				let queue = this.queue;
				for(let i = 0, pos = this.end; i < size; ++i)
				{
					queue[i] = queue[i + pos];
				}
				this.insert = this.insert - this.end;
				this.end = 0;
			}
		}
		
		if(type === spriteLAYER || type === spriteX || type === spriteY)
		{
			this.queue[this.insert] =
			{
				type      : type,
				direction : dir,
				ticks     : 1,
				pos       : units
			};
		}
		else if(type === spriteSCRIPT)
		{
			this.queue[this.insert] =
			{
				type       : spriteSCRIPT,
				direction  : dir,
				ticks      : units,
				script     : script,
			};
		}
		else
		{
			this.queue[this.insert] =
			{
				type      : type,
				direction : dir,
				ticks     : units,
				pos       : 0
			};
		}
		++this.insert;
	}
}

//create a sprite object
//atlas = texture object containing all the frames
//template = template object to use - see below
//id = id for referencing

export class Sprite
{
	constructor (id, atlas, template)
	{
		this.id     = id;
		this.dirs   = template.dirs;
		this.dir_Id = template.dirs_Id;
		this.o      = [template.x_o,template.y_o];
		this.w      = template.w;
		this.h      = template.h;
		this.a_w    = atlas.width;
		this.a_h    = atlas.height;
		//make a lookup table for texture movement
		//don't need to do this but it slightly optimisises the render function
		//and makes it prettier
		this.frames = new Array(this.dirs.length);
		for (var i = 0, j = 0; i < this.dirs.length; ++i)
		{
			this.frames[i] = new Array(this.dirs[i].frames.length);
			for(j = 0; j < this.dirs[i].frames.length; ++j)
			{
				this.frames[i][j] = [this.dirs[i].frames[j].u/this.a_w,-this.dirs[i].frames[j].v/this.a_h,1];
			}
		}
		this.col    = template.col;
		this.type   = template.type;
		this.shape  = new Shape(ShapeType.TriStrip, atlas,new VertexList([
			{x:0,         y:0,          z:0, u:0,                 v:1                    ,color:Color.White},
			{x:template.w,y:0,          z:0, u:this.w/atlas.width,v:1                    ,color:Color.White},
			{x:0,         y:template.h, z:0, u:0,                 v:1-this.h/atlas.height,color:Color.White},
			{x:template.w,y:template.h, z:0, u:this.w/atlas.width,v:1-this.h/atlas.height,color:Color.White}]));
	}
}

/*create a template for sprite objects
//used to enable simpler creation of sprites
//the template describes:
  - the layout of image file that will be used
  - the directions the sprite can have
  dirs = array of direction inputs, each one should be an object with:
   - id: id for direction
   - vector: [i,j,k] - number of pixels to move in X, Y and Z directions for each tick moved in this direction
   - frames: number of frames in direction
   - speed: number of ticks to wait before changing frame
  x = x coordinate in image file of first frame
  y = y coordinate in image file of first frame
  x_o,y_o = offset for drawing, if 0 sprite images are drawn with top left cornaer at sprite's coordinate, adjust to move sprite relative to coordinates
  width,hieght = dimensions of each frame
  horizontal =true/false the frames of each direction appear horizontally through the image
  stacked = true/false; true = if frames are horizontal each direction has a seperate row, false = one frame after another
            true = if directions are vertical each direction has a seperate column etc
  colision_polygon - for shape based colisions the vertices of the colision shape
	                 must provide as an array of vertex objects, each object should have properties x and y
	                 ignored if using tile based colisions (or if not doing colisiond detection) coordinates are relative to
*/


export class STemplate
{
	constructor (dirs, x, y, x_o, y_o, width, height, horizontal, stacked, colision_polygon)
	{
		this.dirs = [];
		this.dirs_Id = {};
		let t_x = x;
		let t_y = y;
		for(var i = 0; i < dirs.length; ++i)
		{
			this.dirs[i] = new Direction(dirs[i].id, dirs[i].vector, dirs[i].speed, dirs[i].frames, dirs[i].reset, t_x,t_y, width, height, horizontal);
			this.dirs_Id[dirs[i].id] = i;
			if(horizontal && stacked)
			{
				t_y += height;
			}
			else if(horizontal)
			{
				t_x += width * dirs[i].frames;
			}
			else if(stacked)
			{
				t_x += width;
			}
			else
			{
				t_y += height * dirs[i].frames;
			}
		}
		this.x_o = x_o;
		this.y_o = y_o;
		this.col = colision_polygon;
		this.w = width;
		this.h = height;
	}
}

export function loadSES(inputFile)
{
	let source = new DataStream(inputFile, FileOp.Read);

	let frameWidth = source.readUint16(true);
	let frameHeight = source.readUint16(true);

	let polyCount = source.readUint8(true);
	let polygons = new Array(polyCount);
	for(let i = 0; i < polyCount; ++i)
	{
		polygons[i] = {
			type:source.readUint8(true),
			x : source.readInt16(true),
			y : source.readInt16(true),
			w : source.readUint16(true),
			h : source.readUint16(true)
		};
	}
	let offsetX = source.readUint16(true);
	let offsetY = source.readUint16(true);

	let numDirections = source.readUint16(true);
	
	let directions = new Array(numDirections);
	for(let i = 0; i < numDirections; ++i)
	{
		directions[i] =
		{
			id: source.readString16(true),
			vector : [source.readInt8(), source.readInt8(),source.readInt8()],
			speed : source.readUint8(),
			frames : source.readUint8(),
			reset : source.readUint8()
		};
	}
	let fullWidth = source.readUint16(true);
	let fullHeight = source.readUint16(true);
	
	let image = new Texture(fullWidth, fullHeight, source.read(fullWidth * fullHeight * 4));

	let template = new STemplate (directions, 0, 0, offsetX, offsetY, frameWidth, frameHeight, true, true, polygons);
	return new Sprite(inputFile.substring(inputFile.lastIndexOf("/")), image, template);
}

const blankScripts =
{
	onSetup : function(){},
	onDestroy : function(){},
	onTouchPlayer : function(){},
	onTouchOther : function(){},
	onTalk : function(){},
	onIdle : function(){}
};

//create a Direction object
//this is a private class that shouldn't be used externally
//it is used for building a new Template object
//breaking it out of the STemplate function above made it look a lot simpler
//id = the name of the direction, can check/set directions by id not just by index number
//vector = [i,j,k] number of pixels to move in X, Y and Z directions for each tick moved in this direction
//frame_speed number of ticks to move before changing frame
//num_frames - number of frames in the direction
//reset - number of ticks to wait before resetting to frame 0 if not moving -1 to not reset
//x,y, width, height - the coordinates and size (in pixels) of the first frame of the direction in the Sprite's image/Atlas
//horizontal true if the frames of the spirte are drawn accross the image file, false if they're drawn down the image file
class Direction
{
	constructor (id, vector, frame_speed, num_frames, reset, x, y, width, height, horizontal)
	{
		this.id     = id;
		this.frames = [];
		this.vector = vector;
		this.dt     = frame_speed;
		this.reset  = reset;
		var ux      = x;
		var vy      = y;
		for(var i = 0; i < num_frames; ++i)
		{
			this.frames[i] = {u:ux,v:vy};
			if(horizontal)
			{
				ux = ux + width;
			}
			else
			{
				vy = vy + height;
			}
		}
	}
}