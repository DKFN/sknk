// Object registered by child application ordering how to deal with instanciation
export interface SkunkApplication {
    baseProps?: any;
    name: string;
    layoutOptions: Object;
    render: (domId: string) => void;
}

// Object fired by the server when receives a run order
export interface SkunkApplicationInstance extends SkunkAppDefinition {
    hash: string;
    domId?: string;
    instance: number;
}

// Object representing an allowed script from the main app
export interface SkunkAppDefinition {
    name: string;
    src: string;
    instances: number; // Included is different than zero
}

export interface SkunkOptions {
    pedingAppsWaiterAutoStart: boolean;
    layoutsWaiterAutoStart: boolean;
    refreshCoef: (previous: number) => number;
    maxRefreshDelay: number;
}

// TODO : Extend maximum contained apps, names of allowed apps
export interface SkunkUserLayout {
    id: string;
    domContainer: HTMLElement;
    hash: string;
    params: {
        maxApps: number;
        allowedApps?: [];

    };
}

export const DEFAULT_USERLAYOUT_PARAMS = {
    maxApps: 0
};
