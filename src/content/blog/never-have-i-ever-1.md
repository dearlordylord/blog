---
title: "Mindfulness in Typescript code branching. Exhaustiveness, pattern matching, and side effects. 1/2"
tags: programming, types, branching, typescript
description: In-depth analysis of if/else.
publication-date: 09/01/2024
opengraphImage: /static/blog/never-have-i-ever/ifelse-catdog-splash.png
opengraphImageAlt: Either / or
reading-time: 5
author: Igor Loskutov
social-media-url: https://github.com/dearlordylord
published: 2024-09-01T13:44:27Z
image-url: /static/ifelse-catdog-splash-2.png
company-title: Senior If/Else Architect
social-media-handle: ohdearlordylord
author-image: /static/core/img/img-team-037.png
---

<center>

# Mindfulness in Typescript code branching. Exhaustiveness, pattern matching, and side effects.

<big>

1/2: "Exhaustive absurd", Or how to if/else

</big>

*Written by Igor Loskutov. Originally published 2024-01-09 on the [Monadical blog](https://monadical.com/blog.html).*


</center>

> This is part one of two in our series about code branching in Typescript.
> The first post serves as an introduction to the topic and is intended to be entry-level. It shows useful techniques of how to improve branching safety with explicit exhaustiveness checks.

As developers, we probably all wrote our first **if/else** statement when we were just newborns (that is, 0-years-experienced newborns in the industry).

```ts
if (x > 5) {
  console.log('Greater than 5');
} else {
  console.log('Not greater than 5');
}
```

We proceeded with learning switch/case, and usually end here. "We're ready to hack The Next Facebook. Nobody can stop us now, not even our teamlead".

```ts
switch (x) {
  case 5:
    console.log('Five');
    break;
  case 6:
    console.log('Six');
    break;
  default:
    console.log('Not five or six');
}
```

![five, six and not](https://www.loskutoff.com/static/blog/never-have-i-ever/five-six-and-not.png)

Then we learn about OOP and inheritance, and that it also can provide branching:

```ts
class Animal {
  constructor(public name: string) {}
  makeSound(): string {
    return `${this.name} makes a sound.`;
  }
}

class Dog extends Animal {
  name = 'Dog';
  makeSound(): string {
    return `${this.name} barks.`;
  }
}

class Cat extends Animal {
  name = 'Cat';
  makeSound(): string {
    return `${this.name} meows.`;
  }
}

// see, no if/else or anything
const handleSound = (animal: Animal): string => animal.makeSound();

const dog = new Dog('Storm');
const cat = new Cat('Viper');

// "Storm barks."
handleSound(dog);
// "Viper meows."
handleSound(cat);

```

![Catdog](https://www.loskutoff.com/static/blog/never-have-i-ever/catdog.png)

> We can also invert the control of the above using visitor pattern (https://en.wikipedia.org/wiki/Visitor_pattern) which I'm to detail in the next post.

The most inquisitive of us all probably wondered how we can do more complex branching and encountered pattern matching in such languages as Haskell, Scala, OCaml and Rust:

```scala
def listMatch(lst: List[Int]): String = lst match {
  case Nil => "Empty list"
  case List(0, _, _) => "Starts with zero and has three elements"
  case List(x, y) if x == y => "Two identical elements"
  case _ => "Other"
}
```

But is there a deeper meaning to this syntax? And are there underlying intricacies we should be aware of?

![arrows](https://www.loskutoff.com/static/blog/never-have-i-ever/ifelse-vs-arrow.png)

In this brief article, I'll hopefully present a way of deeper thinking about code branching. I'll show how to improve type safety and composability of branching in Typescript.

## Why branch?

We need if/else or equivalents to do anything useful in classic programming. Without it, programs will be static and won't do much. Making programmatic decisions will be very hard. Most likely you'll map/reduce some data into some other data and that'll be it.

Assume that you want to send a notification to a user. A user may use different channels to receive notifications, and you want to dispatch properly:

- emails to an email APIs such as Sendgrid
- Slack to Slack APIs etc.

```ts
type Notification =
  | { type: 'email'; recipient: string; subject: string; body: string }
  | { type: 'sms'; phoneNumber: string; message: string }
  | { type: 'push'; deviceId: string; title: string; body: string }
  | { type: 'slack'; channelId: string; text: string }
```

You can handle it with a naive switch/case:

> I'm going to use "break" or "return" for switches everywhere in this post; we won't go into fallthrough logic.

```ts
function handleNotification(notification: Notification) {
  switch (notification.type) {
    case 'email':
      sendEmail(notification.recipient, notification.subject, notification.body);
      break;
    case 'sms':
      sendSMS(notification.phoneNumber, notification.message);
      break;
    case 'push':
      sendPushNotification(notification.deviceId, notification.title, notification.body);
      break;
    case 'slack':
      postToSlack(notification.channelId, notification.text);
      break;
  }
}
```

> The kind of type we match against (`Notification`) is called [discriminated union](https://www.typescriptlang.org/docs/handbook/typescript-in-5-minutes-func.html#discriminated-unions).

> This code has some potential issues I'll talk about later. The main point here is that it shows why we want to branch our code at all.

### Playing around with if/else

You also can rewrite the code above to if/else. That won't change much, it's just a bit more boilerplate in this case.

> if/else is much more powerful since you can give it any expression resulting in a boolean, e.g. `if (x > 5)`, whereas switch/case would only accept exact matches.

![if/else and switch? Same Picture!](https://www.loskutoff.com/static/blog/never-have-i-ever/same-picture.jpeg)
<p><i>Picture <a href="https://dev.to/sumusiriwardana/if-else-or-switch-case-which-one-to-pick-4p3h">source</a></i></p>

```ts
function handleNotification(notification: Notification) {
  if (notification.type === 'email') {
    sendEmail(notification.recipient, notification.subject, notification.body);
  } else if (notification.type === 'sms') {
    sendSMS(notification.phoneNumber, notification.message);
  } else if (notification.type === 'push') {
    sendPushNotification(notification.deviceId, notification.title, notification.body);
  } else if (notification.type === 'slack') {
    postToSlack(notification.channelId, notification.text);
  }
}
```

In both cases, Typescript figures out the shape of the notification object after the "type" field check. Additionally you won't be able to write something like `notification.type === 'GIBBERISH'` or `case('yes?')`; it will stop you.

A difference with switch/case is that if/else has more boilerplate, but also is more applicable to more general cases because it allows expressions (such as math comparison `x > 2`) in its "decision tree".

## Adding new cases

Now, time for the bad news. We want to add a new case like `{ type: 'discord'; channel: string; message: string }`. We add it to the union type definition but forget to add to `handleNotification` function.

`handleNotification` works for a week until we notice users aren't getting notified. They lose their money, the business goes down, marriages break up. All because we forgot to handle `type === 'discord'`.

![arrowhead miss](https://www.loskutoff.com/static/blog/never-have-i-ever/arrowhead-miss.png)

This is a recurring problem. Fortunately, there exists a solution already.

```ts
function absurd(x: never): never {
  throw new Error(`panic! not reachable: ${x}`);
}

function handleNotification(notification: Notification) {
  switch (notification.type) {
    // ... switch/case from handleNotification above and then ...
    default:
      absurd(notification.type);
  }
}
```

> This function is also called `assertNever` in [TS documentation](https://www.typescriptlang.org/docs/handbook/unions-and-intersections.html#union-exhaustiveness-checking). I'll stick to `absurd` because it's more fun.

How does it work? Each `case` (or `if/else`) Typescript narrows down the possible type of `notification.type`:

```ts
// here, notification.type is full 'email' | 'sms' | 'push' | 'slack' | 'discord'
switch (notification.type) {
  case 'email':
    break;
  // if we end with "default" clause here, notification.type would be 'sms' | 'push' | 'slack' | 'discord', so, with no 'email'
  case 'sms':
    break;
  // if we end with "default" clause here, notification.type would be 'push' | 'slack' | 'discord', so, with no 'email' or 'sms'
  case 'push':
    break;
  // if we end with "default" clause here, notification.type would be 'slack' | 'discord', so, with no 'email' or 'sms' or 'push'
  case 'slack':
    postToSlack(notification.channelId, notification.text);
    break;
  // finally, we're ending with "default" clause here, and so notification.type is 'discord', with no 'email' or 'sms' or 'push' or 'slack'
  default:
    absurd(notification.type);
}
```

But `absurd(notification.type)` expects `never` type! It won't allow anything else, yet we're trying to feed it 'discord' string literal.

And so it goes: compiler complains, you realize your code has a bug, you fix it **before** shipping to your users and not **after** (that is, unless you also wrote good tests.)

You fix it by adding another `case` clause:

```ts
function handleNotification(notification: Notification) {
  switch (notification.type) {
    // ...
    case 'discord':
      postToDiscord(notification.channelId, notification.message);
      break;
    // default: ...
  }
}
```

> What about more "type-free" comparisons like n > 5? Type narrowing doesn't apply here. You have to figure yourself whether you covered all cases or not.

### A peculiar case of "never"

![nevermore](https://www.loskutoff.com/static/blog/never-have-i-ever/nevermore.png)
<p><i>Artist: <a href="https://www.instagram.com/serytama.art/p/C59EwKrOQBR/">Serytama.art</a></i></p>

`never` is a very [special type](https://www.typescriptlang.org/docs/handbook/basic-types.html#never) in Typescript.

It's assignable to anything, which isn't very useful in our case, but is useful in more advanced cases.

But another property we can and do leverage: nothing can be assigned to `never`, except `never` itself.

So, the function `absurd` expects only `never` type.

```ts
function absurd(x: never): never {
  throw new Error(`panic! not reachable: ${x}`);
}
absurd('fizzbuzz'); // error: Argument of type '"fizzbuzz"' is not assignable to parameter of type 'never'.
```

When our `notification.type` above is checked, it narrows down gradually to lesser and lesser type, until only `discord` literal is left, and finally we narrow `discord` literal itself.

When nothing is left out of our poor `notification.type` type, only `never` remains.

There's one extra way to show that in code; with an (arguably ugly) ternary:

```ts
// some imaginary numeric "code"...
const code: number =
  notification.type/*'email' | 'sms' | 'push' | 'slack' | 'discord'*/ === 'email' ? 1 :
    notification.type/*'sms' | 'push' | 'slack' | 'discord'*/ === 'sms' ? 2 :
      notification.type/*'push' | 'slack' | 'discord'*/ === 'push' ? 3 :
        notification.type/*'slack' | 'discord'*/ === 'slack' ? 4 :
          notification.type/*'discord'*/ === 'discord' ? 5 :
            absurd(notification.type/*never*/);
````

Importantly, when `never`-typed values in code, you can always assume this part of the code is unreachable, assuming your typing has no bugs. In Typescript, it may happen e.g. because of casting with `as`. That's why I accompany the `never` check in `absurd` with a `throw`. Better safe than sorry.

### Object key mapping

There's another technique to map behaviours that's worth mentioning. It lets us (in some cases) avoid the need for `switch/case`, `if/else`, and still have exhaustive behaviour without using any `absurd` hacks.

```ts
export const handlers = {
  email: (notification: Notification & {type: 'email'}) => sendEmail(notification.recipient, notification.subject, notification.body),
  sms: (notification: Notification & {type: 'sms'}) => sendSMS(notification.phoneNumber, notification.message),
  push: (notification: Notification & {type: 'push'}) => sendPushNotification(notification.deviceId, notification.title, notification.body),
  slack: (notification: Notification & {type: 'slack'}) => postToSlack(notification.channelId, notification.text),
  discord: (notification: Notification & {type: 'discord'}) => postToDiscord(notification.channelId, notification.message),
};
// ...
const notification: Notification = {type: 'email', recipient: 'igor@loskutoff.com', subject: 'hello', body: 'world'};
handlers[notification.type](notification);
```

Note `& {type: 'email'}` in the argument type. It would narrow down the type of `notification`, opening up the fields `receipient`, `subject` and `body` to be used in the handler. Same with `sms` and `push` and `slack` and `discord`.

With `handlers`, you won't be able to write a new type of notifications without adding a new handler, which is the main benefit of this technique.

Dead code elimination works here as well: if you remove one of the handlers, its `& {type: }` won't compile anymore, inviting you to remove the corresponding case as well, same as with `switch/case` or `if/else`.

The most common sentiment against this technique I encounter is that it introduces a layer of indirection. I say indeed it does, as any separation of concerns technique. I also argue that separation of concerns objectively brings more benefits than a thin (it's language-level!) layer of indirection.

### Eslint rule

Honorary mention to [switch-exhaustiveness-check](https://typescript-eslint.io/rules/switch-exhaustiveness-check/), which while not a "typescript"-native solution, is still good enough to preserve exhaustiveness for switch/case.

It's a ESlint rule that enforces exhaustiveness of enums and union types.

## Never have I ever...

In this post, I've introduced the concept of exhaustiveness checking and explored some of the ways to branch in Typescript.

These tools alone, used properly, will drastically improve your type safety and save you from many runtime bugs.

I haven't talked about return types yet; i'll save that for the follow up.

In that post I'll also talk about more advanced notions, such as pattern matching with ts-pattern and in other languages, expressions and side effects, IIFE, discriminated unions and algebraic data types (spoiler: we used the latter two in the examples above), and what they do in OOP to achieve the same goal (spoiler: Visitor Pattern).

I'll also present a case that in most situations, we won't need the `absurd`-like function call at all, even if you don't explicitly declare return type.


