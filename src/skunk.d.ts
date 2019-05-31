import {SkunkServer} from "./server/skunkServer";

declare module 'skunkjs' {
    export const server: SkunkServer;
}