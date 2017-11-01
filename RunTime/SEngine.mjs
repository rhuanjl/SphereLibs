/* File: SEngine.mjs
 * Author: Rhuan
 * Date: 27/10/2017
 * Sprite Engine for miniSphere game engine
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


/*Direct dependencies
input.mjs - for input handling
DataStream (from sphere Run time) for loading sprite files

May need to change paths depending on your setup*/
import DataStream from "data-stream";
import {Input} from "./input";

/*Queued action types
These are used to indicate what type of action a sprite has queued
to aid readability over using bare id numbers, and improve performance vs string compares*/
export const spriteMOVE = 0;
export const spriteANIMATE = 1;
export const spriteSCRIPT = 2;
export const spriteFACE = 3;
const spriteDESTROY = 7;//bottom 4 not exported as should not be used externally
const spriteY = 8;
const spriteX = 9;
const spriteLAYER = 10;



/**
 * Key class - SEngine
 * An instnace of SEngine is an environment for Sprites
 * Any given map can only use one instance at a time
 * In most games just one instance will be required
 * 
 * @export
 * @class SEngine
 */
export class SEngine
{
	/**
	 * Creates an instance of SEngine.
	 * @param {object} runTime - object to be available in entity scripts
	 * @param {object} CEngine - instance of CEngine class (unless you don't need collisions)
	 * @param {number} tSize  - size of collision segment, if using tileMovement this should be tile width
	 * 							For normal movement use a number 4-5x the width of your sprites
	 * @param {boolean} [useCEngine=true] -true for collisions
	 * @param {boolean} [tileMovement=false] -currently tileMovement is broken, must be false
	 * @param {number} [maxPerSeg=20] - future feature for now always leave as 20
	 * @param {string} [shaderPath="shaders/"] -path to where the customised shaders can be found
	 * @memberof SEngine
	 */
	constructor(runTime, CEngine, tSize, useCEngine=true, tileMovement=false, maxPerSeg=20, shaderPath="shaders/")
	{
		this.entities     = [];
		this._renders     = [];
		this.waiting      = 0;
		this.shader       = new Shader({
			fragmentFile: shaderPath + "customised.frag.glsl",
			vertexFile: shaderPath + "customised.vert.glsl"});
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
		this._default     = false;
		this.transform    = null;
		this.transformed  = false;
		this.DEBUG_MODE   = false;
		this.talking      = false;
		this.input        = new Input();
		this.inputs       = [];
		this.maxPerSeg    = maxPerSeg;
	}

