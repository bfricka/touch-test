# Viewport Detection

We looked at JS-based solutions, such as enquire.js, and also considered other ways of detecting viewport changes or media query break-points.  We ended up coming to the conclusion that JS should never actually care about specific widths or orientations.  While there may be instances where we need to get more data or detect dimensions dynamically, this can easily be accomplished with conventional methods.

The [example page](http://brian-frichette.github.io/touch-test/viewport) shows a simple resize event that fires and detects the orientation based on the window width / height ratio. Resize the window until portrait is achieved and the text changes.

Measurement is how we do things such as knowing how much data to request on the current EPG, and thus tying this to a resize event allows us to request more data if dimensions change.