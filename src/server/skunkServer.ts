import assign from "lodash/assign";
import find from "lodash/find";
import clone from "lodash/clone";

import {
    DEFAULT_USERLAYOUT_PARAMS,
    SkunkAppDefinition,
    SkunkApplication,
    SkunkApplicationInstance,
    SkunkOptions
} from "../models";

/**
 * Skunk Server v0.1
 *
 * Author: DKFN
 */

const DISABLE_RECCURING_LOGS = true;


// TODO : Add instance hash of div id somewhere
class SkunkServer {

    public runningApps: SkunkApplicationInstance[] = [];
    private static pendingApps: SkunkApplicationInstance[] = [];
    private static skunkApps: SkunkApplication[] = [];
    private static allowedScripts: SkunkAppDefinition[] = [];
    private static userLayouts = []; // Todo: Store an intermediate object containing user conf and dom access to wrapper space
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
        const maybeScript = find(SkunkServer.allowedScripts, {name: options.name});
        if (maybeScript)
            return console.warn("[SKUNKSV] Already allowed script");
        SkunkServer.allowedScripts.push(options);
    }

    public static registerApp(options: SkunkApplication) {
        if (!find(SkunkServer.allowedScripts, {name: options.name})) {
            console.error("[SKUNKSV] Attempted registration of non allowed script from an application", options);
            return false;
        }

        console.log("[SKUNKSV] Registering : ", options);
        SkunkServer.skunkApps.push(options);
        console.log("[SKUNKSV] Registered ", SkunkServer.pendingApps);
        return true;
    }

    private static pendingAppsWatcherId = 0;

    private firePendingApps() {
        SkunkServer.pendingAppsWatcherId = setInterval(() => {
            this.iteration = this.iteration + 1;
            if (SkunkServer.pendingApps.length === 0 || SkunkServer.skunkApps.length === 0)
                return DISABLE_RECCURING_LOGS || console.log("[SKUNSV] Empty ramp");


            SkunkServer.pendingApps = SkunkServer.pendingApps
                .map(x => {
                    const maybeRegisteredApp = find(SkunkServer.skunkApps, {name: x.name});
                    // console.log("[SKUNKSV] Found pending: ", {found: maybeRegisteredApp, source: x});
                    DISABLE_RECCURING_LOGS  || console.log("[SKUNKSV] I have " + SkunkServer.pendingApps.length + " app waiting to run but not registered");
                    return maybeRegisteredApp || x;
                })
                .filter(x => !!x)
                .map(
                (x) => {
                    if (!x.render)
                        return x;
                    const randomDomId = this.randId("skunk-");
                    x.domId = randomDomId;
                    const maybeScript = find(SkunkServer.allowedScripts, {name: x.name});
                    const targetSpace = find(SkunkServer.userLayouts, {id: x.layoutOptions.id || "default"});

                    if (targetSpace) {
                        this.createInstanceNode(randomDomId, targetSpace && targetSpace.containerNode);
                        x.render(randomDomId, maybeScript.baseProps);
                        this.runningApps.push(x);
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
        const maybeApp = clone(find(SkunkServer.allowedScripts, {name: name}));
        if (!maybeApp)
            return console.error("[SKUNKSV] Unregistred app : ", name);
        this.hotLoad(maybeApp);
        SkunkServer.pendingApps.push(assign(maybeApp, {
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
            const maybeSpaces = Array.from(document.getElementsByClassName("skunk-space"));
            if (maybeSpaces.length === SkunkServer.userLayouts.length)
                return DISABLE_RECCURING_LOGS || console.log("[SKUNKSV] Empty layout check");

            maybeSpaces
                .filter((space) => {
                    const maybeId = space.getAttribute("skunk-id");
                    return !find(SkunkServer.userLayouts, {id: maybeId});
                })
                .map((space) => {
                    console.log(space);
                    const maybeId = space.getAttribute("skunk-id");
                    const maybeParams = space.getAttribute("skunk-params");
                    const params = assign(JSON.parse(maybeParams || "{}"), clone(DEFAULT_USERLAYOUT_PARAMS));
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

export interface ISkunkServerPublic {
    registerApp: (options: SkunkApplication) => void
}

declare const window: {
    skunkServer: ISkunkServerPublic
};
const serverInstance = new SkunkServer();

export default serverInstance;

window.skunkServer = serverInstance.publicInterface;
