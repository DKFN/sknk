var assert = require("assert");
const _sfu = require("../dist/sfu");

describe("SKNK Functionnal Utils", () => {
    describe("Assign", () => {
        it("Correctly assigns two objects",  () =>  {
            const a = {foo: "bar"};
            const b = {zorg: "dex"};
            const ab = {foo: "bar", zorg: "dex"};
            assert.deepEqual(_sfu.assign(a,b), ab);
        });

        it("Latest assignation of colliding property is priority", () => {
            const a = {foo: "bar"};
            const b = {foo: "baz"};
            assert.deepEqual(_sfu.assign(a, b), b)
        });

        it("Merge is only 1 level deep", () => {
            const a = {
                foo: {
                    bar: "baz"
                }
            };

            const b = {
                foo: {
                    zorg: "zeg"
                },
                bor: "barf"
            };

            const ab = {
                foo: {
                    zorg: "zeg"
                },
                bor: "barf"
            };

            assert.deepEqual(_sfu.assign(a, b), ab);
        })
    });

    describe("Clone", () => {
        it("Correctly removes a reference", () => {
            const a = { boz: "buz"};
            const b = _sfu.clone(a);
            assert.deepEqual(a, b);
            assert.notEqual(a, b);
        });

        it("Keeps shallow references", () => {
            const app = {test: "hey"};

            const a = {baseApp: app};
            const b = _sfu.clone(a);

            assert.equal(a.baseApp, b.baseApp);
        })
    });

    describe("Find", () => {
        const mkWrap = (prim) => ({
            key: prim
        });

        it("Finds boxed primitive", () => {
            const needle = mkWrap(5);
            const col = [1, 4, 2, 5, 6, 8, 3, 2].map(mkWrap);
            const item = _sfu.find(col,  needle);

            assert.deepEqual(needle, item);

            const none = _sfu.find(col, mkWrap(42));
            assert.deepEqual(none, undefined);
        });

        it("Finds complex objects", () => {
            const col = [{
                name: "sfu",
                param: "boz"
            }, {
                name: "sfa",
                param: "boz"
            }];

            const needle = { name: "sfa", param: "boz"};
            assert.deepEqual(_sfu.find(col, needle), needle);

        });

        it("Finds complex objects partial query", () => {
            const col = [{
                name: "sfu",
                param: "boz"
            }, {
                name: "sfa",
                param: "boz"
            }];

            const needle = { name: "sfa", param: "boz"};
            assert.deepEqual(_sfu.find(col, { name: "sfa"}), needle);

        });
    });

    describe("Remove", () => {
        it("Removes a primitive", () => {

        })
    });
});
