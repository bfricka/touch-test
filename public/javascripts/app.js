/* global Hammer */
(function(){
  var doc = document
  , body = doc.body
  , nav = doc.querySelector(".swipe-menu-left")
  , distanceBuffer = 10
  , navWidth = nav.offsetWidth
  , hBody = Hammer(body)
  , startPosition = -navWidth;

  nav.addEvent('transitionend', function(ev){
    nav.removeClass('swipe-transition');
  });

  var hBodyDragEnabled = true;

  hBody.on('dragright', function(evt){
    var enabled = checkEvtEnabled(evt);
    if (!enabled) return;

    var distance = evt.gesture.distance;

    if (distance < distanceBuffer || distance >= navWidth || startPosition === 0 || evt.target.nodeName.toLowerCase() === 'input') return;
    var xVal = distance + startPosition;
    xVal = xVal >= 0 ? 0 : xVal;
    
    translateX(nav, xVal);
  });

  hBody.on('dragleft', function(evt){
    var enabled = checkEvtEnabled(evt);
    if (!enabled) return;
    
    var distance = evt.gesture.distance;
    if (distance < distanceBuffer || distance >= navWidth || startPosition === -navWidth || evt.target.nodeName.toLowerCase() === 'input') return;
    var xVal = startPosition - distance;
    xVal = xVal <= -navWidth ? -navWidth : xVal;
    
    translateX(nav, xVal);
  });

  hBody.on('dragend', function(evt) {
    var direction = evt.gesture.direction
      , distance = evt.gesture.distance
      , fast = isFastX(evt)
      , snapDistance = navWidth / 4
      , navPosition;

    if (!hBody.enabled) {
      hBody.enable(true);
      return;
    }

    switch (direction) {
      case 'right':
        if (startPosition === 0) return;
        navPosition = (distance >= snapDistance || fast) ? 0 : -navWidth;
        break;
      case 'left':
        if (startPosition === -navWidth) return;
        navPosition = (distance < snapDistance || fast) ? 0 : -navWidth;
        break;
    }

    nav.addClass('swipe-transition');
    translateX(nav, navPosition);
    startPosition = navPosition;
  });

  hBody.on('swiperight', function(evt) {

  });

  function checkEvtEnabled(evt) {
    var elName = evt.target.nodeName.toLowerCase();
    if (elName === 'input') {
      hBody.enable(false);
    }

    return hBody.enabled;
  }

  function isFastX(evt) {
    var snapVelocity = 3;
    return Math.abs(evt.gesture.velocityX) >= snapVelocity;
  }

  function translateX(el, val) {
    el.style.webkitTransform = 'translate3d(' + val + 'px, 0, 0)';
  }

  window.addEvent('resize', function() {
    navWidth = nav.offsetWidth;
  });
}());