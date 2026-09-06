---
title: "Mandelbugs and Heisenbugs as attention distractors"
subtitle: "Chekhov guns you can't unsee"
---

A post about human code? In 2026?

But don’t worry, it’s all still applicable to AI.

Also, no token suffered in vain while I was writing this post. I put them all to good use.

```ts
function connect() {
  const socket = new WebSocket(url)

  socket.onmessage = async ({ data }: MessageEvent<Blob>) => {
    const message = decode(await data.arrayBuffer())
    handleMessage(message)
  }

  socket.onclose = () => setTimeout(connect, 0)
}
```

There’s code with some async interaction. It fires promises, .then()s or awaits their results, bada-bing, bada-boom, and shows the user the correct result.

There’s a bug. A bug that's almost impossible to reproduce.[^bug-classification] A bug that we don't really care about.

## Mandelbugs we don't even care about

```ts
let currentValue = 0

function handleMessage(message: { value: number }) {
  currentValue = message.value
}
```

A message arrives. We start reading its payload with `await data.arrayBuffer()`. Meanwhile, the connection drops and we reconnect. The new connection delivers a newer value. Then the old callback finishes reading its payload and overwrites that value with an older one.

Nothing throws. We just quietly go backwards.

The bug is, in fact, so dormant that you’re pretty sure it will never happen. I reproduced it with a payload of 64 MB and with aggressive CPU throttling.

Is it even a bug then?

Something could happen only when the user’s laptop is at a certain temperature and elevation.

(fun thing, a real [elevation-related](https://www.seagate.com/gb/en/support/kb/what-is-the-maximum-altitude-at-which-a-seagate-hard-drive-will-function-205031en/) group of bugs happened to my HDD laptop while I travelled in Tibet) (which was later stolen on a city bus in Khimki, Russia. That’s what prompted me to learn to code, believe it or not.)

<img src="/static/blog/mandelbugs/tibet-mountain-landscape.jpg" alt="An earthen structure on a rocky plain beneath mountains in Tibet" width="1600" height="1050" loading="lazy" decoding="async" />

We can just say screw it and ignore this bug. The KPI won’t suffer. In fact, it’ll only get better. We won’t spend time or mental energy on it.

This bug usually isn’t alone in a system. There are lots of them sitting there. It’s not even about them multiplying each other. They can be orthogonal.

The problem is that, as my intuition and experience grew, one day I started seeing them.

## "We have such sights to show you," or "Chekhov guns you can't unsee."

Does it make things any easier that these problems in the code never go off, like defective Chekhov guns?[^chekhov]

Here I want to argue that no, it doesn’t. You stumble over this junk every now and then. You see that this process right here can corrupt the state.

You stumble over it even more when trying to fix an actual bug. It’s obvious why: our brains are tuned to look for corner cases at those moments. By the way, maybe this distracts LLMs too, pulling in unnecessary neural connections.

There are many bugs and only one you. Whether they depend on obscure timing or disappear when you try to investigate, they still take up space in your head. Thoughts about corner cases clog up the context and get in the way of thinking about more serious things.

A PR with a fix could look like this:

```ts
let connectionId = 0

function connect() {
  const myId = ++connectionId
  const socket = new WebSocket(url)

  socket.onmessage = async ({ data }: MessageEvent<Blob>) => {
    const message = decode(await data.arrayBuffer())
    if (myId !== connectionId) return
    handleMessage(message)
  }

  socket.onclose = () => setTimeout(connect, 0)
}
```

Not every project’s decision-maker would accept such a PR. “This PR solves nothing.” That's a real conundrum. A pickle, if you will.

But I would accept it. I argue that it's very good to have a fix here. Not for the sake of fixing the bug, but because it makes code more readable.

“More readable how?” you ask me. It adds a check for something that almost never happens. "It adds complexity."

## "It adds complexity"

But does it? Complexity was already there. Almost never visible at runtime, but there in the model of the world that the reader builds in their head.

And the reader (hopefully) sees corner cases and invalid states and the control flow that leads to data corruption.

That's our job. It's always been our job.

We see more lines in the file, but the **meaning** was always there. Whether you describe it with lines or pretend it doesn't exist.

"This execution can lead to data corruption" is what I read in the original example.

If I see that it's handled in code, I can let it go, trust the code, and move on with my task or bug investigation.

If I see it's not handled, I get distracted and have to remind myself that “this code is all right”. (not that I still don't ask myself "is it really all right?")

As a result, NOT handling the Mandelbug is an externality. It is a mental load pushed off as a tax on my decision-making process.

Ignoring these bugs saves us effort in the short term. Someone else pays with their attention later.

## Good habits

Ok, even if not everything is that obvious with the WebSocket example, let's look at a more obvious race condition on the "spectrum of usefulness".

```ts
async function search(query: string) {
  const results = await fetchResults(query)
  showResults(results)
}

// Type "ca":  request A starts.
// Type "cat": request B starts while A is still pending.
// B returns:  showResults(resultsForCat).
// A returns:  showResults(resultsForCa).
```

It's quite obvious that this code has a race condition. It also compiles just fine.

We catch that during PR review, if not sooner:

```ts
let latestSearch = 0

async function search(query: string) {
  const startedBy = ++latestSearch
  const results = await fetchResults(query)
  if (startedBy !== latestSearch) return
  showResults(results)
}
```

Not that it's exactly what you'll have in production code, but you get the idea. There's no doubt we handle **that** type of race condition.

But how do we decide which race conditions to handle and which to ignore?

I'd argue we just handle them all indiscriminately.

That's another opportunity to reduce the cognitive load. Instead of **deciding** which race conditions to handle, we can make handling them all a **habit**.

This way we also won't forget to do it when it really matters. Discipline is a good thing, isn't it?

## Modeling processes

There's also the question of how to organise this computation. A guard approach like the ones above works but isn't always self-evident and expressive enough.

We can do better with a reducer (event-based) approach or an idiomatic Effect.ts approach.

Which is nice, but I feel like it would be too much of a context switch in this post. So, I'll follow up with an "implementation" post a bit later.

## Conclusion

Fixing “code that already works” can still be worth it.

Unnecessary mental load and repeatedly deciding which race conditions to handle are costs we tend to overlook.

Those externalities are rarely considered during code review. Instead, we get the instant gratification of false “simplification”.

Making existing complexity explicit helps the reader, as long as it occupies its proper abstraction level in the system.

[^bug-classification]: A Bohrbug is straightforward to reproduce. A Mandelbug makes things complicated: timing, the environment, or the order of operations can decide whether it shows up. Heisenbugs are the elusive, intermittently reproducible bugs treated as a subset of Mandelbugs in [Xiao et al.’s classification](https://guanpingxiao.github.io/publications/ISSRE17.pdf) (Section II).

[^chekhov]: Chekhov’s gun is a storytelling principle: if you put a gun on the wall early in a story, it should go off later. A detail you draw attention to should have a purpose.
