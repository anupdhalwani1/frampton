/**
 * A small functional reactive library.
 * @author Kevin B. Greene <kgreene@linkedin.com>
 * @version 0.1.0
 */
(function(global, document, $, define, undefined) {

  'use strict';

  /**
   * Because we want to be responsible devs and not polute the global namespace more
   * than we absolutely have to, let's create an object to attach our public API.
   * @namespace Frampton
   */
  var Frampton = {};

  // Some useful stuff...
  var _slice   = Array.prototype.slice,
      _hasProp = Object.prototype.hasOwnProperty,
      toArray  = function(args, begin, end) {

        var argLen = args.length,
            begin  = begin || 0,
            end    = end || argLen,
            arrLen = end - begin,
            idx    = 0,
            arr, i;

        if (argLen > 0) {
          arr = new Array(arrLen);
          for (i=begin;i<end;i++) {
            arr[idx++] = args[i];
          }
        }

        return arr;
      };

  /**
   * Occassionally we need to blow things up if something isn't right.
   * @name assert
   * @private
   * @param {Any}    cond - A condition that evaluates to a Boolean. If false, an error is thrown.
   * @param {String} msg  - Message to throw with error.
   */
  var assert = function(cond, msg) {
    if (!cond) {
      throw new Error(msg || 'An error occured'); // Boom!
    }
  };

  /**
   * Cross browser context binding
   *
   * @name bindCallback
   * @private
   * @param {Function} fn
   * @param {Object}   thisArg
   */
  var bindCallback = function(fn, thisArg) {
    return (isFunction(Function.prototype.bind)) ? fn.bind(thisArg) : function() {
      return fn.apply(thisArg, toArray(arguments));
    };
  };

  // takes a function and warps it to be called at a later time.
  function lazy(fn, thisArg) {
    var args = toArray(arguments, 1);
    return function() {
      fn.apply(thisArg || null, args);
    }
  }

  /**
   * The following set of helper functions all start with the word 'is',
   * guess what they do
   */
  var isFunction = function(fn) {
        return (typeof fn === 'function');
      },
      isBoolean = function(obj) {
        return (typeof obj === 'boolean');
      },
      isArray = function(arr) {
        return Object.prototype.toString.call(arr) === "[object Array]";
      },
      isObject = function(obj) {
        return (isSomething(obj) && !isArray(obj) && typeof obj === 'object');
      },
      isString = function(obj) {
        return (typeof obj === 'string');
      },
      isNumber = function(num) {
        return (typeof num === 'number');
      },
      isNothing = function(obj) {
        return (isUndefined(obj) || isNull(obj));
      },
      isSomething = function(obj) {
        return !isNothing(obj);
      },
      isDefined = function(obj) {
        return !isUndefined(obj);
      },
      isUndefined = function(obj) {
        return (typeof obj === 'undefined');
      },
      isNull = function(obj) {
        return (obj === null);
      },
      isPromise = function(promise) {
        return (isObject(promise) && isFunction(promise.then));
      };

  /**
   * Convinience method for adding an event listener that will either add with addEventListenr
   * or an 'on' method. It will return a function to unsubscribe from the event.
   *
   * @name addEvent
   * @memberOf Frampton
   * @private
   * @param {String} eventName
   * @param {Function} callback
   * @param {Object} target
   * @returns {Function} A function to remove the event from the target.
   */
  function addEvent(eventName, callback, target) {

    var listen = isFunction(target.addEventListener) ? target.addEventListener :
                 isFunction(target.attachEvent) ? target.attachEvent :
                 isFunction(target.on) ? target.on : null;

    var eventPrefix = isFunction(target.attachEvent) ? 'on' : '';

    assert(isFunction(listen), 'addEvent received an unknown type as target');

    listen.call(target, eventPrefix + eventName, callback);

    /**
     * lazy takes the function to make lazy first and then a list of arguments to pass
     * to the newly lazy function.
     */
    return lazy(removeEvent, eventName, callback, target);
  }

  /**
   * Removes an event listener from an object, usually a DOM node, alternatively can remove
   * listener from any object that implements an 'off' method that takes an event name and a
   * callback as parameters in that order.
   *
   * @name removeEvent
   * @memberOf Frampton
   * @private
   * @param {String} eventName - Event to remove.
   * @param {Function} callback - Callback to remove.
   * @param {Object} target - Object to remove event listener from.
   */
  function removeEvent(eventName, callback, target) {

    var remove = isFunction(target.removeEventListener) ? target.removeEventListener :
                 isFunction(target.removeEvent) ? target.removeEvent :
                 isFunction(target.off) ? target.off : null;

    var eventPrefix = isFunction(target.removeEvent) ? 'on' : '';

    assert(isFunction(remove), 'removeEvent received an unknown type as target');

    remove.call(target, eventName, callback);
  }

  /**
   * Normalized event object for <=IE8. Really we should just print out a message saying
   * "screw you" to all people who visit using IE8 or less, but some sensitive morons
   * would probably take offense.
   *
   * @name normalizeEvent
   * @memberOf Frampton
   * @private
   * @param {Object} evt - Event object.
   */
  function normalizeEvent(evt) {
    evt = evt || global.event;
    evt.target = evt.target || evt.srcElement;
    evt.preventDefault = evt.preventDefault || function() {
      evt.returnValue = false;
    };
    evt.stopPropagation = evt.stopPropagation || function() {
      evt.cancelBubble = true;
    };
    return evt;
  }

  /**
   * Helper for recursive inspect (toString)
   * @name inspect
   * @memberOf Frampton
   * @private
   */
  function inspect(obj) {

    if (isNull(obj)) {
      return 'null';
    } else if (isUndefined(obj)) {
      return 'undefined';
    }

    return obj.inspect ? obj.inspect() : obj;
  }

  /**
   * Destructively (yay, carnage) extend one object with another.
   * @name extend
   * @private
   */
  function extend(toExtend) {

    var key,
        i,
        extensions = toArray(arguments, 1);

    for (i in extensions) {

      for (key in extensions[i]) {
        toExtend[key] = extensions[i][key];
      }
    }
  }

  /**
   * Makes a shallow copy of an object.
   * @name copy
   * @memberOf Frampton
   * @private
   */
  function copy(obj) {

    var newObj = {},
        key;

    for (key in obj) {
      newObj[key] = obj[key];
    }

    return newObj;
  }

  /**
   * @name currentTime
   * @memberOf Frampton
   * @private
   */
  function currentTime() {
    return (new Date()).getTime();
  }

  /**
   * Yes, this dumb little guy is useful, don't make fun of him. He just takes a value
   * and spits it at you. Sounds rude, but he has his place.
   */
  var identity = function identity(x) {
    return x;
  };

  /**
   * Yes, this guy looks even more useless. Have a heart. His mother smoked crack. He
   * finds things to do from time to time.
   */
  var noop = function noop() {};

  /**
   * Takes a function and returns a new function that will wait to execute the original
   * function until it has received all of its arguments. Each time the function is called
   * without receiving all of its arguments it will return a new function waiting for the
   * remaining arguments.
   *
   * @name curry
   * @memberOf Frampton
   * @static
   * @param {Function} curry - Function to curry.
   */
  var curry = function curry(fn) {

    assert(isFunction(fn), 'Argument passed to curry is not a function: ' + fn);

    var arity = fn.length,
        args  = toArray(arguments, 1);

    function curried() {

      // an array of arguments for this instance of the curried function
      var locals = args;

      if (arguments.length > 0) {
        locals = locals.concat(toArray(arguments, 0));
      }

      if (locals.length >= arity) {
        return fn.apply(null, locals);
      } else {
        return curry.apply(null, [fn].concat(locals));
      }
    }

    return args.length >= arity ? curried() : curried;
  }

  /**
   * Compose takes any number of functions and returns a function that when
   * executed will call the passed functions in order, passing the return of
   * each function to the next function in the execution order.
   *
   * @name compose
   * @memberOf Frampton
   * @static
   * @param {Function} functions - Any number of function used to build the composition.
   */
  var compose = function compose(/* functions */) {

    var fns = toArray(arguments);

    assert(fns.length > 0, "Compose did not receive any arguments. You can't compose nothing. Stoopid.");

    return function composition() {

      return foldr(

        function(args, fn) {
          return [fn.apply(this, args)];
        },

        toArray(arguments),

        fns

      )[0];
    };
  };

  /**
   * Takes a function and memoizes it. The returned function will always return the same value for
   * the same input. There is no way to empty the function's internal cache once it has been
   * memoized.
   *
   * The data store for the memoized function uses JSON.stringify to create keys for arguments. This
   * will throw if an object containing a circular reference, such as a DOM element, is used
   * as input.
   *
   * @name memoize
   * @memberOf Frampton
   * @static
   * @param   {Function} fn - Function to memoize
   * @returns {Function} A function that takes the same arguments and performs the same computations
   * as the function passed in. The only difference is the new function caches all of it computations.
   */
  var memoize = function(fn) {

    var store = {};

    return function() {

      var args = toArray(arguments),
          key  = JSON.stringify(args);

      if (key in store) {
        return store[key];
      } else {
        return (store[key] = fn.apply(null, args));
      }
    }
  };

  /**
   * Takes a function and calls it asycronously as quicly as possible, using setImmediate, if
   * available (non-standard IE 10+), otherwise, uses setTimeout of 0.
   *
   * @name immediate
   * @param {Function} fn - a function to call.
   */
  var immediate = (isFunction(global.setImmediate)) ? setImmediate : function(fn) {
    setTimeout(fn, 0);
  };

  /**
   * @name foldl
   * @memberOf Frampton
   * @static
   */
  var foldl = curry(function curried_foldl(fn, acc, list) {

    var i   = -1,
        len = list.length;

    while (++i < len) {
      acc = fn(acc, list[i]);
    }

    return acc;
  });

  /**
   * @name foldr
   * @memberOf Frampton
   * @static
   */
  var foldr = curry(function curried_foldr(fn, acc, list) {

    var i = list.length;

    while (i--) {
      acc = fn(acc, list[i]);
    }

    return acc;
  });

  /**
   * @name each
   * @memberOf Frampton
   * @static
   */
  var each = curry(function curried_each(fn, arr) {

    var i   = -1,
        len = arr.length;

    while (++i < len) {
      fn(arr[i], i);
    }
  });

  /**
   * @name remove
   * @memberOf Frampton
   * @static
   */
  var remove = curry(function curried_remove(arr, obj) {

    var index = -1,
        len,
        i;

    if (isFunction(Array.prototype.indexOf)) {
      index = arr.indexOf(obj);
    } else {

      for (i=0, len=arr.length;i<len;i++) {
        if (arr[i] === obj) {
          index = i;
          break;
        }
      }
    }

    if (index > -1) {
      arr.splice(index, 1);
    }

  });

  /**
   * This next group of functions are just composable helpers that call methods on the objects passed in.
   *
   * COMPOSABLE HELPERS:
   * filter
   * reduce
   * map
   * get
   * set
   * log
   */
  var filter = curry(function curried_filter(fn, obj) {
        return obj.filter(fn);
      }),
      reduce = curry(function curried_reduce(fn, obj) {
        return obj.reduce(fn);
      }),
      map = curry(function curried_map(fn, obj) {
        return obj.map(fn);
      }),
      get = curry(function curried_get(prop, obj) {
        return obj[prop];
      }),
      set = curry(function curried_set(prop, value, obj) {
        obj[prop] = value;
        return obj;
      }),
      log = function composable_log(x) {

        if (typeof console.log !== 'undefined') {
          console.log(x);
        }

        return x;
      };

  /**
   * Simple cache that removes items based on least recently used (LRU).
   *
   * @name Cache
   * @class
   * @param {Object} options - A hash of options to configure the cache. Currently only supports
   * LIMIT (the max number of items in cache) and TIMEOUT (how long an entry should be valid).
   */
  var Cache = (function() {

    var defaults = {
      LIMIT   : 1000,
      TIMEOUT : (5 * 60 * 1000) // 5 minutes
    };

    function isExpired(entry, timeout) {
      return (currentTime() - entry.timestamp > timeout);
    }

    // Takes two entries and bidirectionally links them.
    function linkEntries(prevEntry, nextEntry) {

      if (nextEntry === prevEntry) return;

      if (nextEntry) {
        nextEntry.prev = prevEntry || null;
      }

      if (prevEntry) {
        prevEntry.next = nextEntry || null;
      }
    }

    // update the counter to keep track of most popular cached items.
    // TODO: implement least frequently used (LFU) caching as an option.
    function updateCounter(entry) {
      entry.counter = entry.counter + 1;
    }

    // takes an entry and makes it the head of the linked list
    function makeHead(entry, head, tail) {

      if (entry === head) return;

      if (!tail) {
        tail = entry;
      } else if (tail === entry) {
        tail = entry.prev;
      }

      linkEntries(entry.prev, entry.next);
      linkEntries(entry, head);

      head = entry;
      head.prev = null;
    }

    function _Cache(options) {

      this.store  = {};
      this.config = {};
      this.size   = 0;
      this.head   = null;
      this.tail   = null;

      extend(this.config, defaults, options);
    }

    /**
     *
     */
    _Cache.prototype.get = function(key) {

      if (this.store[key]) {

        // if we have a key but it's expired, blow the mother up.
        if (isExpired(this.store[key], this.config.TIMEOUT)) {
          this.remove(key);
          return null;
        }

        // otherwise, yeah b@$%#!, let's return the value and get moving.
        makeHead(this.store[key], this.head, this.tail);
        updateCounter(this.store[key]);
        return this.store[key].value;
      }

      return null;
    };

    /**
     *
     */
    _Cache.prototype.put = function(key, value) {

      if (isNothing(key) || isNothing(value)) return;

      if (!this.store[key]) {

        this.size = this.size + 1;
        this.store[key] = {
          key       : key,
          value     : value,
          next      : null,
          prev      : null,
          timestamp : currentTime(),
          counter   : 1
        };

      } else {
        this.store[key].value = value;
        this.store[key].timestamp = currentTime();
        updateCounter(this.store[key]);
      }

      makeHead(this.store[key], this.head, this.tail);

      if (this.size > this.config.LIMIT) {
        this.remove(this.tail.key);
      }

      return value;
    };

    /**
     *
     */
    _Cache.prototype.remove = function(key) {

      var entryToRemove;

      if (isNothing(this.store[key])) return;

      entryToRemove = this.store[key];

      if (entryToRemove === this.head) {
        this.head = entryToRemove.next;
      }

      if (entryToRemove === this.tail) {
        this.tail = entryToRemove.tail;
      }

      linkEntries(entryToRemove.prev, entryToRemove.next);

      delete this.store[key];

      size--;
    };

    function Cache(options) {
      return new _Cache(options);
    }

    /**
     * @name isCache
     * @memberOf Cache
     * @static
     */
    Cache.isCache = function(obj) {
      return (obj instanceof _Cache);
    };

    return Cache;

  }());

  /**
   *
   * @name Outlet
   * @class
   */
  var Outlet = (function() {

    function _Outlet(onNext, onError, onDone) {
      this._onError = onError || noop;
      this._onNext  = onNext || noop;
      this._onDone  = onDone || noop;
      this.isClosed = false;
    }

    /**
     * @name sendNext
     * @memberOf Outlet
     * @method
     * @instance
     */
    _Outlet.prototype.sendNext = function(val) {
      if (!this.isClosed) {
        this._onNext(val);
      }
    };

    /**
     * @name sendError
     * @memberOf Outlet
     * @method
     * @instance
     */
    _Outlet.prototype.sendError = function(err) {
      if (!this.isClosed) {
        this._onError(err);
      }
    };

    /**
     * @name sendDone
     * @memberOf Outlet
     * @method
     * @instance
     */
    _Outlet.prototype.sendDone = function() {
      if (!this.isClosed) {
        this.isClosed = true;
        this._onDone();
      }
    };

    function Outlet(onNext, onError, onDone) {
      return new _Outlet(onNext, onError, onDone);
    }

    /**
     * Does a boolean test on whether or not an object is an Outlet
     *
     * @name isOutlet
     * @memberOf Outlet
     * @static
     * @param {Object} obj Object to test
     */
    Outlet.isOutlet = function(obj) {
      return (obj instanceof _Outlet);
    };

    return Outlet;

  }());

  /**
   * Dispatcher is a helper object that helps the a stream manage its Outlets. A
   * new instance of the Dispatcher is created for each new stream. The owning stream
   * inherits references to its dispatcher's subscribe, broadcast and clear methods.
   *
   * @name Dispatcher
   * @class
   * @param  {Stream} stream The stream that owns this instance of the dispatcher.
   * @returns {Dispatcher}   A new dispatcher.
   */
  var Dispatcher = (function() {

    function _Dispatcher(stream) {

      var outlets  = [],
          breakers = [];

      /**
       * Add Outlets to the owning stream.
       *
       * @name subscribe
       * @memberOf Dispatcher
       * @method
       * @instance
       * @param   {Outlet} outlet - An outlet to subscribe to.
       * @returns {Function} A function to cancel the subscription.
       */
      this.subscribe = function(outlet) {

        var breaker;

        outlets.push(outlet);

        if (outlets.length === 1) {
          breaker = stream.seed(stream) || noop;
          breakers.push(breaker);
        }

        return function unsub() {

          var i = outlets.length;

          while (i--) {

            if (outlets[i] === outlet) {
              outlets.splice(i, 1);
              break;
            }
          }

          if (outlets.length === 0) {
            breaker();
          }
        }
      };

      /**
       * Handles notifying outlets of new data on the stream.
       *
       * @name broadcast
       * @memberOf Dispatcher
       * @method
       * @instance
       * @param {String} method - Method to use to notify outlets: 'sendNext', 'sendError', 'sendDone'
       * @param {Any}    data   - The data to broadcast.
       */
      this.broadcast = function(method, data) {
        each(function(outlet) {
          outlet[method](data);
        }, outlets);
      };

      /**
       * Used to burn it all down when this stream is destroyed.
       *
       * @name destroy
       * @memberOf Dispatcher
       * @method
       * @instance
       */
      this.destroy = function() {

        each(function(breaker) {
          breaker();
        }, breakers);

        outlets = [];
        breakers = [];
      };
    }

    function Dispatcher(stream) {
      return new _Dispatcher(stream);
    };

    Dispatcher.isDispatcher = function(obj) {
      return (obj instanceof _Dispatcher);
    }

    return Dispatcher;

  }());

  /**
   * Main constructor for a new Stream
   *
   * @name Stream
   * @class
   * @param {Function} seed      - A function to seed values for the stream
   * @param {Function} transform - A function to transform the values of the stream.
   */
  var Stream = (function() {

    // Mostly for debugging, we're going to give each stream a unique id number.
    var id = 0;

    // Stream helpers
    function isStream(obj) {
      return (obj instanceof _Stream);
    }

    // For when we just need a stream to pass along its value without a transform.
    function streamIdentity(stream, val) {
      stream.broadcast('sendNext', val);
    }

    // Creates a new stream with a given transform.
    function withTransform(source, transform) {
      return Stream(function(downStream) {
        // pipe returns a function to unsubscribe from values of the passed in stream.
        source.pipe(downStream);
      }, transform);
    }

    function _Stream(seed, transform) {
      this.transform  = transform || streamIdentity;
      this.dispatcher = Dispatcher(this);
      this.broadcast  = this.dispatcher.broadcast;
      this.seed       = seed;
      this._id        = id++;
      this.isClosed   = false;
    }

    var streamProto = _Stream.prototype;

    /**
     * Subscribes to values on this stream
     *
     * @name subscribe
     * @method
     * @memberOf Stream
     * @instance
     * @param {Function} onNext  - Function to call when next value is written to Stream
     * @param {Function} onError - Function to call when the Stream errors
     * @param {Function} onDone  - Function to call when the Stream closes
     * @returns {Function} - A function to unsubscribe to this stream
     */
    streamProto.subscribe = function(onNext, onError, onDone) {
      return this.dispatcher.subscribe(Outlet(onNext, onError, onDone));
    };

    /**
     * Pipes the data from this stream to another stream.
     *
     * @name pipe
     * @method
     * @memberOf Stream
     * @instance
     * @param {Stream} stream - Stream to add to the dependant stack
     * @returns {Function} A function to unsubscribe to the updates on the piped function.
     */
    streamProto.pipe = function(stream) {

      assert(isStream(stream), 'Stream.pipe received a non Stream');

      return this.subscribe(
        // onNext
        function(val) {
          stream.write(val);
        },
        // onError
        function(err) {
          stream.error(err);
        },
        // onDone
        function() {
          stream.close();
        }
      );
    };

    /**
     * Called when there is new data on the stream that needs to be processed.
     *
     * @name write
     * @method
     * @memberOf Stream
     * @instance
     * @param {Any} data - Data to write to the stream. Data can be any type.
     */
    streamProto.write = function(data) {

      try {
        this.transform(this, data);
      } catch(err) {
        this.broadcast('sendError', err);
      }

      return this;
    };

    /**
     * Throws and error onto the stream. Errors will pass to the end of the line without
     * blowing anyting up, almost like a non value.
     *
     * @name error
     * @method
     * @memberOf Stream
     * @instance
     * @param {Any} error - The error message and associated data to pass along.
     */
    streamProto.error = function(error) {
      this.broadcast('sendError', error);
    };

    /**
     * Closes this stream.
     *
     * @name close
     * @method
     * @memberOf Stream
     * @instance
     */
    streamProto.close = function() {

      if (!this.isClosed) {
        // Alert outlets we're closing down.
        this.broadcast('sendDone');
        // Tell the dispatcher to remove outlets.
        this.dispatcher.destroy();
        this.isClosed = true;
      }
    };

    /**
     * Bind the values of a stream to the value of an object's given property.
     * Useful for binding the values of a stream to a DOM node.
     *
     * EXAMPLE:
     * stream.assign('innerHTML', div);
     *
     * @name bindObject
     * @method
     * @memberOf Stream
     * @instance
     * @param {String} prop The property to which to bind the value of this stream.
     * @param {Object} obj  The object on which the property resides.
     * @returns {Stream} The original Stream
     */
    streamProto.bindObject = streamProto.assign = function(prop, obj) {

      var source = this,
          breaker;

      return Stream(function(downStream) {
        obj[prop] = val;
      });

      this.subscribe(function(val) {
        obj[prop] = val;
      });

      return this;
    };

    /**
     * Takes a function that returns a new stream and returns a new stream itself that flattens
     * the two streams into one.
     *
     * @name flatMapLatest
     * @method
     * @memberOf Stream
     * @instance
     * @param {Function} mapping A function that takes a value and returns a new stream.
     * @returns {Stream} A new Stream.
     */
    streamProto.flatMapLatest = function(mapping, thisArg) {

      var source      = this,
          innerStream = null,
          breaker;

      mapping = bindCallback(mapping, thisArg);

      return Stream(function(downStream) {

        breaker = source.subscribe(
          // onNext
          function(val) {
            /**
             * If there is already an inner stream, close it. It is no longer relevant now that
             * a new stream is being created.
             */
            if (innerStream) {
              innerStream.close();
              innerStream = null;
            }

            /**
             * Our new stream is a product of calling the mapping function with the next value
             * on the previous stream.
             */
            innerStream = mapping(val);

            innerStream.subscribe(
              function(val) {
                downStream.write(val);
              },
              function(err) {
                downStream.error(err);
              }
            );
          },
          // onError
          function(err) {
            downStream.error(err);
          },
          // onDone
          function() {
            downStream.close();
          }
        );

        return lazy(breaker);
      });
    };

    /**
     * Returns a stream that will only produce values until the stopper stream produces a
     * value.
     *
     * @name takeUntil
     * @method
     * @memberOf Stream
     * @instance
     * @param {Stream} stopper - A stream on which this stream will stop emitting values
     * when it emits its first value after the creating of the new stream
     * @returns {Stream} A new Stream that closes once the stopper returns false
     */
    streamProto.takeUntil = function(stopper) {

      var source   = this,
          breakers = [];

      return Stream(function(downStream) {

        breakers.push(source.pipe(downStream));

        breakers.push(stopper.subscribe(function(val) {
          downStream.close();
          breaker();
        }));

        return function() {
          each(function(breaker) {
            breaker();
          }, breakers);
          breaker = null;
          source = null;
        }
      });
    };

    /**
     * Maps a function over the values of this stream
     *
     * @name map
     * @method
     * @memberOf Stream
     * @instance
     * @param {Any} mapping - If a function is passed, the values on the stream will be passed
     * to the function and the result of that function will be added to the stream. If any
     * other value is passed to the stream, the values on the stream will be replaced with
     * that value.
     * @param {Object} thisArg - an object to bind to the value of this in the mapping function
     * @returns {Stream} A new Stream with the mapping applied to the previous stream.
     */
    streamProto.map = function(mapping, thisArg) {
      var mappingFn = (typeof mapping === 'function') ? mapping : function () { return mapping; };
      mappingFn = bindCallback(mappingFn, thisArg);
      return withTransform(this, function(stream, val) {
        stream.broadcast('sendNext', mappingFn(val));
      });
    };

    /**
     * Takes an input stream and returns a new stream of the values from this stream filtered by
     * the values of the input stream. Values will only continue on if the input stream most
     * recently emitted a truthy value.
     *
     * @name and
     * @method
     * @memberOf Stream
     * @instance
     * @param {Stream} filterStream - A stream to filter this stream with. Values will only continue
     * down the stream if the input stream produces a truthy value. Doesn't have to be a Boolean.
     * @returns {Stream} A new Stream of the filtered values.
     */
    streamProto.and = function(filterStream) {

      var source    = this,
          testValue = null,
          breakers  = [];

      return Stream(function(downStream) {

        breakers.push(filterStream.subscribe(function(val) {
          testValue = val;
        }));

        breakers.push(source.subscribe(
          // onNext
          function(val) {
            if (testValue) {
              downStream.broadcast('sendNext', val);
            }
          },
          // onError
          function(err) {
            downStream.broadcast('sendError', err);
          },
          // onDone
          function() {
            downStream.broadcast('sendDone');
          }
        ));

        return function() {
          each(function(breaker) {
            breaker();
          }, breakers);
          breakers = null;
          source = null;
          testValue = null;
        }
      });
    };

    /**
     * Only return values on the stream if they are different from the previous value on the
     * stream. In other words, only return values on the stream when there is a change in the
     * value.
     *
     * @name dropRepeats
     * @method
     * @memberOf Stream
     * @instance
     * @returns {Stream} A new Stream that filters out consecutive repeated values.
     */
    streamProto.dropRepeats = function() {

      var prevVal = null;

      return this.filter(function(val) {

        if (val !== prevVal) {
          prevVal = val;
          return true;
        }

        return false;
      });
    };

    /**
     * Takes a delay and returns a stream that will update at most once per the
     * delay duration.
     *
     * @name debounce
     * @method
     * @memberOf Stream
     * @instance
     * @param {Number} delay - Time (milliseconds) to delay each update on the stream.
     * @returns {Stream} A new Stream with the delay applied.
     */
    streamProto.debounce = function(delay) {

      var timer = null,
          saved = null;

      return withTransform(this, function(stream, val) {

        saved = val;

        if (timer) clearTimeout(timer);

        timer = setTimeout(function() {

          stream.broadcast('sendNext', saved);
          saved = null;
          timer = null;

        }, delay);
      });
    };

    /**
     * Creates a new stream with the values of the current stream filtered by the function
     * passed in.
     *
     * @name filter
     * @method
     * @memberOf Stream
     * @instance
     * @param {Function} predicate - function used to filter the stream. Removes values from the stream
     * if this function returns a falsy value
     * @param {Object} thisArg - an object to bind to the value of this in the filter function
     * @returns {Stream} A new Stream
     */
    streamProto.filter = streamProto.keepWhen = function(predicate, thisArg) {
      var predicateFn = isFunction(predicate) ? predicate : function(val) { return (predicate === val); };
      predicateFn = bindCallback(predicateFn, thisArg);
      return withTransform(this, function(stream, val) {
        if (predicateFn(val)) {
          stream.broadcast('sendNext', val);
        }
      });
    };

    /**
     * A filter function that returns a new stream that drops values when the given
     * function evaluates to true.
     *
     * @name dropWhen
     * @method
     * @memberOf Stream
     * @instance
     * @param {Function} predicate - Function to test against.
     * @param {Object} thisArg - an object to bind to the value of this in the filter function
     * @returns {Stream} A new Stream
     */
    streamProto.dropWhen = function(predicate, thisArg) {
      var predicateFn = isFunction(predicate) ? predicate : function(val) { return (predicate === val); };
      predicateFn = bindCallback(predicateFn, thisArg);
      return withTransform(this, function(stream, val) {
        if (!predicateFn(val)) {
          stream.broadcast('sendNext', val);
        }
      });
    };

    /**
     * Takes only the specified number from the stream, then never again.
     *
     * @name take
     * @method
     * @memberOf Stream
     * @instance
     * @param {Number} number - Number of values to take off the stream.
     * @returns {Stream} A new Stream
     */
    streamProto.take = function(number) {

      return withTransform(this, function(stream, val) {

        if (number > 0) {
          number = number - 1
          stream.broadcast('sendNext', val);
        } else {
          stream.broadcast('sendDone');
        }

      });
    };

    /**
     * For use in combination with buffering/throttling to only take the most recent value
     * in an array of values.
     *
     * @name takeLastest
     * @method
     * @memberOf Stream
     * @instance
     * @returns {Stream} Returns a new Stream that flattens buffered values into the most recent
     * value.
     */
    streamProto.takeLastest = function() {

      return this.map(function(val) {

        if (isArray(val) && val.length > 0) {
          return val[0];
        }

        return val;
      });
    };

    /**
     * Reduces the values returned by the stream into a single value
     *
     * @name reduce
     * @method
     * @memberOf Stream
     * @instance
     * @param {Function} fn - function used to reduce the values in the stream. The function takes
     * the accumulated value so far and the next value in the stream as parameters.
     * @param {Any} acc - initial value of the accumulator used by the function. This will default
     * to the first value of the stream.
     * @param {Object} thisArg - an object to bind to the value of this in the reduce function
     * @returns {Stream} returns a new stream
     */
    streamProto.reduce = function(fn, acc, thisArg) {
      fn = bindCallback(fn, thisArg);
      return withTransform(this, function(stream, val) {
        acc = (isUndefined(acc)) ? val : fn(acc, val);
        stream.broadcast('sendNext', acc);
      });
    };

    /**
     * Returns a new stream that produces arrays of values. The array is the last
     * n number of values on the parent stream.
     *
     * @name cacheValues
     * @method
     * @memberOf Stream
     * @instance
     * @param {Number} num The number of values to hold in the cache
     * @return {Stream} returns a new stream
     */
    streamProto.cacheValues = function(num) {
      var cache = [];
      return withTransform(this, function(stream, val) {
        if (cache.length >= num) {
          cache.shift();
        }
        cache.push(val);
        stream.broadcast('sendNext', cache);
      });
    };

    /**
     * Throttles the stream so that it only updates outlets at most once per the delay
     * duration. Unlike debounce, values on this stream are not dropped, they are put
     * into a buffer queue and the buffer queue (an array) is pushed out as the value of
     * this stream. Outlets of this stream will always get an array as value.
     *
     * @name bufferWithTime
     * @method
     * @memberOf Stream
     * @instance
     * @param {Number} delay - delay applied to stream in milliseconds
     * @returns {Stream}
     */
    streamProto.bufferWithTime = function(delay) {

      var timer = null,
          queue = [];

      return withTransform(this, function(stream, val) {

        queue.push(val);

        if (!timer) {

          timer = setTimeout(function() {

            stream.broadcast('sendNext', queue);
            queue.length = 0;
            timer = null;

          }, delay);
        }
      });
    };

    /**
     * Logs the value on the stream and continues the flow.
     *
     * @name log
     * @method
     * @memberOf Stream
     * @instance
     * @returns {Stream} A new stream that logs values without transforming them.
     */
    streamProto.log = function() {

      return withTransform(this, function(stream, val) {
        log(val);
        stream.broadcast('sendNext', val);
      });
    };

    /**
     * Merges a stream with the current stream and returns a new stream
     *
     * @name merge
     * @method
     * @memberOf Stream
     * @instance
     * @param {Object} stream - stream to merge with current stream
     * @returns {Stream} A new Stream
     */
    streamProto.merge = function(stream) {
      assert(isStream(stream), 'Stream.merge did not receive a Stream');
      return Stream.fromMerge(this, stream);
    };

    /**
     * Returns a new stream recieving values from a main stream and a stream to sample.
     * The new stream is called everytime their is a new value on the main stream.
     * The new stream recieves pairs of values.
     *
     * @name sample
     * @method
     * @memberOf Stream
     * @instance
     * @param {Stream} stream - Stream to sample
     * @returns {Stream} A new Stream
     */
    streamProto.sample = function(stream) {

      assert(isStream(stream), 'Stream.sample did not receive a Stream');

      var sampleVal   = null,
          mainStream  = this,
          breakers    = [];

      return Stream(function(downStream) {

        breakers.push(stream.subscribe(function(val) {
          sampleVal = val;
        }));

        breakers.push(mainStream.subscribe(function(val) {
          downStream.write([val, sampleVal])
        }));

        return function() {
          each(function(breaker) {
            breaker();
          }, breakers);
          sampleVal = null;
          mainStream = null;
          stream = null;
          breakers = null;
        }
      });
    }

    /**
     * Returns a new Stream that produces pairs of values from the parent Streams
     *
     * @name zipWith
     * @method
     * @memberOf Stream
     * @instance
     * @param {Stream} stream2 - The Stream to zip with the current Stream.
     * @returns {Stream} A new Stream.
     */
    streamProto.zipWith = streamProto.zip = function(stream2) {

      assert(isStream(stream2), 'Stream.zipWith did not receive a Stream');

      var val1     = null,
          val2     = null,
          stream1  = this,
          breakers = [];

      return Stream(function(downStream) {

        breakers.push(stream1.subscribe(function(val) {
          val1 = val;
          if (val2) downStream.write([val1, val2]);
        }));

        breakers.push(stream2.subscribe(function(val) {
          val2 = val;
          if (val1) downStream.write([val1, val2]);
        }));

        return function() {
          each(function(breaker) {
            breaker();
          }, breakers);
          breakers = null;
          stream1 = null;
          val1 = null;
          val2 = null;
        }
      });
    };

    /**
     * Only for event Streams. Otherwise shit's gonna blow up.
     *
     * @name preventDefault
     * @method
     * @memberOf Stream
     * @instance
     * @returns {Stream} A new Stream
     */
    streamProto.preventDefault = function() {
      return withTransform(this, function(stream, evt) {
        evt.preventDefault();
        evt.stopPropagation();
        stream.broadcast('sendNext', evt);
      });
    };

    /**
     * Returns a stream of http responses. Responses will only be written to the stream
     * in order. Responses that return out of order are disguarded.
     *
     * EXAMPLE:
     * toHttpStream({
     *   method : 'POST',
     *   dataType : 'text',
     *   cache : false
     * })
     *
     * // include a custom Cache
     * toHttpStream({
     *   cache : Cache(options)
     * })
     *
     * @name toHttpStream
     * @method
     * @memberOf Stream
     * @instance
     * @param {Object} options - A hash of options to configure the http request and cahce.
     * @returns {Stream} A new Stream
     */
    streamProto.toHttpStream = function(options) {

      var options = options || {},
          cache   = Cache.isCache(options.cache) ? options.cache :
                    (options.cache === false) ? false : Cache();

      delete options.cache;

      return Stream.createHttpStream(this, cache, options);
    };

    /**
     * A conviniece constructor, wrapping the new operator, so that this is more easily
     * composoable.
     */
    function Stream(seed, transform) {
      return new _Stream(seed, transform);
    }

    /**
     * Does a boolean check if an object is a Stream
     *
     * @name isStream
     * @method
     * @static
     * @memberOf Stream
     * @param {Object} obj - Object to check
     * @returns {Boolean} Is the object a Stream?
     */
    Stream.isStream = function(obj) {
      return isStream(obj);
    };

    /**
     * Creates a stream with an initial value. The returned stream is useful for merging
     * with other streams.
     *
     * @name fromValue
     * @method
     * @static
     * @memberOf Stream
     * @param {Any} val - A value to be emitted when the stream is subscribed to.
     * @returns {Stream} - A new stream that emits a single value
     */
    Stream.fromValue = function(val) {
      return Stream(function(downStream) {
        downStream.write(val);
      });
    };

    /**
     * Takes an array and returns a stream with each value in the array pushed onto the
     * stream.
     *
     * @todo Should the values be fed onto the stream asyncronously using immediate()?
     *
     * @name fromArray
     * @method
     * @static
     * @memberOf Stream
     * @param {Array} arr - Array used as the input for the new stream.
     * @returns {Stream} - A new stream that will be fed the values in the array once it
     * has a subscriber.
     */
    Stream.fromArray = function(arr) {

      return Stream(function(downStream) {

        each(function(element) {
          downStream.write(element);
        }, arr);

        downStream.close();
      });
    };

    /**
     * Takes a promise and returns a new stream that will emit the value of the promise
     * when it is known.
     *
     * @name fromPromise
     * @method
     * @static
     * @memberOf Stream
     * @param {Object} promise - The promise to convert into a Stream.
     * @returns {Stream} A new Stream.
     */
    Stream.fromPromise = function(promise) {

      return Stream(function(downStream) {

        promise.then(function(val) {
          downStream.write(val);
        }, function(err) {
          downStream.error(err);
        });
      });
    };

    /**
     * Takes a function that wraps a function that takes a callback. We provide the callback
     * to the inner function and feed a stream from the value that callback receives.
     *
     * Example:
     * function(callback) {
     *   ajax(query, callback);
     * }
     *
     * @name fromCallback
     * @method
     * @static
     * @memberOf Stream
     * @param {Function} fn - Function that wraps a function that takes a callback and receives
     * that callback as an argument.
     * @returns {Stream} A new stream that gets it's value from that callback function.
     */
    Stream.fromCallback = function(fn) {

      return Stream(function(downStream) {

        fn(function(val) {
          downStream.write(val);
        });
      });
    };

    /**
     * Creates a new stream by merging together the passed in streams.
     *
     * @name fromMerge
     * @method
     * @static
     * @memberOf Stream
     * @param {Stream(s)} One or more streams to merge
     * @returns {Stream} A new stream that receives values from all the merged streams.
     */
    Stream.fromMerge = function(/* streams */) {

      var toMerge = toArray(arguments);

      return Stream(function(downStream) {

        each(function(source) {

          assert(isStream(source), 'Stream.fromMerge recieved a non stream as an argument');

          source.pipe(downStream);

        }, toMerge);

      });
    };

    /**
     * Create a stream of Http responses.
     *
     * @name createHttpStream
     * @method
     * @static
     * @memberOf Stream
     * @param {Function} source  - Stream to feed the new stream.
     * @param {Cache}    cache   - Object to cache http requests.
     * @param {Object}   options - A hash of options to pass to the http function.
     * @returns {Stream} A new stream.
     */
    Stream.createHttpStream = function(source, cache, options) {

      var config = {
        dataType : 'json',
        method : 'GET'
      };

      extend(config, options);

      return source.flatMapLatest(function(url) {

        assert(isString(url), "Url for HttpStream must be a string");

        return Stream(function(downStream) {

          var entry = (Cache.isCache(cache)) ? cache.get(url) : null;

          if (entry) {

            // if we have data we'll asyncronously return it as fast as possible.
            if (entry.data) {

              immediate(function() {
                downStream.broadcast('sendNext', entry.data);
              });
            }

          } else {

            // Make an entry to put into the cache.
            entry = {
              request : $.ajax({
                url : url,
                method : config.method,
                dataType : config.dataType
              }),
              data : null
            };

            entry.request.then(function(response) {
              entry.data = response;
              entry.request = null;
              downStream.broadcast('sendNext', response);
            },
            function(err) {
              // on error, propogate the error down the stream.
              downStream.broadcast('sendError', err);
            });

            if (cache) {
              cache.put(url, entry);
            }

          }
        });
      });
    };

    /**
     * Creates a new stream of events, given an event name and a Dom node to attach to. The
     * stream is lazy. The event is not attached until the stream is subscribed to.
     *
     * @name fromEvent
     * @method
     * @static
     * @memberOf Stream
     * @param {String}     eventName - Name of event to listen to.
     * @param {DOM|jQuery} target    - Dom node to attach to. Alternatively, you can also pass a
     * jQuery object or similar wrapper that provides an 'on' method for listening to events.
     * @returns {Object} A new stream of events.
     */
    Stream.fromEvent = curry(function(eventName, target) {

      return Stream(function(downStream) {

        return addEvent(
          eventName,
          function eventHandler(evt) {
            downStream.write(normalizeEvent(evt));
          },
          target
        );
      });
    });

    // Extend jQuery, if it's available.
    if (isFunction($)) {

      $.fn.createStreamFrom = function(eventName) {
        return Stream.fromEvent(eventName, this);
      };
    }

    return Stream;

  }());

  // EXPORTS

  // Main exports
  Frampton.Stream = Stream;
  Frampton.Cache  = Cache;

  // Helpers
  Frampton.bindCallback = bindCallback
  Frampton.toArray      = toArray;
  Frampton.memoize      = memoize;
  Frampton.compose      = compose;
  Frampton.curry        = curry;
  Frampton.log          = log;
  Frampton.get          = get;
  Frampton.set          = set;
  Frampton.map          = map;
  Frampton.filter       = filter;
  Frampton.reduce       = reduce;
  Frampton.foldr        = foldr;
  Frampton.foldl        = foldl;
  Frampton.lazy         = lazy;

  // Boolean checks
  Frampton.isString    = isString;
  Frampton.isNumber    = isNumber;
  Frampton.isArray     = isArray;
  Frampton.isFunction  = isFunction;
  Frampton.isNothing   = isNothing;
  Frampton.isSomething = isSomething;
  Frampton.isUndefined = isUndefined;
  Frampton.isDefined   = isDefined;

  // Finally, unleash ourselves onto the world.
  global.Frampton = Frampton;

  if ( isFunction(define) && define.amd ) {
    define( "Frampton", [], function() {
      return Frampton;
    });
  }

}(window, window.document, window.jQuery, window.define));