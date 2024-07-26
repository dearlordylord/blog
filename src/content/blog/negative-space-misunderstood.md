---
title: "Negative Space Programming: it's not bad, it's just misunderstood"
tags: programming, types
description: A positive rant on typing
publication-date: 07/25/2024
opengraphImage: /static/blog/negative-space-misunderstood/Always-Has-Been.png
reading-time: 5
author: Igor Loskutov
social-media-url: https://github.com/dearlordylord
published: 2024-07-25T13:44:27Z
---

# Reject Negative Space, be happy

Negative Space programming is a new term for an old concept that has managed to captivate the industry’s attention thanks to recent popularisation by certain influencers.

It’s a very cool name indeed:

> There’s a term in drawing called [“negative space”](https://en.wikipedia.org/wiki/Negative_space). The idea is very simple: you don’t draw what’s there – you draw what’s *not* there.[^1]

But I feel it has become gravely misunderstood. I’ll show that most of this “negativity” can and should be brought back to the light, and it’s not too difficult to archive.

# Parse, Don’t, Validate

![Scooby unmask](https://www.loskutoff.com/static/blog/negative-space-misunderstood/scooby.png)

Negative Space is [understood](https://double-trouble.dev/post/negativ-space-programming/) as assertions of function arguments like:

```typescript=
function calculateArea(width: number, height: number) {  
  assert(width > 0);  
  assert(height > 0);  
  return width * height;  
}  
```

> The examples will be in Typescript, just because I’m very hands-on with it. However, the practices here could apply to any compiled language. It could’ve been your favourite Rust, for all I care; I just wanted to finish this writing in one evening.

It looks nice and reasonable until we get another bunch of functions that expect width/height:

```typescript=

function stretch(widthOrHeight: number) {  
  assert(widthOrHeight > 0);  
  return widthOrHeight * 2;  
}

function heighten(height: number) {  
  assert(height > 0);  
  return height * 2;  
}

function widen(width: number) {  
  assert(width > 0);  
  return width * 2;  
}

```

You can imagine that it becomes pretty bothersome to check it every time! You indeed need a lot of discipline in your team to maintain this practice. Still, this example is just a basic one; it becomes much more intricate when you have more complex structures.

There’s in fact a term for this. It’s called Shotgun Parsing and was coined a while ago by a Haskell enthusiast [Lexi Lambda](https://lexi-lambda.github.io/blog/2019/11/05/parse-don-t-validate/) .

> Shotgun parsing is a programming antipattern whereby parsing and input-validating code is mixed with and spread across processing code—throwing a cloud of checks at the input, and hoping, without any systematic justification, that one or another would catch all the “bad” cases.

Ok, there must be a way out of here, I hear you saying.   
There is, come with me.

# Run/Compile-time boundary

When we want to tell a String from a Number, it’s usually pretty clear.   
A function `calculateArea` from the examples above won’t allow itself to be called like

```typescript=  
calculateArea("100", "200")  
```

Unless you’re not using a language with no type checks (I assume you don’t, otherwise, why are you reading this).

So, we can clearly tell the difference between “100” and 100, there’s no ambiguity in that, and the compiler agrees.

Now, things are not so obvious when we compare a negative and a positive value, e.g. -1 and 1 (if we’re using ints that many languages provide) or if we compare, e.g. 2 and 3.14, which Typescript allows you to do. What is the context of comparison? Do we care about the values being negative or “float-y”?

Apparently, for the function `calculateArea`, there IS a difference. Negative values are just not in the function domain! And floats not always, too, although that depends on your application’s purpose only.

I call this ambiguity boundary between runtime and compile-time. They often move case-by-case, taking more “compile-time” space or more “runtime” space.

In some sense, the example

```typescript=  
function calculateArea(width: number, height: number) {  
  assert(width > 0);  
  assert(height > 0);  
  return width * height;  
}  
```

Reminds me

```typescript=  
function calculateArea(width: any, height: any) {  
  assert(typeof width === 'number');  
  assert(typeof height === 'number');  
  assert(width > 0);  
  assert(height > 0);  
  return width * height;  
}  
```

I just see the same picture, it’s just that the boundary is fully moved towards runtime.

# How can it be instead?

One word: **newtypes**. Actually, a second word: **branded types**.

```typescript=

function calculateArea(width: Width, height: Height): Area {  
  // ...   
}

```

That’s it. I’d have said “Bye,” but you deserve more elaboration.

I argue that when you have a number (or int, or uint) in your app, it’s probably not the right abstraction. It doesn’t tell what this value means, only how it’s stored. There’s a [great article](https://ybogomolov.me/primitives-were-a-mistake) that expands on it. You most likely want meaningful types closer to the goal you want to archive.

You most likely can archive this result in your language. E.g. in Typescript, it can be done with one of the [advanced codecs libraries](https://github.com/effect-ts/effect/tree/main/packages/schema) (a post on them’all is coming soon) or even manually.

The point is that you can move your boundary closer to the compile-time and train your compiler to help you avoid mistakes *and* strongly document your code at the same time.

With this technique you also avoid most of the “Negative State” programming, it just becomes outsourced to the calling code/validation wrappers.

# How should it be instead?

![imagination sponge bob](https://www.loskutoff.com/static/blog/negative-space-misunderstood/imagination.jpg)

Taking the approach one step further, you sometimes can archive this:

```typescript=  
const w: Width = 100;  
const h: Height = 200;  
const w2: Width = w * 2; // scalar multiplication is possible  
const w3: Width = w + h; // compile-time error  
const w4: Width = w - w2; // result is negative: error or not? Compile time or runtime?  
const area = calculateArea(w, h); // square meter  
const area2 = area * area; // quadruple meter? Doesn’t make sense! Compile-time error  
```

Unfortunately, not with any language you can do it without damaging your DevEx. [I tried that with Newtypes](https://www.loskutoff.com/blog/graph-property-based/) in Typescript; it was horrible. Branded types work much better but also much weaker (e.g. you can multiply Area by Area).

That’s where Negative Space shines. If your language makes your typing work difficult, assert away. The point is, **use Negative Space programming when it’s really necessary**. It is a powerful tool, that comes with responsibilities.

That's it. Stay positive (with less negative spaces), safe (from runtime errors) and happy (with what your programming language allows you to do).

[^1]:  [https://alfasin.com/2017/12/21/negative-space-and-how-does-it-apply-to-coding/](https://alfasin.com/2017/12/21/negative-space-and-how-does-it-apply-to-coding/) 