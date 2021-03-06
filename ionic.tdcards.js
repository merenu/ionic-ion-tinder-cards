(function(ionic) {

  // Get transform origin poly
  var d = document.createElement('div');
  var transformKeys = ['webkitTransformOrigin', 'transform-origin', '-webkit-transform-origin', 'webkit-transform-origin',
              '-moz-transform-origin', 'moz-transform-origin', 'MozTransformOrigin', 'mozTransformOrigin'];

  var TRANSFORM_ORIGIN = 'webkitTransformOrigin';
  for(var i = 0; i < transformKeys.length; i++) {
    if(d.style[transformKeys[i]] !== undefined) {
      TRANSFORM_ORIGIN = transformKeys[i];
      break;
    }
  }

  var transitionKeys = ['webkitTransition', 'transition', '-webkit-transition', 'webkit-transition',
              '-moz-transition', 'moz-transition', 'MozTransition', 'mozTransition'];
  var TRANSITION = 'webkitTransition';
  for(var i = 0; i < transitionKeys.length; i++) {
    if(d.style[transitionKeys[i]] !== undefined) {
      TRANSITION = transitionKeys[i];
      break;
    }
  }

  var SwipeableCardView = ionic.views.View.inherit({
    /**
     * Initialize a card with the given options.
     */
    initialize: function(opts) {
      opts = ionic.extend({
      }, opts);

      ionic.extend(this, opts);

      this.el = opts.el;

      this.parentWidth = this.el.parentNode.offsetWidth;
      this.width = this.el.offsetWidth;

      this.startX = this.startY = this.x = this.y = 0;

      this.bindEvents();
    },

    /**
     * Set the X position of the card.
     */
    setX: function(x) {
      this.el.style[ionic.CSS.TRANSFORM] = 'translate3d(' + x + 'px,' + this.y + 'px, 0)';
      this.x = x;
      this.startX = x;
    },

    /**
     * Set the Y position of the card.
     */
    setY: function(y) {
      this.el.style[ionic.CSS.TRANSFORM] = 'translate3d(' + this.x + 'px,' + y + 'px, 0)';
      this.y = y;
      this.startY = y;
    },

    /**
     * Set the Z-Index of the card
     */
    setZIndex: function(index) {
      this.el.style.zIndex = index;
    },

    /**
     * Set the width of the card
     */
    setWidth: function(width) {
      this.el.style.width = width + 'px';
    },

    /**
     * Set the height of the card
     */
    setHeight: function(height) {
      this.el.style.height = height + 'px';
    },

    /**
     * Set the duration to run the pop-in animation
     */
    setPopInDuration: function(duration) {
      this.cardPopInDuration = duration;
    },

    /**
     * Transition in the card with the given animation class
     */
    transitionIn: function(animationClass) {
      var self = this;

      this.el.classList.add(animationClass + '-start');
      this.el.classList.add(animationClass);
      this.el.style.display = 'block';
      setTimeout(function() {
        self.el.classList.remove(animationClass + '-start');
      }, 100);
    },

    /**
     * Disable transitions on the card (for when dragging)
     */
    disableTransition: function(animationClass) {
      this.el.classList.remove(animationClass);
    },

    /**
     * Swipe a card out programtically
     */
    swipe: function() {
      this.transitionOut();
    },
    
    /**
     * Snap the card back to its original position
     */
    snapBack: function() {
      this.onSnapBack(this.x, this.y, this.rotationAngle);
    },

    isUnderThreshold: function() {
      //return true;
      return Math.abs(this.thresholdAmount) < 0.4;
    },
    /**
     * Fly the card out or animate back into resting position.
     */
    _endSwipe: function(deltaX, deltaY, velocityX) {
      var self = this;

      if(this.isUnderThreshold()) {
        self.onSnapBack(this.x, this.y, this.rotationAngle);
        return;
      }

      self.onTransitionOut(self.thresholdAmount);

      var angle = Math.atan(deltaX / deltaY);

      var dir = this.thresholdAmount < 0 ? -1 : 1;
      var targetX;
      if(this.x > 0) {
        targetX = (this.parentWidth / 2) + (this.width);
      } else {
        targetX = - (this.parentWidth + this.width);
      }

      // Target Y is just the "opposite" side of the triangle of targetX as the adjacent edge (sohcahtoa yo)
      var targetY = targetX / Math.tan(angle);

      // Fly out
      var rotateTo = this.rotationAngle;//(this.rotationAngle this.rotationDirection * 0.2));// || (Math.random() * 0.4);

      var duration = 0.3 - Math.min(Math.max(Math.abs(velocityX)/10, 0.05), 0.2);

      ionic.requestAnimationFrame(function() {
        self.el.style.transform = self.el.style.webkitTransform = 'translate3d(' + targetX + 'px, ' + targetY + 'px,0) rotate(' + self.rotationAngle + 'rad)';
        self.el.style.transition = self.el.style.webkitTransition = 'all ' + duration + 's ease-in-out';
      });

      var viewCallbackFunction = this['onSwipe' + (dir > 0 ? 'Right' : 'Left')];
      viewCallbackFunction && viewCallbackFunction();

      // Trigger destroy after card has swiped out
      setTimeout(function() {
        self.onDestroy && self.onDestroy();
      }, duration * 1000);
    },
    transitionOut: function(e) {
      this._endSwipe(e.gesture.deltaX, e.gesture.deltaY, e.gesture.velocityX);
    },

    /**
     * Bind drag events on the card.
     */
    bindEvents: function() {
      var self = this;
      ionic.onGesture('dragstart', function(e) {
        /*
        var cx = window.innerWidth / 2;
        if(e.gesture.touches[0].pageX < cx) {
          self._transformOriginRight();
        } else {
          self._transformOriginLeft();
        }
        */
        ionic.requestAnimationFrame(function() { self._doDragStart(e) });
      }, this.el);

      ionic.onGesture('drag', function(e) {
        ionic.requestAnimationFrame(function() { self._doDrag(e) });
        // Indicate we want to stop parents from using this
        e.gesture.srcEvent.preventDefault();
      }, this.el);

      ionic.onGesture('dragend', function(e) {
        ionic.requestAnimationFrame(function() { self._doDragEnd(e) });
      }, this.el);
    },

    // Rotate anchored to the left of the screen
    _transformOriginLeft: function() {
      this.el.style[TRANSFORM_ORIGIN] = 'left center';
      this.rotationDirection = 1;
    },

    _transformOriginRight: function() {
      this.el.style[TRANSFORM_ORIGIN] = 'right center';
      this.rotationDirection = -1;
    },

    isDragDisabled: function() { // Can be overriden
      return false;
    },

    _doDragStart: function(e) {
      if (this.isDragDisabled()) return;
      e.preventDefault();
      var width = this.el.offsetWidth;
      var point = window.innerWidth / 2 + this.rotationDirection * (width / 2)
      var distance = Math.abs(point - e.gesture.touches[0].pageX);// - window.innerWidth/2);

      this.touchDistance = distance * 10;
    },

    _onMove: function(deltaX, deltaY) {
      var o = deltaX / -1000;

      this.rotationAngle = Math.atan(o);

      this.x = this.startX + (deltaX * 0.8);
      this.y = this.startY + (deltaY * 0.8);

      this.el.style.transform = this.el.style.webkitTransform = 'translate3d(' + this.x + 'px, ' + this.y  + 'px, 0) rotate(' + (this.rotationAngle || 0) + 'rad)';


      this.thresholdAmount = (this.x / (this.parentWidth/2));

      var self = this;
      setTimeout(function() {
        self.onPartialSwipe(self.thresholdAmount);
      });
    },

    _doDrag: function(e) {
      if (this.isDragDisabled()) return;
      e.preventDefault();

      this._onMove(e.gesture.deltaX, e.gesture.deltaY);
    },
    _doDragEnd: function(e) {
      if (this.isDragDisabled()) return;
      this.transitionOut(e);
    }
  });


  angular.module('ionic.contrib.ui.tinderCards', ['ionic'])

  .directive('tdCard', ['$timeout', function($timeout) {
    /**
     * A simple non-linear fade function for the text on each card
     */
    var fadeFn = function(t) {
      // Speed up time to ramp up quickly
      t = Math.min(1, t * 3);

      // This is a simple cubic bezier curve.
      // http://cubic-bezier.com/#.11,.67,.41,.99
      var c1 = 0.11,
          c2 = 0.67,
          c3 = 0.41,
          c4 = 0.99;

      return Math.pow((1 - t), 3)*c1 + 3*Math.pow((1 -  t), 2)*t*c2 + 3*(1 - t)*t*t*c3 + Math.pow(t, 3)*c4;
    };

    return {
      restrict: 'E',
      template: '<div class="td-card" ng-transclude></div>',
      require: '^tdCards',
      transclude: true,
      scope: {
        onTdSwipeLeft: '&',
        onTdSwipeRight: '&',
        onTransitionLeft: '&',
        onTransitionRight: '&',
        onTransitionOut: '&',
        onPartialSwipe: '&',
        onSnapBack: '&',
        onDestroy: '&',
        dragDisabled: '&'
      },
      compile: function(element, attr) {
        return function($scope, $element, $attr, swipeCards) {
          var el = $element[0];
          var leftText = el.querySelector('.no-text');
          var rightText = el.querySelector('.yes-text');
          
          // Force hardware acceleration for animation - better performance on first touch
          el.style.transform = el.style.webkitTransform = 'translate3d(0px, 0px, 0px)';

          $scope.$on('tinderCards.swipeProgrammatically', function (evt, isLeft) {
            $element.hasClass('card-0') && $scope.swipeProgrammatically(isLeft);
          });

          // Instantiate our card view
          var swipeableCard = new SwipeableCardView({
            el: el,
            leftText: leftText,
            rightText: rightText,
            isDragDisabled: function() {
              return $scope.dragDisabled() || swipeCards._programmaticalSwipeInProgress;
            },
            onPartialSwipe: function(amt) {
              swipeCards.partial(amt);
              var self = this;
              $timeout(function() {
                if (amt < 0) {
                  if (self.leftText) self.leftText.style.opacity = fadeFn(-amt);
                  if (self.rightText) self.rightText.style.opacity = 0;
                } else {
                  if (self.leftText) self.leftText.style.opacity = 0;
                  if (self.rightText) self.rightText.style.opacity = fadeFn(amt);
                }
                $scope.onPartialSwipe({amt: amt});
              });
            },
            onSwipeRight: function() {
              $timeout(function() {
                $scope.onTdSwipeRight();
              });
            },
            onSwipeLeft: function() {
              $timeout(function() {
                $scope.onTdSwipeLeft();
              });
            },
            onTransitionRight: function() {
              $timeout(function() {
                $scope.onTransitionRight();
              });
            },
            onTransitionLeft: function() {
              $timeout(function() {
                $scope.onTransitionLeft();
              });
            },
            onTransitionOut: function(amt) {
              if (amt < 0) {
                swipeableCard.onTransitionLeft();
              } else {
                swipeableCard.onTransitionRight();
              }
              $timeout(function() {
                $scope.onTransitionOut({amt: amt});
              });
            },
            onDestroy: function() {
              $timeout(function() {
                $scope.onDestroy();
              });
            },
            onSnapBack: function(startX, startY, startRotation) {
              var leftText = el.querySelector('.yes-text');
              var rightText = el.querySelector('.no-text');

              var animation = collide.animation({
                // 'linear|ease|ease-in|ease-out|ease-in-out|cubic-bezer(x1,y1,x2,y2)',
                // or function(t, duration),
                // or a dynamics configuration (see below)
                duration: 500,
                percent: 0,
                reverse: false
              })

              .easing({
                type: 'spring',
                frequency: 15,
                friction: 250,
                initialForce: false
              })

              .on('step', function(v) {
                var xPos = startX - startX*v;
                swipeCards.partial(xPos / (swipeableCard.parentWidth / 2));
                //Have the element spring over 400px
                el.style.transform = el.style.webkitTransform = 'translate3d(' + xPos + 'px, ' + (startY - startY*v) + 'px, 0) rotate(' + (startRotation - startRotation*v) + 'rad)';
                if (rightText) rightText.style.opacity = 0;
                if (leftText) leftText.style.opacity = 0;
              })
              .start();

              $timeout(function() {
                $scope.onSnapBack();
              });

              /*
              animateSpringViaCss(el, 0, 0.5, 50, 700, 10, function (x) {
                return el.style.transform = el.style.webkitTransform = 'translate3d(' + x + 'px,0,0)';
              });
              */
            },
          });
          $scope.$parent.swipeCard = swipeableCard;

          $scope.swipeProgrammatically = function(isLeft) {
            if (swipeCards._programmaticalSwipeInProgress) return;

            swipeCards._programmaticalSwipeInProgress = true;
            var xDestination = (isLeft ? -1 : 1) * swipeableCard.parentWidth / 2;
            var yDestination = 20;

            var animation = collide.animation({
              // 'linear|ease|ease-in|ease-out|ease-in-out|cubic-bezer(x1,y1,x2,y2)',
              // or function(t, duration),
              // or a dynamics configuration (see below)
              duration: 200,
              percent: 0,
              reverse: false
            })
            .on('step', function(v) {
              ionic.requestAnimationFrame(function() { swipeableCard._onMove(xDestination * v, yDestination * v); });
            })
            .on('stop', function() {
              ionic.requestAnimationFrame(function() { swipeableCard._endSwipe(xDestination, yDestination, 0.1); });
              delete swipeCards._programmaticalSwipeInProgress;
            })
            .start();
          };

          swipeCards.sortCards();
        }
      }
    }
  }])

  .directive('tdCards', ['$rootScope', '$timeout', function($rootScope, $timeout) {
    return {
      restrict: 'E',
      template: '<div class="td-cards" ng-transclude></div>',
      transclude: true,
      scope: {
        maxStackSize: '=', // Max visible number of cards
        cardPixelOffset: '=' // Offset of each card
      },
      controller: ['$scope', '$element', function($scope, $element) {
        var PIXEL_OFFSET = $scope.cardPixelOffset || 4;

        var cards;
        var firstCard, secondCard, thirdCard;

        var existingCards, card;

        var i, j;

        var sortCards = function() {
          existingCards = $element[0].querySelectorAll('td-card');

          for(i = 0; i < existingCards.length; i++) {
            card = existingCards[i];
            if(!card) continue;
            if(i > 0) {
              var cardOffsetIndex = ($scope.maxStackSize && ($scope.maxStackSize - 1) < i) ? $scope.maxStackSize - 1 : i;
              card.style.transform = card.style.webkitTransform = 'translate3d(0, ' + (cardOffsetIndex * PIXEL_OFFSET) + 'px, 0)';
            }
            card.style.zIndex = (existingCards.length - i);
          }
        };

        var alreadyDelegated = false;
        this.sortCards = function() {
          if (!alreadyDelegated) {
            $timeout(function() {
              alreadyDelegated = false;
              sortCards();
            });
            alreadyDelegated = true;
          }
        };

        var bringCardUp = function(card, amt, max) {
          var position, newTop;
          position = card.style.transform || card.style.webkitTransform;
          newTop = Math.max(0, Math.max(max - PIXEL_OFFSET, max - (PIXEL_OFFSET * Math.abs(amt))));
          card.style.transform = card.style.webkitTransform = 'translate3d(0, ' + newTop + 'px, 0)';
        };

        this.partial = function(amt) {
          cards = $element[0].querySelectorAll('td-card');
          firstCard = cards[0];
          secondCard = cards.length >= 2 && cards[1];
          thirdCard = cards.length >= 3 && cards[2];

          secondCard && bringCardUp(secondCard, amt, PIXEL_OFFSET);
          thirdCard && bringCardUp(thirdCard, amt, PIXEL_OFFSET * 2);
        };
      }]
    }
  }])

  .factory('TDCardDelegate', ['$rootScope', function($rootScope) {
    return {
      popCard: function($scope, isAnimated) {
        $rootScope.$emit('tdCard.pop', isAnimated);
      },
      getSwipeableCard: function($scope) {
        return $scope.swipeCard;
      }
    }
  }]);

})(window.ionic);
