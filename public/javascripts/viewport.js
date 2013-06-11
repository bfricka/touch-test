// Viewport

(function(){
  var orientationEl = $('viewport-orientation')
    , currentOrientation = getOrientation();

  setOrientation(currentOrientation);

  window.addEvent('resize', function(){
    var orientation = getOrientation();

    if (orientation !== currentOrientation) {
      setOrientation(orientation);
    }
  });

  function setOrientation(orientation) {
    orientationEl.set('text', orientation);
    currentOrientation = orientation;
  }

  function getOrientation() {
    return (window.innerHeight > window.innerWidth) ? 'Portrait' : 'Landscape';
  }
}());