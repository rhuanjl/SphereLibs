# Classes

## Introduction

Classes were introduced in ECMASpec 2015 intended as a more elegant style of Javascript in many ways they're a different way of writing functionally identical code though they do bring a few new features.

## Simple example

In older javascript you could write this:

```js
function MyObj(a, b, c, d, e)
{
    this.a = a;
    this.b = b;
    this.c = c;
    this.d = d * e;
}

MyObj.prototype.add = function (x)
{
    this.a += x;
    this.b += x;
}

MyObj.prototype.sub = function ()
{
    this.d *= this.a;
}
```

Using the new class syntax you can write the same as:

```js
class MyObj
{
    constructor (a, b, c, d, e)
    {
        this.a = a;
        this.b = b;
        this.c = c;
        this.d = d * e;
    }

    add (x)
    {
        this.a += x;
        this.b += x;
    }

    sub ()
    {
        this.d *= this.a;
    }
}
```

Functionally these two examples are currently identical, in either case you could use new MyObj(a, b, c, d, e) to make an object with the defined properties and the add() and sub() methods.

The class syntax is this case is just neater - the function and prototype keywords are not needed the constructor (the method used to create/construct your object) is clearly named as a constructor making it's role obvious and everything is held together in one set of braces to show that it's connected.

But there are some other things we can do in class bodies that we couldn't do with the old style.

## Getters and Setters

Classes aren't the only place you can use these but they work particularly well in classes.

```js
class MyObj
{
    constructor (a, b)
    {
        this.value = a / b;
        this.count = 0;
        this.multiple = b;
    }

    set fact (a)//note a setter must always have 1 parameter
    {
        this.multiple = a;
    }

    get product ()//note a getter can NOT have a parameter
    {
        ++ this.count;
        return this.value * this.multiple;
    }

    set product (a) //you can define a getter and a setter with the same name
    {
        this.value = a / this.multiple;
    }
}

let inst = new MyObj(5, 10);

let foo = inst.product;//acts and looks like a property but actually calls the defined getter function.
//MyObj.count is now 1
//foo is now 5
inst.fact = 5;//looks like a normal object property actually calls the setter function
//MyObj.multiple is now 5
inst.product = 20;//looks like a normal property write, calls the setter
//MyObj.value is now 4
foo = inst.fact;//error setter cannot be read from
```

Getters and setters like this can be used to make much cleaner looking interactions with your classes e.g. in my SpriteEngine I use a setter for setting a sprite - as various calculations have to be done when changing sprite BUT as I have a setter function to change sprite someone can simply do entityObj.sprite = someSprite.

They can also be used to create read only or write only properties which can sometimes be useful or to track the number of times a property changes etc or provide a sequence of values in some way.

## Static Methods

A static method is a function defined as part of a class definition that is NOT instantiated for each copy of the class so must be called with className.staticName - not with the name of an instance.

Additionally if you use "this" in it - the "this" will be the class itself not an instance of it. This is useful for grouping together methods that relate to each other or relate to the rest of your class but don't need to be duplicated each time a copy of your class is made.

```js
class MyObj
{
    constructor (a, b, c, d, e)
    {
        this.a = a;
        this.b = b;
        this.c = c;
        this.d = d * e;
    }

    add (x)
    {
        this.a += x;
        this.b += x;
    }

    static doSomething (x, y)
    {
        //do something with x andy
    }
}

MyObj.doSomething(5, 10);
let foo = new MyObj(2, 3, 4, 5,);

foo.doSomething(5, 6);//ERROR - static method cannot be called as a property of an instance
```

## Inheritance/Extension

Class inheritance can be used to make several different classes that share some key properties.

```js
class Character
{
    constructor (name, hp, atk)
    {
        this.name = name;
        this.hp = hp;
        this.atk = atk;
    }
    runAway()
    {
        //make this character run away?
    }
}

class Enemy extends Character
{
    constructor (name, hp, atk, boss)
    {
        super(name, hp, atk);//invokes the Character constructor
        this.boss = boss;
    }
    beEvil()
    {
        //do something evil here
    }
}

class Hero extends Character
{
    constructor (name, hp, atk, favouriteFood)
    {
        super(name, hp, atk);
        this.favouriteFood = favouriteFood;
    }
}

let foo = new Hero ("Bob", 10, 5, "Pizza");
//foo has properties:
foo.name;
foo.hp;
foo.atk;
foo.favouriteFood;

let bar = new Enemy("Jeff", 5, 15, true);
//bar has properties
bar.name;
bar.hp;
bar.atk;
bar.boss
//and method
bar.beEvil();
```

This feature can be very useful for designing related classes. Additionally you can extend native objects like Array or Promise. You can even extend Sphere v2 native objects.

One thing to be aware of - you must use ```super()``` to invoke the parent constructor before you can use ```this``` in the constructor of a class that extends/inherits from another.