	/**
	 * Add an entity to your SEngine
	 * This is a wrapper around new Entity that supplies certain required environment variables
	 * use this instead of calling new Entity diretly
	 * 
	 * @param {any} id -id/name for the entity, 
	 * @param {any} sprite -array of sprite objects (see Sprite class below) #MayChange to single sprite object
	 * @param {boolean} [persist=false] -true to keep it when changing map, false to delete on map change
	 * @param {number} [x=0] -initial coordinates
	 * @param {number} [y=0] 
	 * @param {any} [scale=[1, 1]] -x/y scaling to apply
	 * @param {number} [layer=0] -initial layer
	 * @param {any} [scripts=blankScripts] -entity scripts object - see blankScripts object for template
	 * @returns instance of Entity
	 * @memberof SEngine
	 */
	addEntity (id, sprite, persist=false, x=0, y=0, layer=0, speed = 100, scale=[1, 1], scripts=blankScripts)
	{
		if(scale[0] < 0 || scale[1] < 0)
		{
			SEngine.error("negative scale specified for entity" + id);
		}
		let newEntity = new Entity(id, sprite, x, y, speed, persist, scale, scripts, this, this.shader, this.tSize, layer, this.tileMovement, this.DEBUG_MODE);
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


	/**
	 * reset(mapWidth, mapHeight,mapLayers, surface)
	 * Initialises/Resets SEngine for a new map
	 * When using SEngine with MEngine
	 * MEngine will call this when yous et a map
	 * If not using MEngine you must call this yourself
	 * Use it to set the width, height and number of layers of the map your sprites can move on
	 * This initialises collision detection and sets this.ready to true
	 * calling it also deletes any entities for whom persist = false
	 * 
	 * @param {number} mapWidth 
	 * @param {number} mapHeight 
	 * @param {number} mapLayers 
	 * @param {object} [surface=Surface.Screen] - surface to draw to
	 * @memberof SEngine
	 */
	reset(mapWidth, mapHeight, mapLayers, surface = Surface.Screen)
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
		this.entities.length = 0;
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

	/**
	 * getEntity(id)
	 * Returns the entity object represented by the supplied id
	 * 
	 * #FIX ME could this use a WeakMap for better performance?
	 * @param {any} id 
	 * @returns 
	 * @memberof SEngine
	 */
	getEntity(id)
	{
		for(var i = 0; i < this.entities.length && this.entities[i].id !== id; ++i);
		return this.entities[i];
	}

	/**
	 * addInput(key, continuous, parameter, script)
	 * Binds the function: script to the key: key
	 * if continuous is false the function will only be called once each time the key is pressed
	 * if continous is true the function will be called every frame as long as the key is pressed
	 * the parameter object will be passed to the function as its second parameter the runtime
	 * object as its first
	 * 
	 * @param {number} key 
	 * @param {boolean} continuous 
	 * @param {object} parameter 
	 * @param {function} script 
	 * @returns 
	 * @memberof SEngine
	 */
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

	/**
	 * Remove an input previously added with addInput
	 * 
	 * @param {any} key 
	 * @memberof SEngine
	 */
	removeInput(key)
	{
		let index = 0;
		let inputs = this.inputs;
		let length = inputs.length;
		for(; index < length && inputs[index].key !== key; ++index);

		if(index === length)
		{
			SEngine.error("Request to remove input that does not exist");
		}

		inputs.splice(index, 1);
	}

	/**
	 * idle ()
	 * this.waiting = number of entities with no action queued
	 * this returns true if that is all entities - i.e. if nothing is happening
	 * 
	 * @returns 
	 * @memberof SEngine
	 */
	idle ()
	{
		return (this.waiting === this.entities.length);
	}

	/**
	 * Adds simple 4 directional movement + talk activation to the supplied entity
	 * 
	 * @param {object} entity - object representing an entity within this SEngine instance
	 * @memberof SEngine
	 */
	addDefaultInput(entity)
	{
		if(this._default === true)
		{
			this.removeDefaultInput();
		}
		
		this.input.takeInput();
		entity.attached = true;
		this._default = true;
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
				let vec = entity._vectors[entity.dir];
				let target = inputs.CEngine.collide(inputs.ref, entity.internalLayer, entity._x, entity._y, vec[0] * 2, vec[1] * 2, entity.poly);
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

	removeDefaultInput()
	{
		if(this._default === true)
		{
			let index = 0;
			let entities = this.entities;
			let length = entities.length;
			for(; index < length && entities[index].attached !== true; ++ index);
	
			if(index === length)
			{
				SEngine.error("attempt to remove Default Input when this does not exist.");
			}
	
			entities[index].attached = false;
	
			this.removeInput(Key.Enter);
			this.removeInput(Key.Up);
			this.removeInput(Key.Down);
			this.removeInput(Key.Left);
			this.removeInput(Key.Right);
		}
	}

	/**
	 * update (offset = [0, 0], scale = 1)
	 * updates the system this does the following things
	 * 1. checks for any inputs added with addINput above
	 * 2. loops through all entities processing the first action in their queues
	 * 		- if the action is a teleport (type spriteX/spriteY/spriteLayer) it's free
	 * 		- i.e. the next action is processed too
	 * 3. sets scale and offset ready for rendering
	 * scale = zoom in/out for everything
	 * offset = translation for everything - used to move around a map
	 * 
	 * NOTE when using MEngine with SEngine MEngine.update calls this function
	 * Only call this yourself if not using MENgine
	 * 
	 * #FIX ME - add a feature to freeze the whole SEngine?
	 * #FIX ME - move these params to render?
	 * @param {any} [offset=[0, 0]] 
	 * @param {number} [scale=1] 
	 * @memberof SEngine
	 */
	update ()
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
		let vec  = [0, 0];
		let pVec = [0, 0];
		let dX = 0;
		let dY = 0;
		let collisions;
		this.waiting = 0;
		for (let i = 0; i < this.entities.length; ++i)
		{
			stopped = false;
			entity = this.entities[i];
			if (entity.frozen === true) 
			{
				if (entity.frame !== 0 && entity._sprite.dirs[entity.dir].reset > -1)
				{
					if (entity.ticks > entity._sprite.dirs[entity.dir].reset)
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
					if (entity.frame !== 0 && entity._sprite.dirs[entity.dir].reset > -1)
					{
						if (entity.ticks > entity._sprite.dirs[entity.dir].reset)
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
					if (entity._sprite.dir_Id[entity.queue[entity.end].direction] !== entity.dir)
					{
						entity.ticks = 0;
						entity.frame = 0;
						entity.dir = entity._sprite.dir_Id[entity.queue[entity.end].direction];
						entity.needsUpdate = true;
					}
					else
					{
						entity.ticks = (entity.ticks + 1) % entity._sprite.dirs[entity.dir].dt;
						if (entity.ticks === 0)
						{
							entity.frame = (entity.frame + 1) % (entity._sprite.dirs[entity.dir].frames.length);
							entity.needsUpdate = true;
						}
					}
				}
				if (action.type === spriteMOVE)
				{
					vec = entity._vectors[entity.dir];
					pVec = entity._pVectors[entity.dir];
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
							dX = ((entity._px + pVec[0]) >> 7) - entity._x;
							dY = ((entity._py + pVec[1]) >> 7) - entity._y;	
							
							collisions = this.CEngine.collide(i, entity.internalLayer, entity._x, entity._y, dX, dY, entity.poly);
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
												SSj.log(e.toString());
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
								this.updateCollisions(i, entity._x, entity._y, dX, dY, entity.internalLayer, entity.internalLayer, false);
							}

							for (let j = 0; j < entity.poly.length; ++j)
							{
								entity.poly[j].x += dX;
								entity.poly[j].y += dY;
							}
						}
						entity._x += dX;
						entity._y += dY;
						entity._px += pVec[0];
						entity._py += pVec[1];
						//temp.z += temp._sprite.dirs[temp.dir].vector[2];
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
						entity._y = action.pos;
						entity._py = action.pos * 128;
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
						entity._px = action.pos * 128;
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
					if (this.CEngine.ctype === 1)
					{
						this.updateCollisions(i, entity._x, entity._y, 0, 0, entity.internalLayer, entity.internalLayer, false, true);
					}
					else if (cType === 0)
					{
						this.tObs[entity.internalLayer][entity.tile_x][entity.tile_y] = 0;
					}
					this._renders[entity.internalLayer].splice(entity.position, 1);
					entity.inUse = false;
					entity.frozen = true;
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
	}


	/**
	 * Draw one layer of entities
	 * Self explanatory
	 * 
	 * Note when using MEngine this is called by MEngine#render
	 * Only call it yourself if using SEngine without MEngine
	 * 
	 * If you have multiple layers of entities and are not using MEngine
	 * You will need to call it once per layer
	 * @param {object} [surface=Surface.Screen] 
	 * @param {number} [layer=0] 
	 * @memberof SEngine
	 */
	renderLayer(offset = [0, 0], zoom = 1, surface = Surface.Screen, layer = 0)
	{
		let thisLength = this._renders[layer].length;
		let currentRender;
		let coords = [0, 0];
		let transformed = this.transformed;
		let renderQueue = this._renders[layer];
		let sWidth = this.width;
		let sHeight = this.height;
		let zooomedOffset = [offset[0] / zoom, offset[1] / zoom];
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
				coords[0] = Math.floor((currentRender._x - (currentRender.scale[0] *  currentRender._sprite.o[0])) / zoom) - zooomedOffset[0];
				coords[1] = Math.floor((currentRender._y  - (currentRender.scale[1] *  currentRender._sprite.o[1])) / zoom) - zooomedOffset[1];

				let w_scale = (currentRender.scale[0] / zoom);
				let h_scale = (currentRender.scale[1] / zoom);
				if (coords[0] < sWidth &&
					coords[1] < sHeight &&
					(coords[0] + w_scale * currentRender._sprite.w) > 0 &&
					(coords[1] + h_scale * currentRender._sprite.h) > 0 )
				{
					//Future idea: should have a method for z coordinates
					if(currentRender.needsUpdate === true)
					{
						currentRender.model.shader.setFloatVector("tex_move", currentRender._sprite.frames[currentRender.dir][currentRender.frame]);//here be magic
						currentRender.needsUpdate = false;
					}
					currentRender.trans.identity();
					currentRender.trans.scale(w_scale, h_scale);
					currentRender.trans.translate(coords[0], coords[1]);
					if(transformed === true)
					{
						currentRender.trans.compose(transformation);
					}
					currentRender.model.draw(surface);
					if(this.DEBUG_MODE === true)
					{
						currentRender.trans.identity();
						currentRender.trans.scale(1 / zoom, 1 / zoom);
						currentRender.trans.translate(currentRender._x / zoom - offset[0], currentRender._y / zoom - offset[1]);
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

	/**
	 * loadMapEntities (list, scripts)
	 * This is called when setting a map in MEngine to load all the map entities
	 * 
	 * #DOCUMENT me - this needs better explanation for use without MEngine
	 * @param {any} list 
	 * @param {any} scripts 
	 * @memberof SEngine
	 */
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
			this.addEntity(list[i].name, this.lazyLoadSprite("sprites/" + list[i].sprite), false, list[i].x, list[i].y, list[i].layer, 128, [1,1], scriptSet);
		}
	}

	/**
	 * lazyLoadSprite (fileName)
	 * Checks an array of pre-loaded spritesets for the requested sprite
	 * If the sprite is found returns it
	 * If not found loads the sprite, adds it to the array and returns it
	 * 
	 * @param {any} fileName 
	 * @returns 
	 * @memberof SEngine
	 */
	lazyLoadSprite (fileName)
	{//#FIX ME add exception catching
		let name = fileName.substring(fileName.lastIndexOf("/") + 1);
		if(!this.sprites[name])
		{
			this.sprites[name] = loadSES(fileName);
		}
		return this.sprites[name];
	}

	//Remaining SENgine functions are internal use only
	//scroll down to Entity class to see more external use functions

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


	static error (description)
	{
		throw new Error("SEngine error: " + description);
	}


}

/**
 * Load a sprite from a .ses File
 * 
 * @export
 * @param {string} inputFile path/name
 * @returns 
 */
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


//this class is intentionally not exported
//always create Entities via the SEngine#addEntity method
//it uses this constructor and returns the object but sets lots of default values based on the SEngine instance
/**
 * A class representing an Entity
 * this class is intentionally not exported
 * always create Entities via the SEngine#addEntity method
 * 
 * However each entity you create that way will be an instance of this class
 * Read down for methods and properites available for use
 * 
 * @class Entity
 */
class Entity
{
	constructor (id, sprite, x, y, speed, persist, scale, scripts, SEngine, shader, tSize, layer, tileMovement, DEBUG_MODE)
	{
		this.id = id;

		//setup the sprite
		this._sprite = sprite;
		this.trans   = new Transform();
		this.model   = new Model([sprite.shape], shader.clone());
		this.model.transform = this.trans;
		this.model.shader.setFloatVector("tex_move", [0,0,1]);
		this.model.shader.setInt("mask_mode",0);

		if(DEBUG_MODE)
		{
			var obs_shapes = new Array(sprite.col.length);
			var debugColour = new Color(0.9, 0.1, 0);
		}

		this.poly = new Array(sprite.col.length);
		for(let i = 0; i < this.poly.length; ++i)
		{
			this.poly[i] =
			{
				type: sprite.col[i].type,
				x:    sprite.col[i].x * scale[0] + x,
				y:    sprite.col[i].y * scale[1] + y,
				w:    sprite.col[i].w * scale[0],
				h:    sprite.col[i].h * scale[1]
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



		//coordinates
		this.tile_x = ((x - sprite.o[0]) / tSize)|0;
		this.tile_y = ((y - sprite.o[1]) / tSize)|0;

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
		this.internalLayer = layer;

		this._px = x * 128;
		this._py = y * 128;

		this._speed = speed;

		this._pVectors = [];
		this._vectors = [];

		for(let i = 0; i < sprite.dirs.length; ++i)
		{
			this._pVectors[i] = [sprite.dirs[i].vector[0] * speed, sprite.dirs[i].vector[1] * speed];
			this._vectors[i] = [sprite.dirs[i].vector[0], sprite.dirs[i].vector[1]];
		}

		//scripts
		this.scripts = 
		{
			onDestroy     : scripts.onDestroy,
			onTouchPlayer : scripts.onTouchPlayer,
			onTouchOther  : scripts.onTouchOther,
			onIdle        : scripts.onIdle,
			onTalk        : scripts.onTalk
		};

		//set various generic properties
		this.persist = persist;
		this.frozen = false;
		this.visible = true;
		this.scale = scale;
		this.frame = 0;
		this.ticks = 0;
		this.dir = 0;
		this.queue = new Array({},{},{},{});//movement queue
		this.end = 0;
		this.insert = 0;

		this.position = 0;//place in render queue
		this.needsUpdate = true;//change of frame or direction
		this.attached = false;//is this player controlled

		//add a hook to SEngine - used by some of the convenience methods
		if(typeof(SEngine) === "object")
		{
			this.SEngine = SEngine;
			this.inUse = true;
		}
		else
		{
			this.inUse = false;
		}
		
	}


	/**
	 * get the sprite object
	 * 
	 * @memberof Entity
	 */
	get sprite()
	{
		return this._sprite;
	}
	
	/**
	 * Set the sprite object
	 * entityObject.sprite = spriteObject;
	 * Supply the new spriteObject as the parameter
	 * 
	 * @memberof Entity
	 */
	set sprite(sprite)
	{
		let shader   = this.model.shader;
		this._sprite = sprite;
		this.model   = new Model(sprite.shape, shader);

		this.model.transform = this.trans;
		let DEBUG_MODE = false;

		if(this.inUse === true)
		{
			if(this.SEngine.DEBUG_MODE === true)
			{
				DEBUG_MODE = true;
				var obs_shapes = new Array(sprite.col.length);
				var debugColour = new Color(0.9, 0.1, 0);
			}
		}

		let x = this.x;
		let y = this.y;

		this.poly = new Array(sprite.col.length);
		for(let i = 0; i < this.poly.length; ++i)
		{
			this.poly[i] =
			{
				type: sprite.col[i].type,
				x:    sprite.col[i].x * scale[0] + x,
				y:    sprite.col[i].y * scale[1] + y,
				w:    sprite.col[i].w * scale[0],
				h:    sprite.col[i].h * scale[1]
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


		this._pVectors = [];
		this._vectors = [];

		for(let i = 0; i < sprite.dirs.length; ++i)
		{
			this._pVectors[i] = [sprite.dirs[i].vector[0] * this.speed, sprite.dirs[i].vector[1] * this.speed];
			this._vectors[i] = [sprite.dirs[i].vector[0], sprite.dirs[i].vector[1]];
		}

		if(this.inUse === true)
		{
			let index = 0;
			let entities = this.SEngine.entities;
			let length = entities.length;
			for(; index < length && entities[index].id !== this.id; ++index);
			if(index === length)
			{
				SEngine.error("Sprite change requested for in use entity but entity not found in SEngine.");
			}
			this.SEngine.updateCollisions(index, this._x, this._y, 0, 0, this.internalLayer,this.internalLayer,false,false);
			if (this.SEngine.CEngine.collide(index, this.internalLayer, this._x, this._y, 0, 0, this.poly).length > 0)
			{
				SEngine.error("Sprite change requested that creates collision - this is not permitted.");
			}
		}

		this.needsUpdate = true;
	}

	set speed(value)
	{
		if(this._speed !== value)
		{
			this._speed = value;
			let dirs = this.sprite.dirs;
			for(let i = 0; i < dirs.length; ++i)
			{
				this._pVectors[i] = [dirs[i].vector[0] * value, dirs[i].vector[1] * value];
				this._vectors[i] = [dirs[i].vector[0], dirs[i].vector[1]];
			}
		}
	}

	get speed()
	{
		return this._speed;
	}


	//#FINISH ME need mechanism for sprite swaps
	//#REFACTOR ME should we bin the sprite array?

	/**
	 * faceEntity(entity, immediate = true)
	 * makes this Entity face towards entity
	 * if immediate is true this is done by setting properties immediately
	 * if immediate is false it is queued to happen after any other queued movements
	 * 
	 * @param {any} entity 
	 * @param {boolean} [immediate=true] 
	 * @memberof Entity
	 */
	faceEntity(entity, immediate = true)
	{
		let dx = entity._x - this._x;
		let dy = entity._y - this._y;
		let dirs = this._sprite.dirs;
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
	/**
	 * Entity#obstructions
	 * an array of items obstructing the entity
	 * 
	 * @readonly
	 * @memberof Entity
	 */
	get obstructions ()
	{
		if(this.inUse === true)
		{
			let dirs = this._sprite.dirs;
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
	/**
	 * Specifies whether the entity would be obstructed with it's crurent x,y on the specified layer
	 * 
	 * @param {any} layer 
	 * @returns 
	 * @memberof Entity
	 */
	obstructedOnLayer(layer)
	{
		if(this.inUse === true)
		{
			let index = 0;
			let entities = this.SEngine.entities;
			let length = entities.length;
			for(; index < length && entities[index].id !== this.id; ++index);
			if(index === length)
			{
				SEngine.error("Obstructions requested for in use entity but entity not found in SEngine.");
			}
			return (this.SEngine.CEngine.collide(index, layer, this._x, this._y, 0, 0, this.poly).length > 0);
		}
		else
		{
			SEngine.error("obstructions requested for entity that is not in use.");
		}
	}

	/**
	 * obstructionsInDirection(direction)
	 * Specifies whether the entity would be obstructed
	 * if it attempted to move in the specified direction
	 * 
	 * @param {any} direction 
	 * @returns 
	 * @memberof Entity
	 */
	obstructionsInDirection(direction)
	{
		let dirs = this._sprite.dirs;
		for(var i = 0; dirs[i].id !== direction; ++i);
		if(dirs[i].id !== direction)
		{
			SEngine.error("obstructions test requested for non-existent direction");
		}
		let vec = dirs[i].vector;
		let index = 0;
		let entities = this.SEngine.entities;
		let length = entities.length;
		for(; index < length && entities[index].id !== this.id; ++index);
		if(index === length)
		{
			SEngine.error("Obstructions requested for in use entity but entity not found in SEngine.");
		}
		return this.SEngine.CEngine.collide(index, this.internalLayer, this._x, this._y, vec[0], vec[1], this.poly);
	}
	
	/**
	 * Entity#layer
	 * queues a teleport to the specified layer
	 * 
	 * @memberof Entity
	 */
	set layer(value)
	{
		if(value !== this.internalLayer)
		{
			//need SEngine to process this so queue it
			this.queueMove(this.dir, value, spriteLAYER);
		}
	}

	/**
	 * Entity#x
	 * queues a teleport to the specified x
	 * 
	 * @memberof Entity
	 */
	set x (value)
	{
		if(value !== this._x || this.waiting === false)
		{
			this.queueMove(this.dir, value, spriteX);
		}
	}

	get x()
	{
		return this._x;
	}

	/**
	 * Entity#y
	 * queues a teleport to the specified y
	 * 
	 * @memberof Entity
	 */
	set y (value)
	{
		if(value !== this._y || this.waiting === false)
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

	/**
	 * Entity#waiting
	 * True if the entity has no actions queued
	 * Teleports are not counted as they are executed for free
	 * 
	 * @readonly
	 * @memberof Entity
	 */
	get waiting()
	{
		return (this.queueLength === 0);
	}

	/**
	 * Entity#fullyWaiting
	 * True if entity has nothing queued at all (including teleports)
	 * 
	 * @readonly
	 * @memberof Entity
	 */
	get fullyWaiting()
	{
		return (this.insert === this.end);
	}

	/**
	 * Returns number of actions queued excluding teleports
	 * 
	 * @readonly
	 * @memberof Entity
	 */
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


	/**
	 * Entity#fullQueueLength
	 * Returns the number of actions queued
	 * Including teleports
	 * 
	 * @readonly
	 * @memberof Entity
	 */
	get fullQueueLength()
	{
		return this.insert - this.end;
	}

	//wipe out an entity's queue - cancels any planned actions
	clearQueue()
	{
		this.insert = 0;
		this.end = 0;
	}

	/**
	 * Entity#direction
	 * The name of the ddirection the entity is facing e.g. "north"
	 * 
	 * #OPTIMISE_ME - next two methods could probably be faster with a WeakMap
	 * @memberof Entity
	 */
	get direction()
	{
		return this._sprite.dirs[this.dir].id;
	}

	set direction(value)
	{
		if(value !== this._sprite.dirs[this.dir].id)
		{
			this.dir = this._sprite.dirs_ID[value];
			this.needsUpdate = true;//have to set this so that the render function knows to update the sprite
		}
	}

	/**
	 * Entity#destroy()
	 * "remove" entity from SEngine
	 * if processQueue is true any remaining actions are completed first
	 * if it's false or omitted remaining actions are cancelled 
	 * 
	 * Entity is not fully removed, however it is removed from:
	 * - collision detection and
	 * - the render list and
	 * - it's queue will no longer be processed
	 * 
	 * NOTE THERE IS CURRENTLY NO METHOD to reverse this #FIX ME?
	 * 
	 * @param {boolean} [processQueue=false] 
	 * @memberof Entity
	 */
	destroy(processQueue = false)
	{
		if(processQueue === false)
		{
			this.clearQueue();
		}
		this.queueMove(this.dir, 1, spriteDESTROY);
	}

	/**
	 * queueMove (dir, units = 1, type = 0, script)
	 * function for queuing movement commands
	 * dir = name of direction
	 * units = how far to move
	 * note specifying 0 (or negative )units = move forever or untill clearQueue is called
	 * type 0 (or no specified type) = move
	 * type 1 = animate without moving
	 * type 2 = execute the function passed as the script parameter
	 * 			- note 1 : assumed to be a function already - don't pass a string,
	 * 			- note 2 : it will be executed with runTime passed as a parameter (property of SEngine object)
	 * type 3 = face specified direction
	 * ...space for future options
	 * Note 7-10 are reserved for features used through other Entity methods, don't use directly
	 * @param {any} dir 
	 * @param {number} [units=1] 
	 * @param {number} [type=0] 
	 * @param {any} script 
	 * @memberof Entity
	 */
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

/**
 * a sprite object
 * atlas = texture object containing all the frames
 * template = template object to use - see below
 * id = id for referencing (not currently used afaik)
 * Look further down for LoadSES function - to load sprite from file
 * @export
 * @class Sprite
 */
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



//Template object for entity scripts
//Make your own entity scripts normally via a MapScript file
const blankScripts =
{
	onSetup : function(runTime, self){},
	onDestroy : function(runTime, self){},
	onTouchPlayer : function(runTime, self, player){},
	onTouchOther : function(runTime, self, other){},
	onTalk : function(runTime, self){},
	onIdle : function(runTime, self){}
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