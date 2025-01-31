---
title: "Born to be legacy, or MeteorJS: fractal of helloworld-oriented design"
legacyDate: 2015-04-16 00:00:15 +0700
tags: meteorjs, roast
publication-date: 04/26/2023
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

UPD: original comments were hosted on disqus; I moved from it a while ago. There's the comments dump below.

```xml
<?xml version="1.0" encoding="utf-8"?>
<disqus xmlns="http://disqus.com" xmlns:dsq="http://disqus.com/disqus-internals" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:schemaLocation="http://disqus.com/api/schemas/1.0/disqus.xsd http://disqus.com/api/schemas/1.0/disqus-internals.xsd">
    <category dsq:id="2973741">
        <forum>firfiblog</forum>
        <title>General</title>
        <isDefault>true</isDefault>
    </category>
    <thread dsq:id="3685617534">
        <id>http://loskutoff.com/blog/meteorjs-born-to-be-legacy/</id>
        <forum>firfiblog</forum>
        <category dsq:id="2973741" />
        <link>http://loskutoff.com/blog/meteorjs-born-to-be-legacy/</link>
        <title>Born to Be Legacy, or MeteorJS: Fractal of Helloworld-oriented Design - firfiBlog</title>
        <message />
        <createdAt>2015-04-16T05:55:21Z</createdAt>
        <author>
            <name>firfi</name>
            <isAnonymous>false</isAnonymous>
            <username>firfi</username>
        </author>
        <isClosed>false</isClosed>
        <isDeleted>false</isDeleted>
    </thread>
    <post dsq:id="1970249805">
        <id />
        <message><![CDATA[<p>I am one of the developers of Meteor.</p><p>Overall, I might say, that all points here are well deserved - Meteor has problems in some design decisions. I do want to comment with what is going on in Meteor Core to fix these.</p><p>A. Session variables: these are global variables, preserved on Hot Code Push. They are designed to be something that is global for the user, as a set of settings of your text-editor are global for the session, or the set of your toolbars hidden in Photoshop is preserved only for this project. Session variables are the wrong way to manage your reactive variables, they are really bad at this.</p><p>What has Meteor Core done?</p><p>Sessions are discouraged. The official [tutorial](<a href="https://www.meteor.com/try" rel="nofollow noopener" title="https://www.meteor.com/try">https://www.meteor.com/try</a> ) uses Sessions only to store one variable that *actually* is something that should be in Session - do you want to hide the list of done tasks.</p><p>What to use instead?</p><p>You can use [ReactiveVars](<a href="http://docs.meteor.com/#/full/reactivevar" rel="nofollow noopener" title="http://docs.meteor.com/#/full/reactivevar">http://docs.meteor.com/#/fu...</a> ) or in the future, [Template local state](<a href="https://github.com/meteor/meteor/pull/3561" rel="nofollow noopener" title="https://github.com/meteor/meteor/pull/3561">https://github.com/meteor/m...</a> ) baked into the templating language.</p><p>B. The packaging system is different. It has good sides (sharing files between client/server, an API to plug into the unified build system), bad parts (difference from the commonjs modules, overuse of globals, coupling of many different features to the package format).</p><p>To be fair: in 2012, I don't think the world has caught up on what users pray today: webpack and browserify. Bower still cannot resolve conflicts automatically, npm still loads 10 copies of one module. ES6 modules were not on the rise as they are right now.</p><p>I do believe we can have a bright future with the ES6 modules and a better dependencies resolution.</p><p>(the fact that `this` in Browserify and Webpack means something different is an irrelevant complaint IMO)</p><p>There are good points on what Meteor can work in this blogpost, but the language to express it is too cynical for my taste.</p>]]></message>
        <createdAt>2015-04-16T07:34:11Z</createdAt>
        <isDeleted>false</isDeleted>
        <isSpam>false</isSpam>
        <author>
            <name>imslavko</name>
            <isAnonymous>false</isAnonymous>
            <username>imslavko</username>
        </author>
        <thread dsq:id="3685617534" />
    </post>
    <post dsq:id="1970472394">
        <id />
        <message><![CDATA[<p>@imslavko:disqus, thanks you very much for you feedback and sorry that I had to use such article style; the whole point of this was to attract attention to described problems that I didn't got in github/stackoverflow. I'll change the article style soon. <br>However, I still consider 'this' issue very relevant. It makes porting packages to Meteor painful and that harm not just me (I cope with this problem well) but for Meteor infrastructure. You just lose a huge subset of community-written packages because of that.<br>Maybe I don't understand something here, and 'this' is irrelevant indeed. If it isn't, can you elaborate it little more?</p>]]></message>
        <createdAt>2015-04-16T11:47:46Z</createdAt>
        <isDeleted>false</isDeleted>
        <isSpam>false</isSpam>
        <author>
            <name>firfi</name>
            <isAnonymous>false</isAnonymous>
            <username>firfi</username>
        </author>
        <thread dsq:id="3685617534" />
        <parent dsq:id="1970249805" />
    </post>
    <post dsq:id="1971077534">
        <id />
        <message><![CDATA[<p>I think that the packaging for Meteor already requires changes to the original repository, and coping with "this" can be worked around.</p><p>There are plenty of other formats of the packages, amdjs, systemjs, commonjs, etc. They all would require some processing to adapt the code from one system to another (unless I am that clueless about them and they just happen to work well with each other). I do agree, that standardizing on the package format is important, but I think it will be achieved with ES6 modules, until then there are always will be differences like this here and there.</p><p>By "irrelevant", I meant that it is just a small detail of the whole problem of "Meteor's package format is so different from everyone else". That is the main point, `this` is just a detail that as well could be something else.</p>]]></message>
        <createdAt>2015-04-16T17:46:50Z</createdAt>
        <isDeleted>false</isDeleted>
        <isSpam>false</isSpam>
        <author>
            <name>imslavko</name>
            <isAnonymous>false</isAnonymous>
            <username>imslavko</username>
        </author>
        <thread dsq:id="3685617534" />
        <parent dsq:id="1970472394" />
    </post>
    <post dsq:id="1972139771">
        <id />
        <message><![CDATA[<p>I have created a package to solve the loading order and globals problem:<br><a href="https://github.com/meteorflux/reactive-dependency/" rel="nofollow noopener" title="https://github.com/meteorflux/reactive-dependency/">https://github.com/meteorfl...</a><br>It adds dependency injection as well.</p><p>Let me know what you think !</p>]]></message>
        <createdAt>2015-04-17T07:27:56Z</createdAt>
        <isDeleted>false</isDeleted>
        <isSpam>false</isSpam>
        <author>
            <name>Luis Herranz</name>
            <isAnonymous>false</isAnonymous>
            <username>luisherranz</username>
        </author>
        <thread dsq:id="3685617534" />
    </post>
    <post dsq:id="1972438352">
        <id />
        <message><![CDATA[<p>Great work! Currently I do something like this [without packages] with Q's promises. Still, it looks rather dirty, and your solution can mean less code. I just hope to have something like that (and with same API) for backend and frontend both (though it currently impossible with Tracker)</p>]]></message>
        <createdAt>2015-04-17T12:45:25Z</createdAt>
        <isDeleted>false</isDeleted>
        <isSpam>false</isSpam>
        <author>
            <name>firfi</name>
            <isAnonymous>false</isAnonymous>
            <username>firfi</username>
        </author>
        <thread dsq:id="3685617534" />
        <parent dsq:id="1972139771" />
    </post>
    <post dsq:id="1972440255">
        <id />
        <message><![CDATA[<p>I'll bring here my comment from <a href="http://crater.io" rel="nofollow noopener" title="crater.io">crater.io</a> (<a href="https://crater.io/posts/pAY62qQxNjkmGhxDR/comment/LSgo6ZZxZS8a92WFf):" rel="nofollow noopener" title="https://crater.io/posts/pAY62qQxNjkmGhxDR/comment/LSgo6ZZxZS8a92WFf):">https://crater.io/posts/pAY...</a></p><p>Thanks a lot for commentators feedback. I appreciate it very much. It was exactly what I was trying to archive - shed a light on really important problems of Meteor, and obtain an estimation of their resolving progress. I could've done it on StackOverflow, in Meteor IRC channel or in github, and I did, but these problems didn't meet enough (somewhere nothing at all) attention. So whole reason of sarcastic style of the text and of title was to get it at last.</p><p>However, I didn't wanted and still doesn't want to personally offend anyone and watched myself while writing it, so all complaints I had are directed towards architecture.</p><p>As @Slave Kim pointed out in blog comments, some of the problems are resolved, so I'll describe it soon, editing the article. Thanks @Slava for your feedback.</p><p>I can't agree with @amitkenny, as code really isn't so simple underneath and prepares a trap for those who doesn't understand it's bowels.</p><p>That doesn't mean that I drop the platform in a rage. I'm ok with things as they are for myself as I have enough knowledge to make it work (and I'll share it).</p><p>What concerns me is that these things are hard for new programmers who wish to do things 'better' from the start. I'm speaking about concrete example - substitution of Blaze to React. Presently React has a lot of great libs packed with webpack/browserify, really well-written ones and well-tested. New programmers want to use it - and don't find it in Atmosphere, and stick with custom solutions (here, not necessary solutions would be react-based, I'm talking about just a tendency in general), then bring it as their own, very often not so well-written libs, then drop their maintaining. And another programmers find those and lost their time to filter out not maintained ones.</p><p>So I really hope Meteor developers would find a solution to gather it all together.</p><p>Currently I ported several React libs (great tcomb/tcomb-validator/tcomb-form ones, griddle, baconjs, react-bootstrap) to Atmosphere and I'm concerned that there's too much to maintain and looking for, as I don't want to stop with it and port another libraries.</p><p>So well-working [with webpack/browserify] packaging system would be a great help for me and for community.</p>]]></message>
        <createdAt>2015-04-17T12:46:50Z</createdAt>
        <isDeleted>false</isDeleted>
        <isSpam>false</isSpam>
        <author>
            <name>firfi</name>
            <isAnonymous>false</isAnonymous>
            <username>firfi</username>
        </author>
        <thread dsq:id="3685617534" />
    </post>
</disqus>

```