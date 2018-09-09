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

/// <reference path="../SphereV2.d.ts" />

/*Direct dependencies
input.mjs - for input handling
DataStream (from sphere Run time) for loading sprite files

May need to change paths depending on your setup*/
import DataStream from "data-stream";
import Input from "./input";

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
 * An instance of SEngine is an environment for Sprites
 * Any given map can only use one instance at a time
 * In most games just one instance will be required
 * 
 * @export
 * @class SEngine
 */
export default class SEngine
{
    /**
     * Creates an instance of SEngine.
     * @param {object} runTime - object to be available in entity scripts
     * @param {CEngine} CEngine - instance of CEngine class (unless you don't need collisions)
     * @param {number} tSize  - size of collision segment, if using tileMovement this should be tile width
     *                             For normal movement use a number 4-5x the width of your sprites
     * @param {boolean} [useCEngine=true] -true for collisions
     * @param {boolean} [tileMovement=false] -currently tileMovement is broken, must be false
     * @param {number} [maxPerSeg=20] - future feature for now always leave as 20
     * @param {string} [shaderPath="shaders/"] -path to where the customised shaders can be found
     * @memberof SEngine
     */
    constructor(runTime, CEngine, tSize = 50, useCEngine=true, tileMovement=false, maxPerSeg=20, shaderPath="shaders/")
    {
        /** @type {Entity[]} */
        this.entities     = [];
        /** @type {Entity[][]} */
        this._renders     = [];
        this.waiting      = 0;
        this.shader       = new Shader({
            fragmentFile : shaderPath + "customised.frag.glsl",
            vertexFile   : shaderPath + "customised.vert.glsl"});
        this.useCEngine   = useCEngine;
        if (useCEngine)
        {
            this.CEngine  = CEngine;
        }
        this.ready        = false;
        this.tSize        = tSize;
        this._tFract      = 1 / tSize;
        this.layers       = 0;
        this.tileMovement = tileMovement;
        this.runTime      = runTime;
        this.folder       = "@";
        /*** @type {[name : string]: Sprite } */
        this.sprites      = {};
        /*** @type {[number, number]} */
        this.offset       = [0,0];
        this.width        = 0;
        this.height       = 0;
        this._default     = false;
        /** @type {Transform} */
        this.transform    = null;
        this.transformed  = false;
        this.DEBUG_MODE   = false;
        this.input        = new Input();
        /** @type {SEngineInput[]} */
        this.inputs       = [];
        this.maxPerSeg    = maxPerSeg;
    }

    /**
     * Add an entity to your SEngine
     * This is a wrapper around new Entity that supplies certain required environment variables
     * use this instead of calling new Entity directly
     * 
     * @param {string} id -id/name for the entity, 
     * @param {Sprite} sprite - sprite object (see Sprite class below)
     * @param {boolean} [persist=false] -true to keep it when changing map, false to delete on map change
     * @param {number} [x=0] -initial coordinates
     * @param {number} [y=0] 
     * @param {[number, number]} [scale=[1, 1]] -x/y scaling to apply
     * @param {number} [layer=0] -initial layer
     * @param {any} [scripts={}] -entity scripts object - see blankScripts object for template
     * @returns {Entity}
     * @memberof SEngine
     */
    addEntity (id, sprite, persist=false, x=0, y=0, layer=0, speed = 100, scale=[1, 1], scripts={})
    {
        if (scale[0] < 0 || scale[1] < 0)
        {
            throw new SEngineError("negative scale specified for entity" + id);
        }
        const newEntity = new Entity(id, sprite, x, y, speed, persist, scale, scripts, this, this.shader, this.tSize, this._tFract, layer, this.tileMovement, this.DEBUG_MODE);
        if (scripts.hasOwnProperty("onSetup"))
        {
            newEntity.queueMove(newEntity._sprite.dirs[newEntity.dir].id, 1, spriteSCRIPT, scripts.onSetup);
        }
        this.entities.push(newEntity);
        if (this.ready === true)
        {
            this.initEntity(newEntity);
        }
        else if (persist === false)
        {
            throw new SEngineError("Cannot create non-persistant entity when SEngine not yet set");
        }
        return newEntity;
    }


    /**
     * Initialises/Resets SEngine for a new map
     * 
     * When using SEngine with MEngine
     * MEngine will call this when you set a map
     * 
     * If not using MEngine you must call this yourself
     * 
     * Use it to set the width, height and number of layers of the map your sprites can move on
     * 
     * This initialises collision detection and sets this.ready to true
     * calling it also deletes any entities for whom persist = false
     * 
     * @param {number} mapWidth 
     * @param {number} mapHeight 
     * @param {number} mapLayers 
     * @param {Surface} [surface=Surface.Screen] - surface to draw to
     * @memberof SEngine
     */
    reset(mapWidth, mapHeight, mapLayers, surface = Surface.Screen)
    {
        this.width = surface.width;
        this.height = surface.height;
        this.layers = mapLayers;
        /** @type {Entity[]} */
        const persistantEntities = [];
        for (let i = 0,length = this.entities.length; i < length; ++i)
        {
            if (this.entities[i].persist === true)
            {
                persistantEntities.push(this.entities[i]);
            }
        }
        this.entities.length = 0;
        for (let i = 0; i < mapLayers; ++i)
        {
            this._renders[i] = [];
        }
        if (this.useCEngine === true)
        {
            this.initColisions(mapWidth, mapHeight, mapLayers);
        }
        for (let i = 0, length = persistantEntities.length; i < length; ++i)
        {
            const entity = persistantEntities[i];
            entity.internalLayer = Math.min(entity.layer, mapLayers - 1);
            this.entities.push(entity);
            this.initEntity(entity);
        }
        this.ready = true;
    }

    /**
     * Returns the entity object represented by the supplied id
     * 
     * @param {string} id 
     * @returns {Entity}
     * @memberof SEngine
     */
    getEntity(id)
    {
        const length = this.entities.length;
        for (let i = 0; i <  length; ++i)
        {
            if (this.entities[i].id === id)
            {
                return this.entities[i];
            }
        }
        throw new SEngineError("Attempt to get entity " + id + " but no such entity exists");
    }

