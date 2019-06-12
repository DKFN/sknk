import {SknkServer} from "./server/sknkServer";

declare module 'sknk' {
    export const server: SknkServer;
}