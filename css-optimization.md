# Mobile CSS Optmization

## Overview

First, one of the suggested avenues of investigation--potentially loading stylesheets asyncronously--is not at all feasible.  This is due to the certainty of producing a FUC (flash of unstyled content) before the new stylesheet resolves.  This is why stylesheets are always synchronous and modern HTML5 specs include an `async` attribute for scripts but not for stylesheets.

The next avenue of investigation is to potentially break stylesheets down and serve them conditionally based on the views or components that they apply to.  This would include a "shared" stylesheet that deals with common, site-wide styling, and a series of componentized stylesheets serving specific areas of the site.  This is the avenue I will explore in this review and weigh out some of the pros and cons.

## Does CSS performance matter?

The first question we need to answer in our research is, when it comes to mobile rendering performance, "Does CSS performance actually matter"?  The answer to this question is complicated, but from what we found, the answer is almost ubiquitously "yes" in all but the most sparsely populated layouts.

### Concepts

There are two main concepts that happen to matter when it comes to CSS performance.  We're going to exclude HTTP request time since we'll assume that files will end up being cached (although with lots of requests this could become an issue).  The two main performance areas that matter are selector parsing and painting, which I go into more detail about below.

###Selector Parsing

This is the time it takes for the browser to parse all the stylesheets, break them into a rule set, and scan the HTML for selector matches.  To test the impact of selector performance, I used Chrome's CSS selector profiling via ADB bridge on my Nexus 4.  

**Twitter Bootstrap Extreme Test**

As a test of selector parsing time, I loaded Twitter Bootstrap's [Base CSS](http://twitter.github.io/bootstrap/base-css.html) page, because it includes the whole Bootstrap CSS framework CSS (~100KB minified), along with matching selectors for the majority of the base styles in the framework.  

This is a worst case scenario, as even large Bootstrap projects are hopefully not silly enough to include the whole framework (as opposed to using only the components they require).  Unmatched selectors still carry a heavy cost, as I saw several unmatched selectors contribute significantly to parse times (after all, the searching still has to occur).  However, matching selectors contributed significantly more, and there are likely few mobile sites in existence that would have this many matching selectors.

**Results**

Selector profiling on this extreme test showed that selector performance matters a great deal.  Times were pretty consistently around 1 second.

Main culprits for poor selector performance were basically what you would expect:

1. Attribute regexp selectors were the worst: `[class^="icon-"], [class*=" icon-"]`
2. Next worst were plain attribute selectors: `input[type="password"]`
3. Unqualified pseudo-selectors: `:focus` is like saying `*:focus`
4. Heavily matched selectors: `div`, `button, input`, etc.

Because of the extreme case that exists on this page, it's clear that selector performance can matter significantly, but what about on a more typical (even heavy) page?  Turns out there's a nice test for that: The home page.

**Twitter Bootstrap Simple Test**

This is an ideal test because the stylesheets are the same, but the number of matchers is reduced dramatically to a level that is more realistic (if not a bit low for common apps). If performance is significantly better here, then there is an empirical case for simply writing better CSS, and limiting the complexity of layouts.

**Results**

The results here were **drastically** different. An average parse time for this page merely ~55ms.  A parse speed this fast is not a significant performance impact.  All the culprits for performance impact were virtually the same as the first result: Regexp attributes came out on top, followed by unqualified pseudo-selectors.

**Selector Performance Conclusion**

In the context of this result, it seems obvious that, while CSS selector performance matters, it's not the size of the stylesheet that matters in large part.  It's the size of the document.  This makes perfect sense, since more DOM nodes means more searching for selector matches. The reason this is interesting and important is that it's not the number of potential matchers that matters most as one might conjecture, but the number of DOM elements that those matchers must compare against.

Clearly, a more complex set of rules means more matchers that each DOM element must be tested against, but it appears, as in JavaScript, that traversing a large, complex DOM tree is proportionally much worse than simply having lots of rules.

