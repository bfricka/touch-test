(function(){
	function CardViewModel() {
		this.cards = window.cards;
	}

	ko.applyBindings(new CardViewModel());

	var winWidth = $('win-width');
	window.addEvent('resize', function(){
		winWidth.set('text', window.innerWidth);
	});
}());