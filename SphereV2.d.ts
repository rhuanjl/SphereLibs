import { zoneCollision } from "./typings/CEngine";

/**Global namespace containing  properties about the game and engine and a few general methods.*/
declare namespace Sphere
{
    /**Name and version number of the engine*/
    const Engine : string
    /**Version number of API supported by engine*/
    const Version : number
    /**Current state of API number is incremented when functions added*/
    const APILevel : number
    /**Name and version number of build tool */
    const Compiler : string
    /**Object containing properties from the game's manifest file */
    const Game : GameObject
    /**Framerate the game is running at*/
    let frameRate : number
    /**Maximum number of frames the engine is allowed to skip */
    let frameSkip : number
    /**Is the game running in fullScreen mode */
    let fullScreen : boolean
    /**Abort the game - throws an un-catchable exception */
    function abort(message : string) : void
    /**Number of frames (including skipped frames) since the gae started running*/
    function now() : number
    /**Schedules a restart of the game - restart occurs the next time the game returns to the event loop*/
    function restart() : void
    /**Set the game's resolution */
    function setResolution(width : number, height : number) : void
    /**Schedule a shutdown the game will close when control next returns to the event loop*/
    function shutDown() : void
    /**Returns a promise that resolves of the provided number of frames*/
    function sleep(frames : number) : Promise<void>
}

declare class GameObject
{
    author : string
    /**the name of the game's main module or script */
    main : string
    name : string
    /**The games resolution as a string "wxh" */
    resolution : string
    sandBox : string
    saveId : string
    summary : string
}

/**Enum of Keyboard keys*/
declare enum Key 
{
    Alt,
    AltGr,
    Apostrophe,
    Backslash,
    Backspace,
    CapsLock,
    CloseBrace,
    Comma,
    Delete,
    Down,
    End,
    Enter,
    Equals,
    Escape,
    F1,
    F2,
    F3,
    F4,
    F5,
    F6,
    F7,
    F8,
    F9,
    F10,
    F11,
    F12,
    Home,
    Hyphen,
    Insert,
    LCtrl,
    LShift,
    Left,
    NumLock,
    OpenBrace,
    PageDown,
    PageUp,
    Period,
    RCtrl,
    RShift,
    Right,
    ScrollLock,
    Semicolon,
    Slash,
    Space,
    Tab,
    Tilde,
    Up,
    A,
    B,
    C,
    D,
    E,
    F,
    G,
    H,
    I,
    J,
    K,
    L,
    M,
    N,
    O,
    P,
    Q,
    R,
    S,
    T,
    U,
    V,
    W,
    X,
    Y,
    Z,
    D1,
    D2,
    D3,
    D4,
    D5,
    D6,
    D7,
    D8,
    D9,
    D0,
    NumPad1,
    NumPad2,
    NumPad3,
    NumPad4,
    NumPad5,
    NumPad6,
    NumPad7,
    NumPad8,
    NumPad9,
    NumPad0,
    NumPadEnter,
    Add,
    Decimal,
    Divide,
    Multiply,
    Subtract
}

/**Debugging namespace, provides methods for debugging
 * only avaialble when running in spheRun. in miniSphere
 * all of these functions do nothing
 */
declare namespace SSj
{
    /**
     * Logs `message` to the terminal OR to an attached SSj or SSj Blue session.  If an object
     *is passed in, logs the result of calling `JSON.stringify()` on the object.
     */
    function log (message : string | object | Error) : void
    /**
     * Logs the provided message to an attached SSj or SSj Blue session if tracing is enabled.
     * If tracing is not enabled does nothing.
     */
    function trace (message : string) : void
    /**
     * Returns the time in nanoseconds since some arbitrary point in time when running in spheRun
     * In miniSphere, this will return 0; */
    function now () : number
    /**
     * Immediately flips the contents of the backbuffer to the screen.  The
     *backbuffer is not cleared afterwards.
    */
    function flipScreen() : void
    /**
     * Adds a method to be automatically profiled (timed) by SpheRun.
     * 
     * `description` is an optional string to name the function in the performance
     * report; if no description is given, the engine will use the name of the
     * function.
     * 
     * `object` is the object whose method is being profiled, and `method_name` is
     * the name of the method.  Note that to profile a method for all instances of
     * a class, you can specify the prototype.
     * 
     * SpheRun must be started with the `--performance` (or `-p`) option to enable the
     * profiler.  All `SSj.profile()` calls will bdo nothing if the profiler is not enabled.
     */
    function profile(object: object, method_name: string, description? : string) : void
}