The main conclusion here is that if we write sane CSS (something we have historically had some trouble with but have become much better at), then the stylesheet itself shouldn't matter much.  Constructing layouts that are decidedly "app-like" (instead of long, complex "page-like" layouts) would do significantly more for CSS Selector performance than any sort of conditional stylesheet paradigm could even do.

### Painting Performance

The next relevant piece of CSS-related performance is painting performance.  The key thing to grasp here is that painting performance has nothing at all to do with the loading or parsing of stylesheets.  Even using a stylesheet where every single rule matches every single element exactly, and not a single extra matcher is parsed than is required, painting performance would be the same.

With that in mind, painting performance is a much more important aspect of performance than parsing performance.  It determines the speed and responsiveness of the layout.  The difference between 60fps liquid smooth page performance and a juttery disjointed experience is in the hardware performance of the device (which we can't control) and the CSS we write (which we can).

While much goes into painting speed, I'll try to cover some of the larger points.  I linked to a very informative video by Google on page rendering speed and performance in my touch event optimization write-up, but I'll provide it **[here](http://www.youtube.com/watch?v=n8ep4leoN9A)** as well.

In no particular order:

* `box-shadow`: The box shadow property is awesome, but it's also one of the most expensive in terms of rendering / painting speed (worse than `background-image` gradients, `border-radius`, etc.  I wouldn't advocate foregoing it completely as it's extremely effective and pleasing when used correctly; however, we should take care to use it sparingly.
* **Positioning transitions**: This relates to creating CSS3-based sliding effects.  A common practice when doing traditional step-based animation is to create a "slide" effect by animating a `position: absolute|relative` item's `top|right|bottom|left` properties.  This is a poor method for performance as each step in the animation requires a repaint.  The logical next step is to use CSS3 transitions to animate these properties instead, which does indeed improve performance dramatically.  However, it's still not optimal and does cause repaints, even though they are GPU accelerated.  The solution is to use `transform: translate3d(x, y, z)` instead.  This actually extracts the element to its own composite layer, which means that repaints are confined to within the element itself, and once the layer is painted it never gets repainted unless the contents change.  This means that slide (and other) animations never trigger repaints, and instead are sent directly to the GPU.
* **Scrolling**: Page scrolling and `overflow: scroll` causes repaints and is comparatively slow.  We proved this on the Lazy Loading research task.  We should consider using a `transform: translate3d` implementation for all scrolling.
* `position: fixed`: Position fixed elements should be used cautiously as they can trigger repaints.

**Painting Performance Conclusion**

Avoiding unnecessary repaints is key. We should be constructing our CSS using "Show Paint Rectangles", "Show Composite Layer Borders", and using Chrome's animation profiling to detect any unnecessary repaints and slow JavaScript calls.  Elements that consistently repaint (such as interval sliders), should be taken out of page context using the `translate3d` (or other "3D" property).

For more information see the video I linked to above as well as [this article](http://addyosmani.com/blog/devtools-visually-re-engineering-css-for-faster-paint-times/) for detailed information on this topic.

## Discussion

The results of this research task produced some fairly clear results, but the direction we chose to go is not completely clear.  In particular, we know that the majority of onus is going to fall on UX and front-end developers to create efficient layouts and excellent CSS best-practices, and to integrate CSS3 performance analysis into our mobile development workflow.

What is unclear is whether conditionally loading CSS stylesheets for specific areas of the will actually matter, and if it does matter, does the engineering cost justify the potential benefits.  For example to conditionally render stylesheets all pages will need to have knowledge of a "view type" in order to serve the proper stylesheets.  This will need to be coordinated from back-end controller to front-end.

Spending a few minutes (rather than a cursory thought) thinking through the implementation and maintenance of conditional stylehsheet paradigm seemed to us to have a fairly high cost.  My personal recommendation would be to do without it until it becomes a problem.  This put responsibility for good CSS and layouts squarely on the shoulders of those who design the concepts and write the code.  If we have excellent code and layouts and still have a good bit of room to improve, then a conditional-loading scheme could be entertained.