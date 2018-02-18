# Let and Const

## Introduction

Let and const are two new keywords introduced in the EcmaSpec2015 standard for JavaScript they are intended as alternatives to/replacements for "var". In many cases they work in the same way but they have specific differences intended to make development of complex JavaScript easier. This document will explain something of their semantics and the semantics of var for comparison.

```js
var varName = "foo";
let letName = "foo";
const constName = "foo";
```

## Scoping

Historically there have been two scopes that a JavaScript variable (a var) could exist in, either:

### A) Global Scope

Globally scoped variables are visible everywhere - in any function and outside of any function.

A variable created outside of a function would be globally scoped.

``` js
var notInAFunction = "hi";
```

Additionally a variable created implicitly that is without using the var keyword would also be globally scoped, even if it was created in a function.

```js
function makeAGlobal()
{
   globalVar = "hello";
}
```

### B) Function scope

Variables created within a function using the keyword var would be Function scoped that is - visible only in that function (and being automatically deleted when that function concluded unless they were copied or referenced somewhere else).

```js
function localVar()
{
    var local = "hi";
}
```

## Hoisting

Another aspect of var's behaviour is "hoisting" - var declarations are automatically hoisted to the top of the scope they're defined in. e.g.

```js
function doStuff()
{
    if(someLogic)
    {
        //do some stuff
    }
    //do more stuff
    var hello = "stuff";
}
```

Is actually equivalent to:

```js
function doStuff()
{
    var hello = undefined;
    if(someLogic)
    {
        //do some stuff
    }
    //do more stuff
    hello = "stuff";
}
```

Or a slightly more interesting case:

```js
function collision(x1, x2, x3, x4)
{
    if(x1 < x2)
    {
        var start = 0;
    }
    else
    {
        var start = 1;
    }
    if (x3 < x4)
    {
        var end = 0;
    }
    else
    {
        var end = 1;
    }
    if (start = end)
    {
        var done = true;
    }
}
```

Would be converted by a JavaScript engine into:

```js
function collision(x1, x2, x3, x4)
{
    var start = undefined;
    var end = undefined;
    var done = undefined;
    if(x1 < x2)
    {
        start = 0;
    }
    else
    {
        start = 1;
    }
    if (x3 < x4)
    {
        end = 0;
    }
    else
    {
        end = 1;
    }
    if(start = end)
    {
        done = true;
    }
}
```

Notably the duplicate "var"s are removed by the engine but also the "done" var is created every time the function is called even if the condition is not reached for it to be assigned a value.

Hoisting whilst it simplifies some code also causes very odd effects and hard to diagnose bugs in other cases.

The same logic is applied to global scope - with var declarations effectively being pulled to the top line of your global code.

## Let

In some ways let is similar to var, in other ways it is very different.

### Similarities

1. "let" can be used to create a JavaScript variable and it can store all of the same data types as a var. It has no new data types that var didn't have or anything like that.

2. A variable created with a let is writeable i.e. can be overwritten just like a variable created with a var.

3. A let can be globally scoped or locally scoped.

4. A let declaration is hoisted to the top of its scope.

### Differences

#### 1. Duplicate let definitions

Duplicates in the same block are syntax errors:

```js
let dup = 5;
let dup = 2;
```
"Syntax error duplicate let/const declaration"

In comparison with var the engine would transform:
```js
var dup = 5;
var dup = 2;
```

Into

```js
var dup =  5;
dup = 2;
```

This means for instance that if you meant to create two variables and accidentally used the same name with var the 2nd one will overwrite the first one potentially leading to odd behaviour later on. Conversely with let an error is thrown immediately helping you to spot your mistake.

(note also a let in the same block as a const with the same name or sharing global or top level function scope with a var of the same name will similarly produce this error.)

#### 2. Block scoping

A var could be scoped only globally or to a function. With let the variable is scoped to the block it's defined in:

```js
if (true)
{
    let variable = "hi";
}
//variable is now out of scope/undefined
```

Generally a block is anything enclosed by { }. For a slightly more complex example:

```js
function fun()
{
    let oneVar = 5;//visible anywhere in the function block
    if (oneVar > 2)
    {//twoVar is visible only inside this if
        let twoVar = oneVar;
    }
    else
    {//note in "strict mode" this would be a syntax error
        let threeVar = twoVar;//twoVar is undeclared
    }
}
```

Unfortunately you can declare two different lets with overlapping scopes:

```js
function fun()
{
    let oneVar = 5;//visible anywhere in the function block
    if (oneVar > 2)
    {
        let oneVar = 3;
        //oneVar = 3 - assumed that the let defined in this block is the one wanted
    }
    //oneVar = 5 (outer scope)
}
```

#### 3. Temporal Dead Zone

(The Specification refers to this feature as the temporal dead zone... or TDZ)
Variables created with let cannot be used before their definition. This avoids pitfalls where operations are done in the wrong order which var allowed:

```js
function doSomething(parameter)
{
    //do stuff
    //parameter = undefined
}
doSomething(stuff);
var stuff = "something";
```

```js
function doSomething(parameter)
{
    //do stuff
}
doSomething(stuff);
let stuff = "something";
```

"Syntax error: use before definition."

## Const

"const" keeps all of the new features of let compared with var but adds one extra feature.

A const has a fixed value after it's defined you cannot change it.

```js
const something = 5;
something = 3;
```
"TypeError: Assignment to const"

Note: if your const is an object you can add properties to it/change the values of its properties:

```js
const something = {};
something.name = "hello";
something.length = 3;
```

But if you try to replace it with a whole new obejct you will receive an error.

```js
const something = {};
something.name = "hello"; //fine
something.length = 3; //fine

something = {};//TypeError: assignment to const
```