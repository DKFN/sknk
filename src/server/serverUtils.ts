
export const hotloadScript = (options) => {
    let include = document.createElement('script');
    include.setAttribute('src', options.src);
    include.setAttribute('type', "text/javascript");
    include.setAttribute('class', "skunk-include");
    include.setAttribute('id', "skunk-" + options.name);
    document.body.appendChild(include);
};
