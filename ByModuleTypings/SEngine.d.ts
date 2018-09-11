/* File: SEngine.d.ts
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

import CEngine, {Collision} from "./CEngine";
import Input from "./input";

/*Queued action types
These are used to indicate what type of action a sprite has queued
to aid readability over using bare id numbers, and improve performance vs string compares*/
export const spriteMOVE = 0;
export const spriteANIMATE = 1;
export const spriteSCRIPT = 2;
export const spriteFACE = 3;

/**
 * An instance of SEngine is an environment for Sprites
 * Any given map can only use one instance at a time
 * In most games just one instance will be required
 */
export default class SEngine
{
    /**
     * @param {object} runTime - object to be available in entity scripts
     * @param {CEngine} CEngine - instance of CEngine class (unless you don't need collisions)
     * @param {number} tSize  - size of collision segment, if using tileMovement this should be tile width
     *                             For normal movement use a number 4-5x the width of your sprites
     * @param {boolean} [useCEngine=true] -true for collisions
     * @param {boolean} [tileMovement=false] -currently tileMovement is broken, must be false
     * @param {number} [maxPerSeg=20] - future feature for now always leave as 20
     * @param {string} [shaderPath="shaders/"] -path to where the customised shaders can be found
     */
    constructor(runTime : object, CEngine : CEngine, tSize? : number, useCEngine? : boolean,
        tileMovement? : boolean, maxPerSeg? : number, shaderPath? : string)

    entities : Entity[]
    _renders : Entity[][]
    waiting : number
    shader : Shader
    useCengine : boolean
    CEngine : CEngine
    ready : boolean
    tSize : number
    _tFract : number
    layers : number
    tileMovement : boolean
    runTime : object
    folder : string
    sprites : { [name : string] : Sprite}
    offset : [number, number]
    width : number
    height : number
    _default : boolean
    transform : Transform | null
    transformed : boolean
    DEBUG_MODE : boolean
    input : Input
    inputs : SEngineInput[]
    maxPerSeg : number


    /**
     * Add an entity to your SEngine
     * This is a wrapper around new Entity that supplies certain required environment variables
     * use this instead of calling new Entity directly
     */
    addEntity (id: string, sprite: Sprite, persist?: boolean, x?: number, y?: number, layer?: number, speed? : number, scale?: [number, number], scripts?: {[name : string] : Function}): Entity

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
     */
    reset(mapWidth: number, mapHeight: number, mapLayers: number, surface?: Surface) : void

    /**
     * Returns the entity object represented by the supplied id
     */
    getEntity(id: string): Entity

    /**
     * Binds the function: script to the key: key
     * 
     * - if continuous is false the function will only be called once each time the key is pressed
     * - if continous is true the function will be called every frame as long as the key is pressed
     * - the parameter object will be passed to the function as its second parameter the runtime
     * object as its first
     * 
     * Note you must call SEngine#input.takeInput() to enable the input
     */
    addInput(key: number, continuous: boolean, parameter: object, onPress?: Function, onRelease?: Function): number

    /**
     * Remove an input previously added with addInput
     */
    removeInput(key: number) : void

    /**True when no entities have any actions queued - i.e. nothing is happening in SEngine */
    readonly idle : boolean

    /**
     * Adds simple 4 directional movement + talk activation to the supplied entity.
     * 
     * Additionally makes the engine treat the specified entity as the player character wherever that is relevant.
     * 
     * If this is called on two entities the call to the second one replaces the call to the first one.
     * 
     * Note you must call SEngine#input.takeInput() to enable the input.
     */
    addDefaultInput(entity: Entity) : void

    /**
     * Removes the input added with addDefaultInput
     * 
     * Returns false if nothing found to remove
     */
    removeDefaultInput() : boolean

    /**
     * updates the system this does the following things
     * 1. checks for any inputs added with addInput above
     * 2. loops through all entities processing the first action in their queues
     *     - if the action is a teleport (type spriteX/spriteY/spriteLayer) it's free
     *     - i.e. the next action is processed too
     * 
     * NOTE when using MEngine with SEngine MEngine.update calls this function
     * Only call this yourself if not using MENgine
     */
    update () : void

    /**
     * Draw the entities on the specified layer to the specified surface at the provided offset 
     * and with the provided zoom
     *
     * When using MEngine this will be called from within MEngine#render
     * 
     * If using SEngine without MEngine you will need to call this for each layer
     * presumably via Dispatch.onRender
     */
    renderLayer(offset?: [number, number], zoom? : number, surface?: Surface, layer?: number) : void

