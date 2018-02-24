# Arrow Functions (aka Lambda functions)

## Introduction

Arrow functions (sometimes referred to as Lambda functions) are a new type of function introduced in ECMASpec 2015. They appear in a few different forms with slightly different semantics. In many ways:

```js
const foo = (parameters) =>
{
    //do stuff
}
```

Is very similar to:

```js
function foo (parameters)
{
    //do stuff
}
```

And the arrow form is perhaps less immediately clear than the old form (as it doesn't have the keyword "function" to tell you what it is). But arrow functions come with various benefits (they also come with some pitfalls)...

## Forms of arrow functions

### 1. "Normal" form

```js
let arrowFunc = (param1, param2, param3) =>
{
    //do stuff
}
```

### 2. "Short" form

```js
let arrowFunc = (param1, param2) => otherFunc(param1, param2);
```

The short form can be used for setting up a function call to be handed as a parameter to something else with specific variables pre-provided as the parameters.

## Differences between arrow functions and normal functions

### 1. Scope capture

Arrow functions are called with the scope they were created in. This means if a variable is in scope when you create an arrow function it will be in scope for that arrow function whenever it's called.

```js
function makeStuff()
{
    let x = 5;
    return () => {print ("hello + " + x)};
}

let foo = makeStuff();// foo is now an arrow function
foo();//calls print("hello + " + 5);
```

### 2. Capture of this

Arrow functions do not have their own "this" property. Within an arrow function the "this" value is the "this" value for the scope you created it in.

```js
function makeStuff()
{
    this.x = 5;
    this.other = () => {++this.x; print (this.x);};
}

let foo = new makeStuff();
foo.other();//print(6);
foo.other();//print(7);
foo.other();//print(8);
```