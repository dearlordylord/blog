---
title: "Mandelbugs and Heisenbugs as attention distractors. Chekhov guns you can't unsee"
---

A post about human code? In 2026?

But don’t worry, it all still applicable to AI 

Also, no token suffered in vain while writing this post. I put them all to good use.

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

There’s a bug. A bug that's almost impossible to reproduce. A bug that we don't really care about.

## Mandelbugs we don't even care about

```ts
let currentValue = 0

function handleMessage(message: { value: number }) {
  currentValue = message.value
}
```

If, during websocket reconnection, it happens that the payload is still being read, then older callback would modify the state it isn't supposed to modify anymore.

The bug is, in fact, so dormant that you’re pretty sure it won’t never happen. I reproduced it with a payload of 64mb and with aggressive CPU throttling.

Is it even a bug then? 

Something could happen only when the users’ laptop it at certain temperature and elevation* 

(fun thing, a real elevation-related group of bugs happened to my HDD laptop while I travelled in Tibet) (which was later stolen on a city bus in Khimki, Russia, which event prompted me to learn to code)

Мы можем просто забить на этот баг. KPI не пострадает. На самом деле, только улучшится. Мы не тратили на него время и ментальную энергию (называемую в народе “внимание”).

Что я хочу сказать в первую очередь, так это то, что в системах этот баг, как правило, не один. Их много таких сидит. Дело даже не в том, что они друг друга умножают. Они могут быть ортогональны. 

Проблема их в том, что с ростом интуиции и опыта, я однажды начал их видеть.

## "We have such sights to show you," or "Chekhov guns you can't unsee."

Стало ли легче от того, что такие проблемы в коде никогда не выстреливают, как дефектные Чеховские ружья?

Здесь я хочу доказать, что нет, не легче. Ты иногда натыкаешься на этот мусор. Видишь что вот этот процесс может сломать состояние. 

Ещё больше натыкаешься когда пытаешься решить реальный баг. Это очевидно, почему: наш мозг настроен в такие моменты на поиски corner-cases. Кстати возможно LLM это тоже отвлекает, притягивая на себя ненужные нейронные связи.

Багов много, ты один, мысли о corner cases забивают контекст и мешают думать о более серьезных вещах.

TODO reference to mandelbug/heisenbug classification https://guanpingxiao.github.io/publications/ISSRE17.pdf

A PR with a fix could look like this:

```ts
let ws = null;
let connectionId = 0;

function connect() {
  const myId = ++connectionId;    
  ws = new WebSocket(url);

  ws.onmessage = (event) => {
    if (event.data instanceof Blob) {
      event.data.arrayBuffer().then((buf) => {
        if (myId !== connectionId) return;   // ignore (or handle somehow differently), a newer connection has since taken over
        const decoded = decode(buf);
        handleMessage(decoded);
      });
    }
  };
  ws.onclose = () => setTimeout(connect, 0);
}
```

Not every project’s decision-maker would accept such a PR. This PR solves nothing. That's a real conundrum. A pickle, if you will.

But I would. I argue that it's very good to have a fix here. Not for the sake of fixing the bug, but because it makes code more readable.

More readable how, you ask me. It adds lines that would never be reached. "It adds complexity"

## "It adds complexity"

But does it? Complexity was already there. Never present in runtime, but there in the model of the world that the reader builds in their head.

And the reader (hopefully) sees corner cases and invalid states and the control flow that leads to data corruption. 

That's our job. It's always been our job. 

We see more lines on the file, but the **meaning** was always there. Whether you describe it with lines or pretend it doesn't exist.

"This execution can lead to data corruption" is what I read in the example above. 

If I see that it's handled in code, I can let it go, trust the code, and move on with my task or bug investigation.

If I see it's not handled, I have to get distracted and remember that "this code is all right". (not that I still don't ask myself "is it really all right?")

As a result, NOT handling the mandelbug is an externality. It is a mental load pushed off as a tax on my decision-making process.

Externalities are good in the short-term. They are always someone else's problem in the long-term. They become attention span hog if not handled.

## Good habits

Ok, even if not everything is that obvious with the websocket example, let's move towards the "usefulness" on this spectrum.

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

We immediately catch that at least on PR review:

```ts
let latestSearch = 0

async function search(query: string) {
  const startedBy = ++latestSearch
  const results = await fetchResults(query)
  if (startedBy !== latestSearch) return
  showResults(results)
}
```

Not that it's what you'll exactly have in production code, but you get the idea. There's no doubt we handle **that** type of race condition.

But how we decide which race conditions to handle and which to ignore?

I'd argue we just handle them all indiscriminately. 

That's another opportunity to reduce the cognitive load. Instead of **deciding** which race conditions to handle, we can **externalize** to having a good habit of handling them all.

This way we also won't forget to do it when it really matters. Discipline it a good thing isn't it.

## Modeling processes

There's another question of organising this computation. A guard approach like the ones above works but isn't always self-evident and expressive enough.

We can do better with a "capacity-restricted" callback approach, or a reducer (event-based) approach (which is always tantamount to a state machine), or Effect.ts idiomatic approach.

Which is nice, but I feel like it would be too much of a context switch in this post. So, I'll follow up with an "implementation" post a bit later.

## Conclusion

Although it is usually argued that fixing "code that already works" isn't a good idea, in this post I present an alternative point of view on the problem.

We have such overlooked externalities as unnecessary mental load and decision branching in race condition handling.

Those externalities are rarely minded during code review, sometimes yielding priority to the instant gratification of false "simplification". 

Making existing complexity explicit can never be a bad thing, as long as it occupies its proper abstraction level in the system. 

I'll follow up with those specifics next time.