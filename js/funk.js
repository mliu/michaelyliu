(function() {
  'use strict';

  var TICK_INTERVAL = 33;
  var MAX_TICK_INTERVAL = 66;
  var SPEED_SUCCESS_THRESHOLD = 25;
  var NUM_INITIAL_LIGHTBALLS = 25;
  var NUM_LIGHTBALLS_ADD_IN_ON_SPEED_SUCCESS = 5;
  var MAX_LIGHTBALL_VELOCITY = 5;
  var LIGHTBALL_RADIUS_BASE = 10;
  var MAX_LIGHTBALL_RADIUS = 100;
  var LIGHTBALL_OPACITY_BASE = 0.1;
  var MAX_LIGHTBALL_OPACITY_PERCENT = 50;
  var LIGHTBALL_FADEOUT_INCREMENT = 0.02;

  var canvas;
  var lights = [];
  var fadingLights = [];
  var lastTickTime;
  var speedSuccessTickCounts = 0;

  function init() {
    setTagline();
    canvas = $("#canvas");

    window.onresize();

    // Add lightballs
    for (var i = NUM_INITIAL_LIGHTBALLS; i--;) {
      lights.push(generateRandomLightball());
    }

    setInterval(tick, TICK_INTERVAL);
  }

  $(document).ready(function() {
    init();
  });

  function setTagline() {
    var el = $("#tagline");

    switch(Math.round(Math.random() * 3)) {
      case 0:
        el.text("made with \u2764");
        break;
      case 1:
        el.text("welcome aboard!");
        break;
      case 2:
        el.text("what's up?");
        break;
      case 3:
        el.text("hello there!");
        break;
    }
  }

  function drawLightball(lightball) {
    if (lightball.el) {
      lightball.el.css({
        "top": lightball.y,
        "left": lightball.x,
        "opacity": lightball.opacity,
      });
    } else {
      var el = $(document.createElement("lightball"));
      var colorString = "rgb(" + 
        Math.round(Math.random() * 255) + "," + 
        Math.round(Math.random() * 255) + "," + 
        Math.round(Math.random() * 255) + ")";
      el.css({
        "backgroundColor": colorString,
        "opacity": lightball.opacity,
        "width": lightball.r,
        "height": lightball.r,
        "top": lightball.y,
        "left": lightball.x,
      });
      getHtmlCanvas().appendChild(el.get()[0]);
      lightball.el = el;
    }
  }

  function generateRandomLightball() {
    var lightball = {};
    var cWidth = canvas.width();
    var cHeight = canvas.height();

    lightball.r = LIGHTBALL_RADIUS_BASE + Math.round(Math.random() * MAX_LIGHTBALL_RADIUS);
    lightball.opacity = LIGHTBALL_OPACITY_BASE + Math.round(Math.random() * MAX_LIGHTBALL_OPACITY_PERCENT) / 100;

    // Determine which side the lightball will come from
    switch(Math.round(Math.random() * 3)) {
      case 0: //top
        lightball.x = Math.random() * cWidth;
        lightball.y = -2 * lightball.r;
        lightball.vx = (Math.random() * MAX_LIGHTBALL_VELOCITY) - (MAX_LIGHTBALL_VELOCITY/2);
        lightball.vy = Math.random() * MAX_LIGHTBALL_VELOCITY;
        break;
      case 1: //bottom
        lightball.x = Math.random() * cWidth;
        lightball.y = cHeight;
        lightball.vx = (Math.random() * MAX_LIGHTBALL_VELOCITY) - (MAX_LIGHTBALL_VELOCITY/2);
        lightball.vy = -Math.random() * MAX_LIGHTBALL_VELOCITY;
        break;
      case 2: // right
        lightball.x = cWidth;
        lightball.y = Math.random() * cHeight;
        lightball.vx = -Math.random() * MAX_LIGHTBALL_VELOCITY;
        lightball.vy = (Math.random() * MAX_LIGHTBALL_VELOCITY) - (MAX_LIGHTBALL_VELOCITY/2);
        break;
      case 3: // left
        lightball.x = -2 * lightball.r;
        lightball.y = Math.random() * cHeight;
        lightball.vx = Math.random() * MAX_LIGHTBALL_VELOCITY;
        lightball.vy = (Math.random() * MAX_LIGHTBALL_VELOCITY) - (MAX_LIGHTBALL_VELOCITY/2);
        break;
    }

    return lightball;
  }

  function getHtmlCanvas() {
    return canvas.get()[0];
  }

  function outOfBounds(lightball) {
    return (lightball.x + 2 * lightball.r < 0 || lightball.x > canvas.width()) ||
      (lightball.y + 2 * lightball.r < 0 || lightball.y > canvas.height());
  }

  function tick() {
    var lightball;

    // Move lightballs
    for (var i = lights.length; i--;) {
      lightball = lights[i];
      drawLightball(lightball);
      lightball.x += lightball.vx;
      lightball.y += lightball.vy;

      if (outOfBounds(lightball)) {
        getHtmlCanvas().removeChild(lightball.el.get()[0]);
        lights[i] = generateRandomLightball();
      }
    }

    i = 0;
    // Fadeout lightballs
    while (i < fadingLights.length) {
      lightball = fadingLights[i];
      if (lightball.el === null) {
        fadingLights.splice(i, 1);
        continue;
      }

      drawLightball(lightball);
      lightball.x += lightball.vx;
      lightball.y += lightball.vy;
      lightball.opacity -= LIGHTBALL_FADEOUT_INCREMENT;

      if (lightball.opacity <= 0) {
        fadingLights.splice(i, 1);
        getHtmlCanvas().removeChild(lightball.el.get()[0]);
        continue;
      }

      i++;
    }

    // Remove lightballs if the rendering time is slow
    if (lastTickTime !== null && $.now() - lastTickTime > (MAX_TICK_INTERVAL)) {
      speedSuccessTickCounts = 0;
      fadingLights = fadingLights.concat(lights.splice(0, Math.round(lights.length / 5)));
    } else {
      speedSuccessTickCounts++;

      if (speedSuccessTickCounts >= SPEED_SUCCESS_THRESHOLD && lights.length < NUM_INITIAL_LIGHTBALLS) {
        speedSuccessTickCounts = 0;

        // We've rendered a good number of frames below the render time threshold.
        // Let's try adding more lightballs.
        for (i = NUM_LIGHTBALLS_ADD_IN_ON_SPEED_SUCCESS; i--;) {
          lights.push(generateRandomLightball());
        }
      }
    }

    lastTickTime = $.now();
  }

  window.onresize = function() {
    canvas.width(document.body.clientWidth);
    canvas.height(window.innerHeight);
  };
})();