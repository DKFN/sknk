/*
* FIXME : This issue should make the bundle size lighter but is throwing errors client side
import assign from "lodash/assign";
import find from "lodash/find";
import clone from "lodash/clone";
*/

import * as _ from "lodash";

import {
    DEFAULT_USERLAYOUT_PARAMS,
    SkunkAppDefinition,
    SkunkApplication,
    SkunkApplicationInstance,
    SkunkOptions, SkunkUserLayout
} from "../models";

/**
 * Skunk Server v0.1
 *
 * Author: DKFN
 */

const DISABLE_RECCURING_LOGS = true;


// TODO : Add instance hash of div id somewhere
export class SkunkServer {

    public runningApps: SkunkApplicationInstance[] = [];
    private static pendingApps: SkunkApplicationInstance[] = [];
    private static skunkApps: SkunkApplication[] = [];
    private static allowedScripts: SkunkAppDefinition[] = [];
    private static userLayouts: SkunkUserLayout[] = []; // Todo: Store an intermediate object containing user conf and dom access to wrapper space
    private static __conf: SkunkOptions = {
        pedingAppsWaiterAutoStart: true,
        layoutsWaiterAutoStart: true,
        maxRefreshDelay: 100,
        refreshCoef: (act: number) => 100,
    };

    private iteration: number = 0;

    public constructor() {
        this.firePendingApps();
        this.findALlUserSpaces();
    }

    // Public interface of the API (outside of main app accessible functions)
    // TODO : Register should not load and display the app, add a makeVisible that will be both acessible by the
    // TODO : Parent and child app so that the child can register once and parent spawn many
    public publicInterface = {
        registerApp: SkunkServer.registerApp
    };

    public setConfiguration(options: SkunkOptions) {
        if (!options.pedingAppsWaiterAutoStart)
            this.disablePendingAppsWaiter();

        SkunkServer.__conf = options;
    }

    public allowScript(options: SkunkAppDefinition) {
        if (!options.src || !options.name)
            return console.error("[SKUNKSV] Can't allow without src and name", options);
        options.instances = 0;
        const maybeScript = _.find(SkunkServer.allowedScripts, {name: options.name});
        if (maybeScript)
            return console.warn("[SKUNKSV] Already allowed script");
        SkunkServer.allowedScripts.push(options);
    }

    public static registerApp(options: SkunkApplication) {
        if (!_.find(SkunkServer.allowedScripts, {name: options.name})) {
            console.error("[SKUNKSV] Attempted registration of non allowed script from an application", options);
            return false;
        }

        console.log("[SKUNKSV] Registering : ", options);
        SkunkServer.skunkApps.push(options);
        console.log("[SKUNKSV] Registered ", SkunkServer.pendingApps);
        return true;
    }

    private static pendingAppsWatcherId = 0;

    // aka "render" loop
    private firePendingApps() {
        SkunkServer.pendingAppsWatcherId = setInterval(() => {
            this.iteration = this.iteration + 1;
            if (SkunkServer.pendingApps.length === 0 || SkunkServer.skunkApps.length === 0)
                return DISABLE_RECCURING_LOGS || console.log("[SKUNSV] Empty ramp");

            SkunkServer.pendingApps = SkunkServer.pendingApps
                .map(
                (x) => {
                    const app = _.find(SkunkServer.skunkApps, {name: x.name});
                    if (!app) {
                        console.log("[SKUNKSV] App have not registred itself");
                        return x;
                    }

                    if (!app.render || typeof app.render !== "function") {
                        console.error("[SKUNKSV] App does not give render function", app);
                        return x;
                    }

                    const randomDomId = this.randId("skunk-");
                    const maybeScript = _.find(SkunkServer.allowedScripts, {name: x.name});
                    console.log(app.layoutOptions.id);
                    const targetSpace = _.find(SkunkServer.userLayouts, {id: app.layoutOptions.id});

                    if (!maybeScript || !targetSpace) {
                        console.warn(
                            "[SKUNKSV] Unable to meet library criteras",
                            {lib: app, allowScriptIfAny: maybeScript, targetSpaceIfAny: targetSpace}
                        );
                        return x;
                    }

                    const runningApp = _.assign(maybeScript, {
                        domId: randomDomId,
                        hash: "none",
                        baseApp: app,
                        instance: 0 // TODO : Real number of running app instance
                    });

                    if (targetSpace) {
                        this.createInstanceNode(randomDomId, targetSpace && targetSpace.containerNode);
                        app.render(randomDomId, maybeScript.baseProps);
                        this.runningApps.push(runningApp);
                        return null;
                    } else
                        console.warn("[SKUNKSV] Unable to find render space, retrying ...", x);
                    return x;
                }
            ).filter(x => !!x);
        }, this.iteration > 1000 ? 2 * this.iteration : 170);
    }