    /**
     * Binds the function: script to the key: key
     * 
     * - if continuous is false the function will only be called once each time the key is pressed
     * - if continous is true the function will be called every frame as long as the key is pressed
     * - the parameter object will be passed to the function as its second parameter the runtime
     * object as its first
     * 
     * Note you must call SEngine.input.takeInput() to enable the input
     * @param {Key} key 
     * @param {boolean} continuous 
     * @param {object} parameter 
     * @param {function():void} onPress
     * @param {function():void} onRelease 
     * @returns {number}
     * @memberof SEngine
     */
    addInput(key, continuous, parameter, onPress=function(){}, onRelease=function(){})
    {
        const inputs = this.inputs;
        const length = inputs.length;
        for (let index = 0; index < length; ++index)
        {
            if (inputs[index].key === key)
            {
                throw new SEngineError("Attempt to add an input handler for a key that already has one.");
            }
        }
        inputs[length] = new SEngineInput(key, continuous, parameter,onPress, onRelease);
        return inputs.length;
    }

    /**
     * Remove an input previously added with addInput
     * 
     * @param {Key} key 
     * @memberof SEngine
     */
    removeInput(key)
    {
        const inputs = this.inputs;
        const length = inputs.length;
        for (let index = 0; index < length; ++index)
        {
            if (inputs[index].key === key)
            {
                inputs.splice(index, 1);
                return;
            }
        }
        throw new SEngineError("Request to remove input that does not exist");
    }

    /**
     * this.waiting = number of entities with no action queued
     * this returns true if that is all entities - i.e. if nothing is happening
     * 
     * @returns 
     * @memberof SEngine
     */
    get idle ()
    {
        return this.waiting === this.entities.length;
    }

    /**
     * Adds simple 4 directional movement + talk activation to the supplied entity.
     * 
     * Additionally makes the engine treat the specified entity as the player character wherever that is relevant.
     * 
     * If this is called on two entities the call to the second one replaces the call to the first one.
     * 
     * Note you must call SEngine.input.takeInput() to enable the input.
     * 
     * @param {Entity} entity - object representing an entity within this SEngine instance
     * @memberof SEngine
     */
    addDefaultInput(entity)
    {
        if (this._default === true)
        {
            this.removeDefaultInput();
        }
        entity.attached = true;
        this._default = true;
        this.addInput(Key.Up, true, entity, moveNorth);
        this.addInput(Key.Down, true, entity, moveSouth);
        this.addInput(Key.Left, true, entity, moveWest);
        this.addInput(Key.Right, true, entity, moveEast);

        if (this.useCEngine === true)
        {
            for (let i = 0; i < this.entities.length; ++i)
            {
                if (this.entities[i].id === entity.id)
                {
                    this.addInput(Key.Enter, false, { CEngine : this.CEngine, entity : entity, ref : i, entities : this.entities}, talkHandler);
                    return;
                }
            }
        }
    }

    /**
     * Removes the input added with addDefaultInput
     * 
     * Returns false if nothing found to remove
     *
     * @returns
     * @memberof SEngine
     */
    removeDefaultInput()
    {
        if (this._default === true)
        {
            const entities = this.entities;
            const length = entities.length;
            for (let index = 0; index < length; ++ index)
            {
                if (entities[index].attached === true)
                {
                    entities[index].attached = false;
                    this.removeInput(Key.Enter);
                    this.removeInput(Key.Up);
                    this.removeInput(Key.Down);
                    this.removeInput(Key.Left);
                    this.removeInput(Key.Right);
                    return true;
                }
            }
        }
        return false;
    }

