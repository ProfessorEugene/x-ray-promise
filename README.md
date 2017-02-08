# x-ray-promise

An [x-ray](https://github.com/lapwinglabs/x-ray) wrapper that patches basic promise support into x-ray instances.

Basic usage:
```js
/* standard Xray usage for construction and config: */
var XrayPromise = require('x-ray-promise');
var x = XrayPromise({
    filters: {...}
    });
x.concurrency(7).limit(5,100);

/* basic promise usage: */
x('https://www.google.com/','title).toPromise().then(...).catch(...);

/* fancier promise usage: */
x('https://www.google.com/',{
    anotherSite: x('a@href',{
        title: (ctx, cb) => x(ctx,'title').toPromise().toHandler(cb),
        anotherTitle: x(ctx,'title')
    })
}).toPromise().then(...).catch(...);

/* dynamicly add filters: */
Object.assign(x.options.filters,{
    anotherFilter: (v) => v.toLowerCase()
});
x('https://www.yahoo.com/','title | anotherFilter').toPromise().then(...).catch(...);
```

# Documentation

Documentation is available [here](https://professoreugene.github.io/x-ray-promise/XrayPromiseWrapper.html)