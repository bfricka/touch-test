# Mobile Lazy Loading

## Overview

This was an extremely informative research project. The established goal was to investigate the feasibility and efficacy of lazily loading page components in the CPU / resource-contstrained mobile environment with the aim of improving speed and experience.  While it's clear that there is much more to learn, I believe we have established a reasonable baseline from which to base future endeavors into building performant mobile experiences in the front-end technologies we leverage.

## Philosophies employed and gleaned

First, we looked elsewhere for inspiration, for example LinkedIn has a **[good article](http://engineering.linkedin.com/linkedin-ipad-5-techniques-smooth-infinite-scrolling-html5)** on this altough the context is not identical. We went into this with a number of tenets in mind:

- Speed is the number one priority.
- Everything must justify its cost.  Thus optimizations must improve speed or experience in the most common cases.
- All computational must either be deferred until transition end, or must be extremely fast.
- Employ cascading returns based on estimated conditional probability where possible.
- Do not try to engineer a polished result:
  - The aim is to test the limits of the technology and frameworks, not to write spectacular code.
  - Get it working, polish it, iterate.
- Limit / defer painting at all costs.
- Measure painting and analyze animation timelines to look for weak spots.

These tenets served us well, by keeping us focused on the important pieces without getting mired in details like structure, SOC, modularity, etc., that had little bearing on the actual aims of the project.  In writing our code in such an utterly different manner from our current coding practice, I believe we picked up some valuable unintentional insights as well.

Some of the bits learned from the exercise:

- KnockoutJS has some very real deficiencies when it comes to fine-grained control. See KnockoutJS below for examples. Using KnockoutJS in a "traditional" way to perform fine-grained and efficient optimizations and behaviors seems next to impossible without significant cognitive and structural overhead.
- Hammer.js is excellent. Even compared to native browser scrolling, it is preferable when done correctly.  However, due to Knockout's deficiencies, interacting with view-models via the outside requires either fighting with the cranky interface or a much looser coding structure (frequently employing closures to share data).
- Touch events are complex `:-)`. Some of the many things we had to consider:
    - Managing seamless transition between swipe and drag events.
    - Adding seamless transitions to swipe events, removing them appropriately, firing off all the appropriate in between, and doing it all fast.
    - Balancing the blocking of native events (preventDefault) such as scroll while maintaining a smooth experience.  For example without blocking scroll events on the slider, the page will move around when dragging and swiping. However, completely blocking the scroll event on the slider itself makes the page impossible to scroll.  It required some polish to get this balanced correctly.
    - Rarely did optimizations pay for themselves.  Part of this is due to the difficulty of talking to view-models from the "outside", as the desire to write declarative views means following a certain Knockout syntax pattern; A pattern in which it is difficult to manage individual scopes and therefore target specific changes. This meant that we had to: 1. trigger view-model changes manually (which itself is very confusingly implemented). 2. Use binding syntax and inefficiently calculate properties on each element (slide). 3. Use Hacks. 4. Go outside Knockout for DOM-stuff (which we avoided).
    - Deferring computation works, but it's tricky. Deferring expensive computation until transition end so as not to incur painting costs while transitioning is effective, but difficult to corridinate, and requires some creativity.

## Lazy-loading techniques

There are a few ways to interpret "lazy-loading", but in this context, we assumed it mean:

1. Ability to load AJAX content performantly into mobile view-models 
2. Ability to defer and dynamically load images and data that would otherwise slow down rendering.

In other words keep things fast.

## KnockoutJS

For example there isn't a good avenue for custom DOM interaction.  We have seen this thus far in production code with the terribly tempramental (and frankly hackish) ellipsification code. In fact there are only two methods of gaining access to the element and neither provide anything close to the ideal interface: 

- There is no clear way to asynchronously update a binding. (Or control the timing of its execution / rendering).