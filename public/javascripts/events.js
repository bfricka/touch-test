/* global Hammer */
if (!Hammer.HAS_TOUCHEVENTS && !Hammer.HAS_POINTEREVENTS) {
  Hammer.plugins.showTouches();
  Hammer.plugins.fakeMultitouch();
}

// Menu
(function(){
  var nav = document.querySelector(".swipe-menu-left")
    , navWidth = nav.offsetWidth
    , dragDefaults = { drag_min_distance: 20, prevent_default: true }
    , swipeZone = Hammer($('swipe-menu-zone'), dragDefaults)
    , swipeMenu = Hammer($('swipe-menu'), dragDefaults)
    , startPosition = -navWidth;

  swipeZone.on('dragright', function (evt){
    var distance = evt.gesture.distance;

    if (distance >= navWidth || startPosition === 0) return;
    var xVal = distance + startPosition;
    xVal = xVal >= 0 ? 0 : xVal;

    translateX(nav, xVal);
  });

  swipeMenu.on('dragleft', function (evt){
    var enabled = checkEvtEnabled(evt);
    if (!enabled) return;

    var distance = evt.gesture.distance;
    if (distance >= navWidth || startPosition === -navWidth) return;
    var xVal = startPosition - distance;
    xVal = xVal <= -navWidth ? -navWidth : xVal;

    translateX(nav, xVal);
  });

  swipeMenu.on('dragend', dragEndHandler);
  swipeZone.on('dragend', dragEndHandler);

  function dragEndHandler(evt) {
    var direction = evt.gesture.direction
      , distance = evt.gesture.distance
      , snapDistance = navWidth / 3
      , navPosition;

    if (!swipeMenu.enabled) {
      swipeMenu.enable(true);
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
  }

  swipeZone.on('swiperight', function(evt) { snapNavTo(0); });
  swipeMenu.on('swipeleft', function(evt) { snapNavTo(-navWidth); });

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
    if (elName === 'input' || elName === 'textarea') {
      swipeMenu.enable(false);
    }

    return swipeMenu.enabled;
  }

  function translateX(el, val) {
    el.style.webkitTransform = 'translate3d(' + val + 'px, 0, 0)';
  }
}());

// Image
(function(){
  var posX = 0, posY = 0, prevPosX = 0, prevPosY = 0
    , scale = 1, lastScale
    , rotation = 0, lastRotation

    , pinchZoom = Hammer(document.getElementById('pinch-zoom'), {
        transform_always_block: true
      , transform_min_scale: 1
      , drag_block_horizontal: true
      , drag_block_vertical: true
      , drag_min_distance: 0
    })

    , touchImg = document.getElementById('touch-img');

  pinchZoom.on('touch drag transform release', function(event) {
    var gesture = event.gesture;

    switch(event.type) {
      case 'release':
        prevPosX = posX;
        prevPosY = posY;
        break;
      case 'touch':
        lastScale = scale;
        lastRotation = rotation;
        break;

      case 'drag':
        posX = gesture.deltaX + prevPosX;
        posY = gesture.deltaY + prevPosY;
        break;

      case 'transform':
        rotation = lastRotation + gesture.rotation;
        scale = Math.max(1, Math.min(lastScale * gesture.scale, 10));
        break;
    }

    var transform = [
      'translate3d('+posX+'px,'+posY+'px, 0)',
      'scale3d('+scale+','+scale+', 0)',
      'rotate('+rotation+'deg)'
    ].join(' ');

    touchImg.style.webkitTransform = transform;
  });

  pinchZoom.on('doubletap', function(event){
    touchImg.addClass('tap-transition');
    touchImg.style.webkitTransform = [
      'translate3d(0,0,0)',
      'scale3d(1,1,0)',
      'rotate(0deg)'
    ].join(' ');
    scale = 1;
    rotation = 0;
    posX = 0;
    posY = 0;
  });

  touchImg.addEvent('transitionend', function(){
    touchImg.removeClass('tap-transition');
  });
}());