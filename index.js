const Xray = require('x-ray');

/**
 * An Xray wrapper that delegates everything to a real Xray instance.  Provides extra functionality.
 * @typedef XrayWrapper
 * @property options {object}   options instance was constructed with, useful for doing things like dynamically adding filters
 */

/**
 * A promise that contains an extra "toHandler" function to convert the promise into a callback/handler
 * @typedef XrayPromise
 * @proeprty toHandler {function} a toHandler function
 */

/**
 * Construct an Xray instance that adds a new toPromise method
 * @param options xray options
 * @returns {XrayWrapper} a wrapped xray instance
 * @constructor
 */
function XrayPromiseWrapper(options) {
    const xOptions = Object.assign({
        filters: {},
    }, options);
    const delegate = new Xray(xOptions);
    const addToHandlerFn = (promise) => {
        /* add a toHandler method to promise */
        Object.assign(promise, {
            toHandler: callback => promise.then(r => callback(null, r)).catch(e => callback(e)),
        });
        /* recursively mutate results */
        ['then', 'catch'].forEach((fnName) => {
            const fn = promise[fnName];
            promise[fnName] = (...fnArgs) => {
                const r = fn.apply(promise, fnArgs);
                if (r && typeof (r.then) === 'function') {
                    return addToHandlerFn(r);
                }
                return r;
            };
        });
        return promise;
    };
    const wrapper = (...constArgs) => {
        const xNode = delegate.apply(delegate, constArgs);
        xNode.toPromise = () => {
            const newPromise = addToHandlerFn(new Promise((resolve, reject) => {
                xNode((error, result) => {
                    if (error) {
                        reject(error);
                    } else {
                        resolve(result);
                    }
                });
            }));
            return newPromise;
        };
        return xNode;
    };
    wrapper.options = xOptions;
    wrapper.delegate = delegate;
    /* lets update some functions! */
    Object.keys(delegate).map(key => ({
        key, value: delegate[key],
    })).filter(kv => typeof (kv.value) === 'function')
        .forEach((kv) => {
            wrapper[kv.key] = (...fnArgs) => {
                const result = kv.value.apply(delegate, fnArgs);
                /* if function returns "this" return wrapper */
                if (result === delegate) {
                    return wrapper;
                }
                /* if function does not return this, return real result */
                return result;
            };
        });

    return wrapper;
}
module.exports = XrayPromiseWrapper;