    /**
     * updates the system this does the following things
     * 1. checks for any inputs added with addInput above
     * 2. loops through all entities processing the first action in their queues
     *     - if the action is a teleport (type spriteX/spriteY/spriteLayer) it's free
     *     - i.e. the next action is processed too
     * 
     * NOTE when using MEngine with SEngine MEngine.update calls this function
     * Only call this yourself if not using MENgine
     * 
     * #FIX ME - add a feature to freeze the whole SEngine?
     * @memberof SEngine
     */
    update ()
    {
        let cType = 0;
        if (this.useCEngine === true)
        {
            cType = this.CEngine.cType;
        }
        const inputSys = this.input;
        for (let i = 0, length = this.inputs.length; i < length; ++i)
        {
            const input = this.inputs[i];
            if (input.continuous === true)
            {
                if (inputSys.isPressed(input.key) === true)
                {
                    input.active = true;
                    input.onPress(this.runTime, input.parameter);
                }
                else if (input.active === true)
                {
                    input.active = false;
                    input.onRelease(this.runTime, input.parameter);
                }
            }
            else if (input.active === false)
            {
                if (inputSys.isPressed(input.key) === true)
                {
                    input.active = true;
                    input.onPress(this.runTime, input.parameter);
                }
            }
            else if (inputSys.isPressed(input.key) === false)
            {
                input.active = false;
                input.onRelease(this.runTime, input.parameter);
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
        for (let i = 0, length = this.entities.length; i < length; ++i)
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
                const action = entity.queue[entity.end];
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
                            entity.frame = (entity.frame + 1) % entity._sprite.dirs[entity.dir].frames.length;
                            entity.needsUpdate = true;
                        }
                    }
                }
                if (action.type === spriteMOVE)
                {
                    vec = entity._vectors[entity.dir];
                    pVec = entity._pVectors[entity.dir];
                    if (this.tileMovement === true && action.pos < this.tSize)
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
                                        const collidedWith = this.entities[collisions[j].ref];
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
                                        const collidedWith = this.entities[collisions[j].ref];
                                        if (collidedWith.attached === true)
                                        {
                                            collisions[j].scripts.onTouchPlayer(this.runTime, entity);
                                        }
                                        else
                                        {
                                            collisions[j].scripts.onTouchOther(this.runTime, entity);
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
                                    throw new SEngineError("attempt to use tile based movement with polygon based collisions - this is not yet supported");
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
                            entity.tile_x = Math.floor(entity._x * this._tFract);
                            entity.tile_y = Math.floor(entity._y * this._tFract);
                            stopped = true;
                        }
                        else if (this.useCEngine === true)
                        {
                            dX = (entity._px + pVec[0] >> 7) - entity._x;
                            dY = (entity._py + pVec[1] >> 7) - entity._y;

                            collisions = this.CEngine.collide(i, entity.internalLayer, entity._x, entity._y, dX, dY, entity.poly);
                            if (collisions.length > 0)
                            {
                                for (let j = 0; j < collisions.length; ++j)
                                {
                                    if (collisions[j].type === 0)
                                    {
                                        stopped = true;
                                        const collidedWith = this.entities[collisions[j].ref];
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
                                    else /* type 2 = trigger, type 3 = zone - handling is the same */
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
                    }
                    entity.scripts.onStep(this.runTime, entity);
                }
                else if (action.type === spriteSCRIPT)
                {
                    action.script(this.runTime, entity);
                    --action.ticks;
                }
                else if (action.type === spriteY)
                {
                    if (entity._y !== action.pos)
                    {
                        if (cType === 1)
                        {
                            this.updateCollisions(i, entity._x, entity._y, 0, action.pos - entity._y, entity.internalLayer, entity.internalLayer, false);
                        }
                        else if (cType === 0)
                        {
                            const newTileY = Math.floor(action.pos * this._tFract);
                            this.tObs[entity.internalLayer][entity.tile_x][newTileY] = i + 1;
                            this.tObs[entity.internalLayer][entity.tile_x][entity.tile_y] = 0;
                        }
                        for (let j = 0; j < entity.poly.length; ++j)
                        {
                            entity.poly[j].y += action.pos - entity._y;
                        }
                        entity._y = action.pos;
                        entity._py = action.pos * 128;
                    }
                    action.ticks = 0;
                    --i;//when the action is teleporting let them take another action
                }
                else if (action.type === spriteX)
                {
                    if (entity._x !== action.pos)
                    {
                        if (cType === 1)
                        {
                            this.updateCollisions(i, entity._x, entity._y, action.pos - entity._x, 0, entity.internalLayer, entity.internalLayer, false);
                        }
                        else if (cType === 0)
                        {
                            const newTileX = Math.floor(action.pos * this._tFract);
                            this.tObs[entity.internalLayer][newTileX][entity.tile_y] = i + 1;
                            this.tObs[entity.internalLayer][entity.tile_x][entity.tile_y] = 0;
                        }
                        for (let j = 0; j < entity.poly.length; ++j)
                        {
                            entity.poly[j].x += action.pos - entity._x;
                        }
                        entity._x = action.pos;
                        entity._px = action.pos * 128;
                    }
                    action.ticks = 0;
                    --i;//when the action is teleporting let them take another action
                }
                else if (action.type === spriteLAYER)
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
            this._renders[i].sort(compareEntities);
        }
    }

    /**
     * Draw the entities on the specified layer
     * To the specified surface at the provided offset and with the provide zoom
     *
     * When using MEngine this will be called from within MEngine#render
     * 
     * @param {[number, number]} [offset=[0, 0]]
     * @param {number} [zoom=1]
     * @param {Surface} [surface=Surface.Screen]
     * @param {number} [layer=0]
     * @memberof SEngine
     */
    renderLayer(offset = [0, 0], zoom = 1, surface = Surface.Screen, layer = 0)
    {
        const thisLength = this._renders[layer].length;
        let currentRender;
        const coords = [0, 0];
        const transformed = this.transformed;
        const renderQueue = this._renders[layer];
        const sWidth = this.width;
        const sHeight = this.height;
        const uZoom = Math.floor(1024 / zoom);
        const zFract = 1 / zoom;
        /** @type {Transform} */
        let transformation;
        if (transformed === true)
        {
            transformation = this.transform;
        }
        for (let j = 0; j < thisLength; ++j)
        {
            currentRender = renderQueue[j];
            currentRender.position = j;
            if (currentRender.visible === true)
            {
                coords[0] = (currentRender._x - currentRender.scale[0] * currentRender._sprite.o[0] - offset[0]) * uZoom >> 10;
                coords[1] = (currentRender._y - currentRender.scale[1] * currentRender._sprite.o[1] - offset[1]) * uZoom >> 10;
                const w_scale = currentRender.scale[0] * zFract;
                const h_scale = currentRender.scale[1] * zFract;
                if (coords[0] < sWidth &&
                    coords[1] < sHeight &&
                    coords[0] + Math.ceil(w_scale * currentRender._sprite.w) > 0 &&
                    coords[1] + Math.ceil(h_scale * currentRender._sprite.h) > 0 )
                {
                    //Future idea: should have a method for z coordinates
                    if (currentRender.needsUpdate === true)
                    {
                        currentRender._shader.setFloatVector(tex_move, currentRender._sprite.frames[currentRender.dir][currentRender.frame]);//here be magic
                        currentRender.needsUpdate = false;
                    }
                    currentRender.trans.identity();
                    currentRender.trans.scale(w_scale, h_scale);
                    currentRender.trans.translate(coords[0], coords[1]);
                    if (transformed === true)
                    {
                        currentRender.trans.compose(transformation);
                    }
                    currentRender.model.draw(surface);
                    if (this.DEBUG_MODE === true)
                    {
                        currentRender.trans.identity();
                        currentRender.trans.scale(zFract, zFract);
                        currentRender.trans.translate(currentRender._x * zFract - offset[0], currentRender._y * zFract - offset[1]);
                        if (transformed === true)
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
     * This is called when setting a map in MEngine to load all the map entities
     * 
     * #DOCUMENT me - this needs better explanation for use without MEngine
     * @param {any} list 
     * @param {any} scripts 
     * @memberof SEngine
     */
    loadMapEntities (list, scripts)
    {//#FIX ME add exception catching
        const length = list.length;
        let scriptSet;
        for (let i = 0; i < length; ++i)
        {
            if (scripts[list[i].name])
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
     * Checks an array of pre-loaded spritesets for the requested sprite
     * If the sprite is found returns it
     * If not found loads the sprite, adds it to the array and returns it
     * 
     * @param {string} fileName 
     * @returns {Sprite}
     * @memberof SEngine
     */
    lazyLoadSprite (fileName)
    {//#FIX ME add exception catching
        const name = fileName.substring(fileName.lastIndexOf("/") + 1);
        if (!this.sprites[name])
        {
            this.sprites[name] = loadSES(fileName);
        }
        return this.sprites[name];
    }

    /**
     * For internal use only
     * 
     * this function initialises collision information
     * pulled out into a seperate function from reset() for neatness/intelligibility
     * @param {number} mapWidth
     * @param {number} mapHeight
     * @param {number} mapLayers
     * @memberof SEngine
     */
    initColisions(mapWidth, mapHeight, mapLayers)
    {
        const tilesAccross = Math.max(Math.ceil(mapWidth * this._tFract), Math.ceil(mapHeight * this._tFract)) + 1;
        this.tilesAccross = tilesAccross;
        this.layers = mapLayers;
        const CEngineCall = {
            entities : this.entities,
            table    : null
        };
        switch (this.CEngine.cType)
        {
        case 0:
            //setup a tile map for colisions
            if (this.tileMovement !== true)
            {
                throw new SEngineError("tile based colisions but pixel based movement - this combination isn't supported yet.");
            }
            this.tObs = new Array(mapLayers);
            for (let i = 0; i < mapLayers; ++i)
            {
                this.tObs[i] = new Array(tilesAccross);
                for (let j = 0; j < tilesAccross; ++j)
                {
                    this.tObs[i][j] = new Array(tilesAccross);
                    this.tObs[i].fill(0);
                }
            }
            CEngineCall.table = this.tObs;
            break;
        case 1:
            //set up segments for collisions
            this.sObs = new Array(mapLayers);
            for (let i = 0; i < mapLayers; ++ i)
            {
                this.sObs[i] = new Array(tilesAccross);
                for (let j = 0; j < tilesAccross; ++j)
                {
                    this.sObs[i][j] = new Array(tilesAccross);
                    for (let k = 0; k < tilesAccross; ++ k)
                    {
                        this.sObs[i][j][k] =
                        {
                            list : new Array(this.maxPerSeg),
                            end  : 0
                        };
                        this.sObs[i][j][k].list.fill(0);
                    }
                }
            }
            CEngineCall.table = this.sObs;
            break;
        }
        this.CEngine.SEngine = CEngineCall;
        this.CEngine.tFract = this._tFract;
    }

    /**
     * For internal use only
     * 
     * called from SEngine#addEntity and from SEngine#reset, should not be used anywhere else
     *
     * @param {Entity} entity
     * @memberof SEngine
     */
    initEntity(entity)
    {
        const layer = entity.layer;
        if (layer < 0 || layer >= this.layers)
        {
            throw new SEngineError("out of range layer specified for entity" + entity.id);
        }
        if (this.useCEngine)
        {
            switch (this.CEngine.cType)
            {
            case 0:
                this.tObs[layer][entity.tile_x][entity.tile_y] = this.entities.length;//the apparent error here is intentional
                break;
            case 1:
                this.updateCollisions(this.entities.length-1, entity._x, entity._y, 0, 0, layer, layer, true);
            }
        }
        this._renders[layer].push(entity);
    }

    /**
     * For internal use only
     * 
     * Called when:
     * - creating an entity to put them into the collision system
     * - after an entity moves to update where they are for future collision checks
     * - when destroying an entity to remove them from the collision system
     * - upon calling reset() to reset all collsiion information
     * 
     * @param {number} ref
     * @param {number} x
     * @param {number} y
     * @param {number} d_x
     * @param {number} d_y
     * @param {number} layer1
     * @param {number} layer2
     * @param {boolean} [initial=false]
     * @param {boolean} [destroy=false]
     * @memberof SEngine
     */
    updateCollisions (ref, x, y, d_x, d_y, layer1, layer2, initial=false, destroy=false)
    {
        const polygons = this.entities[ref].poly;
        const tFract = this._tFract;
        //where did we start - this will break if a polygon goes above the top or off to the left of a sprite
        //such behaviour should not be expected so won't allow for it
        //#FIX ME add in an error message to Entity creation for out of bounds polys
        const start_x1 = Math.floor(x * tFract);
        const start_y1 = Math.floor(y * tFract);

        let max_w = 0, max_h = 0;

        for (let i = 0; i < polygons.length; ++i)
        {
            if (polygons[i].type === 1)
            {
                max_w = Math.max(polygons[i].w, max_w);
                max_h = Math.max(polygons[i].h, max_h);
            }
            else if (polygons[i].type === 0)
            {//note the use of w for both directions here is intentional as if this is a circle it's the radius
                max_w = polygons[i].w * 2 > max_w ? polygons[i].w * 2 : max_w;
                max_h = polygons[i].w * 2 > max_h ? polygons[i].w * 2 : max_h;
            }
        }

        const start_x2 = Math.ceil((x + max_w) * tFract);
        const start_y2 = Math.ceil((y + max_h) * tFract);

        const end_x1   = Math.floor((x + d_x) * tFract);
        const end_y1   = Math.floor((y + d_y) * tFract);
        const end_x2   = Math.ceil((x + max_w + d_x) * tFract);
        const end_y2   = Math.ceil((y + max_h + d_y) * tFract);

        let i = Math.max(Math.min(start_x1, end_x1) - 1, 0);
        max_w = Math.min(Math.max(start_x2, end_x2) + 1, this.tilesAccross);

        const min_h = Math.max(Math.min(start_y1, end_y1) - 1, 0);
        max_h  = Math.min(Math.max(start_y2, end_y2) + 1, this.tilesAccross);

        for (let j = min_h; i < max_w; ++ i, j = min_h)
        {
            for (; j < max_h; ++j)
            {
                if (initial === false && i >= start_x1 && i <= start_x2 && j >= start_y1 && j <= start_y2)
                {
                    if (i < end_x1 || i > end_x2 || j < end_y1 || j > end_y2 || layer1 !== layer2 || destroy === true)
                    {
                        this.popSegment(i, j, layer1, ref);
                    }
                }
                else if (i >= end_x1 && i <= end_x2 && j >= end_y1 && j <= end_y2 && destroy === false)
                {
                    this.pushSegment(i, j, layer2, ref);
                }
            }
        }
    }

    /**
     * For internal use only
     * 
     * called only from updateCollisions seperated only for neatness
     * @param {number} i
     * @param {number} j
     * @param {number} layer
     * @param {number} ref
     * @memberof SEngine
     */
    popSegment (i, j, layer, ref)
    {
        const sOb = this.sObs[layer][i][j];
        let location = sOb.end;
        for (let k = 0; k < location; ++ k)
        {
            if (sOb.list[k] === ref)
            {
                location = k;
            }
        }
        if (sOb[location] === ref)
        {
            --sOb.end;
            sOb.list[location] = sOb.list[sOb.end];
        }
    }

    /**
     * For internal use only
     * 
     * called only from updateCollisions seperated only for neatness
     * @param {number} i
     * @param {number} j
     * @param {number} layer
     * @param {number} ref
     * @memberof SEngine
     */
    pushSegment (i, j, layer, ref)
    {
        const sOb = this.sObs[layer][i][j];
        sOb.list[sOb.end] = ref;
        ++sOb.end;
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
    const source = new DataStream(inputFile, FileOp.Read);

    const frameWidth = source.readUint16(true);
    const frameHeight = source.readUint16(true);

    const polyCount = source.readUint8();
    const polygons = new Array(polyCount);
    for (let i = 0; i < polyCount; ++i)
    {
        polygons[i] =
        {
            type : source.readUint8(),
            x    : source.readInt16(true),
            y    : source.readInt16(true),
            w    : source.readUint16(true),
            h    : source.readUint16(true)
        };
    }
    const offsetX = source.readUint16(true);
    const offsetY = source.readUint16(true);

    const numDirections = source.readUint16(true);

    const directions = new Array(numDirections);
    for (let i = 0; i < numDirections; ++i)
    {
        directions[i] =
        {
            id     : source.readString16(true),
            vector : [source.readInt8(), source.readInt8(),source.readInt8()],
            speed  : source.readUint8(),
            frames : source.readUint8(),
            reset  : source.readUint8()
        };
    }
    const fullWidth = source.readUint16(true);
    const fullHeight = source.readUint16(true);

    const image = new Texture(fullWidth, fullHeight, source.read(fullWidth * fullHeight * 4));

    const template = new STemplate (directions, 0, 0, offsetX, offsetY, frameWidth, frameHeight, true, true, polygons);
    return new Sprite(inputFile.substring(inputFile.lastIndexOf("/")), image, template);
}


/**
 * A class representing an Entity
 * 
 * this class is intentionally not exported
 * always create Entities via the SEngine#addEntity method
 * 
 * However each entity you create will be an instance of this class
 * 
 * Read down for methods and properties available for use
 * 
 * @class Entity
 */
class Entity
{
    /**
     *Creates an instance of Entity.
     * @param {string} id
     * @param {Sprite} sprite
     * @param {number} x
     * @param {number} y
     * @param {number} speed
     * @param {boolean} persist
     * @param {[number, number]} scale
     * @param {object} scripts
     * @param {SEngine} sengine
     * @param {Shader} shader
     * @param {number} tSize
     * @param {number} tFract
     * @param {number} layer
     * @param {boolean} tileMovement
     * @param {boolean} DEBUG_MODE
     * @memberof Entity
     */
    constructor (id, sprite, x, y, speed, persist, scale, scripts, sengine, shader, tSize, tFract, layer, tileMovement, DEBUG_MODE)
    {
        this.id = id;
        this._sprite = sprite;
        this.trans   = new Transform();
        this._shader = shader.clone();
        this.model   = new Model([sprite.shape], this._shader);
        this.model.transform = this.trans;
        this._shader.setFloatVector(tex_move, [0,0,1]);
        this._shader.setInt("mask_mode",0);
        this._scale = scale;

        this.internalLayer = layer;

        this._px = x * 128;
        this._py = y * 128;

        this._speed = speed;

        this._pVectors = [];
        this._vectors = [];

        //set various generic properties
        this.persist = persist;
        this.frozen = false;
        this.visible = true;
        this.scale = scale;
        this.frame = 0;
        this.ticks = 0;
        this.end = 0;
        /** @type {number} */
        this.insert = 0;

        /** @type {number} */
        this.dir = 0;
        /** @type {Action[]} */
        this.queue = [];//movement queue


        this.position = 0;//place in render queue
        this.needsUpdate = true;//change of frame or direction
        this.attached = false;//is this player controlled

        let obs_shapes, debugColour;

        if (DEBUG_MODE)
        {
            obs_shapes = new Array(sprite.col.length);
            debugColour = new Color(0.9, 0.1, 0);
        }

        this.poly = new Array(sprite.col.length);
        for (let i = 0; i < this.poly.length; ++i)
        {
            this.poly[i] =
            {
                type : sprite.col[i].type,
                x    : sprite.col[i].x * scale[0] + x,
                y    : sprite.col[i].y * scale[1] + y,
                w    : sprite.col[i].w * scale[0],
                h    : sprite.col[i].h * scale[1]
            };
            if (DEBUG_MODE)
            {
                obs_shapes[i] = new Shape(ShapeType.LineLoop, null, new VertexList([
                    {x : this.poly[i].x                  - x, y : this.poly[i].y - y,                  color : debugColour},
                    {x : this.poly[i].x                  - x, y : this.poly[i].y + this.poly[i].h - y, color : debugColour},
                    {x : this.poly[i].x + this.poly[i].w - x, y : this.poly[i].y + this.poly[i].h - y, color : debugColour},
                    {x : this.poly[i].x + this.poly[i].w - x, y : this.poly[i].y - y,                  color : debugColour}]));
            }
        }
        if (DEBUG_MODE)
        {
            this.obs_model = new Model(obs_shapes);
            this.obs_model.transform = this.trans;
        }

        //coordinates
        this.zoom = 1; /*not strictly needed
        - most entities will never use a zoom property
        - BUT sometimes want it for using an entity for map zoom
        - have it on all entities to avoid having different virtual classes
        - this is a significant performance optimisation due to how the JIT works*/

        this.tile_x = Math.floor(x - sprite.o[0] * tFract);
        this.tile_y = Math.floor(y - sprite.o[1] * tFract);

        if (tileMovement)
        {//snap to tile grid if using tile movement
            this._x = this.tile_x * tSize;
            this._y = this.tile_y * tSize;
        }
        else
        {
            this._x = x;
            this._y = y;
        }

        for (let i = 0; i < sprite.dirs.length; ++i)
        {
            this._pVectors[i] = [sprite.dirs[i].vector[0] * speed, sprite.dirs[i].vector[1] * speed];
            this._vectors[i] = [sprite.dirs[i].vector[0], sprite.dirs[i].vector[1]];
        }

        //scripts
        this.scripts = Object.assign({}, blankScripts, scripts);

        //object to hold any user added properties
        this.data = {};

        //add a hook to SEngine - used by some of the convenience methods
        if (typeof sengine === "object")
        {
            this.SEngine = sengine;
            this.inUse = true;
        }
        else
        {
            this.inUse = false;
        }
    }


    /**
     * Sprites may be updated via direct assignment: Entity#Sprite = newSprite
     * 
     * Warning there is a lot of hidden cost when doing this - so don't do it every frame
     * 
     * @memberof Entity
     */
    get sprite()
    {
        return this._sprite;
    }

    /**
     * 
     * @param {Sprite} sprite
     * @memberof Entity
     */
    set sprite(sprite)
    {
        const shader   = this._shader;
        this._sprite = sprite;
        this.model   = new Model(sprite.shape, shader);

        this.model.transform = this.trans;
        let DEBUG_MODE = false;
        let obs_shapes, debugColour;

        if (this.inUse === true)
        {
            if (this.SEngine.DEBUG_MODE === true)
            {
                DEBUG_MODE = true;
                obs_shapes = new Array(sprite.col.length);
                debugColour = new Color(0.9, 0.1, 0);
            }
        }

        const x = this.x;
        const y = this.y;

        this.poly = new Array(sprite.col.length);
        for (let i = 0; i < this.poly.length; ++i)
        {
            this.poly[i] =
            {
                type : sprite.col[i].type,
                x    : sprite.col[i].x * this._scale[0] + x,
                y    : sprite.col[i].y * this._scale[1] + y,
                w    : sprite.col[i].w * this._scale[0],
                h    : sprite.col[i].h * this._scale[1]
            };
            if (DEBUG_MODE)
            {
                obs_shapes[i] = new Shape(ShapeType.LineLoop, null, new VertexList([
                    {x : this.poly[i].x                  - x, y : this.poly[i].y - y,                  color : debugColour},
                    {x : this.poly[i].x                  - x, y : this.poly[i].y + this.poly[i].h - y, color : debugColour},
                    {x : this.poly[i].x + this.poly[i].w - x, y : this.poly[i].y + this.poly[i].h - y, color : debugColour},
                    {x : this.poly[i].x + this.poly[i].w - x, y : this.poly[i].y - y,                  color : debugColour}]));
            }
        }
        if (DEBUG_MODE)
        {
            this.obs_model = new Model(obs_shapes);
            this.obs_model.transform = this.trans;
        }

        /** @type {[number, number][]} */
        this._pVectors = [];
        /** @type {[number, number][]} */
        this._vectors = [];

        for (let i = 0; i < sprite.dirs.length; ++i)
        {
            this._pVectors[i] = [sprite.dirs[i].vector[0] * this.speed, sprite.dirs[i].vector[1] * this.speed];
            this._vectors[i] = [sprite.dirs[i].vector[0], sprite.dirs[i].vector[1]];
        }

        this.needsUpdate = true;

        if (this.inUse === true)
        {
            const entities = this.SEngine.entities;
            const length = entities.length;
            for (let index = 0; index < length; ++index)
            {
                if (entities[index].id === this.id)
                {
                    this.SEngine.updateCollisions(index, this._x, this._y, 0, 0, this.internalLayer, this.internalLayer,false,false);
                    if (this.SEngine.CEngine.collide(index, this.internalLayer, this._x, this._y, 0, 0, this.poly).length > 0)
                    {
                        throw new SEngineError("Sprite change requested that creates collision - this is not permitted.");
                    }
                    return;
                }
            }
            throw new SEngineError("Sprite change requested for in use entity but entity not found in SEngine.");
        }
    }

    /**
     * Speed of a given entity
     * 
     * Stored as Vectors per frame * 128
     * 
     * Update to make the entitiy move faster/slower
     * 
     * Value is always an integer if a float is provided it will be rounded down
     *
     * @memberof Entity
     */
    get speed()
    {
        return this._speed;
    }

    /**
     * @param {number} value
     * @memberof Entity
     */
    set speed(value)
    {
        const flooredValue = value |0;
        if (this._speed !== flooredValue)
        {
            this._speed = flooredValue;
            const dirs = this.sprite.dirs;
            for (let i = 0; i < dirs.length; ++i)
            {
                this._pVectors[i] = [dirs[i].vector[0] * flooredValue, dirs[i].vector[1] * flooredValue];
                this._vectors[i] = [dirs[i].vector[0], dirs[i].vector[1]];
            }
        }
    }

    /**
     * makes this Entity face towards the specified entity
     * 
     * if immediate is true this is done by setting properties immediately
     * 
     * if immediate is false it is queued to happen after any other queued movements
     * 
     * @param {Entity} entity 
     * @param {boolean} [immediate=true] 
     * @memberof Entity
     */
    faceEntity(entity, immediate = true)
    {
        const dx = entity._x - this._x;
        const dy = entity._y - this._y;
        const dirs = this._sprite.dirs;
        const options = [];
        const length = dirs.length;
        let targetIndex = 0;

        for (let i = 0, smallest = Infinity; i < length; ++i)
        {
            const temp1 = dx - dirs[i].vector[0];
            const temp2 = dy - dirs[i].vector[1];
            options[i] = temp1 * temp1 + temp2 * temp2;
            if (options[i] < smallest)
            {
                targetIndex = i;
                smallest = options[i];
            }
        }
        if (immediate === true)
        {
            this.dir = targetIndex;
            this.needsUpdate = true;
        }
        else
        {
            this.queueMove(dirs[targetIndex].id, 0, spriteFACE);
        }

    }

    /**
     * an array of items obstructing the entity
     * 
     * @readonly
     * @memberof Entity
     */
    get obstructions ()
    {
        if (this.inUse !== true)
        {
            throw new SEngineError("obstructions requested for entity that is not in use.");
        }

        const dirs = this._sprite.dirs;
        const obstructions = [];
        const collisionTest = this.SEngine.CEngine.collide;
        const id = this.id;
        const layer = this.internalLayer;
        const x = this._x;
        const y = this._y;
        const poly = this.poly;
        for (let i = 0, length = dirs.length; i < length; ++i)
        {
            obstructions.push({direction : dirs[i].id, collisions : collisionTest(id, layer, x, y, dirs[i].vector[0], dirs[i].vector[1], poly)});
        }
        return obstructions;
    }

    /**
     * Experimental method
     * 
     * Specifies whether the entity would be obstructed with it's current x, y if it was on the specified layer
     * 
     * @param {number} layer 
     * @returns 
     * @memberof Entity
     */
    obstructedOnLayer(layer)
    {
        if (this.inUse === true)
        {
            const entities = this.SEngine.entities;
            const length = entities.length;
            for (let index = 0; index < length; ++index)
            {
                if (entities[index].id === this.id)
                {
                    return this.SEngine.CEngine.collide(index, layer, this._x, this._y, 0, 0, this.poly).length > 0;
                }
            }
            throw new SEngineError("Obstructions requested for in use entity but entity not found in SEngine.");
        }
        else
        {
            throw new SEngineError("obstructions requested for entity that is not in use.");
        }
    }

    /**
     * Specifies whether the entity would be obstructed
     * if it attempted to move in the specified direction
     * 
     * @param {string} direction 
     * @returns 
     * @memberof Entity
     */
    obstructionsInDirection(direction)
    {
        const dirs = this._sprite.dirs;
        let length = dirs.length;
        for (let i = 0; i < length; ++i)
        {
            if (dirs[i].id === direction)
            {
                const vec = dirs[i].vector;
                const entities = this.SEngine.entities;
                length = entities.length;
                for (let index = 0; index < length; ++index)
                {
                    if (entities[index].id === this.id)
                    {
                        return this.SEngine.CEngine.collide(index, this.internalLayer, this._x, this._y, vec[0], vec[1], this.poly);
                    }
                }
                throw new SEngineError("Obstructions requested for in use entity but entity not found in SEngine.");
            }
        }
        throw new SEngineError("obstructions test requested for non-existent direction");
    }

    /**
     * Getter/Setter for coordinate
     * 
     * Reading returns current value
     * 
     * Writing queues a teleport to the specified location
     * 
     * @memberof Entity
     */
    set layer(value)
    {
        if (value !== this.internalLayer)
        {
            //need SEngine to process this so queue it
            this.queueMove(this.dir, value, spriteLAYER);
        }
    }

    /**
     * Getter/Setter for coordinate
     * 
     * Reading returns current value
     * 
     * Writing queues a teleport to the specified location
     * 
     * @memberof Entity
     */
    set x (value)
    {
        if (value !== this._x || this.waiting === false)
        {
            this.queueMove(this.dir, value, spriteX);
        }
    }

    get x()
    {
        return this._x;
    }

    /**
     * Getter/Setter for coordinate
     * 
     * Reading returns current value
     * 
     * Writing queues a teleport to the specified location
     * @memberof Entity
     */
    set y (value)
    {
        if (value !== this._y || this.waiting === false)
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
     * True if the entity has no actions queued
     * Teleports are not counted as they are executed for free
     * 
     * @readonly
     * @memberof Entity
     */
    get waiting()
    {
        return this.queueLength === 0;
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
        return this.insert === this.end;
    }

    /**
     * Number of actions queued excluding teleports
     * 
     * @readonly
     * @memberof Entity
     */
    get queueLength()
    {
        if (this.insert === this.end)
        {
            return 0;
        }
        else
        {//remove layer changes from queueLength as they don't take up a tick
            let _return = 0;
            const queue = this.queue;
            for (let i = this.end, insert = this.insert; i < insert; ++i )
            {
                if (queue[i].type < spriteY)//values above this are instant teleports
                {
                    ++_return;
                }
            }
            return _return;
        }
    }


    /**
     * Number of actions queued including teleports
     * 
     * @readonly
     * @memberof Entity
     */
    get fullQueueLength()
    {
        return this.insert - this.end;
    }

    /**
     * Wipe out an entity's queue - cancels any planned actions
     *
     * @memberof Entity
     */
    clearQueue()
    {
        this.insert = 0;
        this.end = 0;
    }

    // #OPTIMISE_ME - next two methods could probably be faster with a WeakMap

    /**
     * The name of the direction the entity is facing e.g. "north"
     * 
     * @memberof Entity
     */
    get direction()
    {
        return this._sprite.dirs[this.dir].id;
    }

    set direction(value)
    {
        if (value !== this._sprite.dirs[this.dir].id)
        {
            this.dir = this._sprite.dirs_ID[value];
            this.needsUpdate = true;//have to set this so that the render function knows to update the sprite
        }
    }

    /**
     * Queue removal of entity from SEngine
     * - if processQueue is true any remaining actions are completed first
     * - if it's false or omitted remaining actions are cancelled 
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
        if (processQueue === false)
        {
            this.clearQueue();
        }
        this.queueMove(this.dir, 1, spriteDESTROY);
    }

    /**
     * Queue an Entity command
     * 
     * dir = name of direction
     * 
     * units = how far to move
     * note specifying 0 (or negative) units = move forever or until clearQueue is called
     * 
     * - type 0 (or no specified type) = move
     * - type 1 = animate without moving
     * - type 2 = execute the function passed as the script parameter
     *     - note 1 : assumed to be a function already - don't pass a string,
     *     - note 2 : it will be executed with runTime passed as a parameter (property of SEngine object)
     * - type 3 = face specified direction
     * 
     * ...space for future options
     * 
     * Types 7-10 are reserved for features used through other Entity methods, don't use directly
     * @param {string} dir 
     * @param {number} [units=1] 
     * @param {number} [type=0] 
     * @param {function} [script] 
     * @memberof Entity
     */
    queueMove (dir, units = 1, type = 0, script)
    {
        if (this.insert === this.queue.length)
        {
            if (this.end > 4)
            {
                const size = this.insert - this.end;
                const queue = this.queue;
                for (let i = 0, pos = this.end; i < size; ++i)
                {
                    queue[i] = queue[i + pos];
                }
                this.insert = this.insert - this.end;
                this.end = 0;
            }
        }
        if (type === spriteLAYER || type === spriteX || type === spriteY)
        {
            this.queue[this.insert] = new Action (type, dir, 1, units, doNothing);
        }
        else if (type === spriteSCRIPT)
        {
            this.queue[this.insert] = new Action (spriteSCRIPT, dir, units, 0, script);
        }
        else
        {
            this.queue[this.insert] = new Action (type, dir, units, 0, doNothing);
        }
        ++this.insert;
    }
}

/**
 * Action factory method used to ensure that queue actions retain same signiture
 * required for performance.
 * 
 * Note this an ES5 function not a class also for performance.
 * @param {number} type
 * @param {string} direction
 * @param {number} ticks
 * @param {number} pos
 * @param {function} script
 */
function Action (type, direction, ticks, pos, script)
{
    this.type = type;
    this.direction = direction;
    this.ticks = ticks;
    this.pos = pos;
    this.script = script;
}

/**
 * Default method for certain actions when no method specified
 *
 */
function doNothing () {}

/**
 * - atlas = texture object containing all the frames
 * - template = template object to use - see below
 * - id = id for referencing (not currently used afaik)
 * 
 * @export
 * @class Sprite
 */
export class Sprite
{
    /**
     *Creates an instance of Sprite.
     * @param {string} id
     * @param {Texture} atlas
     * @param {STemplate} template
     * @memberof Sprite
     */
    constructor (id, atlas, template)
    {
        this.id     = id;
        this.dirs   = template.dirs;
        this.dir_Id = template.dirs_Id;
        /** @type {[number, number]} */
        this.o      = [template.x_o,template.y_o];
        this.w      = template.w;
        this.h      = template.h;
        this.a_w    = atlas.width;
        this.a_h    = atlas.height;
        //make a lookup table for texture movement
        //don't need to do this but it slightly optimises the render function
        //and makes it prettier
        this.frames = new Array(this.dirs.length);
        for (let i = 0, j = 0; i < this.dirs.length; ++i)
        {
            this.frames[i] = new Array(this.dirs[i].frames.length);
            for (j = 0; j < this.dirs[i].frames.length; ++j)
            {
                this.frames[i][j] = [this.dirs[i].frames[j].u/this.a_w,-this.dirs[i].frames[j].v/this.a_h,1];
            }
        }
        this.col    = template.col;
        this.shape  = new Shape(ShapeType.TriStrip, atlas, new VertexList([
            {x : 0,          y : 0,          z : 0, u : 0,                 v : 1                       },
            {x : template.w, y : 0,          z : 0, u : this.w/atlas.width,v : 1                       },
            {x : 0,          y : template.h, z : 0, u : 0,                 v : 1 - this.h/atlas.height },
            {x : template.w, y : template.h, z : 0, u : this.w/atlas.width,v : 1 - this.h/atlas.height }]));
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
  x_o,y_o = offset for drawing, if 0 sprite images are drawn with top left corner at sprite's coordinate, adjust to move sprite relative to coordinates
  width,height = dimensions of each frame
  horizontal =true/false the frames of each direction appear horizontally through the image
  stacked = true/false; true = if frames are horizontal each direction has a separate row, false = one frame after another
            true = if directions are vertical each direction has a separate column etc
  collision_polygon - for shape based colisions the vertices of the collision shape
                     must provide as an array of vertex objects, each object should have properties x and y
                     ignored if using tile based colisions (or if not doing collision detection) coordinates are relative to
*/

export class STemplate
{
    /**
     *Creates an instance of STemplate.
     * @param {{id : string, vector : [number, number, number], speed : number, frames : number, reset : number}[]} dirs
     * @param {number} x
     * @param {number} y
     * @param {number} x_o
     * @param {number} y_o
     * @param {number} width
     * @param {number} height
     * @param {boolean} horizontal
     * @param {boolean} stacked
     * @param {object} collision_polygon
     * @memberof STemplate
     */
    constructor (dirs, x, y, x_o, y_o, width, height, horizontal, stacked, collision_polygon)
    {
        /** @type {Direction[]} */
        this.dirs = [];
        /** @type {{[name : string]: number}} */
        this.dirs_Id = {};
        let t_x = x;
        let t_y = y;
        for (let i = 0; i < dirs.length; ++i)
        {
            this.dirs[i] = new Direction(dirs[i].id, dirs[i].vector, dirs[i].speed, dirs[i].frames, dirs[i].reset, t_x, t_y, width, height, horizontal);
            this.dirs_Id[dirs[i].id] = i;
            if (horizontal === true && stacked === true)
            {
                t_y += height;
            }
            else if (horizontal === true)
            {
                t_x += width * dirs[i].frames;
            }
            else if (stacked === true)
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
        this.col = collision_polygon;
        this.w = width;
        this.h = height;
    }
}



//Template object for entity scripts
//Make your own entity scripts normally via a MapScript file
const blankScripts =
{
    onSetup       : function (/*runTime, self*/){},
    onDestroy     : function (/*runTime, self*/){},
    onTouchPlayer : function (/*runTime, self, player*/){},
    onTouchOther  : function (/*runTime, self, other*/){},
    onTalk        : function (/*runTime, self*/){},
    onIdle        : function (/*runTime, self*/){},
    onStep        : function (/*runTime, self*/){}
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
    /**
     *Creates an instance of Direction.
     * @param {string} id
     * @param {[number, number, number]} vector
     * @param {number} frame_speed
     * @param {number} num_frames
     * @param {number} reset
     * @param {number} x
     * @param {number} y
     * @param {number} width
     * @param {number} height
     * @param {boolean} horizontal
     * @memberof Direction
     */
    constructor (id, vector, frame_speed, num_frames, reset, x, y, width, height, horizontal)
    {
        this.id     = id;
        /** @type {{u : number, v : number}[]} */
        this.frames = [];
        this.vector = vector;
        this.dt     = frame_speed;
        this.reset  = reset;
        let ux    = x;
        let vy    = y;
        for (let i = 0; i < num_frames; ++i)
        {
            this.frames[i] = {u : ux, v : vy};
            if (horizontal)
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

//we use this string in a loop it's potentially needed many times a frame
//so make a constant out of it to remove the risk of it being re-created
const tex_move = "tex_move";

class SEngineError extends Error
{
    /**
     *Creates an instance of SEngineError.
     * @param {string} message
     * @memberof SEngineError
     */
    constructor(message)
    {
        super("SEngine Error: " + message);
    }
}

/**
 *
 *
 * @param {Entity} entity_one
 * @param {Entity} entity_two
 * @returns number
 */
function compareEntities(entity_one, entity_two)
{
    const test = entity_one._y - entity_two._y;
    if (test !== 0)
    {
        return test;
    }
    else
    {
        return entity_one.position - entity_two.position;
    }
}

/**
 *
 *
 * @param {object} runTime
 * @param {Entity} entity
 */
function moveNorth (runTime, entity)
{
    if (entity.waiting === true)
    {//this could be optimised - but would be uglier
        entity.queueMove("north");
    }
}

/**
 *
 *
 * @param {object} runTime
 * @param {Entity} entity
 */
function moveSouth (runTime, entity)
{
    if (entity.waiting === true)
    {
        entity.queueMove("south");
    }
}

/**
 *
 *
 * @param {object} runTime
 * @param {Entity} entity
 */
function moveWest(runTime, entity)
{
    if (entity.waiting === true)
    {
        entity.queueMove("west");
    }
}

/**
 *
 *
 * @param {*} runTime
 * @param {Entity} entity
 */
function moveEast(runTime, entity)
{
    if (entity.waiting === true)
    {
        entity.queueMove("east");
    }
}

/**
 *
 *
 * @param {object} runTime
 * @param {{CEngine : CEngine, entity : Entity, ref : number, entities : Entity[]}} inputs
 * @returns {void}
 */
function talkHandler(runTime, inputs)
{
    /** @type {Entity} */
    const entity = inputs.entity;
    const vec = entity._vectors[entity.dir];
    const target = inputs.CEngine.collide(inputs.ref, entity.internalLayer, entity._x, entity._y, vec[0] * 2, vec[1] * 2, entity.poly);
    for (let j = 0, done = false; j < target.length && done === false; ++j)
    {
        if (target[j].type === 0)
        {
            inputs.entities[target[j].ref].scripts.onTalk(runTime, inputs.entities[target[j].ref], inputs.entity);
            done = true;
        }
    }
}

class SEngineInput
{
    /**
     *Creates an instance of SEngineInput.
     * @param {Key} key
     * @param {boolean} continuous
     * @param {object} parameter
     * @param {Function} onPress
     * @param {Function} onRelease
     * @memberof SEngineInput
     */
    constructor(key, continuous, parameter, onPress, onRelease)
    {
        this.key        = key;
        this.continuous = continuous;
        this.parameter  = parameter;
        this.onPress    = onPress;
        this.onRelease  = onRelease;
        this.active     = false;
    }
}

