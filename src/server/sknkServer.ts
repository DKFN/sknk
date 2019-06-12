/*
* FIXME : This issue should make the bundle size lighter but is throwing errors client side
import assign from "lodash/assign";
import find from "lodash/find";
import clone from "lodash/clone";
*/

// TODO : Drop lodash as it counts for 100kb of deps
import * as _ from "lodash";
import {SKNK_VERSION} from "../version";
import {
    DEFAULT_USERLAYOUT_PARAMS,
    SKUNK_LOG_LEVEL,
    SkunkAppDefinition,
    SkunkApplication,
    SkunkApplicationInstance,
    SkunkOptions,
    SkunkUserLayout
} from "../models";
import {getOrElse, hotloadScript} from "./serverUtils";

const SKNK_BUILD = SKNK_VERSION;

import Minilog = require("minilog");

/**
 * Skunk Server v0.1
 *
 * Author: DKFN
 */

const DISABLE_RECCURING_LOGS = true;


// TODO : Add a refresher waiter that will call functions depending on queues emptyness according to related handler functions
// TODO : Instead
// TODO : For this use promisifyInterval to try until first priority queue (space) is empty
// TODO : Before moving to the orther

// TODO : Add instance hash of div id somewhere
// TODO : Add a sknktoken for each instance that will be passed and given only to them
// TODO : ( To be better than a simple hashing )
export class SknkServer {

    //  Scripts that are currently running and managed by SknkServer
    private runningApps: SkunkApplicationInstance[] = [];
    // Scripts that received a run order but that the server has yet to render
    private static pendingApps: SkunkApplicationInstance[] = [];
    // Scripts that have registred themselves to the server
    private static skunkApps: SkunkApplication[] = [];
    // Scripts allowed by parent application
    private static allowedScripts: SkunkAppDefinition[] = [];



    private static userLayouts: SkunkUserLayout[] = []; // Todo: Store an intermediate object containing user conf and dom access to wrapper space
    private static __conf: SkunkOptions = {
        logLevel: SKUNK_LOG_LEVEL.ERROR,
        pedingAppsWaiterAutoStart: true,
        layoutsWaiterAutoStart: true,
        maxRefreshDelay: 100,
        refreshCoef: (act: number) => 100,
    };

    private readonly log: Minilog;
    public static slog: Minilog;

    private iteration: number = 0;

    public constructor() {
        this.firePendingApps();
        this.findALlUserSpaces();
        // TODO : Make a function to be able to change log level at runtime
        this.log = Minilog(`[SKNK-SV] (v${SKNK_BUILD} )`);
        SknkServer.slog = this.log;
    }

    // Public interface of the API (outside of main app accessible functions)
    // TODO : Register should not load and display the app, add a makeVisible that will be both acessible by the
    // TODO : Parent and child app so that the child can register once and parent spawn many
    public publicInterface = {
        registerApp: SknkServer.registerApp,
        getBaseProps: this.getBaseProps
    };

    public setConfiguration(options: SkunkOptions) {
        if (options.pedingAppsWaiterAutoStart === false)
            this.disablePendingAppsWaiter();

        if (options.logLevel == SKUNK_LOG_LEVEL.NONE)
            Minilog.disable();
        else
            Minilog.enable();

        SknkServer.__conf = options;
    }

    public allowScript(options: SkunkAppDefinition) {
        if (!options.src || !options.name)
            return this.log.error("Can't allow without src and name", options);
        options.instances = 0;
        const maybeScript = _.find(SknkServer.allowedScripts, {name: options.name});
        if (maybeScript)
            return this.log.warn("Already allowed script");
        SknkServer.allowedScripts.push(options);
    }

    public static registerApp(options: SkunkApplication) {
        if (!_.find(SknkServer.allowedScripts, {name: options.name})) {
            SknkServer.slog.warn("Attempted registration of non allowed script from an application",
                {
                    opts: options,
                    allwds: this.allowedScripts
                });
            return false;
        }

        SknkServer.slog.info("Registering : ", options);
        SknkServer.skunkApps.push(options);
        SknkServer.slog.info("Registered ", SknkServer.pendingApps);
        return true;
    }

    public getBaseProps(accessToken: string) {
        const maybeInstance: SkunkApplicationInstance = _.find(this.runningApps, {hash: accessToken});
        if (!maybeInstance) return;
        SknkServer.slog.info("Getting props for", maybeInstance);
        return maybeInstance.baseProps;
    }

    private static pendingAppsWatcherId = 0;

