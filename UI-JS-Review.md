# Front-end JS code review

First, let me start by saying that this is a huge undertaking, and a thorough review would be utterly impossible in the allotted time.  With a codebase over 24,000 lines long, spread over 202 files (NES src only), there simply wasn't time to do a truly in-depth review.

That said, our codebase is clearly in need of some help.  We did our best to try to boil down a few key points and offer suggestions where possible.

## Major Anti-patterns and Bad Practices

### Call Stack Hell

This is a result of using too many classes with zero inheritence and not using static methods, dependency injection, or other techniques for sharing generic objects.

For example, to get entitlement information in Entitlement.js, the following call stack occurs. Keep in mind that this is used once throughout the site:

```javascript
// Entitlement.js line 17
var userEntitlement = Uverse.page.getUserEntitlement().hash;

// PageControl.js (Uverse.page) line 205
, getUserEntitlement: function() {
	return this.personalization.getUserEntitlement();
}

// Personalization.js line 58
, getUserEntitlement: function() {
	return this.userData.getUserEntitlement();
}

// Finally in Personalization.js on line 183 (userData instance):
, getUserEntitlement: function() {
	return this.entitlementPackages;
}
```
A few points here: 

- `Uverse.page.getUserEntitlement` is called exactly once throughout the whole site, and that is in Entitlement.js
- The method call to `Uverse.page` is a single line that does nothing but call another method in Personalization.js, which, itself does nothing but call a different method.
- Nothing is transformed and no actions are taken along the way. It's a useless call stack that makes code very painful to debug.
- `Uverse.PageControl` is a class that only has once instance and is never extended.  In other words it should be static. The same is true for `Uverse.utils.Personalization` and MANY other pieces of code.
- This sort of thing is littered throughout our site and it does nothing but convolute and bloat our code, making it brittle and hard to debug.  In addition, this sort of code is going to be extremely difficult / impossible to unit test.

### Arbitrary Decisions and Inconsistency

While inconsistency in choices and implementations is always going to exist even within a single-person project, let alone a large, multi-person, multi-year project, there are certain philosophies that should be standardized to promote readability and simplicity.  This is a large problem throughout our code, but I think it's important to make it clear that this applies to on a high-level to very common implementations. The goal, in my mind is for our code be able to answer a set of philosophical questions that we define for our project, not for specific implementations to be homogenous.  We don't want to stifle innovation or micro-manage.

With that preface out of the way, here are some inconsistencies and arbitrary decisions that reduce the quality of our codebase and would likely benefit from refactoring:

- Inconsistencies with using `Callbacks`, `MemoryEvents`, or call chains. There is no consistent use case for any of these ways of connecting chains of logic.  It seems that the choice for this comes down to developer's whims rather than a set of defined use cases.  Personally, I think callbacks are a serious pain point, but what is really troublesome is how arbitrarily we seem to use these constructs. What we should do is define the problem we are trying to solve with these and come up with a consistent solution that is simple and readable.

- Code needs to be more modularized and better namespaced.
	- Modularization: We have far too many interdependencies and long chains of logic (for no apparent purpose). Tons of functions that *only* call other functions. Most components are required to "know" too much.  Very brittle and convoluted. Difficult to unit test. It seems like our definition of "modular" is really "spatially separated code instances".  However, our code is almost *less* modular.  Modular should, IMHO, mean "independent and easily unit testable, with a single well-defined purpose".
	- Namespacing: We rigidly implement the "class" when it isn't necessarily appropriate. Should have more static methods. Should use less deeply nested namespacing conventions. Many classes that have only a single instance and are never extended. We should use the right pattern for the right job.  Use a static module pattern for most things that aren't "class-like" objects. Don't so strictly structure code for no particular reason. Use JavaScript's exceptionally flexible syntax to solve problems.

- Random try/catch and throw new Error, but not consistent.  We should be better about error checking and handling, or at least be consistent.

- No real concept or philosophy delineating what a certain pieces of high-level code do.  For example, we often have a "Tile.Controller", "Tile.Helper", "Tile.Manager", "Tile.Utils" etc. and there is no clear indication of what each one is responsible for. It's seemingly arbitrary. We follow nothing even resembling an MVC pattern. This is by far one of the largest failures throughout our codebase, IMO.  It's not a particular philosophy that matters, but the fact that we should have one.  While on a team level, I think we all generally understand these ideas, there is no defined set of tenets that we can use to unify our vision of where the app is heading.  This leads to code that is bloated, complex, and often brittle, as it often evolves from a simple idea into monster as solutions get bolted on.

### Documentation

We should adopt a more strict code policy of commenting methods and classes. At the very least, we should find and agree upon a consistent commenting syntax, preferably one that can be compiled to create full codebase documentation.  Examples include YUIDoc and JSDoc3.

I find that this would be particularly beneficial for us as we have quite an extensive assortment of useful utilities, classes, and MooTools implementations that have been constructed by the talented individuals here but that aren't easily searchable and aren't uniformly documented. 

I believe that better documentation would point out areas where we can reuse code, would encourage the use of more static, reusable methods, and would help identify code that is redundant or poorly implemented (by casting a light on it).

