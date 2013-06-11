(function(){
	function CardViewModel() {
		this.cards = window.cards;
	}

	ko.applyBindings(new CardViewModel());

	var winWidth = $('win-width').set('text', window.innerWidth);
	window.addEvent('resize', function(){
		winWidth.set('text', window.innerWidth);
	});
}());