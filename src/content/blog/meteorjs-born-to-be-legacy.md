---
title: "Born to be legacy, or MeteorJS: fractal of helloworld-oriented design"
legacyDate: 2015-04-16 00:00:15 +0700
tags: meteorjs, roast
publication-date: 04/26/2023
image-url: /static/blog/50-shades-of-rust/splashcrab.jpg
opengraphImage: /static/blog/50-shades-of-rust/splashcrab.jpg
---

* Update2 (04-09-2024): It's an archived post I wrote in 2015. It's not kind, but it turned out to predict the future quite correctly. MeteorJS ecosystem, built on 3rd party packages, experiences a lack of support. Even the packages that Meteor team took under their patronage are not maintained well (https://github.com/Meteor-Community-Packages/meteor-scss/pull/296).

* Update * Slowly things are getting better. Most of the issues noted in this article aren't actual anymore.
  Meteor community did a great job moving from Meteor packages to npm, from Blaze to React/Angular2/Vue,
  from minimongo reactivity to [Graphql](http://www.apollostack.com/). I won't say all those custom Meteor infrastructure things were failures,
  as at the time it was the best choice to obtain quick traction and user base.

Here I'll share some thoughts about MeteorJS bad parts that I faced working with it.
It isn't about starting holy war, but rather constructive criticism, and I really hope I'll help Meteor community become better.

I really want to be wrong here. Please point in comments if I'm wrong, and return me my trust in framework and in community.

So there's my main statement: MeteorJS is optimized for Hello World applications;
you can write serious application on top of it, but you have to hack it around to do so.

MeteorJS advertises itself as easy to use. It does so many things for you. It attracts developers with shiny demonstrations,
aggressively extending it's community, writing nice tutorials for new developers which are easy to follow but which are utterly wrong.

How many times did you saw tutorial with usage of a Session reactive source, for like _everything_?

\* *Session reactive source is a (string)key-value store that is maintained for the whole application
and accessible globally from any code part*

Of course you can use namespaces in form of prefixes (but who _really_ doing it?) or ReactiveVars like me.
But I don't see it's usage as a recommended, as a result there's plead of new developers who learning to do things wrong.

Session is only a part of big `global` problem, that, in it's turn, a part of packages / dependencies loading problem.
I'll write about it later, but will concentrate on problem of globals.

So my second statement would be: Packages in Meteor are globals, and it is fundamentally wrong.
If you think globals are OK I hope there's time machine for you so you could travel back to nineties and never come back.

I agree, globals are very easy to use and easy to attract fresh blood to community, but only if you don't care about blood quality.

What tangible problems globals give me right now are a) problem with load order and dependencies b) problem with packages.

A. Load order issues

So as we all know, Meteor load files deep-first, alphabetical-first, 'main.js'-last.
That becomes an issue when you have some inner dependencies to watch, i.e. you have services/SomeService/index.js and someFeature/index.js
which depends in SomeService at initialisation. When you move someFeature/index.js to someFeature/subfolder/subfolder/index.js you don't have a
SomeService global initialized anymore.

Some can argue about Meteor.loaded callback. That's ok as long as service isn't use this callback too.

As a result, you don't structure your application as you want, but rather as you can.

That can be resolved with packages, but you don't want to move all your application-specific functionality in packages just to get load order,
besides, packaging system has it's own problems.

B. Globals and packages

How packages are being imported into your applications is the globals too.
Packages are supposed to have 'export' API that describes what globals would be imported in your app.

Sounds great, but let's look in details how it works.

First, you create package: you get some library, bundle it in dist.js like this:

```js
MyPackage = {/* your package API */};
```

and then, in `package.js`, you write something like `api.export('MyPackage', ['client'])` so it is being exported to client side.

So far so good, but wait a second, say you, what if I have a package that need to be built from modules with [webpack](http://webpack.github.io/) or [browserify](http://browserify.org/)?
Unfortunately you can't do it; you have to **include built dist.js in your repository**. For some it isn't a problem; but I personally distaste it.
So that doesn't lead to bit problems. Ok, just include it. It is your package. Wait, what? It isn't your package?
And package owners distaste including dist in their package too? Then just fork it and build it yourself. That's a good solution.
Except it wouldn't work.

And there's the reason - package managers like browserify and webpack packing built packages in [IFFE](http://en.wikipedia.org/wiki/Immediately-invoked_function_expression)
(Immediately invoked function expression). More simply put, it looks like this:

```js
(function(global){
    // assign stuff to 'global', works with AMD, Require, just window etc, but not with Meteor.
})(this);
```

Unfortunately, `MyPackage = {}` isn't the same thing as `this.MyPackage = {}` in package file.
In `this` case your `api.export` will export `undefined` instead of your package.
And I have a hack for this. Just don't export this variable in `api.use`, and you'll be fine (no idea why it works).
But seriously? That's pretty crucial infrastructure functionality and you're beyond 1.0 already.

As a bonus, if you have another globals that you want to depend on in your package, you don't have them in `this`. So you have to emulate `this` like

```js
var meteorHack = {packageIDependOn: packageIDependOn};
(function(global){
    // assign MyPackage to 'global', using packageIDependOn
})(meteorHack);
MyPackage = meteorHack.MyPackage;
```

You can argue that it is automatic build and you don't have to add some hacks manually. I don't like it too, but it how does it works right now.

Ok, we dealt with dist.js, included it with package.js in our fork and pull requested the library owner.

Now library owner has to decide, whether accept it or not. So things that have to be accepted:

- dist.js - that will increase repo size, will impose commit discipline (commit code first, then build) (or commit everything at once and have dirty commit history)

- package.js. So some guy that doesn't know Meteor have to accept
  some file named `package.js` and another users of this package will see it every time they look at source directory tree
  and wonder if it is some npm build custom script (what will be you first thought, implying you see already package.json?).
  Really, really confusing.

- mentioned above hack for dist.js

Well, you always can maintain your own fork and share it with community under your name. But today you work with MeteorJS, and tomorrow
you're hired on CometJS or PonyJS or WhateverJS project and you have to maintain your Meteor legacy packages.
Remembering to repackage them every time on new version and apply manual hacks to it.

So to summarise written above:

currently Meteor have oversimplified system on these levels:

- application programming (globals everywhere, or Template.instance() to get the template current instance from helper)

- package programming (globals again, and only `MyPackage = ...` working)

- documentation level (documentation and articles enforcing idea that Meteor is simple and pleasant to work with, and enforcing using 'easy' solutions like globals and global Session store)

This 'simplicity' gives you big problems when you want to do advanced things.

So I call this design helloworld-oriented, fit very well to attract young developers and especially fit well to attract near-programming management/startup owners
who already heard all this buzz about ten-million funding and about fullstack JS tendency.