### Too many globals

We should be wrapping our code in a self-invoking anonymous function to locally scope app-level variables other than the Uverse namespace.

Instead of:

```javascript
// Callbacks.js
window.Callbacks = new Class({ /*...*/ });
```

Our whole app is wrapped and everything top-level (within the app) is just a variable. This allows better aliasing and minification, the use of shared references and closures (none of which we employ to any significant extent), and doesn't pollute the global namespace:

```javascript
// Main
window.Uverse = {};
(function(win, doc, uv){
	var Callbacks = new Class({ /*...*/ });
	// Exposing external and using aliases internally:
	var widgetButton = uv.widgets.Button = new Class({ /*...*/ });
}(window, document, Uverse));
```

### Inconsistent use of `Array.each` / `Object.each`

Some places we use prototypal instance methods and other times we use static MooTools method. Should standardize.  Nearly every app or project I have seen in JavaScript has an internal iterator that is used throughout. For example:

Instead of:

```javascript
[1, 2, 3].each(function(num), { return 2 * num; });
```

Use:

```javascript
Array.each([1, 2, 3], function(num) { return 2 * num; });
```

Better yet, by wrapping our codebase in a self-invoking anonymous function, we could alias common utilities.  There's no reason to namespace them. Thus:

```javascript
// Define once
var each = Array.each;
// Then use throughout
each([1, 2, 3], function(num) { return 2 * num; });
```

### `MemoryEvents` Implementation

For `MemoryEvents` there's no reason to use a `class`.  This is true for much of the site, as mentioned.  In this case it would be *much* simpler to use a well-patterned `EventEmitter`, such as [this implementation](https://github.com/Wolfy87/EventEmitter) modeled after the Node.js EventEmitter.

Example:

```javascript
// Create a button that emits events
uv.Button = new Class({
	Extends: EventEmitter
	initialize: function(el) {
		el.addEvent('click', function(ev) {
			var result = doSomething();
			this.emit('somethingHappened', result);
		}.bind(this));
	}
});

// Subscribe to button events
uv.myWidget = new Class({
	initialize: function(el) {
		this.btn = new uv.Button(el);
		this.btn.on('somethingHappened', doSomethingWithResult.bind(this));

		function doSomethingWithResult(result) {
			console.log(result);
		}
	}
});
```

### Additional Notes from me and Halderman

**PageControl.js**

- `Uverse.PageControl` is getting complex and handling too much.
- Rather than functions with a single line that call another function which is a single line which calls another... just call the end function directly where needed. Another case for static methods.
- isUserLoggedIn and isLoggedIn are redundant
- line 368, 380: instantiation of a class not stored in a variable. Could this be a static method or something, rather than a class, and instance not returned.  Perfect example of cases where "Class" isn't required or useful.  Bad pattern.
- line 139: private function which isn't called in this class, but is called by other classes. Why even use MooTools' Class implementation if we aren't checking this?  Every instance method called has to pass through that horrific MooTools private/protected check (muddying our debugging considerably), and yet we don't implement anything to actually take advantage of this feature.  It only serves to get in our way. We should either use this check, or remove it from the source code completely.
- Overall this whole "class" is a poor pattern IMO.

**Loader.js**

This whole thing might be rethought. It is hard for me to see the justification for many of the decisions made. If we really need a loader, we should consider simplifying considerably, or using a better thought-out module system like [require.js](http://requirejs.org/)

- line 134: what is the point of this function? Couldn't the constructor just be called instead?

**Personalization.js**

- 3 classes in one file
- Most functions are a single line which call another function (and these functions are often called in a function which is a single line)

**BaseControl.js**

- No initialize method to take care of parent-level setup logic.
- Duplicate code in controls that extend base that should be handled by parent
- Duplicate callbacks in controls which could be setup and called by parent

**List.js**

- line 46, 50: List of elements should be cached as to not call getElements every time the list is needed, which is fairly often

**ScrollBar.js**

- line 137: a function named returnFalse which just returns false...

**BookmarkAPI.js**

- lines 78 & 87: calling a function on page which calls a function in personzalization which calls yet another function. STAHP!
- Why is the BookmarkAPI calling a method on Uverse.page in order to set a bookmarks, as opposed just handling bookmarks itself. Encapsulation? Why would the Bookmarks API be required to tell the Page to tell personalization to set a bookmark?? BookmarksAPI should know about bookmarks, personalization should know about personalization.  If the BookmarkAPI needs personalization stuff, then it asks Personalization for personalization stuff.  And visa versa.  We should abolish over-proxying our code, work toward true encapsulation.

**NotificationAPI.js**

- line 7: this variable is not used
- lines 20 & 24: calling private function in another class

**DvrAPI.js**

- has options but doesn't implement Options nor take options as an argument to initialize

## Summary

That's a very brief overview of what we found in a limited period of time.  I'm sure everyone on our team has ideas of how we could improve our codebase. The key, in my mind, is to develop some core, high-level tenets that we all abide by. Specific implementations aren't the concern, as long as they can pass through the filter of our team and project philosophies.