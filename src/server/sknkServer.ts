import {SKNK_VERSION} from "../version";
import {hotloadScript} from "./serverUtils";
import * as _sfu from '../sfu';
import Minilog = require("minilog");
import {
    DEFAULT_USERLAYOUT_PARAMS,
    SKUNK_LOG_LEVEL,
    SkunkAppDefinition,
    SkunkApplication,
    SkunkApplicationInstance,
    SkunkOptions,
    SkunkUserLayout
} from "../models";
const SKNK_BUILD = SKNK_VERSION;

/**
 * Skunk Server v0.1
 *
 * Author: DKFN
 */
// TODO : Add a refresher waiter that will call functions depending on queues emptyness according to related handler functions
// TODO : Instead
// TODO : For this use promisifyInterval to try until first priority queue (space) is empty
// TODO : Before moving to the orther

// TODO : Add instance hash of div id somewhere
// TODO : Add a sknktoken for each instance that will be passed and given only to them
// TODO : ( To be better than a simple hashing )
export class SknkServer {

    //  Scripts that are currently running and managed by SknkServer
    private static runningApps: SkunkApplicationInstance[] = [];
    // Scripts that received a run order but that the server has yet to render
    private static pendingApps: SkunkApplicationInstance[] = [];
    // Scripts that have registred themselves to the server
    private static skunkApps: SkunkApplication[] = [];
    // Scripts allowed by parent application
    private static allowedScripts: SkunkAppDefinition[] = [];

    private static userLayouts: SkunkUserLayout[] = []; // Todo: Store an intermediate object containing user conf and dom access to wrapper space
    private static __conf: SkunkOptions = {
        logLevel: SKUNK_LOG_LEVEL.ERROR,
    };

    private readonly log: Minilog;
    public static slog: Minilog;

    public constructor() {
        // TODO : Make a function to be able to change log level at runtime
        this.log = Minilog(`[SKNK-SV] (v${SKNK_BUILD})`);
        SknkServer.slog = this.log;
        this.renderLoop();
    }

