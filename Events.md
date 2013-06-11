# Touch events

There are a number of considerations regarding touch events. As usual, my approach was to find something lightweight, native, and highly tested. The obvious choice for me was [Hammer.js](http://eightmedia.github.io/hammer.js/).  Additionally, there are some event-based MooTools implementations that are useful. For example, we implemented a `transitionEnd` snippet to detect cross-browser CSS3 `transitionEnd` events.

## Points about Hammer.js

- Lightweight (~2.5kb min/gz)
- Native code (no dependencies)
- Mature (284 commits over a year and half) / 1.0+ release
- Actively developed and popular (> 4k stars on Github)
- Broad support (iOS 4, 5, 6 / Android 2, 3, 4+, Windows Phone, Window 8, etc.)
- Multi-touch (pinch, transform, rotate)
- Event normalization
- Lots of useful event data:
  - Velocity (x/y)
  - Delta (x/y)
  - Touches (Array)
  - Angle
  - Direction
  - Scale
  - Rotation
  - Several more
- Nice syntax
- MIT License


## Syntax

```javascript
// Create a hammer instance
var hBody = Hammer(document.body);

// Add generic drag event
hBody.on('drag', function(event) {
  // event object has a new gesture object
  console.log('Dragging ' + event.gesture.direction);
});
// Remove drag event
hBody.off('drag');
// Trigger drag event
hBody.trigger('drag');
```

That's almost the full story here.  Besides a couple dozen useful options that can optionally be passed to `Hammer` instances, Hammer revolves around events, and it's API is dead simple and familiar to anyone who has worked with JavaScript DOM events. Event objects themselves look the same, but have the `event.gesture` object which has the useful touch stuff from Hammer.

## Important Lessons

The decision to use Hammer was easily the simplest part of this research. There were a number of important take-aways from creating the functional prototype.  Below is a list of some of them.

#### Event delegation

Hammer supports event delegation via `event.target`.  For a more complex app, event delegation is a great way to minimize event handlers and page overhead.  That said, there is also a significant benefit to be had from using Hammer's instance options to limit the scope of the events of that instance. For example, you could limit an instance to horizontal drag events with a certain threshold for activation without having to include the boilerplate to check for these via deltas, direction, etc. in each event handler.

I believe that a worthwhile effort for engineering a common paradigm for handling events via delegation, but also utilizing a common set instance options for common event types would bring worthwhile value to writing complex touch events.  My personal philosophy is that in endeavoring such an effort, emphasis be placed on simplicity and concision over micro-optimizations.  Particularly, I am not suggesting a single event handler approach.

Even a couple dozen event handlers is plenty performant, and we can take advantage of the syntax benefits of having different instances with specific options. The key is to be prudent.  Don't put an event handler on all the list items of a repeater when you can place one on the list itself and then listen for the list items.

#### A simple API for handling CSS3 animations

While this doesn't apply to touch events themselves, it's the next logical step.  After all, events exist so you can express behavior through user input.  There is only one real way to create smooth animations, transformations, and movement on mobile is using CSS3-based animations/transitions.  The step-based animation we have used for our desktop experience for long is worse than useless: The result is often just as jerky as an non-animated toggle, but incurs a browser-blocking delay while the animation steps are executed.

There are tons of considerations regarding CSS3 transitions/animations, and I think a more thorough treatment of the subject would be valuable.  Here's a few things to consider:

- Cross-browser support.  Right now we're only looking at WebKit mobile browsers, but in the future we may need to support more. We should write code that normalizes the differences.
- Generating CSS3 animations in JavaScript dynamically. This example used a simple transition class, tied to the `transitionEnd` event.
- Choosing to use CSS3 animations (aka keyframe animations) vs. transitions. While transitions are simple, keyframe animations are more powerful and are supported fully by browsers that also support transitions. As of now we don't employ any CSS3 animations (only transitions).
- Establishing best practices for jutter-free animations.  I sent out [this link](http://www.youtube.com/watch?v=n8ep4leoN9A) but I believe only Boki watched it.  We don't even come close to analyzing and optimizing paint and render performance now.  The good news about this is that we have lots of low-hanging fruit.
- Consider creating a common programmatic animation paradigm that is simple and has step-based fallbacks for less enlightened browsers that do not support CSS3 animations (IE9). Again, let's keep it simple.

#### There are many things you haven't thought about

Finally, what we learned is that there are many things that likely haven't been considered when creating interesting touch behavior tied to animations/transitions. Looking at the code, you can see we have to consider things like:

- Viewport resizing
- Keeping track of the position of elements to determine their behavior
- If we use `translate` and `translate3d` as we should, we'll need a way to parse these properties reliably to determine positioning (rather than using DOM-based measurement)
- Enabling / disabling events based on context.  If I set a drag event on an item and move it on that event, I need to make sure that text inputs inside that element are excluded, otherwise text won't be selectable.

This initial experiment was created using lots of closures to liberally access scopes. The challenge of all these interdependant pieces is going to be creating components that are well-structured and encapsulated without resorting to the crazy callback hell that our current codebase exihibits. We must be vigilant here.