(function(){
	var cardContainer = $('card-container')
		, cardSlider = window.cardSlider = Hammer($('card-slider'), { 
			prevent_default: true 
			, drag_block_vertical: false
			, drag_lock_to_axis: true
		})
		, slider = cardSlider.element
		, posX = 0, prevPosX = 0
		, isTransitioning = false;
		
		cardSlider.on('touch drag dragend release swipe', function(evt){
			var gesture = evt.gesture;

			switch (evt.type) {
				case 'touch':
					removeTransition(slider);
					break;

				case 'drag':
					posX = gesture.deltaX + prevPosX;
					translateX(slider, posX);
					break;

				case 'release':
					var totalWidth = cardVm.containerWidth() - (cardVm.totalCards() * cardVm.cardWidth);

					if (posX > 0) {
						posX = 0;
						addTransition(slider, true);
						translateX(slider, posX);
					}

					if (posX < totalWidth) {
						posX = totalWidth;
						addTransition(slider, true);
						translateX(slider, posX);
					}

					prevPosX = posX;
					break;

				case 'dragend':
					if (gesture.velocityX >= cardSlider.options.swipe_velocity && gesture.deltaTime <= 200) return;
					cardVm.cards.valueHasMutated();
					break;

				case 'swipe':
					if (gesture.deltaTime > 200) return;

					addTransition(slider);

					var multiplier = gesture.direction === 'left' ? -cardContainer.offsetWidth : cardContainer.offsetWidth;
					posX = ((multiplier * Math.min(6, gesture.velocityX)) + prevPosX);
					translateX(slider, posX);
					prevPosX = posX;
					break;
			}
		});

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

	// Add active to cards
	var cardFullWidth = 0;

	function CardViewModel() {
		var self = this;
		window.addEvent('resize', function(){
			self.containerWidth(cardContainer.offsetWidth);
		});

		this.loaderUrl = "public/img/loader.gif";
		this.cards = ko.observableArray(window.cards);
		this.containerWidth = ko.observable(cardContainer.offsetWidth);
		this.startIdx = ko.observable(0);
		this.endIdx = ko.observable(1);
		this.scrollType = ko.observable('event');

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

		this.cardImageUrl = function(card, idx) {
			var active = this.isActive(card, idx());

			return active ? card.categoryImageUrl : this.loaderUrl;
		};
	}

	var cardVm = window.cardVm = new CardViewModel();

	ko.applyBindings(cardVm);

	function translateX(el, posX) {
		el.style.webkitTransform = 'translate3d('+posX+'px, 0, 0)';
	}
}());