# The Event Loop

## Introduction

The Event Loop is a concept used in most modern JavaScript environments. Much modern JavaScript is structured around the event loop concept.

Different environments can have slightly different event loops - this tutorial will focus on introducing miniSphere's event loop specifically.

miniSphere specifically provides an API called "Dispatch" for interacting with it, which I will also introduce in this tutorial.

## The basic concept

Most programmes involve some kind of core loop where each iteration of the loop involves checking for input performing any necessary updates and drawing to the screen. In a Sphere v1 game this loop could either be provided by the built in Map Engine or written in JavaScript, it may have looked something like this:

```js
while(!gameOver)
{
    for(var i = 0; i < updates.length; ++i)
    {
        updates[i]();
    }
    for(var i = 0; i < renders.length; ++i)
    {
        renders[i]();
    }
    FlipScreen();
}
```

Where renders was an array of render functions, updates an array of update functions and gameOver a var that would be set to true when the game ended.

A "modern" event loop operates in much the same way but is provided by the engine rather than written within your code - in some ways it is similar to the loop that was run by the MapEngine in Sphere v1 except you can interact more with it from your javascript.

## The Sphere v2 event loop

The Sphere v2 event loop does the following things every frame (to understand what "later", "now", "update" and "render" jobs are read the next section):

1. Calls one time "later" jobs then disposes of them.

2. Calls "update" jobs.

3. Checks if the frame should be skipped if yes skip to 7.

4. Calls "render" jobs

5. Delay if necessary per the currently set framerate (Default is 60FPS)

6. Draw the screen

7. Calls one time "now" jobs then disposes of them.

8. Process any promise continuations (see separate article on promises)

## The Dispatch API

Dispatch is the name given to the main API for interacting with the event loop in Sphere v2.

### Dispatch.now(callback)

The .now() method instructs the event loop to call the provided callback function once, during the current frame. Note if you need to provide parameters you can use an arrow function to do so:

```js
Dispatch.now(()=>{SomeFunc(param1, param2)}));
```

This call creates a new function that captures the variables ```param1``` and ```param2``` from your current scope and when called will call the existing function, ```SomeFunc``` providing those variables as parameters.

Additionally Dispatch.now returns a job token object which can stored in a variable - more on job tokens later.

### Dispatch.later(num_frames, callback)

This .later() method instructs the event loop to call the provided callback function once, after the specified number of frames have elapsed. Note that if 0 is given as the number of frames this will run at the start of the next frame (this is not the same as a .now() which would run in the current frame).

Similar to the .now() method it returns a job token.

### Dispatch.onUpdate(callback[, options])

The .onUpdate() method instructs the event loop to call the provided callback function once per frame every frame. Similar to the .now() method it returns a job token.

The optional parameter, options should be an object that can have two relevant properties:

1. .inBackground a boolean, which defaults to false. If at any point all remaining callbacks in the event loop are inBackground the event loop will end - this can be used for setting up background tasks that will run all game and don't require any explicit management, so you don't need to end them to end the game.

2. .priority - a number, defaults to 0.0 to specify what order callbacks should occur. The highest number onUpdate callback occurs first down to the lowest. The engine will perform callbacks with the same priority in the order they were created.

### Dispatch.onRender(callback[, options])

The .onRender() method instructs the event loop to call the provided callback function once per frame after the onUpdate callbacks and before the screen is rendered. Except if there is a frame rate issue and the frame is due to be skipped the onRender callback will be skipped too - the intent is that these are used for all drawing operations but only drawing operations. Similar to the .later() method it returns a job token.

The optional parameter, options should be an object that can have two relevant properties:

1. .inBackground a boolean, which defaults to false. If at any point all remaining callbacks in the event loop are inBackground the event loop will end - this can be used for setting up background tasks that will run all game and don't require any explicit management, so you don't need to end them to end the game.

2. .priority - a number, defaults to 0.0 to specify what order callbacks should occur. The lowest number onRender callback occurs first up to the highest - note the reversal compared to onUpdate - the idea here is that the highest priority items to draw are the ones you want at the front of the screen.

### Dispatch.cancelAll()

The .cancelAll() method specifically cancels everything scheduled with .now() and .later(). It does not interact with .onUpdate and .onRender.

Note that .now() and .later() callbacks only occur once and are not retained by the event loop after they've occurred, there is no purpose to cancelling them after they have occurred as they'll be disposed of automatically.

### Sphere.shutDown()

Not technically a Dispatch method but highly related. .shutdown() explicitly cancels all update jobs, all render jobs, all later jobs and all now jobs - the expectation is that as there is nothing left to do the engine will close down shortly afterwards.

### JobTokens

As mentioned above .now(), .later(), .onUpdate() and .onRender() all return JobTokens, a JobToken has 3 methods:

1. .cancel() - cancels the callback associated with this token.

2. .pause() - pauses the callback associated with this token. (It will stop being called)

3. .resume() - resumes the callback associated with this token. (Does nothing if it's not paused.)

## Using this

The intention in Sphere v2 is that all key activities other than initial setup within your game are processed via the Sphere v2 event loop. It controls the framerate and renders the screen for you. It also provides a neat API for scheduling and cancelling recurring actions with minimal boiler plate code.

Additionally it facilitates the use of Promises and async functions which will be discussed in a separate article.