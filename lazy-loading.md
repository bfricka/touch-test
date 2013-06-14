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

In other words keep things fast.  That said, with mobile devices, latency is often more of a problem than throughput, especially considering that models are quite small.  The real savings is in deferring painting and HTTP requests for things like images.

We demonstrated a few techniques here to improve performance. 

### Loading only visible images

First, was to calculate boundaries for visible cards and only load images for the cards in view and a bit beyond.  This limits initial load by reducing the scope of painting, and staggering painting and HTTP requests.  Additionally, we chose not to update the view models until transition end events fire, so as not to incur paints or page-blocking operations while transitions or 3d translations are occurring.

### AJAX paging

I also added a very basic AJAX paging mechanism.  This loads new model data when the view slides to the end of its current data pool.  This was implemented very simply using a pseudo-request object that asychronously loads more data from a global array.  It could be polished much better, but demonstrates the feasibility nonetheless.

### DOM element removal

I took a stab at a basic implementation to remove DOM nodes beyond a certain threshold (say, 50 nodes ahead of the visible end index and 50 nodes before the visible start index).  I created a quick declarative version of this did not turn out be at all performant.  This is because of the default binding syntax of Knockout, along with working with collections.  A more fine-grained approach, while more difficult, would likely yield positive results when dealing with large collections (such as EPG).

## KnockoutJS

KnockoutJS has proved itself a bit painful when it comes to created more complex or fine-grained behavior. We have seen this thus far in production code with the terribly tempramental (and frankly hackish) ellipsification code. 

### DOM interaction deficiencies

For example there isn't a good avenue for custom DOM interaction. 

In fact there are only two methods of gaining access to the element and neither provide anything close to the ideal interface: 1. You can pass the `$element` into a function or writable computed.  This is not particularly useful because it executes the function immediately, and often you're looking for the element, not to calculate an immediate return value, but to use as a reference on that particular scope for other calculations.

We used a hack approach here where we tied the function we needed the element for to a dummy data attribute so that it would recalculate the function when we fired `valueHasMutated` on the observable array of slides.

The second method is to use a binding.  The syntax here is extremely useful in some circumstances, however, in other scenarios it is fails utterly as it fires its main update method based on an arbitrarily defined observable.  In cases when this observable is irrelevant or non-existent a "toggle" or other hack solution needs to be employed to trigger the update.  Custom bindings also have many drawbacks such as not being able to control order of execution and having a very limited interface.

### Triggering updates from the "outside"

Knockout also is clunky when it comes to triggering manual view-model updates due to the fact that one of two things must change in order for a `valueHasMutated` call to trigger an update correctly: Either the return value of a view binding or an observable must change.  Because Knockout requires working with observable functions and thus doesn't allow working with POJOs, this means either wrestling something simple into an observable, or triggering a dummy observable or data-binding.

This is a distinct disadvantage IMO of KnockoutJS vs the dirty-checking approach of AngularJS, which is both far more efficient and easier to work with.  However, Knockout in particular makes this difficult, frameworks other than AngularJS allow much better control over triggering updates, even though all the rest (to my knowledge) work via getters/setters.

### Alternative coding style

One of the things that I didn't anticipate was how much easier it was to work with KnockoutJS when following the less strict coding pattern adopted for the purposes of this research exercise.  Extensively using closures and shared scope references made cutting through some of the stubborness of the interfaces much easier.

I am of the opinion that using the classic MooTools class pattern for this type of development is wasteful and inefficient.  We scarcely use inheritance as it is, and use classes as more of a structural tool to acheive the JavaScript module pattern with a few more features and significantly more overhead and complexity.

In my opinion this style of coding is going to be unacceptable when it comes to developing mobile applications.  On a broader note, I think our implementations of this pattern should be completely rethought or discarded.

### Final note on KnockoutJS

With the above said, it's clear to me that we would be much better off using AngularJS to develop our mobile applications.  AngularJS has abstractions, interfaces, and tools to cleanly and succinctly solve all the headache points encountered with this research endeavor.

Additionally all the counterpoints brought up against AngularJS in our recent framework shooutout fall flat in the context of new mobile work.  In particular, arguments of having an inconsistent codebase and coding patterns is wholly irrelevant here, as it's clear to me that writing code the way we currently do is not going to be feasible--in terms of efficiency/productivity as well as performance and overhead--when it comes to writing mobile applications.

While Knockout is clearly capable of performing well in the mobile space, it's deficiencies almost necessitate different coding patterns.  And frankly, these patterns have yet to be established.  The framework provides no structuring help, and thus we would have to have to agree upon conventions to follow.

As it is clearly inferior to AngularJS, I would prefer we skip that engineering challenge and use something that will allow us to focus on building apps rather than filling in gaps or spending significant time thinking about structure. Thus far we have written 17 bindings or extensions of Knockout, and of these many are filling in obvious gaps in the framework itself.  I don't consider that a success.

## Conclusions

In conclusion, much was gleaned from this exercise.  The main objective I believe was clearly met, which was to use various techniques to produce something that smoothly handles lots of data/elements.  Using CSS3 3D transforms hooks directly into the GPU and provides a very smooth experience even on mobile devices, and deferring computationally heavy operations and painting allows for this to remain smooth.

Hammer.js works well and gives us quite a bit of useful information and available patterns to deal with the complexity of multi-touch events.  That said, touch events are tricky.  However, I believe with practice we'll be able to master this domain of knowledge and produce useful components that keep us from having to repeat the same sorts of operations for everything.

Finally, KnockoutJS got in the way, as it has been prone to do. My personal opinion would be to drop it for our mobile development.  At the very least, it's clear that we'll have to change our approach.