    // aka "render" loop
    private firePendingApps() {
        SknkServer.pendingAppsWatcherId = setInterval(() => {
            this.iteration = this.iteration + 1;
            if (SknkServer.pendingApps.length === 0 || SknkServer.skunkApps.length === 0)
                DISABLE_RECCURING_LOGS && SknkServer.slog.debug("[SKUNSV] Empty ramp", {pa: SknkServer.pendingApps, sa: SknkServer.skunkApps});

            SknkServer.pendingApps = SknkServer.pendingApps
                .map(
                (x) => {
                    const app = _.find(SknkServer.skunkApps, {name: x.name});

                    if (!app) {
                        SknkServer.slog.warn("App have not registred itself");
                        return x;
                    }

                    if (!app.render || typeof app.render !== "function") {
                        SknkServer.slog.error("App does not give render function", app);
                        return x;
                    }

                    const randomDomId = this.randId("skunk-");
                    const maybeScript = _.find(SknkServer.allowedScripts, {name: x.name});
                    SknkServer.slog.debug("Application requests space with id: " + app.layoutOptions.id);
                    const targetSpace = _.find(SknkServer.userLayouts, {id: app.layoutOptions.id});

                    if (!maybeScript || !targetSpace) {
                        SknkServer.slog.warn(
                            "Unable to meet library criteras",
                            {lib: app, allowScriptIfAny: maybeScript, targetSpaceIfAny: targetSpace}
                        );
                        return x;
                    }

                    const runningApp = _.assign(maybeScript,
                        _.assign(x, {
                            domId: randomDomId,
                            baseApp: app
                    }));

                    this.log.info("Running ...", runningApp);

                    // TODO : Small refactor
                    if (targetSpace) {
                        this.createInstanceNode(randomDomId, targetSpace && targetSpace.containerNode);
                        app.render(randomDomId, x.baseProps, x.hash);
                        this.runningApps.push(runningApp);
                        this.log.info("App is now running !", runningApp);
                        return null;
                    } else
                        this.log.warn("Unable to find render space, retrying ...", x);
                    return x;
                }
            ).filter(x => !!x);
        }, this.iteration > 1000 ? 2 * this.iteration : 170); // FIXME: Strategy
    }

    public disablePendingAppsWaiter() {
        this.log.info("Pending apps watcher is stopped. /!\\ New apps will stay pending and will not render /!\\");
        clearInterval(SknkServer.pendingAppsWatcherId);
    }

    public enablePendingAppsWaiter() {
        this.log.info("Pending apps watcher started.");
        this.firePendingApps();
    }

    public hotLoad(options) {
        hotloadScript(options);
        this.log.info("Hotload successfull : There is a new script, ", options);
        return options;
    }

    private createInstanceNode(domId: string, node: HTMLElement | Document = document) {
        const newNode = document.createElement("div");
        newNode.setAttribute("id", domId);
        node.appendChild(newNode);
    }

    // App will be runned as soon as it is available
    public runApp(name: string, additionalProps?: any, runName: string = name) {
        // Fetch app definition from registered apps
        const maybeApp: SkunkAppDefinition = getOrElse(
            _.clone(_.find(SknkServer.allowedScripts, {name: name})),
            () => {
            throw new Error("Application is not an allowed script : " + name)
        });
        if (!maybeApp) return ;

        if (maybeApp.instances === 0)
            this.hotLoad(maybeApp);

        const finalProps = _.assign(_.cloneDeep(maybeApp.baseProps), additionalProps);
        this.log.debug("Pending app final props : ", finalProps);
        const finalApp = _.assign(maybeApp, {
            baseApp: undefined,
            hash: this.randId(),
            domId: "testDomId", // FIXME : Usefull ? I dont think so :)
            baseProps: finalProps,
            instance: maybeApp.instances + 1
        });

        maybeApp.instances++;

        SknkServer.pendingApps.push(finalApp);

        this.log.info("App is pending render", finalApp);
    }

    public stopApp(name: string, runName: string = name) {
        const maybeApp = getOrElse(_.find(this.runningApps, {name: name}),
            () => { throw new Error("There is no running app with name" + name)}
            );
        if (!maybeApp) return ;

        this.log.info("Closed : ", maybeApp);

        // TODO : Provide a way for the app to register a function to clean all intervals etc ...
        // TODO : Necessary for a hot swap heavy application
        const appContainer = getOrElse(document.getElementById(maybeApp.domId),
            () => { throw new Error(
                "Attempted removal of app but DOM container cannot be found: " + maybeApp.domId)
        });
        if (!appContainer) return ;

        appContainer.parentNode.removeChild(appContainer);
        _.remove(this.runningApps, {name: name});
    }

    public registerSpace(options) {
        SknkServer.userLayouts.push(options);
        this.log.info("Detected space ", options);
        return this.randId("space-");
    }

    // Tries to find all the spaces of the user
    private findALlUserSpaces() {
        const interval = setInterval(() => {
            // TODO : Of course check emptyness to trigger interval or not in supervising interval :D
            const maybeSpaces = [].slice.call(document.getElementsByClassName("skunk-space"));
            if (maybeSpaces.length === SknkServer.userLayouts.length)
                return DISABLE_RECCURING_LOGS || this.log.debug("Empty layout check");

            maybeSpaces
                .filter((space) => {
                    const maybeId = space.getAttribute("skunk-id");
                    return !_.find(SknkServer.userLayouts, {id: maybeId});
                })
                .map((space) => {
                    this.log.debug(space);
                    const maybeId = space.getAttribute("skunk-id");
                    const maybeParams = space.getAttribute("skunk-params");
                    const params = _.assign(
                        JSON.parse(maybeParams || "{}"),
                        _.clone(DEFAULT_USERLAYOUT_PARAMS)
                    );
                    const hash = this.randId();
                    space.setAttribute("skunk-shash", hash);
                    SknkServer.userLayouts.push({
                        id: maybeId,
                        containerNode: space,
                        hash: hash,
                        params: params
                    });
            });
            this.log.info("Scanned spaces : ", SknkServer.userLayouts);
        }, this.iteration > 1000 ? 2 * this.iteration : 170); // FIXME: Strategy

    }


    /* Boring internals */
    private randId = (placeholder?: string, iter: number = 4) =>
        (placeholder || "") + Math.random().toString(36).substring(7)
        + (iter === 0 ? "" : this.randId("", iter - 1));
}

const serverInstance = new SknkServer();

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
