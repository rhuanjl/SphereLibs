
declare interface SEngine
{
    entities : Entity[]
    _renders : Entity[][]
    waiting : number
    shader : Shader
    useCEngine : boolean
    CEngine : CEngine
    ready : boolean
    tSize : number
    _tFract : number
    layers : number
    tileMovement : boolean
    runTime : object
    folder : string
    sprites : { [name : string] : Sprite}
    offset : number[]
    width : number
    height : number
    _default : boolean
    transform : Transform | null
    DEBUG_MODE : boolean
    input : Input
    inputs : SEngineInput[]
    maxPerSeg : number
    tilesAccross : number
    tObs : any[] | undefined
    sObs : any[] | undefined


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

declare interface MEngine
{
    /**
     * @param runTime - object to be given to map scripts when they're called - not currently used
     * @param SEngine - instance of SEngine class to handle sprites
     * @param CEngine - instance of CENgine class to handle collisions (must be shared with the SEngine instance)
     * @param shaderPath - path to customised shaders
     * @param width - width of the surface this will draw on
     * @param height - height of the surface this will draw on
     * @param scriptsPath - path to map scripts either relative to maps or with a sphereFS prefix
     */
    
    shader         : Shader
    s_width        : number
    s_height       : number
    useTransform   : boolean
    transformation : Transform
    map            : object
    folder         : string
    DEBUG_MODE     : boolean
    col_tile_size  : number
    useSEngine     : boolean
    SEngine        : SEngine
    runTime        : object
    scriptsPath    : string
    changing       : Changing


    /**
     * Called to update the map should be done every frame
     * - Coordinates are for the point you wish the map to be centered on
     * - Defaults are x= 0, y = 0, zoom = 1
     * - This is designed to be used via Dispatch.onUpdate
     * - If using SEngine this automatically calls SEngine#update
     */
    update(x?: number, y?: number, zoom?: number) : void

    /**
     * Draw the whole map onto the provided surface
     * 
     * - Default surface is Surface.Screen
     * - This is Intended to be used via Dispatch.onRender
     * - start_layer and end_layer allow you to draw a specified range of layers only if wanted
     * 
     * Note if using SEngine the call to this.renderLayer within this method calls on to SEngine.renderLayer as well
     */
    render(surface?: Surface, start_layer?: number, end_layer?: number) : void

    /**
     * Draw one layer of the map onto the specified surface
     * 
     * If using SEngine this also draws the entities for the layer via calling SEngine#renderLayer
     */
    renderLayer(surface: Surface, layer: number) : void

    /**
     * Attach a transformation object to the whole map
     * Use this to rotate or translate or scale the rectangle the map is drawn in
     * For transititions or shrinking to a miniMap or the like
     * 
     * EXPERIMENTAL feature - not fully tested
     */
    attachTransformation(transformation: Transform) : void

    /**
     * Use this to remove a Transfom that was set with attachTransformation
     */
    detachTransformation() : void

    /**
     * Change the standard width and height of the box the map is drawn in
     * 
     * returns false if the map already the specified dimensions hence there was nothing to do
     * 
     * #Experimental feature, not fully tested
     */
    changeRes(width: number, height: number): boolean

    /**
     * Set a map - used to set the first map and to change map later.
     * 
     * Note this is an async function use it with an await or a .then
     * if you wish to schedule anything to happen after the map loads
     * 
     * Additionally the promise MEngine#changing will resolve after the
     * new map's onEnter script has completed
     */
    setMap(fileName: string) : Promise<void>


    /**
     * Add a trigger to the currently active map at
     * specified x, y tile coordinates and on the specified layer
     * 
     * With func as the function to call when it's triggered
     * 
     * Mode determines how to handle duplicates:
     * mode = 0 (default) - throw error for duplicate
     * mode = 1 when there is a duplicate create the new trigger
     *          but have it share the existing trigger's calback
     * mode = 2 overwrite the function used by the duplicate
     */
    addTrigger(name: string, x: number, y: number, layer: number, onPlayer: Function, onOther?: Function, mode?: number) : void

    /**Called when changing off of a map - overwrite this to specificy standard map exit behaviour.
     * 
     * This is called via Promise.all so if it is an async function or returns a promise the map change will be delayed
     * untill the promise resolves.
    */
    onExit   (runTime: object, map: object)

    /**Called when changing on to a map - overwrite this to specificy standard map entry behaviour.
     * 
     * This is called via Promise.all so if it is an async function or returns a promise the MEngine#changing
     * promise will not resolve untill this resolves.
    */
    onEnter  (runTime: object, map: object)
    /**Called every frame during update() - overwrite this to specificy standard update behaviour.*/
    onUpdate (runTime: object, map: object)
    /**Called every frame during render() after the drawing is completed - overwrite this to specificy standard render behaviour.*/
    onRender (runTime: object, map: object)
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
 */
declare interface Entity
{
        
    id      : string
    _sprite : Sprite
    trans   : Transform
    _shader : Shader
    model   : Model
    _scale  : [number, number]
    poly    : {type : number, x : number, y : number, w : number, h : number}[]
    zoom    : number
    readonly index : number

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
    scale : [number, number]
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
    obs_model : Model // only availabel in debug mode

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
     * Returns whether the entity would would be obstructed by with it's current x, y if it was on the specified layer
     */ 
    obstructedOnLayer(layer: number) : boolean

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

declare type mapAnimation = {
    ref : number;
    start : number;
    data : {
        model : Model;
        list : animTile[];
        current : number;
        needsUpdate : boolean;
        last : number ;
        trans : Transform;
        shader : Shader;
    }
}

declare type animTile = {
    index : number;
    offset : number;
    delay : number;
    next : number;
}

declare type trigger = {
    name : string
    id : number
    x : number
    index : number
}

declare interface CEngine
{
    SEngine : SEngine | null
    MEngine : MEngine | null
    cType   : number
    tFract  : number

    /**
     * Function for colliding an entity from SEngine with other entities and Map Obstructions
     * Returns an array of all found collisions
     * 
     * #needs better documentation
     */
    collide(ref: number, layer: number, x: number, y: number, d_x: number, d_y: number, polygons: Polygon[]): Collision[]
}