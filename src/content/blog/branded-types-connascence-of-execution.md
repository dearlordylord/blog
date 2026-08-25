---
title: "Branded Types and Connascence of Execution"
description: "Three TypeScript examples of replacing execution-order coupling with stronger domain types."
published: 2026-08-25T14:45:09Z
---
> In memory of [Jim Weirich](https://connascence.io/pages/about.html). I didn't know you, but your code smells great.

## Connascence of Execution

There's a great classification of design "smells" at [connascence.io](https://connascence.io).[^connascence-smells]

Here, I hope to bring it to the community's attention by combining it with my own experience through the prism of one specific code smell and how to battle it.

I'll argue that battling it is not just a question of personal preference, but offers a benefit-to-effort ratio too great to ignore.

The code smell in question is [Connascence of Execution](https://connascence.io/execution.html).

I think it has more value today than the GoF's work because it's more pertinent to the industry, especially in the context of generative programming. I think it's indeed greatly underappreciated and not widely known enough.

> Present day. Present time.

## 1. File

```ts
const file = new MutableFileHandle();

file.open();
file.close();
file.write("Hello");
```

Connascence of Execution is about the order of operations affecting the outcome of the program.

Imperative programmers like this very much. If we banned writing into a closed file, that would violate their freedoms.

But I think that restricting "what we can do" in fact gives us more freedom. 

Better-typed approach makes maintenance and refactoring much more affordable. Sometimes even seamless.

In our domain, closing is only valid after writing. Indeed, I won't open a file just to close it.

```ts
declare function openFile(file: ClosedFile): OpenFile;
declare function writeFile(file: OpenFile, contents: string): WrittenFile;
declare function closeFile(file: WrittenFile): CompletedFile;

const closed = fileAt(path);
const open = openFile(closed);
const written = writeFile(open, contents);
const completed = closeFile(written); // Our domain requires a write before closing.
```

```ts
const open = openFile(fileAt(path));
closeFile(open); // Compile-time error: OpenFile is not WrittenFile.
```

I think it's quite obvious, without explanation, that this API is much safer.

Unless a language can track those state transitions while preserving syntax like that of the first example.

```ts
file.open(); // changes type to "opened"
file.close(); // changes type to "closed"
file.write("Hello"); // fails compile-time
```

TypeScript cannot. [Rust can model such transitions explicitly with typestate](https://docs.rust-embedded.org/book/static-guarantees/typestate-programming.html). That's another story.

## 2. Physical calculation. Primitives.

Let me bring in another example to introduce how I suggest we should think about primitives.

I will try to show that the file code and the code below do, in fact, share very similar ideas underneath.

```ts
const mass = 10; // kg
const acceleration = 3; // m/s²
const externalForce = 5; // N

let force = mass * acceleration;
force += externalForce;

// 35 N
```

```ts
// Because every value is represented as a number, a careless refactor can keep running while destroying the dimensional meaning of the calculation.
let force = mass;

force += externalForce;
force *= acceleration;

// 45: changing the order mixed kg with N.
```

Ignoring the fact that we did `let force = mass;` to simplify the example, it is still a valid case of "we applied some procedure to something that we weren't supposed to apply it to."

In the context of my claim here,

```ts
force += externalForce;
force *= acceleration;
```

is equivalent to

```ts
file.close();
file.write("Hello");
```

### Make the wrong order impossible

And again, you can just make the values carry their meaning:

```ts
const mass = Kilograms.make(10);
const acceleration = MetresPerSecondSquared.make(3);
const externalForce = Newtons.make(5);

declare function multiplyMassByAcceleration(
  mass: Kilograms,
  acceleration: MetresPerSecondSquared,
): BaseForce;

declare function addExternalForce(
  baseForce: BaseForce,
  externalForce: Newtons,
): TotalForce;

const baseForce = multiplyMassByAcceleration(mass, acceleration);
const totalForce = addExternalForce(baseForce, externalForce);
```

```ts
addExternalForce(mass, externalForce);
// Compile-time error: Kilograms is not BaseForce.
```

### Branded types and Effect.ts

This example uses branded types. One implementation of the pattern is available in [Effect.ts](https://www.effect.website/docs/v4/code-style/branded-types).

> But Igor, this makes us type a lot of stuff.

Then ask your coding agent. I heard that "coding is solved"—I don't know about that, but "typing" is definitely solved.

I think the approach is extremely valuable but underappreciated. 
I believe that, in the near future, *not* using branded types for primitives will become akin to using `any`.

Right now, we type our objects, but somehow forget to type our primitives.

## 3. Email

The bigger idea has already been shown in 1 and 2, but nevertheless:

```ts
const email = new MutableEmail();

email.setRecipient("foo@example.com");
email.setSender("me@mydomain.com");
email.send();
email.setSubject("Hello World"); // Sometimes appears to work because of a race.
```

With a kind of builder pattern:

```ts
const ready = createEmail()
  .setSubject(subject)
  .setRecipient(recipient)
  .setSender(sender);

send(ready); // assuming here that we handle double-call properly, like with idempotency
```

```ts
const incomplete = createEmail()
  .setRecipient(recipient)
  .setSender(sender);

send(incomplete);
// Compile-time error: subject is missing.
```

I hope all of this is clear enough.

Stronger typing eliminates a whole class of bugs.

Not only bugs—readability issues too.
I can already hear someone saying that my "correct" code examples are wordier.
Well, readability is not only about symbols but about the mental strain involved in thinking about corner cases and data correctness, and proper typing handles that for you.
I think that's a good thing. Indeed, a very nice thing. A computer doing what it's supposed to do: helping you reason.

[^connascence-smells]: Not all connascence necessarily indicates a design smell or is inherently bad. In this post, however, I treat Connascence of Execution as an indicator of one.
