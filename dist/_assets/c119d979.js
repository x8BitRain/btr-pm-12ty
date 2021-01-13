"use strict";
(function() {
  function r(e, n, t) {
    function o(i, f) {
      if (!n[i]) {
        if (!e[i]) {
          var c = "function" == typeof require && require;
          if (!f && c) return c(i, !0);
          if (u) return u(i, !0);
          var a = new Error("Cannot find module '" + i + "'");
          throw a.code = "MODULE_NOT_FOUND", a;
        }
        var p = n[i] = {
          exports: {}
        };
        e[i][0].call(p.exports, function(r) {
          var n = e[i][1][r];
          return o(n || r);
        }, p, p.exports, r, e, n, t);
      }
      return n[i].exports;
    }
    for (var u = "function" == typeof require && require, i = 0; i < t.length; i++) {
      o(t[i]);
    }
    return o;
  }
  return r;
})()({
  1: [function(require, module, exports) {
    ;
    (function() {
      // instant.page preloads pages for you
      // Documentation: https://instant.page
      require('instant.page');
    })();
  }, {
    "instant.page": 2
  }],
  2: [function(require, module, exports) {
    /*! instant.page v5.1.0 - (C) 2019-2020 Alexandre Dieulot - https://instant.page/license */
    var mouseoverTimer;
    var lastTouchTimestamp;
    var prefetches = new Set();
    var prefetchElement = document.createElement('link');
    var isSupported = prefetchElement.relList && prefetchElement.relList.supports && prefetchElement.relList.supports('prefetch') && window.IntersectionObserver && 'isIntersecting' in IntersectionObserverEntry.prototype;
    var allowQueryString = ('instantAllowQueryString' in document.body.dataset);
    var allowExternalLinks = ('instantAllowExternalLinks' in document.body.dataset);
    var useWhitelist = ('instantWhitelist' in document.body.dataset);
    var mousedownShortcut = ('instantMousedownShortcut' in document.body.dataset);
    var DELAY_TO_NOT_BE_CONSIDERED_A_TOUCH_INITIATED_ACTION = 1111;
    var delayOnHover = 65;
    var useMousedown = false;
    var useMousedownOnly = false;
    var useViewport = false;
    if ('instantIntensity' in document.body.dataset) {
      var intensity = document.body.dataset.instantIntensity;
      if (intensity.substr(0, 'mousedown'.length) == 'mousedown') {
        useMousedown = true;
        if (intensity == 'mousedown-only') {
          useMousedownOnly = true;
        }
      } else if (intensity.substr(0, 'viewport'.length) == 'viewport') {
        if (!(navigator.connection && (navigator.connection.saveData || navigator.connection.effectiveType && navigator.connection.effectiveType.includes('2g')))) {
          if (intensity == "viewport") {
            /* Biggest iPhone resolution (which we want): 414 × 896 = 370944
             * Small 7" tablet resolution (which we don’t want): 600 × 1024 = 614400
             * Note that the viewport (which we check here) is smaller than the resolution due to the UI’s chrome */
            if (document.documentElement.clientWidth * document.documentElement.clientHeight < 450000) {
              useViewport = true;
            }
          } else if (intensity == "viewport-all") {
            useViewport = true;
          }
        }
      } else {
        var milliseconds = parseInt(intensity);
        if (!isNaN(milliseconds)) {
          delayOnHover = milliseconds;
        }
      }
    }
    if (isSupported) {
      var eventListenersOptions = {
        capture: true,
        passive: true
      };
      if (!useMousedownOnly) {
        document.addEventListener('touchstart', touchstartListener, eventListenersOptions);
      }
      if (!useMousedown) {
        document.addEventListener('mouseover', mouseoverListener, eventListenersOptions);
      } else if (!mousedownShortcut) {
        document.addEventListener('mousedown', mousedownListener, eventListenersOptions);
      }
      if (mousedownShortcut) {
        document.addEventListener('mousedown', mousedownShortcutListener, eventListenersOptions);
      }
      if (useViewport) {
        var triggeringFunction;
        if (window.requestIdleCallback) {
          triggeringFunction = function triggeringFunction(callback) {
            requestIdleCallback(callback, {
              timeout: 1500
            });
          };
        } else {
          triggeringFunction = function triggeringFunction(callback) {
            callback();
          };
        }
        triggeringFunction(function() {
          var intersectionObserver = new IntersectionObserver(function(entries) {
            entries.forEach(function(entry) {
              if (entry.isIntersecting) {
                var linkElement = entry.target;
                intersectionObserver.unobserve(linkElement);
                preload(linkElement.href);
              }
            });
          });
          document.querySelectorAll('a').forEach(function(linkElement) {
            if (isPreloadable(linkElement)) {
              intersectionObserver.observe(linkElement);
            }
          });
        });
      }
    }

    function touchstartListener(event) {
      /* Chrome on Android calls mouseover before touchcancel so `lastTouchTimestamp`
       * must be assigned on touchstart to be measured on mouseover. */
      lastTouchTimestamp = performance.now();
      var linkElement = event.target.closest('a');
      if (!isPreloadable(linkElement)) {
        return;
      }
      preload(linkElement.href);
    }

    function mouseoverListener(event) {
      if (performance.now() - lastTouchTimestamp < DELAY_TO_NOT_BE_CONSIDERED_A_TOUCH_INITIATED_ACTION) {
        return;
      }
      var linkElement = event.target.closest('a');
      if (!isPreloadable(linkElement)) {
        return;
      }
      linkElement.addEventListener('mouseout', mouseoutListener, {
        passive: true
      });
      mouseoverTimer = setTimeout(function() {
        preload(linkElement.href);
        mouseoverTimer = undefined;
      }, delayOnHover);
    }

    function mousedownListener(event) {
      var linkElement = event.target.closest('a');
      if (!isPreloadable(linkElement)) {
        return;
      }
      preload(linkElement.href);
    }

    function mouseoutListener(event) {
      if (event.relatedTarget && event.target.closest('a') == event.relatedTarget.closest('a')) {
        return;
      }
      if (mouseoverTimer) {
        clearTimeout(mouseoverTimer);
        mouseoverTimer = undefined;
      }
    }

    function mousedownShortcutListener(event) {
      if (performance.now() - lastTouchTimestamp < DELAY_TO_NOT_BE_CONSIDERED_A_TOUCH_INITIATED_ACTION) {
        return;
      }
      var linkElement = event.target.closest('a');
      if (event.which > 1 || event.metaKey || event.ctrlKey) {
        return;
      }
      if (!linkElement) {
        return;
      }
      linkElement.addEventListener('click', function(event) {
        if (event.detail == 1337) {
          return;
        }
        event.preventDefault();
      }, {
        capture: true,
        passive: false,
        once: true
      });
      var customEvent = new MouseEvent('click', {
        view: window,
        bubbles: true,
        cancelable: false,
        detail: 1337
      });
      linkElement.dispatchEvent(customEvent);
    }

    function isPreloadable(linkElement) {
      if (!linkElement || !linkElement.href) {
        return;
      }
      if (useWhitelist && !('instant' in linkElement.dataset)) {
        return;
      }
      if (!allowExternalLinks && linkElement.origin != location.origin && !('instant' in linkElement.dataset)) {
        return;
      }
      if (!['http:', 'https:'].includes(linkElement.protocol)) {
        return;
      }
      if (linkElement.protocol == 'http:' && location.protocol == 'https:') {
        return;
      }
      if (!allowQueryString && linkElement.search && !('instant' in linkElement.dataset)) {
        return;
      }
      if (linkElement.hash && linkElement.pathname + linkElement.search == location.pathname + location.search) {
        return;
      }
      if ('noInstant' in linkElement.dataset) {
        return;
      }
      return true;
    }

    function preload(url) {
      if (prefetches.has(url)) {
        return;
      }
      var prefetcher = document.createElement('link');
      prefetcher.rel = 'prefetch';
      prefetcher.href = url;
      document.head.appendChild(prefetcher);
      prefetches.add(url);
    }
  }, {}]
}, {}, [1]);