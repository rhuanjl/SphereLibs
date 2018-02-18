# Promises

## Introduction

Note a basic understanding of event loops is required for this article to be intelligible. I reccomend reading the Event Loop and Dispatch article first.

A Promise is a new type of JavaScript built in object introduced in ECMASpec 2015 it allows interaction with future events, it also allows you to explicitly schedule a continuation for a future event.

These can be a little tricky to understand at first - but they are a key concept for much modern JavaScript. That said they also are one of the slowest built in features of JavaScript - when used correctly this is not an issue, however bad use of promises can make unnecessarily slow code.

Note also if the syntax seems a little convoluted async functions which will be introduced in another article provide a neater way of writing many promise operations.

## Simple example

A common scenario in game logic may be that you wish to do something when a key is pressed. BUT you want everything else to carry on until that key is pressed - you don't want animations to cease or other things to stop happening while you wait for the key.

What's the best way to handle this? One option is to include something like the following at the end of one of your onUpdate callbacks.

```js
if (input.IsKeyPressed(someKey))
{
    //do something here
}
```

But this may well introduce some mess to your code and also mix up the future activity you wish to plan for with the code of your recurring activities.

If instead you create a promise that will be resolved when the key is pressed you can as a one time operation do the following:

```js
somePromise.then(()=>{/*do stuff here*/});
```

This should not be in your update script but rather in some kind of setup function, the single call of that operation will mean that at whatever point somePromise is completed the Event Loop will call the code from the "do stuff here" block as if it were supplied to Dispatch.now() at that point.

## Creating a Promise

The syntax for creating a new Promise object is:

```js
let somePromise = new Promise(controller);
```

Where ```controller``` is a function that will be called immediately by the Promise constructor and handed two arguments ```resolve``` and ```reject``` these arguments are themselves functions. Calling the ```resolve``` function completes the promise, calling the ```reject``` function specifies that it failed.

If you wish to manually complete a promise at a later time you can set it up like this:

```js
let handler;
let somePromise = new Promise((resolve, reject) => {
    handler = {resolve, reject};//make resolve and reject into properties of handler
});
somePromise.resolve = handler.resolve;//re-reference resolve onto somePromise
somePromise.reject = handler.reject;//re-reference reject onto somePromise
```

Then you will be able to call ```somePromise.resolve(value)``` at a later time to mark the promise as completed. Perhaps if you want one piece of game logic to trigger another you could use this method; this is also called a "Deferred Promise".

There is currently one built in Sphere v2 API that makes a promise. ```Sphere.sleep(frames)``` returns a promise that resolves after the specified number of frames has elapsed.

Additionally the ESNext dynamic loading operator ```import()``` which is available in miniSphere returns a promise. (please see the modules article for more detail on that)

A slightly more involved example can be seen in my input.mjs module, I've excerpted the relevant method and then put comments throughout to explain it, this is slightly long as it allows for two options:

1. Continuous input - the promise resolves if the key is pressed
2. Non-continuous input - the promise resolves only if the key is first not pressed and then is pressed

