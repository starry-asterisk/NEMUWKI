let firebase = {};
const ROOT_PATH = './';
function addSuggest(){}

function goHome(){location.href=ROOT_PATH}

function createElement(tagName, option) {
    return createElementPrototype(tagName || 'div', option || {});
}

function createElementPrototype(tagName, {
    styles = {},
    attrs = {},
    on = {},
    value,
    innerHTML
}) {
    let el = document.createElement(tagName);

    for (let namespace in styles) el.style.setProperty(namespace, styles[namespace]);
    for (let namespace in attrs) el.setAttribute(namespace, attrs[namespace]);
    for (let namespace in on) el[`on${namespace}`] = on[namespace];
    console.log(on);
    if (innerHTML) el.innerHTML = innerHTML;
    if (value) el.value = value;

    return el;
}