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

declare class CEngine
{
    constructor(cType?: number)
    SEngine : SEngine
    MEngine : MEngine
    cType   : number
    tFract  : number

    /**
     * Function for colliding an entity from SEngine with other entities and Map Obstructions
     * Returns an array of all found collisions
     * 
     * #needs better documentation
     */
    collide(ref: number, layer: number, x: number, y: number, d_x: number, d_y: number, polygons: Polygon[]): Collision[]

    /**
     * Static method for colliding two polys
     * the first poly is translated by x, y before the comparison
     * 
     * Supports rectangles and circles only
     * 
     */
    static polysCollide(x: number, y: number, _one: Polygon, two: Polygon): boolean

}