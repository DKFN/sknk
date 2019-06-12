import {SknkServer} from "./sknkServer";

export const hotloadScript = (options) => {
    let include = document.createElement('script');
    include.setAttribute('src', options.src);
    include.setAttribute('type', "text/javascript");
    include.setAttribute('class', "skunk-include");
    include.setAttribute('id', "skunk-" + options.name);
    document.body.appendChild(include);
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
}