    // Public interface of the API (outside of main app accessible functions)
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
        const maybeScript = _sfu.find(SknkServer.allowedScripts, {name: options.name});
        if (maybeScript)
            return this.log.warn("Already allowed script");
        SknkServer.allowedScripts.push(options);
    }

    public static registerApp(options: SkunkApplication) {
        if (!_sfu.find(SknkServer.allowedScripts, {name: options.name})) {
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
        const maybeInstance: SkunkApplicationInstance = _sfu.find(SknkServer.runningApps, {hash: accessToken});
        if (!maybeInstance) {
            SknkServer.slog.error("Unable to find accessToken: " + accessToken, SknkServer.runningApps);
            return;
        }
        SknkServer.slog.info("Getting props for", maybeInstance);
        return maybeInstance.baseProps;
    }

    private idleOpsWatcherId;

    private renderLoop() {
        this.idleOpsWatcherId = setInterval(() => {
            const maybeSpaces = [].slice.call(document.getElementsByClassName("skunk-space"));
            if (maybeSpaces.length !== SknkServer.userLayouts.length)
                this.findALlUserSpaces(maybeSpaces);

            if (SknkServer.pendingApps.length > 0)
                this.runPendingApps();
        }, 10);
    }

    private runPendingApps() {
        SknkServer.pendingApps = SknkServer.pendingApps
            .map(
            (x) => {
                const app = _sfu.find(SknkServer.skunkApps, {name: x.name});

                if (!app) {
                    SknkServer.slog.warn("App have not registred itself");
                    return x;
                }

                if (!app.render || typeof app.render !== "function") {
                    SknkServer.slog.error("App does not give render function", app);
                    return x;
                }

                const randomDomId = this.randId("skunk-");
                const maybeScript = _sfu.find(SknkServer.allowedScripts, {name: x.name});
                SknkServer.slog.debug("Application requests space with id: " + app.layoutOptions.id);
                const targetSpace = _sfu.find(SknkServer.userLayouts, {id: app.layoutOptions.id});

                if (!maybeScript || !targetSpace) {
                    SknkServer.slog.warn(
                        "Unable to meet library criteras",
                        {lib: app, allowScriptIfAny: maybeScript, targetSpaceIfAny: targetSpace}
                    );
                    return x;
                }

                const runningApp = _sfu.assign(maybeScript, x, {
                        domId: randomDomId,
                        baseApp: app
                });

                this.log.info("Running ...", runningApp);

                this.createInstanceNode(randomDomId, targetSpace && targetSpace.containerNode);
                app.render(randomDomId, x.baseProps, x.hash);
                SknkServer.runningApps.push(runningApp);
                this.log.info("App is now running !", runningApp);
                return null;
            }).filter(x => !!x);
    }

    public lockRender() {
        clearInterval(this.idleOpsWatcherId);
    }

    public unlockRender() {
        this.renderLoop();
    }

    // TODO : Refactor
    public disablePendingAppsWaiter() {
       //  this.log.info("Pending apps watcher is stopped. /!\\ New apps will stay pending and will not render /!\\");
        // clearInterval(SknkServer.pendingAppsWatcherId);
    }

    // TODO : Refactor
    public enablePendingAppsWaiter() {
        // this.log.info("Pending apps watcher started.");
        // this.runPendingApps();
    }

    private hotLoad(options) {
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
        const maybeApp: SkunkAppDefinition = _sfu.getOrElse(
            _sfu.clone(_sfu.find(SknkServer.allowedScripts, {name: name})),
            () => {
            throw new Error("Application is not an allowed script : " + name)
        });
        if (!maybeApp) return ;

        if (maybeApp.instances === 0)
            this.hotLoad(maybeApp);

        // const finalProps = _sfu.assign(_.cloneDeep(maybeApp.baseProps), additionalProps);
        // TODO : User now required to clone if desired ?
        const finalProps = _sfu.assign(maybeApp.baseProps, additionalProps);
        this.log.debug("Pending app final props : ", finalProps);
        const finalApp = _sfu.assign(maybeApp, {
            baseApp: undefined,
            hash: this.randId(),
            baseProps: finalProps,
            instance: maybeApp.instances + 1
        });

        maybeApp.instances++;

        SknkServer.pendingApps.push(finalApp);

        this.log.info("App is pending render", finalApp);
    }

    public stopApp(name: string, runName: string = name) {
        const maybeApp = _sfu.getOrElse(_sfu.find(SknkServer.runningApps, {name: name}),
            () => { throw new Error("There is no running app with name" + name)}
            );
        if (!maybeApp) return ;

        this.log.info("Closed : ", maybeApp);

        // TODO : Provide a way for the app to register a function to clean all intervals etc ...
        // TODO : Necessary for a hot swap heavy application
        const appContainer = _sfu.getOrElse(document.getElementById(maybeApp.domId),
            () => { throw new Error(
                "Attempted removal of app but DOM container cannot be found: " + maybeApp.domId)
        });
        if (!appContainer) return ;

        appContainer.parentNode.removeChild(appContainer);
        _sfu.remove(SknkServer.runningApps, {name: name});
    }

    public registerSpace(options) {
        SknkServer.userLayouts.push(options);
        this.log.info("Detected space ", options);
        return this.randId("space-");
    }


    // Tries to find all the spaces of the user
    private findALlUserSpaces(maybeSpaces: HTMLElement[]) {
        maybeSpaces
            .filter((space) => {
                const maybeId = space.getAttribute("skunk-id");
                return !_sfu.find(SknkServer.userLayouts, {id: maybeId});
            })
            .forEach((space) => {
                this.log.debug(space);
                const maybeId = space.getAttribute("skunk-id");
                const maybeParams = space.getAttribute("skunk-params");
                const params = _sfu.assign(
                    JSON.parse(maybeParams || "{}"),
                    _sfu.clone(DEFAULT_USERLAYOUT_PARAMS)
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
