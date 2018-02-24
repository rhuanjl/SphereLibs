# Strict Mode

## Introduction

Strict mode was introduced in EcmaScpec 5 published in 2009 so is not particularly new but it is automatically enabled in modules and classes whereas previously it was an opt in feature that many people did not opt in to.

Strict mode imposes various restrictions on the JavaScript you write by making several otherwise valid statements into errors. This is intended to prevent various code patterns that lead to odd or unintended effects or unintelligible code.

## Enabling strict mode

### 1. You can enable strict mode globally by writing "use strict" as a string at the top of your first script.

```js
"use strict";
//start code here
```

### 2. You can enable strict mode for an individual function inside an otherwise not-strict file by writing "use strict" as a string inside the top of the function

```js
function foo()
{
    "use strict";
    //start code here
}
```

### 3. Strict mode is automatically enabled in all modules

### 4. Strict mode is automatically enabled in all classes

## Effects of strict mode

The key stand out effects of strict mode are:

1. The keyword "with" is not allowed.

2. Using an undeclared variable is an error (so you can't accidentally make global variables)

3. You cannot delete objects (except by letting them go out of scope)

## Further details

For a full list of strict mode effects see the [ECMA Spec](https://tc39.github.io/ecma262/#sec-strict-mode-of-ecmascript)
