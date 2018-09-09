

declare namespace Sphere
{
    const Engine : string
    const Version : number
    const APILevel : number
    const Compiler : string
    const Game : object
    let frameRate : number
    let frameSkip : number
    let fullScreen : boolean
    function abort(message : string) : void
    function now() : number
    function restart() : void
    function setResolution(width : number, height : number) : void
    function shutDown() : void
    function sleep(frames : number) : Promise<void>
}

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

declare namespace SSj
{
    function log (message : string | object | Error) : void
    function now () : number
}

declare enum FileOp
{
    Read,
    Write
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
    const Default : Keyboard
}

declare class Keyboard
{
    charOf(key : Key, shifted : boolean) : string
    getKey() : Key
    isPressed(key : Key) : boolean
    clearQueue () : void
    readonly capsLock : boolean
    readonly numLock : boolean
    readonly scrollLock : boolean
}

declare namespace Font
{
    const Default : Font
}

declare class Font
{
    readonly height : number
    readonly fileName : string
    getTextSize(text : string, wrap_width : number) : {width : number, height : number}
    wordWrap(text : string, wrap_width : number) : string[]
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

declare class Model
{
    constructor(shapes : Shape[], shader? : Shader)
    transform : Transform
    shader : Shader
    draw(surface? : Surface) : void
}

declare class VertexList
{
    constructor(vertices : {}[])
}

declare class IndexList
{

}

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

declare class FileStream
{
    constructor(filename : string, fileOp : FileOp)
    read (size : number) : ArrayBuffer
    write (data : ArrayBuffer) : void

    fileName : string
    position : number
    fileSize : number
}

declare namespace Dispatch
{
   function onUpdate(fn : Function, options? : object) : JobToken
   function onRender(fn : Function, options? : object) : JobToken
   function onExit(fn : Function) : JobToken
   function now(fn : Function) : JobToken
   function later(numFrames : number, fn : Function) : JobToken
   function cancelAll() : void
}

declare class JobToken
{
    cancel() : void
    pause() : void
    resume() : void
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
    