    public disablePendingAppsWaiter() {
        clearInterval(SkunkServer.pendingAppsWatcherId);
    }

    public enablePendingAppsWaiter() {
        this.firePendingApps();
    }

    public hotLoad(options) {
        if (options.instances > 0) {
            console.warn("[SKUNKSV] Already hotloaded", options);
            return options;
        }

        let include = document.createElement('script');
        include.setAttribute('src', options.src);
        include.setAttribute('type', "text/javascript");
        include.setAttribute('class', "skunk-include");
        include.setAttribute('id', "skunk-" + name);
        document.body.appendChild(include);
        console.info("[SKUNKSV] Hotload successfull : There is a new script, ", options);
        return options;
    }

    public createInstanceNode(domId: string, node: HTMLElement | Document = document) {
        const newNode = document.createElement("div");
        newNode.setAttribute("id", domId);
        node.appendChild(newNode);
    }

    // App will be runned as soon as it is available
    public runApp(name: string, runName: string = name) {
        // Fetch app definition from registered apps
        const maybeApp: SkunkAppDefinition = _.clone(_.find(SkunkServer.allowedScripts, {name: name}));
        if (!maybeApp)
            return console.error("[SKUNKSV] Unregistred app : ", name);
        this.hotLoad(maybeApp);
        SkunkServer.pendingApps.push(_.assign(maybeApp, {
            baseApp: undefined,
            hash: runName,
            domId: "testDomId",
            instance: 1 // TODO : Correctly count instances
        }));

        // A app is intentionally not checked for liveness
    }

    public registerSpace(options) {
        SkunkServer.userLayouts.push(options);
        console.log("[SKUNKSV] Detected space ", options);
        return this.randId("space-");
    }

    // Tries to find all the spaces of the user
    private findALlUserSpaces() {
        const interval = setInterval(() => {
            const maybeSpaces = [].slice.call(document.getElementsByClassName("skunk-space"));
            if (maybeSpaces.length === SkunkServer.userLayouts.length)
                return DISABLE_RECCURING_LOGS || console.log("[SKUNKSV] Empty layout check");

            maybeSpaces
                .filter((space) => {
                    const maybeId = space.getAttribute("skunk-id");
                    return !_.find(SkunkServer.userLayouts, {id: maybeId});
                })
                .map((space) => {
                    console.log(space);
                    const maybeId = space.getAttribute("skunk-id");
                    const maybeParams = space.getAttribute("skunk-params");
                    const params = _.assign(JSON.parse(maybeParams || "{}"), _.clone(DEFAULT_USERLAYOUT_PARAMS));
                    const hash = this.randId();
                    space.setAttribute("skunk-shash", hash);
                    SkunkServer.userLayouts.push({
                        id: maybeId,
                        containerNode: space,
                        hash: hash,
                        params: params
                    });
            });
            console.log("[SKUNKSV] Scanned spaces : ", SkunkServer.userLayouts);
        }, this.iteration > 1000 ? 2 * this.iteration : 170);

    }


    /* Boring internals */
    private randId = (placeholder?: string, iter: number = 4) =>
        (placeholder || "") + Math.random().toString(36).substring(7)
        + (iter === 0 ? "" : this.randId("", iter - 1));
}

const serverInstance = new SkunkServer();

// Outside export
export interface ISkunkServerPublic {
    registerApp: (options: SkunkApplication) => void
}

declare const window: {
    skunkServer: ISkunkServerPublic
};

window.skunkServer = serverInstance.publicInterface;

// Full server interface export
export default serverInstance;
