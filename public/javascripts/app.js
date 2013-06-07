/* global Hammer */
(function(){
  var nav = document.querySelector(".swipe-menu-left")
  , navWidth = nav.offsetWidth
  , hBody = window.hBody = Hammer(document.body, { dragMinDistance: 20 })
  , startPosition = -navWidth;

  hBody.on('dragright', function(evt){
    var enabled = checkEvtEnabled(evt);
    if (!enabled) return;

    var distance = evt.gesture.distance;

    if (distance >= navWidth || startPosition === 0) return;
    var xVal = distance + startPosition;
    xVal = xVal >= 0 ? 0 : xVal;
    
    translateX(nav, xVal);
  });

  hBody.on('dragleft', function(evt){
    var enabled = checkEvtEnabled(evt);
    if (!enabled) return;

    var distance = evt.gesture.distance;
    if (distance >= navWidth || startPosition === -navWidth) return;
    var xVal = startPosition - distance;
    xVal = xVal <= -navWidth ? -navWidth : xVal;
    
    translateX(nav, xVal);
  });

  hBody.on('dragend', function(evt) {
    var direction = evt.gesture.direction
      , distance = evt.gesture.distance
      , snapDistance = navWidth / 3
      , navPosition;

    if (!hBody.enabled) {
      hBody.enable(true);
      return;
    }

    switch (direction) {
      case 'right':
        if (startPosition === 0) return;
        navPosition = (distance >= snapDistance) ? 0 : -navWidth;
        break;
      case 'left':
        if (startPosition === -navWidth) return;
        navPosition = (distance < snapDistance) ? 0 : -navWidth;
        break;
    }

    snapNavTo(navPosition);
  });

  hBody.on('swiperight', function(evt) { snapNavTo(0); });
  hBody.on('swipeleft', function(evt) { snapNavTo(-navWidth); });

  nav.addEvent('transitionend', function(ev) {
    nav.removeClass('swipe-transition');
  });

  window.addEvent('resize', function() {
    navWidth = nav.offsetWidth;
  });

  function snapNavTo(val) {
    nav.addClass('swipe-transition');
    translateX(nav, val);
    startPosition = val;
  }

  function checkEvtEnabled(evt) {
    var elName = evt.target.nodeName.toLowerCase();
    if (elName === 'input') {
      hBody.enable(false);
    }

    return hBody.enabled;
  }

  function translateX(el, val) {
    el.style.webkitTransform = 'translate3d(' + val + 'px, 0, 0)';
  }
}());