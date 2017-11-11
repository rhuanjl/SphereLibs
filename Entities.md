Entity Objects
==============
Entity objects are used to represent people and other objects you can interact with in the map engine.

Creating Entity Objects
-----------------------
Entity objects can be created in 3 main ways:

1. By including them in your map files - add person entities to your .rmp files in the map editor OR (add details of Tiled support later).
2. If using `map-engine.mjs` via

    MapEngine#createCharacter(name, spritesetName, x, y, layer);

This creates an entity and adds it to the map as well as returning the object.

3. If using `SEngine.mjs` directly;

    SEngine#addEntity(name, spriteObject, persist=false, x=0, y=0, layer=0, speed = 100, scale=[1, 1], scripts=blankScripts)

The function is equivalent to createCharacter but with a little more flexibility - note it reuqires you to preLoad a sprite object.

Getting access to Entity Objects
--------------------------------
If an entity was made with createCharacter or addEntity you can keep access to it by retaining a reference to the return value, if you were not able to retain the return value or you need it in another scope OR if you need access to an entity that was created in the map editor you can use the getEntity method - give it the ID/name of the entity and it will return the object.

    MapEngine#getEntity(name);
    SEngine#getEntity(name);

Additionally Entity objects are provided in Entity scripts as the self/player/other parameters.

Storing Custom Data on Entity Objects
-------------------------------------
Entity objects have a data property - an object that is empty by default you may store any values specific to a given entity on this.

e.g1.

    entityObject.data.talkedTo = true;

e.g.2.
    entityObject.data.running = false;

You can store any type of data on the data objec, note within an entity's person script this could be accessed as self.data.talkedTo etc.

Built in properties
-------------------
Entities have several built in properties that are read/write.

    entity#id
The name of the entity. WARNING do not write to this. In a future version this will be made read only.

    entity#zoom
This value exists in case the map engine camera is attached to the entity - as it requires its object to have a zoom property, if the camera is attached to this entity writing to this will zoom in or out; note larger numbers = zoom out, small numbers = zoom in.

    entity#persist //boolean true/false
Specifies if this entity should persist when the map is changed - if this is true the entity will be retained upon map change if it is false the entity will be deleted when changing map.

Defaults to false for entities created via the map editor, defaults to true for createCharacter

    entity#frozen //boolean true/false
Specifies if the entity is frozen, commands queued for frozen entities are paused - use this to freeze a spceific entity whilst they're talking or during some other animation.

Defaults to false for all entities.

    entity#visible //boolean true/false
Specifies if the entity should be drawn, set to false to disable drawing of the entity.

    entity#attached //boolean true/false
Specifies if the entity is player controlled, certain effects are triggerred only by interaction with the player, warning setting this to true does not on its own add input control.

Note: Using MapEngine#attachInput or SEngine#addDefaultInput will set this to true AND set up inputs.

Properties available via accessors
----------------------------------
Entities have several properties available via getters/setters these can be used like other properties as if they were bare values BUT note that each time you use one of these a function is being called hence there can be a performance impact if these are used too much - if you need repeated access to one of these properties in the same frame cache the value in a temporary variable.

    entity#sprite //spriteObject
The sprite the entity is using - note to change this you should supply a sprite object - e.g. one that has been loaded with the loadSES function from SEngine.mjs

e.g1.

    hero.sprite = loadSES("sprites/newSprite.ses");

e.g.2. - a sudden transformation

    let tempSprite = villain.sprite;
    villian.sprite = hero.sprite;
    hero.sprite = tempSprite;
The hero and the villain will swap appearances...

WARNING: this accessor is experimental and has not been fully tested.

    entity#speed
The movement speed of the entity, notes:
1.non-integer values will be rounded down to the nearest integer

2.A speed of 128 = 1 vector per frame (vectors are set by the spriteset currently converted .rss files give a vector of 1 pixel)

    entity#obstructions

Read only property, attempts to write to this will throw a type error, this will provide an array of objects currently obstructing this entity if it attempts to ove one vector in the direction it is facing.

Note currently obstructed tiles, other entities AND triggers will all appear as obstructions in this array - even though triggers wouldn't actually block movment.

    entity#layer
The layer of the map the entity is on, note writing to this will actually queue a teleport to the new layer which will not resolve untill the any other movements in the entity's queue have been processed.

Teleports are a special type of movement when they reach the front of the movement queue they're processed immediately AND and the next movement after them is processed in the same frame

Reading from it will return the current layer, therefore:

    hero.layer = 5;
    if(hero.layer === 5) //not guaranteed to be true
    {
        //do xyz 
    }

If you need to change layers and then do something else consider queueing the follow up action as an entity script OR using a promise OR Dispatching the second action in an update script with a condition to check if the layer change has happened - remember to have this update script cancel itself.

    entity#x
    entity#y

These behave in the same way as entity#layer.


    entity#fullQueueLength
    entity#queueLength
    
These two properties are read only, fullQueueLength returns the total number of queued actions for an entity. queueLength returns the number of queuedActions excluding teleports (becasue teleports don't cost a frame to execute) - i.e. queueLength is the number of frames untill the entity will be idle, whereas fullQueueLength ay be a higher number.

    entity#waiting
    entity#fullyWaiting
These two properities are also read only and will return true/false. waiting returns true if queueLength is 0, fullyWaiting returns true if fullQueueLength is 0.

    entity#direction
Read/Write - the text name of the direction an entity is facing e.g. "north". Writing to this can change an entities direction BUT please note that moving in a direction always sets that direction.


Entity methods
--------------
In addition to properties entity objects have various methods you can call.

    entity#faceEntity(entity, immmeditate=true)
Attempts to set the direction of the entity so that it is facing the other entity, if immediate is false this change of direction is queued, if true it's done immediately.

WARNING: this method is experimental and not fully tested

    entity#obstructionsOnLayer(layer)
Returns an array of the objects (tiles, entities and triggers) that this entity would collide with if it was on the specified layer.

    entity#obstructionsInDirection(direction)
Returns an array of the objects (tiles, entities and triggers) that this entity would collide with it if attempted to move in the specified direction.

    entity#clearQueue()
Removes all instructions from the entities queue - this cancels all queued actions of any kind for the entity.

    entity#dstroy(processQueue = false)
This queues "destrution" of the entity, destroyed entities aren't actually deleted but are removed from collision detection, frozen and set to invisible.

If the parameter is set to true the destruction occurs after existing queued actions are completed otherwise it occurs on the next frame.

    entity#queueMove(dir, units = 1, type = 0, script)
This function queues an action of almost any kind, generally the oldest action in each entity's queue is processed each frame.

- dir is the direction to face for the action
- units is the number of times to perform the action (normally number of frames to do it for) - NOTE, passing 0 or a negative number of units will result in the action being performed continually OR untill the clearQueue method is used.
- type: 0 for movement, 1 for animation with no movement, 2 to execute a script, 3 to face the specified direction but do nothing else. There are other type values used internally within SEngine, they should not be used externally.
- script: only required for type 2 - this should be a function to be called, it will be passed the runTime object as its first parameter and this entity object as its second parameter


Private Properties
------------------
Entity objects have many other properities. Those not listed above should be considered private and intended for internal use only, liable to change in future versions AND liable to have unintended effects if written to.

e.g.

    entity#_x
    entity#_y
    entity#internalLayer
These are currently the coordinates of the entity BUT if you write to any of these collision detection will break.
