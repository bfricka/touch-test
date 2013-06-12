(function(){
	var cardSlider = Hammer($('card-slider'))
		, slider = cardSlider.element
		, posX = 0, prevPosX = 0;

	cardSlider.on('drag release swipe', function(evt){
		switch (evt.type) {
			case 'drag':
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

	function CardViewModel() {
		var self = this;
		window.addEvent('resize', function(){
			self.windowWidth(window.innerWidth);
		});

		this.cards = ko.observableArray(window.cards);
		this.windowWidth = ko.observable(window.innerWidth);
		this.goBack = function() {
			if (posX === 0) return;
			slider.addClass('slide-transition');
			translateX(slider, 0);
		};
	}

	ko.applyBindings(new CardViewModel());

	function translateX(el, posX) {
		el.style.webkitTransform = 'translate3d('+posX+'px, 0, 0)';
	}
}());