/**File Operation types for use with `FileStream`*/
declare enum FileOp
{
    /**Read data from the file The file must exist and will be opened in
     *read-only mode.  Any attempt to write to the file will throw a
     *TypeError.
     */
    Read,
    /**
     * Write data to the file.  Be careful: If the file already exists,
     * its contents will be overwritten.  If that behavior is not desired,
     * use `FileOp.Update` instead.
     */
    Write,
    /**
     * Amend the file.  If a file by the specified name doesn't exist, it
     * will be created.  For convenience, the file pointer is initially
     * placed at the end of the file.
     */
    Update
}

declare namespace Surface
{
    const Screen : Surface
}

declare class Surface 
{
    width : number
    height : number
    transform : Transform

    constructor(width : number, height : number, content? : Color | ArrayBuffer)

    toTexture() : Texture;
}

declare class Transform
{
    identity() : void
    compose (transform : Transform) : void
    scale (sx : number, sy : number, sz? : number) : void
    translate (x : number, y : number, z? : number) : void
    rotate (angle : number, vx? : number, vy? : number, vz? : number) : void
    project2D(left : number, top : number, right : number, bottom : number, near? : number, far?  : number) : void
    project3D(fov : number, aspect : number, near : number, far : number) : void
    matrix : number [][]
}

declare class Texture
{
    constructor(filename : string)
    constructor(surface : Surface)
    constructor(width : number, height : number, content : Color | ArrayBuffer)

    upload (data : ArrayBuffer) : void
    download() : Uint8ClampedArray
    fileName : string
    width : number
    height : number
}

declare class Shader
{
    constructor(options : object)
    setFloat (name : string, value : number) : void
    setInt (name : string, value : number) : void
    setFloatVector(name : string, values : [number, number] | [number, number, number] | [number, number, number, number]) : void
    setIntVector(name : string, values : [number, number] | [number, number, number] | [number, number, number, number]) : void
    setColorVector(name : string, color : Color) : void
    clone() : Shader
}

declare namespace Color
{
    const White : Color
    const Red : Color
    const Blue : Color
    const Green : Color

    function mix (color1 : Color, color2 : Color, factor1 : number, factor2 : number) : Color
}

declare namespace Keyboard
{
    /**Gets a `Keyboard` object for the default keyboard device. */
    const Default : Keyboard
}

declare class Keyboard
{
    /** 
     * Gets the character(s) that would be generated if a specified key is pressed
     * on this keyboard.  For example, `Key.A` becomes "a" (or "A" if shifted).
     * `shifted` specifies whether to act as if the Shift key is pressed and
     * defaults to `false`.
     * 
     * An empty string is returned if the specified key is not associated with a
     * character (a modifier key, for example).
     */
    charOf(key : Key, shifted?: boolean) : string
    /**
     * Gets the next key in the keyboard queue, or null if the queue is empty.
     */
    getKey() : Key
    /**
     * Returns true if the user is currently pressing the specified key.  `key`
     * should be a member of the Key enumeration.
     */
    isPressed(key : Key) : boolean
    /**
     * Removes all keys from the keyboard queue.  If another key is not pressed
     * in the interim, the next getKey() will return null.
     */
    clearQueue () : void

    /**`true` if capsLock is pressed false if it is not */
    readonly capsLock : boolean
    /**`true` if numLock is pressed false if it is not */
    readonly numLock : boolean
    /**`true` if scrollLock is pressed false if it is not */
    readonly scrollLock : boolean
}


declare namespace Font
{
    /**Provides the engines default font */
    const Default : Font
}

