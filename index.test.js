const expect = require('chai').expect;

const Xray = require('./index.js');

describe('XrayPromise tests', () => {
    it('supports promises', () => {
        const x = new Xray();
        return x('<html><title>test</title></html>', 'title').toPromise().then((result) => {
            expect(result).to.equal('test');
        });
    });
    it('supports chained promises', () => {
        const x = new Xray();
        return x('<html><title>test</title></html>', 'title').toPromise()
            .then(result => x(`<html><span>another-${result}</span></html>`, 'span').toPromise())
            .then((result) => {
                expect(result).to.equal('another-test');
            });
    });
    it('catches errors', (done) => {
        const x = new Xray();
        /* make an x instance that will fail */
        x('<html>garbled crap', '.').toPromise()
            .then((unexpectedResult) => {
                done('Unexpected non-failure', unexpectedResult);
            })
            .catch((error) => {
                expect(error).to.not.be.a('null');
                done();
            })
            .catch((error) => {
                done(error);
            });
    });
    it('passes options argument', () => {
        const x = new Xray({
            filters: {
                pupper: str => str.toUpperCase(),
            },
        });
        return x('<html><title>lower</title></html>', 'title | pupper').toPromise()
            .then((result) => {
                expect(result).to.equal('LOWER');
            });
    });
    it('supports dynamic filter replacements', () => {
        const x = new Xray({
            filters: {},
        });
        Object.assign(x.options.filters, {
            downer: str => str.toLowerCase(),
        });
        return x('<html><title>UPPER</title></html>', 'title | downer').toPromise()
            .then((result) => {
                expect(result).to.equal('upper');
            });
    });
    it('supports toHandler in returned promises', () => {
        const x = new Xray();
        return x('<html><title>fancy</title></html>', {
            fancy: (doc, callback) => x(doc, 'title').toPromise().then(result => result.toUpperCase()).toHandler(callback),
        }).toPromise().then((result) => {
            expect(result).to.deep.equal({
                fancy: 'FANCY',
            });
        });
    });
    it('passes arguments', () => {
        const x = new Xray().driver((ctx, callback) => {
            callback(null, '<span>not google</span>');
        });
        return x('http://google.com/', 'span').toPromise().then((result) => {
            expect(result).to.equal('not google');
        });
    });
});
