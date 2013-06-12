(function(){
	var cardSlider = Hammer($('card-slider'), { prevent_default: true })
		, slider = cardSlider.element
		, posX = 0, prevPosX = 0;

	cardSlider.on('drag release swipe', function(evt){
		switch (evt.type) {
			case 'drag':
				slider.removeClass('slider-transition');
				posX = evt.gesture.deltaX + prevPosX;
				translateX(slider, posX);
				break;
			case 'release':
				prevPosX = posX;
				break;
			case 'swipe':
				slider.addClass('slide-transition');
				posX = ((evt.gesture.deltaX * Math.max(1, Math.min(4, evt.gesture.velocityX))) + prevPosX);
				translateX(slider, posX);
				prevPosX = posX;
				break;
		}
	});

	slider.addEvent('transitionend', function() {
		slider.removeClass('slide-transition');
	});

	// Add active to cards
	window.cards.forEach(function(card){ card.active = false; });
	var cardFullWidth = 0;

	function CardViewModel() {
		var self = this;
		window.addEvent('resize', function(){
			self.windowWidth(window.innerWidth);
		});

		this.loaderUrl = "public/img/loader.gif";
		this.cards = ko.observableArray(window.cards);
		this.windowWidth = ko.observable(window.innerWidth);
		this.totalCards = function() { return this.cards().length; };

		this.totalVisibleCards = function() {
			return Math.floor(this.windowWidth() / this.cardWidth);
		};

		this.getCardInfo = function(el) {
			if (!this.cardWidth) {
				this.cardWidth = el.offsetWidth + parseFloat(el.getComputedStyle('margin-right'));
				var total = this.totalVisibleCards();
				this.startIdx = -Math.round(posX / this.cardWidth);
				this.endIdx = this.startIdx + total;
				this.endIdx = (this.endIdx > this.totalCards() ? this.totalCards() : this.endIdx);
			}
			return this.cardWidth;
		};

		this.goBack = function() {
			if (posX === 0) return;
			slider.addClass('slide-transition');
			translateX(slider, 0);
		};

		this.isActive = function(idx) {
			if (idx >= this.startIdx && idx <= this.endIdx) {
				return true;
			}

			return false;
		};

		this.cardImageUrl = function(card, idx) {
			return this.isActive(idx()) ? card.categoryImageUrl : this.loaderUrl;
		};
	}

	ko.applyBindings(new CardViewModel());

	function translateX(el, posX) {
		el.style.webkitTransform = 'translate3d('+posX+'px, 0, 0)';
	}
}());