    /**
     * This is called when setting a map in MEngine to load all the map entities
     */
    loadMapEntities (list: {name : string, sprite :string, x : number, y : number, layer : number}[], scripts: { [name : string] : {[name : string] : Function}}) : void

    /**
     * Checks an array of pre-loaded spritesets for the requested sprite
     * If the sprite is found returns it
     * If not found loads the sprite, adds it to the array and returns it
     */
    lazyLoadSprite (fileName: string) : Sprite

    /**
     * For internal use only
     * 
     * this function initialises collision information
     * pulled out into a seperate function from reset() for neatness/intelligibility
     */
    private initColisions(mapWidth: number, mapHeight: number, mapLayers: number) : void

    /**
     * For internal use only
     * 
     * called from SEngine#addEntity and from SEngine#reset, should not be used anywhere else
     */
    private initEntity(entity: Entity) : void

    /**
     * For internal use only
     * 
     * Called when:
     * - creating an entity to put them into the collision system
     * - after an entity moves to update where they are for future collision checks
     * - when destroying an entity to remove them from the collision system
     * - upon calling reset() to reset all collsiion information
     */
    private updateCollisions (ref: number, x: number, y: number, d_x: number, d_y: number, layer1: number, layer2: number, initial?: boolean, destroy?: boolean) :void
    
    /**
     * For internal use only
     * 
     * called only from updateCollisions seperated only for neatness*/
    private popSegment (i: number, j: number, layer: number, ref: number) : void

    /**
     * For internal use only
     * 
     * called only from updateCollisions seperated only for neatness*/
    private pushSegment (i: number, j: number, layer: number, ref: number) : void

}

/**
 * Load a sprite from a .ses File
 * 
 */
export function loadSES(inputFile: string) : Sprite

/**
 * A class representing an Entity
 * 
 * this class is intentionally not exported
 * always create Entities via the SEngine#addEntity method
 * 
 * However each entity you create will be an instance of this class
 * 
 * Read down for methods and properties available for use
 */
declare class Entity
{
    constructor (id : string, sprite : Sprite, x : number, y : number, speed : number,
        persist : boolean, scale : number, scripts : object, sengine : SEngine, shader : Shader,
        tSize : number, tFract : number, layer : number, tileMovement : boolean, DEBUG_MODE : boolean)
        
    id      : string
    _sprite : Sprite
    trans   : Transform
    _shader : Shader
    model   : Model
    _scale  : number
    poly    : {type : number, x : number, y : number, w : number, h : number}[]
    zoom    : number

    tile_x  : number
    tile_y  : number
    _x      : number
    _y      : number
    _px     : number
    _py     : number
    _speed  : number
    _pVectors : [number, number][]
    _vectors  : [number, number][]

    internalLayer : number

    scripts :
    {
        onSetup (runTime : object, self : Entity)
        onDestroy (runTime : object, self : Entity)
        onTouchPlayer (runTime : object, self : Entity, player : Entity)
        onTouchOther (runTime : object, self : Entity, other : Entity)
        onTalk (runTime : object, self : Entity)
        onIdle (runTime : object, self : Entity)
        onStep (runTime : object, self : Entity)
    }

    /**Should the entity remain when the map is changed*/
    persist : boolean
    /**do not process this entities actions*/
    frozen : boolean
    /**when visible is false the entity will not be drawn*/
    visible : boolean
    scale : number
    frame : number
    ticks : number
    dir : number
    queue : Action[]
    end : number
    insert : number

    position : number
    needsUpdate : boolean

    /**is this entitiy being treated as "the player" - set to true by addDefaultInput */
    attached : boolean

    /**object to hold any user added properties on an entity*/
    data : object
    SEngine : SEngine
    inUse : boolean

    /**
     * Sprites may be updated via direct assignment: Entity#Sprite = newSprite
     * 
     * Warning there is a lot of hidden cost when doing this - so don't do it every frame
     */
    sprite : Sprite
    
    /**
     * Speed of a given entity
     * 
     * Stored as Vectors per frame * 128
     * 
     * Update to make the entitiy move faster/slower
     * 
     * Value is always an integer if a float is provided it will be rounded down
     */
    speed : number

    /**
     * Makes this Entity face towards the specified entity
     * 
     * - If immediate is true this is done by setting properties immediately
     * - If immediate is false it is queued to happen after any other queued movements
     */
    faceEntity(entity: Entity, immediate?: boolean) : void

    /**
     * an array of items obstructing the entity
     */
    readonly obstructions  : Collision[]

