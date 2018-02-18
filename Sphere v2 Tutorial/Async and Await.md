# Async and Await

## Introduction

Async functions and the related keywords ```async``` and ```await``` are a recently introduced prettier way of writing promises.

A small health warning applies - async functions are slow when they're not needed unless absolutely necessary do not call an async function every frame. They should instead be used to set up/initialise particular events.

## Making async functions

An async function is defined by using he keyword ```async``` before an otherwise normal function definition. You can use them on almost any type of function:

```js
async function foo ()
{
    //this is an async function
}

let bob = async () =>
{
    //this is an async arrow function
}

class someClass
{
    async jeff ()
    {
        //this is an async method in the class someClass
    }
}
```

The constructor of a class cannot be ```async``` and also any other function that you wish to call with the ```new``` keyword cannot be async - attempting this will result in an error being thrown.

## The return value of an async function

Async functions always return a promise. Note if you do not include the ```return``` keyword in your async function it is treated as if you added a ```return undefined``` at its end.

The promise returned by the async function is resolved with the return value of your async function so:

```js
async function foo ()
{
    return "hi";
}
```

Is equivalent to

```js
function foo()
{
    return new Promise((resolve) =>{
        resolve ("hi");
    });
}
```

## The keyword await

The new keyword ```await``` is a keyword usable only inside an async function. It pauses the execution of the function until the promise shown after it is resolved.

```js
async function fun()
{
    await Sphere.sleep(1200);
    //do something here - it will happen 1200 frames i.e. 20 seconds after the function is called
}
```

Additionally you can obtain the resolution value of the promise

```js
async function foo()
{
    let result = await somePromise;
    //do something with result here
}
```

## Why this is nice

Using async functions allows you to show logic that's spread across a long period of time in a very simple way.

```js
async function start ()
{
    let selection = await StartMenu();//wait for the menu to be done
    if(selection == NewGame)
    {
        await StartGame()); //StartGame needs to return a promise that resolves when the game ends
    }
    else if(selection == OptionMenu)
    {
        await Options(); //wait for the Options menu to be done
    }
    else
    {
        Sphere.shutDown();
    }
    Dispatch.now(start);//ask the event loop to re-call start
}
```

## Other notes

1. async functions return promises - so you can call .then() or any other Promise method with their return values

2. when used correctly async functions are non-blocking - they contain some kind of control logic whilst your update and render functions keep running - this is not truly parallel though it's just that the async function pauses and lets everything else carry on for each awaited promise.

3. If you're not working with any promises there is nothing to await and hence no point in using an async function.

## Pitfalls

1. If you use await and don't provide a promise or a function returning a promise as the thing to wait for it is as if ```await``` wasn't there BUT the rest of the function was wrapped in Dispatch.now() - i.e. the async function will still pause but it will resume in the same frame.

2. If an error is thrown in an async function it is treated as a promise rejection and not as a normal error - see the Promises article for more details of this.