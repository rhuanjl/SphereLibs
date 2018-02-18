# Modules

## Introduction

Modules (also called ES Modules or ES6 Modules) were introduced in ECMASpec 2015, the objective to introduce a specification defined method for having multiple script files in one project.

Prior to the addition of modules working with multiple Javascript files required a host/environment defined method of loading the additional files rather than a JavaScript defined method.

## Predecessors to ES modules

For background I'll briefly review some historic approaches to this prior to the introduction of ES Modules.

### The Sphere v1 Approach

In Sphere v1's api there were 4 provided functions for this:

```js
EvaluateSystemScript("systemScriptName.js");
RequireSystemScript("systemScriptName.js");
EvaluateScript("path/ScriptName.js");
RequireScript("path/ScriptName.js");
```

These were defined by the Sphere v1 API and worked to load additional scripts when required. The "Require" functions would check if the script had already been loaded and only load it if it had not been whereas the Evaluate functions would always load it whether it had been loaded before or not.

Every script file would be run as global code and so if you used variables of the same name in multiple files you could run into odd errors.

### The browser approach

In Web browsers an HTML instruction would be used to load scripts - I mention this for comparison only but won't be elaborating on how to use it. Though I note that similar to the Sphere v1 functions all scripts loaded via HTML would be loaded globally.

### require()

An alternative used particularly within Node.js is a host defined function called require. It would be used as:

```js
let foo = require("path/scriptName.js");
```

A key difference between ```require()``` and the Sphere v1 ```RequireScript()``` is that require would not put anything into the global scope; instead require would return an object with it's properties being members of ```module.exports``` an object you could create inside the script. Any variables or functions created inside the require()'d script and not attached to the ```module.exports``` object would be private to the script (as if the entire script was a function that ```return```ed ```module.exports```).

Note: ```require()``` is available within miniSphere though it's use is not encouraged.

## Introducing ES Modules

ES Modules build on the idea of ```require()``` but as they are implemented in JavaScript itself rather than in a function provided by a host they're able to have some much nicer syntax.

### Upfront note - file extensions

In miniSphere (and Node.js) ES Modules must have the file extension ".mjs" instead of ".js" this is simply so that the engine knows immediately whether a file is an ES Module or an "old" style script.

### ES Modules - global scope

Similar to when using ```require()``` variables declared globally within an ES module are local to that module and will not be seen as global in any other module or script.

### Import and Export

Within ES Modules there are 2 key words available that are not available in ".js" scripts these are ```import``` and ```export```.

If you want any variable, function or class defined in your module to be available outside of the module you must ```export``` it. It can then be ```import```ed in another module.

Any type of variable can be exported, for example:

```js
export function foo()
{

}

export const hello = 5;

export class map
{
    ///...
}
```

In general I find that the most useful exports are classes and functions - remember the idea is only to export the things that another script/module is going to need.

Importing is slightly more complex than ```export```ing as you have to specify where to import from and what you want to call them:

```js
import {foo} from "./otherModule.mjs"; //load the export called foo from otherModule.mjs - add it to the current scope as a variable called foo

import {hello as goodbye} from "./otherModule.mjs"; //load the export called hello from otherModule.mjs but insert it into the current scope as a variable called goodbye

import {hello as goodbye, map} from "./otherModule.mjs"; //load the export called hello from otherModule.mjs but insert it into the current scope as a variable called goodbye AND load the export called map from otherModule.mjs and insert it into the current scope (as a variable called map)

import * as someName from "./otherModule.mjs"; //Load all exports from otherModule.mjs insert them into the current scope as named properites of a new object called someName

import "./otherModule.mjs"; // run the otherModule.mjs but do not put anything from it into the current scope

```

You can also export a default from a module - with the "default" keyword:

```js
export default class Hello //the name "Hello" here is optional
{
    //stuff
}
```

This is imported in this way:

```js
import anyNameHere from "./otherModule.mjs";
```

You can use any name you like when ```import```ing a default export - the absence of the ```{}``` tells JS that you want the default export.

### Importing a module multiple times

If you import the same module multiple times - to load different values from it or more likely to access it in different modules it will only be run once. The engine will check if the module has already been ```import```ed if it has it simply returns the requested ```export```s that were loaded when it was imported before. This means you can safely ```import``` all of your dependencies for a given module at the top of that module and clearly see what is needed where without risk of code being run multiple times.

### The static nature of import and export

The keywords ```import``` and ```export``` are designed to be used statically, that is the module filenames you import can only be string literals you cannot use a variable to hold the filename.

Additionally all import statements must appear at the top of the file before any code execution occurs - placing them further down results in syntax errors being thrown.

The reason for this is so that the engine can load all relevant modules before any code is run.

## Dynamic import()

At times you need to decide what to load based on information that arises during code execution and so the static ```import``` is not sufficient.

For this reason there is also a dynamic ```import()``` Dynamic ```import()``` can be used anywhere in a module OR in a .js script.

It returns a Promise which will resolve with its value being an object with  all the exports of the module as it's properties.

```js
let moduleName = someFunc();//get the name of the module we want to load
let foo = import(moduleName);

foo.then((nameOfExportW)=>{
    //do stuff with nameOfExport
});
```

Alternatively within an async function it can be used with await:

```js
let moduleName = someFunc();//get the name of the module we want to load
let foo = await import(moduleName);
//do stuff with foo.exportWeWanted
});
```

Warning if you neither ```.then()``` it or ```await``` it the exports will all be undefined until you return to the event loop.