(function(){
	var cardContainer = $('card-container')
		, cardSlider = window.cardSlider = Hammer($('card-slider'), { 
			prevent_default: true 
			, drag_block_vertical: false
			, drag_lock_to_axis: true
		})
		, slider = cardSlider.element
		, posX = 0, prevPosX = 0;

	cardSlider.on('drag release swipe', function(evt){
		var gesture = evt.gesture;

		switch (evt.type) {
			case 'drag':
				slider.removeClass('slider-transition');
				slider.removeClass('swipe-transition');
				posX = gesture.deltaX + prevPosX;
				translateX(slider, posX);
				break;

			case 'release':
				var totalWidth = cardVm.windowWidth() - (cardVm.totalCards() * cardVm.cardWidth);

				if (posX > 0) {
					posX = 0;
					slider.addClass('swipe-transition');
					translateX(slider, posX);
				}

				if (posX < totalWidth) {
					posX = totalWidth;
					slider.addClass('swipe-transition');
					translateX(slider, posX);
				}

				prevPosX = posX;

				cardVm.cards.valueHasMutated();
				break;

			case 'swipe':
				slider.addClass('slide-transition');
				var multiplier = (gesture.deltaX / cardContainer.offsetWidth);
				multiplier = (gesture.direction === 'right' ? 1 + multiplier : multiplier - 1) * cardContainer.offsetWidth;
				posX = ((multiplier * Math.max(1, Math.min(4, gesture.velocityX))) + prevPosX);
				translateX(slider, posX);
				prevPosX = posX;
				break;
		}
	});

	slider.addEvent('transitionend', function() {
		slider.removeClass('slide-transition');
		slider.removeClass('swipe-transition');
		cardSlider.trigger('release', {});
	});

	// Add active to cards
	window.cards.forEach(function(card){ card.active = false; });
	var cardFullWidth = 0;

	function CardViewModel() {
		var self = this;
		window.addEvent('resize', function(){
			self.windowWidth(cardContainer.offsetWidth);
		});

		this.loaderUrl = "public/img/loader.gif";
		this.cards = ko.observableArray(window.cards);
		this.windowWidth = ko.observable(cardContainer.offsetWidth);
		this.startIdx = ko.observable(0);
		this.endIdx = ko.observable(1);

		this.totalCards = function() { return this.cards().length; };

		this.totalVisibleCards = function() {
			return Math.floor(this.windowWidth() / this.cardWidth);
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
			slider.addClass('slide-transition');
			prevPosX = posX = 0;
			translateX(slider, posX);
		};

		this.isActive = function(idx) {
			if (idx >= this.startIdx() && idx <= this.endIdx()) {
				return true;
			}

			return false;
		};

		this.cardImageUrl = function(card, idx) {
			return this.isActive(idx()) ? card.categoryImageUrl : this.loaderUrl;
		};
	}

	var cardVm = window.cardVm = new CardViewModel();

	ko.applyBindings(cardVm);

	function translateX(el, posX) {
		el.style.webkitTransform = 'translate3d('+posX+'px, 0, 0)';
	}
}());