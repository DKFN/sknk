var sknk = require("../dist/skunk");
var assert = require("assert");

describe("SKNK isolation", () => {
    it("should export full interface in scoped import", () => {
        //console.log("", sknk);
        assert.equal(!!sknk, true);
        assert.equal(!!sknk.server, true);
        assert.equal(!!sknk.server.allowScript, true);
        assert.equal(!!sknk.server.setConfiguration, true);
        assert.equal(!!sknk.server.allowScript, true);
        // TODO : Should be better not exposed to the mother app
        assert.equal(!!sknk.server.getBaseProps, true);
        assert.equal(!!sknk.server.lockRender, true);
        assert.equal(!!sknk.server.unlockRender, true);
        assert.equal(!!sknk.server.runApp, true);
        assert.equal(!!sknk.server.stopApp, true);
        assert.equal(!!sknk.server.registerSpace, true);

        // Functions tgat mother app should not see
        assert.equal(sknk.server.registerApp, undefined);
    });
    it("Window does not exports orther than non sensitive functions", () => {
        const sk = window.skunkServer;

        // Should be visible
        assert.equal(!!sk.registerApp, true);
        assert.equal(sk.getBaseProps, sknk.server.getBaseProps);

        // Never visible in any way
        assert.equal(sk.allowScript, undefined);
        assert.equal(sk.setConfiguration, undefined);
        assert.equal(sk.runApp, undefined);
        assert.equal(sk.stopApp, undefined);
        assert.equal(sk.renderLoop, undefined);
        assert.equal(sk.lockRender, undefined);
        assert.equal(sk.unlockRender, undefined);
        assert.equal(sk.hotLoad, undefined);
        assert.equal(sk.createInstanceNode, undefined);
        assert.equal(sk.registerSpace, undefined);
        assert.equal(sk.findALlUserSpaces, undefined);
        assert.equal(sk.randId, undefined);

    });
    it("Trying to add custom functions to bypass isolation is illegal", () => {
        const iAmAHacker = function () {
            console.log(this);
            this.runningApps.map(x => this.stopApp(x.name));
        };

        // Adding custom
        window.skunkServer.haxx = iAmAHacker;
        assert.notEqual(window.skunkServer.haxx, iAmAHacker);

        // Function override
        window.skunkServer.getBaseProps = iAmAHacker;
        assert.notEqual(window.skunkServer.getBaseProps, iAmAHacker);
    })
});
