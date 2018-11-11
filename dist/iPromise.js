/** iPromise
 *    @detail:    模拟 promise
 *    @return:     function
 *    @author:    linpengteng
 *    @date:      2018.10.11
 */
(function (root, factory) {
    if (typeof module === "object" && module) {
        module.exports = factory();
    } else if (typeof define === 'function' && define.amd) {
        define([], factory);
    }  else if (typeof root === "object" && root) {
        root.iPromise = factory();
    }
})(this, function() {

    function empty () {}
    function isArray (arr) {
        return Object.prototype.toString.call(arr) === '[object Array]';
    }
    function isObject (obj) {
        return Object.prototype.toString.call(obj) === '[object Object]';
    }
    function isString (str) {
        return Object.prototype.toString.call(str) === '[object String]';
    }
    function isBoolean (bool) {
        return Object.prototype.toString.call(bool) === '[object Boolean]';
    }
    function isFunction (func) {
        return Object.prototype.toString.call(func) === '[object Function]';
    }
    function isErrFirst (errFirst) {
        return isBoolean(errFirst)?  errFirst: iPromise.errFirst === true;
    }

    function run (promise) {
        if (promise._status === 'pending') {
            return;
        }
        var value = promise._value;
        var status = promise._status;
        var context = promise._context;
        var callbacks = status === 'resolved'? promise._doneCallbacks: promise._failCallbacks;

        setTimeout(function () {
            for (var i = 0, len = callbacks.length; i < len; i++) {
                callbacks[i](status, context, value);
            }
        }, 0);

        promise._doneCallbacks = [];
        promise._failCallbacks = [];
    }
    function reject (promise, err) {
        if (promise._status !== 'pending') {
            return;
        }
        promise._value = err;
        promise._status = 'rejected';
        run(promise);
    }
    function resolve (promise, data) {
        if (promise._status !== 'pending') {
            return;
        }
        promise._value = data;
        promise._status = 'resolved';
        run(promise);
    }
    function newCallback (promise, callback, action) {
        return function promiseCallback(status, context, value) {
            if (isFunction(callback)) {
                var x;
                var slice = Array.prototype.slice;
                try {
                    promise._context = context;
                    x = callback.apply(context, value);
                }
                catch (e) {
                    reject(promise, [e]);
                }
                if (action === 'finally') {
                    status === 'resolved' && resolve(promise, value);
                    status === 'rejected' && reject(promise, value);
                }
                else {
                    if (x === promise) {
                        var err = new TypeError('The return value could not be same with the promise');
                        reject(promise, [err]);
                    }
                    else if (x instanceof iPromise){
                        x.then(
                            function () { resolve(promise, slice.call(arguments, 0)); },
                            function () { reject(promise, slice.call(arguments, 0)); }
                        );
                    }
                    else {
                        (function resolveThenable(args) {
                            var then;
                            var arg = args.length === 1? args[0]: args;
                            var x = isObject(arg) || isFunction(arg)? arg: args;
                            if (isObject(x) || isFunction(x)) {
                                try {
                                    then = x.then;
                                }
                                catch (e) {
                                    reject(promise, [e]);
                                    return;
                                }
                                if (isFunction(then)) {
                                    var invoked = false;
                                    try {
                                        x.then(
                                            function (y) {
                                                if (invoked) {
                                                    return;
                                                }
                                                invoked = true;
                                                if (y === x) {
                                                    throw new TypeError('The return value could not be same with the previous thenable object');
                                                }
                                                resolveThenable(slice.call(arguments, 0));
                                            },
                                            function () {
                                                if (invoked) {
                                                    return;
                                                }
                                                invoked = true;
                                                reject(promise, slice.call(arguments, 0));
                                            }
                                        );
                                    }
                                    catch (e) {
                                        if (!invoked) {
                                            reject(promise, [e]);
                                        }
                                    }
                                }
                                else {
                                    resolve(promise, args);
                                }
                            }
                            else {
                                resolve(promise, args);
                            }
                        }([x]));
                    }
                }
            }
            else {
                promise._context = context;
                status === 'resolved' && resolve(promise, value);
                status === 'rejected' && reject(promise, value);
            }
        };
    }

    function iPromise(resolver) {
        if (!(this instanceof iPromise)) {
            throw new TypeError('undefined is not a promise');
        }
        else if (!isFunction(resolver)) {
            throw new TypeError("iPromise resolver " + String(resolver) + " is not a function");
        }
        else {
            return this.init(resolver);
        }
    }
    iPromise.prototype.init = function (resolver) {
        var promise = this;
        var slice = Array.prototype.slice;
        this._doneCallbacks = [];
        this._failCallbacks = [];
        this._status = 'pending';
        try {
            resolver.call(
                promise,
                function () { resolve(promise, slice.call(arguments, 0)); },
                function () { reject(promise, slice.call(arguments, 0)); }
            );
        } catch(err) {
            reject(promise, [err]);
        }
    };
    iPromise.prototype.then = function (onResolve, onReject) {
        var promise = new iPromise(empty);
        this._doneCallbacks.push(newCallback(promise, onResolve, 'resolve'));
        this._failCallbacks.push(newCallback(promise, onReject, 'reject'));
        run(this);
        return promise;
    };
    iPromise.prototype.finally = function (onFinally) {
        var promise = new iPromise(empty);
        this._doneCallbacks.push(newCallback(promise, onFinally, 'finally'));
        this._failCallbacks.push(newCallback(promise, onFinally, 'finally'));
        run(this);
        return promise;
    };
    iPromise.prototype.catch = function (onReject) {
        return this.then(null, onReject);
    };

    iPromise.all = function (it) {
        if (!isArray(it) && !isString(it)) {
            throw new TypeError('Cannot read property iterator of undefined');
        }

        var count = 0;
        var result = [];
        var settled = false;
        var length = it.length;
        var promise = new iPromise(empty);
        var slice = Array.prototype.slice;

        if (length === 0) {
            resolve(promise, []);
        }
        else {
            for (var i = 0; i < length; i++) {
                var iterate = it[i];
                iterate = iPromise.resolve(iterate);
                iterate.then(newAllCallback(i, 'resolve'), newAllCallback(i, 'reject'));
            }
        }

        function newAllCallback(index, action) {
            return function () {
                if (settled) {
                    return;
                }
                if (action === 'reject') {
                    settled = true;
                    reject(promise, slice.call(arguments, 0));
                }
                if (arguments) {
                    result[index] = arguments.length > 1? slice.call(arguments, 0): arguments[0];
                }
                if (++count === length) {
                    settled = true;
                    resolve(promise, result);
                }
            }
        }

        return promise;

    };
    iPromise.race = function (it) {
        if (!isArray(it) && !isString(it)) {
            throw new TypeError('Cannot read property iterator of undefined');
        }

        var settled = false;
        var length = it.length;
        var promise = new iPromise(empty);
        var slice = Array.prototype.slice;

        if (length === 0) {
            resolve(promise, []);
        }
        else {
            for (var i = 0;  i < length; i++) {
                var iterate = it[i];
                iterate = iPromise.resolve(iterate);
                iterate.then(newRaceCallback('resolve'), newRaceCallback('reject'));
            }
        }

        function newRaceCallback(action) {
            return function (value) {
                if (settled) {
                    return;
                }
                if (!settled) {
                    settled = true;
                }
                if (action === 'resolve') {
                    resolve(promise, slice.call(arguments, 0));
                }
                if (action === 'reject') {
                    reject(promise, slice.call(arguments, 0));
                }
            }
        }

        return promise;
    };
    iPromise.reject = function (err) {
        var promise = new iPromise(empty);
        var slice = Array.prototype.slice;
        reject(promise, slice.call(arguments, 0));
        return promise;
    };
    iPromise.resolve = function (data) {
        if(data instanceof iPromise){ return data; }
        else {
            var slice = Array.prototype.slice;
            var promise = new iPromise(empty);
            (function resolveThenable(args) {
                var then;
                var arg = args.length === 1? args[0]: args;
                var x = isObject(arg) || isFunction(arg)? arg: args;
                if (isObject(x) || isFunction(x)) {
                    try {
                        then = x.then;
                    }
                    catch (e) {
                        reject(promise, [e]);
                        return;
                    }
                    if (isFunction(then)) {
                        var invoked = false;
                        try {
                            x.then(
                                function (y) {
                                    if (invoked) {
                                        return;
                                    }
                                    invoked = true;
                                    if (y === x) {
                                        throw new TypeError('The return value could not be same with the previous thenable object');
                                    }
                                    resolveThenable(slice.call(arguments, 0));
                                },
                                function () {
                                    if (invoked) {
                                        return;
                                    }
                                    invoked = true;
                                    reject(promise, slice.call(arguments, 0));
                                }
                            );
                        }
                        catch (e) {
                            if (!invoked) {
                                reject(promise, [e]);
                            }
                        }
                    }
                    else {
                        resolve(promise, args);
                    }
                }
                else {
                    resolve(promise, args);
                }
            }(slice.call(arguments, 0)));
        }
        return promise;
    };
    iPromise.compile = function (fn, context, bool) {
        if (!isFunction(fn)) {
            throw new TypeError("iPromise " + String(fn) + " is not a function");
        }
        if (fn.isCompiled === true) {
            return fn;
        }
        function iPromised(){
            var slice = Array.prototype.slice;
            var argArr = slice.call(arguments, 0);
            return new iPromise(function(resolve, reject) {
                try {
                    var promise = this;
                    var defThis = (function(){ return this }());
                    argArr.push(isErrFirst(bool)
                        ? function(){
                            (this !== defThis) && (promise._context = this);
                            arguments[0]?
                                reject.apply(null, slice.call(arguments, 0)):
                                resolve.apply(null, slice.call(arguments, 1));
                        }
                        : function(){
                            (this !== defThis) && (promise._context = this);
                            resolve.apply(null, slice.call(arguments, 0));
                        }
                    );
                    promise._context = context;
                    fn && fn.apply(context, argArr);
                }
                catch (e) {
                    reject([e]);
                }
            });
        }
        return (iPromised.isCompiled = true) && iPromised;
    };

    return iPromise;

});