(Option two allows for situations where you want something to happen only once per key press - or don't want to allow one event to flow too quickly to another)

```js
class Input
{
//... constructor and other methods omitted for space
    waitForInput(keys, allowContinuous = false)
    {
        this.keys = keys;//an array of keys to be looked for
        this.state = 0;//a state variable
        return new Promise((resolve) => //create and return the promise
        {//beginning of the controller function
            if(allowContinuous === false)
            {
                let job = Dispatch.onUpdate(() =>//schedule an update job to check for the key press
                {
                    let done = true;
                    switch(this.state)
                    {
                        case(0)://state 0 i.e. initial state - want to see if the key(s) are held down
                        this.state = 1;//move forward to state 1
                        for(let i = 0; i < this.keys.length; ++i)
                        {
                            if(this.isPressed(this.keys[i]) === true)
                            {
                                this.state = 0;//move back to state 0 if any relevant key is pressed
                            }
                        }
                        break;
                    case(1)://state 1 we know the key(s) had been released/weren't pressed
                        for(let i = 0; i < this.keys.length; ++i)
                        {
                            if(this.isPressed(this.keys[i]) === true)
                            {//if a relevant key is pressed move to state 2
                                this.state = 2;
                                this.value = this.keys[i];
                            }
                        }
                        break;
                    case(2)://state 2 the key was pressed wait for it to be released again
                        for(let i = 0; i < this.keys.length; ++i)
                        {
                            if(this.isPressed(this.keys[i]) === true)//has it been released
                            {
                                done = false;
                            }
                        }
                        if(done === true)
                        {
                            job.cancel();//the key has gone down and up end the job
                            resolve(this.value);//resolve the promise returning the value of the key
                        }
                        break;
                    }
                });
            }
            else// else leg - this is used for continuous input
            {
                let job = Dispatch.onUpdate(() =>
                {
                    let done = false;
                    for(let i = 0; i < this.keys.length; ++i)
                    {
                        if(this.isPressed(this.keys[i]) === true)
                        {//is any relevant key currently pressed?
                            done = true;
                            this.value = this.keys[i];
                        }
                    }
                    if(done)
                    {
                        job.cancel();//key is pressed end the job
                        resolve(this.value);//resolve the promise returning the key
                    }
                });
            }
        });
    }
}
```

This may seem slightly long but it allows for some very nice use cases once it's in place.

```js
instanceOfInput.waitForInput([Key.Enter, Key.Space]).then((key)=>{
    //event loop will do the stuff here only after Enter or Space is pressed and released
    //"key" will be the pressed key
});
```

You would call this just once and it would trigger on whatever later frame the key press and release occurred by.

Note this example ignores ```reject``` as it has no use case for it.

Another example you can look at is the MenuSystem in MenuSystem.mjs which returns a promise which resolves when the menu is over (i.e. the user has selected an option).

## Promise Instance Methods

Promises have the following methods all of which return promises:

### promiseObject.then(onResolved[, onRejected])

Setup a callback for when the promise is completed. Additionally can specify a callback for if the promise is rejected/fails. Note the completion value of the promise (the parameter handed to ```resolve(value)``` or ```reject(reason)```) will be handed to your callbacks as a parameter. Note the .then() method returns a promise that is resolved or rejected with the return value of the handler.

### promiseObject.catch(callback)

Setup a callback specifically for if the promise is rejected - this is equivalent to ```promiseObject.then(undefined, callback)```.

### promiseObject.finally(callback)

Setup a callback to be used if the promiseObject is resolved or rejected. Note if this callback completes normally .finally() will return a promise with the same resolution/rejection as the original promiseObject. If the callback produces an exception it will instead return a promiseObject that is rejected with that exception value.

## Promise Constructor methods

These methods are accessed by using Promise.method - they are not properties of individual promises.

### Promise.resolve(value)

Create and return a promise already resolved with the given value.

### Promise.reject(reason)

Create a promise already rejected with the given reason

### Promise.all(iterable)

An iterable is an Array or Object. Creates a promise that resolves when all the promises in the provided iterable resolves and returns an array of their results. If any of the promises rejects it immediately rejects with the reason for the rejection.

### Promise.race(iterable)

Creates a promise that resolves or rejects the first time one of the promises in the provided iterable resolves or rejects, it will pass through the value/reason of that promise.

## Promise Rejections

If a callback function you provide to a promise handler (.then() etc) throws an error this will not be immediately reported rather the promise will just be rejected.

This can cause problems for debugging code as errors can be silent when they occur and produce unintended results later.

In miniSphere to ease development if a promise is rejected and there is no onRejected handler (provided by either a .catch() or a second parameter to a .then()) then the engine will throw an error with the reason for the rejection at the end of the event loop frame. (NOTE a .finally() handler will not stop the error as it passes through the rejection).