/**
 * The Font class represents fonts for use in drawing text
 */
declare class Font
{
    /**The height of the font */
    readonly height : number
    /**The fileName for the font */
    readonly fileName : string

    /**
     *Gets the size, in pixels, of `text` if it were rendered by Font:drawText()
     * with the specified wrap width.  Return value is an object with `width` and
     * `height` properties.
     *
     * If `wrap_width` is not provided, no word wrap processing will be
     * performed.
     */
    getTextSize(text : string, wrap_width : number) : {width : number, height : number}

    /**
     * Wraps `text` as if it were drawn with Font#drawText() using the specified
     * wrap width.  Returns an array of strings, representing the lines in the
     * wrapped text.
     */
    wordWrap(text : string, wrap_width : number) : string[]

    /**
     * Renders `text` to the specified surface at (x,y).  `color` defaults to
     * Color.White if not provided, and `wrap_width` specifies the width in which
     * to constrain the text.  If `wrap_width` is not provided, no wrapping is
     * performed.
     * */
    drawText(surface : Surface, x : number, y : number, text : string, color? : Color, wrap_width? : number) : void
}

declare class Color
{
    constructor(red : number, green : number, blue : number, alpha? : number)
    r : number
    g : number
    b : number
    a : number
}

/**
 * A `Model` represents a group of one or more shapes, combined with a `Shader` and a `Transform`,
 * which are drawn to a `Surface` as a single unit.  Used well, this can improve
 * your game's rendering performance by grouping together operations using similar
 * parameters.
 */
declare class Model
{
    constructor(shapes : Shape[], shader? : Shader)
    /**
     * The transform object for the model
     */
    transform : Transform
    /**
     * The shader object for the model
     */
    shader : Shader
    /**
     * Draw the model to the specified surface or to the Screen if no surface is specified
     */
    draw(surface? : Surface) : void
}

declare type Vertex =
{
    x : number,
    y : number,
    u? : number,
    v? : number,
    color? : Color
}

/**
 * A `VertexList` contains a collection of vertices for use when constructing a
 * `Shape`.  The vertices in the vertex list are stored on the GPU for fast access
 * at render time.
 * 
 * Each Vertex has:
 * - x and y coordinates
 * - u and v texture coordinates (default to 0) - necessary if texturing the shape
 * - color defaults to White
 */
declare class VertexList
{
    constructor(vertices : Vertex[])
}

/**
 * An `IndexList` contains indices into a vertex list which are stored on the GPU
 * for fast access at render time.  Index lists can be useful if you want to store
 * all the vertices for a scene in a single `VertexList` and construct different
 * shapes from it.  The index list specifies which vertices from the list to use
 * to create a shape.
 */
declare class IndexList
{
    /**
     * Constructs a new index list from `indices`, an array of integers in the
     * range [0,65535].  If `indices` is not an array or any element is not a
     * number in the above range, an error will be thrown.
     */
    constructor(indices : number[])
}

/**
 * Shape type enum this controls how the graphics card will connect the vertices together.
 */
declare enum ShapeType
{
    Fan,
    Lines,
    LineLoop,
    LineStrip,
    Points,
    Triangles,
    TriStrip
}

declare class Shape
{
    constructor(type: number, texture : Texture | null, vertexlist : VertexList, indexlist? : IndexList)

    texture : Texture
}

/** 
 * The `FS` namespace allows your game to access asset and save files, create or
 * remove directories, etc.
 * 
 * By default all file system operations are sandboxed to prevent
 * damage to the system.
*/
declare namespace FS
{
    /**
     * Creates a directory and any of its parent directories that don't already
     * exist.
     * 
     * If the directory already exists, this function does nothing.
     */
    function createDirectory (path: string) : void

    /**
     * Deletes the specified file
     */
    function deleteFile (path: string) : void

    /**
     * Determines whether the specified directory exists
     */
    function directoryExists (path: string) : boolean

    /** 
     * Checks whether the specified file exists and returns true if it does.
     * Otherwise, returns false.
     */
    function fileExists (path : string) : boolean

