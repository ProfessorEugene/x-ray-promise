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
 * @param args xray construction arguments
 * @returns {XrayWrapper} a wrapped xray instance
 * @constructor
 */
function XrayPromiseWrapper(...args) {
    let delegate = new Xray(...args);
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
    wrapper.options = args[0];
    wrapper.delegate = delegate;
    /* lets update some functions! */
    Object.keys(delegate).map(key => ({
        key, value: delegate[key],
    })).filter(kv => typeof (kv.value) === 'function')
        .forEach((kv) => {
            wrapper[kv.key] = (...fnArgs) => {
                delegate = kv.value.apply(delegate, fnArgs);
                return wrapper;
            };
        });

    return wrapper;
}
module.exports = XrayPromiseWrapper;
