// Object registered by child application ordering how to deal with instanciation
export interface SkunkApplication {
    name: string;
    layoutOptions: {
        id: string
    };
    render: (domId: string, baseProps?: any, accessToken?: string) => void;
}

export enum SKUNK_LOG_LEVEL {
    DEBUG = 0,
    INFO = 1,
    WARNING = 2,
    ERROR = 3,
    NONE = 4
}

// Object fired by the server when receives a run order
export interface SkunkApplicationInstance extends SkunkAppDefinition {
    hash: string;
    domId?: string;
    instance: number;
    baseApp?: SkunkApplication;
}

// Object representing an allowed script from the main app
export interface SkunkAppDefinition {
    name: string;
    src: string;
    baseProps?: any;
    instances: number; // Included is different than zero
}

export interface SkunkOptions {
    logLevel: SKUNK_LOG_LEVEL;
    pedingAppsWaiterAutoStart?: boolean;
    layoutsWaiterAutoStart?: boolean;
    refreshCoef?: (previous: number) => number;
    maxRefreshDelay?: number;
}

// TODO : Extend maximum contained apps, names of allowed apps
export interface SkunkUserLayout {
    id: string;
    containerNode: any;
    hash: string;
    params?: {
        maxApps: number;
        allowedApps?: [];

    };
}

export const DEFAULT_USERLAYOUT_PARAMS = {
    maxApps: 0
};