    /**
     * Opens, parses and exxecutes the specified script
     * file in the global namespace
     * 
     */
    function evaluateScript (path : string) : void

    /**
     * Resolves a filename (which may contain relative path components, or even be
     * relative itself) to its full, canonical SphereFS pathname.  `baseDirectory` is
     * optional and specifies a base directory for relative paths.  The file or
     * directory ultimately referred to doesn't need to exist.
     */
    function fullPath (filename: string, baseDirectory?: string) : string

    /**
     * Abbreviates a full SphereFS pathname by returning its path relative to
     * `baseDirectory`.  This can be useful when logging filenames or displaying track
     * names, for example.
     */
    function relativePath (path: string, baseDirectory: string) : string

    /**
     * Read an entire utf-8 (or ascii) file into a JS string
     * 
     * This performs the following steps:
     * - Opens the specified file
     * - reads its entire contents
     * - Performs utf-8 character decoding to create a string
     * - closes the file
     * - returns the string
     */
    function readFile (path : string) : string
    
    /**
     * Writes a string out to a UTF-8 text file.  If a file already exists with
     * the specified filename, it will be overwritten.
     *
     */
    function writeFile(path : string, contents : string) : void

    /**
     * Deletes the specified directory.  The directory must be empty or an error
     * will be thrown.
     */
    function removeDirectory(directoryPath : string) : void

    /**
     * Renames the file named by `orig_name` to `new_name`, both of which are
     * assumed to be full paths.  This can also be used to move a file between
     * directories; if so, the destination directory must already exist.
     *
     */
    function rename(originalPath : string, newPath : string) : void
}

/**
 *  Read or write arbitrary data to a specified file.
 */
declare class FileStream
{
    constructor(filename : string, fileOp : FileOp)

    /**
     * Reads data from the file, up to the specified number of bytes, and returns
     * it as an ArrayBuffer.  The file must be opened for reading. */
    read (size : number) : ArrayBuffer

    /**
     * Writes data to the file and advances the file pointer.  `data` should be an
     * ArrayBuffer, TypedArray or DataView containing the data to be written.
     * The file must be open for writing or updating
     */
    write (data : ArrayBuffer ) : void
    /**
     * Disposes of the FileStream object, closing the underlying file.
     * 
     * Attempting to access it afterwards will throw a TypeError.
     * 
     * This will happen automatically when the FileStream is Garbage Collected
     * It can be called early if you wish to ensure that the memory is freed sooner.
    */
    dispose () : void

    /**The name of the file */
    fileName : string
    /**The current position to read or write from in the file (in bytes)*/
    position : number
    /**The total size of the file (in bytes)*/
    fileSize : number
}

/** 
 * The Dispatch API is used to set up asynchronous function calls which are later
 * performed from a designated part of the Sphere event loop.  This is like an
 * advanced version of Sphere v1's update and render scripts, but more tightly
 * integrated and available throughout the engine.
 *
 * When queueing a job, a token is returned which allows you to manage the
 * in-flight job. 
 */
declare namespace Dispatch
{
   /**
    * Sets up a recurring job to call `fn` during the Update event loop phase.
    * Returns a `JobToken` you can use to manage the job.
    *
    * - `options.inBackground` [default: `false`] - If this is `true`, the job won't keep the event loop alive.
    *
    * - `options.priority` [default: `0.0`] - Determines the order of calls when there is more than one job.  Update jobs are
    *   performed in descending priority order.
    */
   function onUpdate(fn : Function, options? : {inBackground: boolean, priority: number}) : JobToken
   /**
    * Sets up a recurring job to call `fn` during the Render event loop phase.
    * Returns a `JobToken` you can use to manage the job.
    *
    * - `options.inBackground` [default: `false`] - If this is `true`, the job won't keep the event loop alive.
    *
    * - `options.priority` [default: `0.0`] - Determines the order of calls when there is more than one job.  Render jobs are
    *   performed in ascending priority order.
    */
   function onRender(fn : Function, options? : {inBackground: boolean, priority: number}) : JobToken
   /**
    * Sets up a one-time job to call `callback` after the event loop exits.  This
    * is useful when you need to ensure something always runs before the engine
    * terminates; for example, automatically saving the game or finalizing a log
    * file.
    */
   function onExit(fn : Function) : JobToken
   /**
    * Sets up a one-time job to call `callback` from the event loop during the
    * current frame.  This is useful for performing operations that need to be
    * done from the event loop with minimal delay.
    */
   function now(fn : Function) : JobToken
   /**
    * Sets up a one-time job to call `callback` from the event loop after
    * `num_frames` frames have passed.
    * 
    * Returns a `JobToken` you can use the manage the job.
    */
   function later(numFrames : number, fn : Function) : JobToken
   /**
    * Cancels all one-time jobs (except `onExit`) in the job queue.  In order to
    * prevent mishaps, this does not cancel update, render and exit jobs.  Those
    * must be cancelled individually (or via Sphere.shutDown)
    */
   function cancelAll() : void
}

