(function(){
	var cardContainer = $('card-container')
		, slider = $('card-slider')
		, posX = 0, prevPosX = 0
		, isTransitioning = false
		// The deltaTime that classifies a swipe
		, swipeTime = 300
		, prevSwipeTimestamp = 0

		, cardSlider = window.cardSlider = Hammer(slider, { drag_lock_to_axis: true });

		// Note: change to only handle dragRight / dragLeft for drag events (and remove block on vertical scrolling)

		cardSlider.on('touch dragright dragleft dragend release swipe', function(evt){
			var gesture = evt.gesture;

			switch (evt.type) {
				case 'touch':
					removeTransition(slider);
					break;

				case 'dragright':
				case 'dragleft':
					evt.preventDefault();
					// Allow for drag events to record the a timestamp when gesture velocity is reached
					// The scenario that this affects is surprisingly common in my testing: When you start dragging
					// content quickly (gesture velocity reached) and then abruptly stop and release some time later,
					// a swipe event still fires (since it only cares about end velocity). We had to block this for
					// obvious reasons (needless transition). However, another common scenario is to drag quickly and then
					// stop on a piece of content without releasing, examine it for a minute, and then swipe the content
					// forward. Since we blocked this before based on timestamp, we need to register the timestamp of the
					// last drag event that reached swipe velocity. Then we can get the behavior we want:
					// Drag fast -> Stop for an arbitrary period -> swipe forward again.
					if (isSwipe(gesture)) prevSwipeTimestamp = gesture.timestamp;

					posX = gesture.deltaX + prevPosX;
					translateX(slider, posX);
					break;

				case 'release':
					var totalWidth = cardVm.containerWidth() - (cardVm.totalCards() * cardVm.cardWidth);

					// > 0 means before the beginning. Snap back.
					if (posX > 0) posX = 0;

					// Snap back to end if past end
					if (posX < totalWidth) posX = totalWidth;

					prevPosX = posX;

					addTransition(slider, true);
					translateX(slider, posX);
					break;

				case 'dragend':
					// Don't update value if we it's a swipe event
					if (isSwipe(gesture)) return;
					cardVm.cards.valueHasMutated();
					break;

				case 'swipe':
					evt.preventDefault();
					if (prevSwipeTimestamp - gesture.timestamp > swipeTime) return;

					addTransition(slider);

					var multiplier = gesture.direction === 'left' ? -cardContainer.offsetWidth : cardContainer.offsetWidth;
					posX = ((multiplier * Math.min(6, gesture.velocityX)) + prevPosX);
					translateX(slider, posX);
					prevPosX = posX;
					break;
			}
		});

	function isSwipe(gesture) {
		return gesture.velocityX >= cardSlider.options.swipe_velocity && gesture.deltaTime <= swipeTime ? true : false;
	}

	function addTransition(el, slow) {
		isTransitioning = true;
		var duration = slow ? "300ms" : "600ms";
		el.style.webkitTransitionDuration = duration;
	}

	function removeTransition(el) {
		isTransitioning = false;
		el.style.webkitTransitionDuration = "0";
	}

	slider.addEvent('transitionend', function() {
		removeTransition(slider);
		cardVm.cards.valueHasMutated();
	});

	var cardFullWidth = 0;

	function CardViewModel() {
		var self = this;

		window.addEvent('resize', function(){
			self.containerWidth(cardContainer.offsetWidth);
		});

		this.cards = ko.observableArray(window.cards);
		this.endIdx = ko.observable(1);
		this.startIdx = ko.observable(0);
		this.scrollType = ko.observable('event');
		this.containerWidth = ko.observable(cardContainer.offsetWidth);

		this.totalCards = function() { return this.cards().length; };

		this.totalVisibleCards = function() {
			return Math.floor(this.containerWidth() / this.cardWidth);
		};

		this.toggleScrollText = function() {
			var scrollType = this.scrollType();
			return scrollType.charAt(0).toUpperCase() + scrollType.slice(1);
		};

		this.toggleScrollType = function() {
			var scrollType = this.scrollType();

			if (scrollType === 'event') {
				scrollType = 'overflow';
				cardSlider.enable(false);
			} else {
				scrollType = 'event';
				cardSlider.enable(true);
			}

			this.scrollType(scrollType);
		};

		this.getCardInfo = function(el) {
			if (!this.cardWidth) {
				this.cardWidth = el.offsetWidth + parseFloat(el.getComputedStyle('margin-right'));
			}

			var total = this.totalVisibleCards()
				, startIdx = -Math.ceil(posX / this.cardWidth)
				, endIdx = startIdx + total;

			this.startIdx(startIdx);
			this.endIdx(endIdx > this.totalCards() ? this.totalCards() : endIdx);

			return this.cardWidth;
		};

		this.goBack = function() {
			if (posX === 0) return;
			addTransition(slider);
			prevPosX = posX = 0;
			translateX(slider, posX);
		};

		this.isActive = function(card, idx) {
			if (card.active) return true;
			card.active = (idx >= this.startIdx() && idx <= this.endIdx()) ? true : false;

			return card.active;
		};

		this.cardBgImage = function(card, idx) {
			var active = this.isActive(card, idx());
			return active ? 'url('+card.categoryImageUrl+')' : 'none';
		};
	}

	var cardVm = window.cardVm = new CardViewModel();

	ko.applyBindings(cardVm);

	// Todo: create x-browser transition / transform prefix getter.
	function translateX(el, posX) {
		el.style.webkitTransform = 'translate3d('+posX+'px, 0, 0)';
	}
}());