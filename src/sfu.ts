/*
 * Sknk Functional utils
 */
import {SknkServer} from "./server/sknkServer";

export const assign = (source: any, ...targets: any[]) =>
    Object.assign({}, source, ...targets);

export const clone = (e: any) => Object.assign({}, e);

const handler = (query) => (e) => !!Object.keys(query).find(
    (k) => e[k] && e[k] === query[k]
);

export function find<T>(col: T[], query: object): T | undefined {
    return col.find(handler(query));
}
export const findIndex = (col: object[], query: object): number => col.findIndex(handler(query));
export const remove = (col: object[], query: object) => {
    const idx = findIndex(col, query);
    if (idx === -1) return;
    col.splice(idx, 1)
};


const GOE_ERROR_MESSAGE = "getOrElse: Lifted (None) option.";
export function getOrElse<T>(e: T|undefined, goe: () => T|undefined = () => {
    throw new Error("Error while lifting option")
}): T|undefined {
        if (!e) {
            try {
                goe();
            } catch (e) {
                SknkServer.slog.error(e.message, "( Source: " + GOE_ERROR_MESSAGE + ")");
                // SknkServer.slog.debug(GOE_ERROR_MESSAGE, e.stack);
                return;
            }
        }
        return e;
};