/**
 * A JobToken represents a job queued using one of the `Dispatch` functions.
 * When queuing a job, you must keep a reference to the token if you want to be
 * able to manage the job later.
 */
declare class JobToken
{
    /**
     * Cancels the dispatch job associated with this token.  If the job was queued
     * using either `Dispatch.now()` or `Dispatch.later()` and has already started
     * running, calling this has no effect.
     */
    cancel() : void
    /**
     * Pauses the job.  Paused jobs will not run, but do keep the event loop alive
     * and can be resumed at any time without the need to dispatch a new job.
     */
    pause() : void

    /**
     * Resumes the job associated with this token after it's been paused with
     * JobToken#pause().  If the job is not currently paused, this does nothing.
     */
    resume() : void
}

/**
 *  zlib compression and decompression methods.
 */
declare namespace Z
{
    /**
     * Compresses the data in an ArrayBuffer or TypedArray using the DEFLATE
     * compression method.  `level` specifies the compression level from
     * 0 (no compression) to 9 (maximum), with 7 being the default.  Returns an
     * ArrayBuffer containing the compressed data.
     */
    function deflate(data : ArrayBuffer, level?:number) : ArrayBuffer
    /**
     * Decompresses data in an ArrayBuffer or TypedArray which was previously
     * compressed using DEFLATE.  `max_size` is optional and specifies an upper
     * limit on the size of the decompressed data.  Returns an ArrayBuffer containing the decompressed
     * data.
     */
    function inflate(data : ArrayBuffer, level?:number) : ArrayBuffer
}

declare module "data-stream"
{
    export default class DataStream extends FileStream
    {
        constructor (fileName : string, fileOp : FileOp)

        readFloat32(littleEndian : boolean) : number

        readFloat64(littleEndian : boolean) : number

        readInt8() : number

	    readInt16(littleEndian : boolean) : number

	    readInt32(littleEndian : boolean) : number

	    readStringRaw(length : number) : string

        readString8() : string

        readString16(littleEndian : boolean) : string

        readString32(littleEndian : boolean) : string

	    readStruct(desc : object) : object

        readUint8() : number

	    readUint16(littleEndian : boolean) : number

        readUint32(littleEndian : boolean) : number

	    writeFloat32(value : number, littleEndian : boolean) : void
	    writeFloat64(value : number, littleEndian : boolean) : void
	    writeInt8(value : number) : void
	    writeInt16(value : number, littleEndian : boolean) : void

	    writeInt32(value : number, littleEndian : boolean) : void

	    writeStringRaw(value : string, length : number) : void

	    writeString8(value : string) : void

	    writeString16(value : string, littleEndian : boolean) : void

	    writeString32(value : string, littleEndian : boolean) : void

	    writeStruct(object : object, desc : object) : void

	    writeUint8(value : number) : void

	    writeUint16(value : number, littleEndian : boolean) : void

	    writeUint32(value : number, littleEndian : boolean) : void
    }
}

declare module "focus-target"
{
    export default class FocusTarget
    {
	    constructor(options : { })
	    readonly hasFocus : boolean
	    dispose() : void
	    takeFocus() : void
	    yield() : void
    }
}
    