    /**
     * Experimental method
     * 
     * Returns an array of items the entity would be obstructed by with it's current x, y if it was on the specified layer
     */ 
    obstructedOnLayer(layer: number) : Collision[]

    /**
     * Returns an array of items the entity would be obstructed by
     * if it attempted to move in the specified direction
     */
    obstructionsInDirection(direction: string) : any[]

    /**
     * Getter/Setter for coordinate
     * 
     * Reading returns current value
     * 
     * Writing queues a teleport to the specified location
     */
    x : number
    /**
     * Getter/Setter for coordinate
     * 
     * Reading returns current value
     * 
     * Writing queues a teleport to the specified location
     */
    y : number
    /**
     * Getter/Setter for coordinate
     * 
     * Reading returns current value
     * 
     * Writing queues a teleport to the specified location
     */
    layer : number

    /**
     * True if the entity has no actions queued
     * 
     * Teleports are not counted as they are executed for free
     * @readonly
     */
    readonly waiting : boolean

    /**
     * True if entity has nothing queued at all (including teleports)
     * @readonly
     */
    readonly fullyWaiting : boolean

    /**
     * Number of actions queued excluding teleports
     * @readonly
     */
    readonly queueLength : number

    /**
     * Number of actions queued including teleports
     * @readonly
     */
    readonly fullQueueLength : number

    /**
     * Wipe out an entity's queue - cancels any planned actions
     */
    clearQueue() : void

    /**
     * The name of the direction the entity is facing e.g. "north"
     * 
     * Can change this by writing to it however if the entity moves the change will be discarded
     * in favour of the direciton they are moving.
     */
    direction : string

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
     * NOTE THERE IS CURRENTLY NO METHOD to reverse this
     */
    destroy(processQueue?: boolean) : void

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
     */
    queueMove (dir: string, units?: number, type?: number, script?: Function)
}

/**
 * A queued action to be performed by an Entity in SEngine
 */
declare class Action
{
    constructor(type: number, direction: string, ticks: number, pos: number, script: Function)
    type : number
    direction : string
    ticks : number
    pos : number
    script : Function     
}

/**
 * A placeholder method used for actions that currently require no effect
 */
declare function doNothing (runTime : object, entity : Entity) : void


/**
 * A Sprite for use in the SEngine
 * One sprite can be used by multiple entities
 */
export class Sprite
{
    constructor (id : string, atlas : Texture, template : STemplate)

    id     : string
    dirs   : Direction[]
    dir_Id : number[]
    o      : [number,number]
    w      : number
    h      : number
    a_w    : number
    a_h    : number
    frames : [number, number][][]
    col    : Polygon
    shape : Shape
}


/**
 * A Sprite Template used alongside image data to generate a sprite object
 */
export class STemplate
{
    constructor (dirs : Direction[], x : number, y : number, x_o : number, y_o : number,
        width : number, height : number, horizontal : boolean, stacked : boolean, collision_polygon : Polygon)

    dirs : Direction[];
    dirs_Id : number[]
    
    x_o : number
    y_o : number
    col : number
    w   : number
    h   : number
}


/**
 * A Sprite directioon can be north/south/east/west etc. or any arbitrary direction
 * 
 * Or can represent an animation sequence
 */
declare class Direction
{
    constructor (id : string, vector : number[], frame_speed : number, num_frames : number,
        reset : number, x : number, y : number, width : number, height : number, horizontal : boolean)
    
    id     : string
    frames : {u : number, v : number}[]
    vector : [number, number]
    dt     : number
    reset  : number
}

/**
 * A shape for use in collision testing
 * Either a circle or a rectangle
 */
declare class Polygon
{
    constructor(type : number, x : number, y : number, w : number, h : number)
    type  : number
    x     : number
    y     : number
    w     : number
    h     : number
}

/**
 * A SEngineInput represents an input being being monitored
 * by an instance of SEngine including the key and the actions
 * upon press/release
 */
declare class SEngineInput
{
    constructor(key : Key, continuous : boolean, parameter : object, onPress : Function, onRelease : Function)
    key        : Key;
    continuous : boolean;
    parameter  : object;
    onPress    : Function;
    onRelease  : Function;
    active     : boolean;
}

declare class SEngineError extends Error
{
    constructor(message: string)
}


declare function compareEntities(entity_one: Entity, entity_two: Entity) : number

declare function moveNorth (runTime: any, entity: Entity) : void

declare function moveSouth (runTime: any, entity: Entity) : void

declare function moveWest(runTime: any, entity: Entity) : void

declare function moveEast(runTime: any, entity: Entity) : void

declare function talkHandler(runTime, inputs) : void
