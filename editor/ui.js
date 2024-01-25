let app;
let files = [
  { id: Math.random(), name: "files_1.txt" },
  { id: Math.random(), name: "index.css" },
  {
    id: Math.random(),
    name: "index",
    isFolder: true,
    children: [{ name: "index.html" }],
  },
  { id: Math.random(), name: "index.html" },
];
Vue.component("file", {
  props: {
    id: {},
    name: { default: "[no_named_file]" },
    isFolder: { default: false },
    children: { default: () => [] },
    state: { type: Number },
    onTab: {},
    padding: { default: 2.2 },
  },
  template: `
    <div class="aside_folder" v-if="isFolder">
        <div class="aside_line" onclick="this.parentElement.classList.toggle('open')" tabindex="0" :style="'padding-left:'+padding+'rem;'">{{ name }}</div>
        <file v-for="child in children" v-bind="{...child,onTab,padding: padding + 2.2}"></file>
    </div>
    <div class="aside_line" v-else 
        v-on:click="onTab.addSubTab({id, name, isFolder, onTab}, true)"
        v-on:dblclick="onTab.addSubTab({id})"
        :type="name.split('.')[1]||'file'"
        :style="'padding-left:'+padding+'rem;'"
        tabindex="0">{{ name }}</div>
    `,
});
const TabState = {
  temp: 0,
  open: 1,
};

class Tab {
  constructor(_app) {
    this._uid = Math.random();
    this._app = _app;
    this._icon = "mdi-radiobox-blank";
    this._nam = "empty tab";
    this._subTabs = [];

    this._onSubTab = new SubTab();
  }

  addSubTab = ({ name = "file1.txt", id }, temp = false) => {
    if (
      this._subTabs.find(
        (subTab) => subTab._state != TabState.temp && subTab._uid == id
      )
    )
      return;
    let subTab = null,
      temp_index = this._subTabs.findIndex(
        (subTab) => subTab._state == TabState.temp
      );
    let state = temp ? TabState.temp : TabState.open;

    if (temp_index < 0) {
      editor.clear();
      if (
        (temp_index =
          this._subTabs.findIndex((subTab) => subTab._uid == id) > -1)
      )
        return;
      this._app.onTab._onSubTab = subTab = create();
      this._subTabs.push(subTab);
    } else if (this._subTabs[temp_index]._uid === id) {
      this._app.onTab._onSubTab = subTab = this._subTabs[temp_index];
      subTab.set("state", state);
    } else {
      editor.clear();
      this._app.$set(this._app.onTab._subTabs, temp_index, create());
      this._app.onTab._onSubTab = subTab = this._subTabs[temp_index];
    }

    function create() {
      return new SubTab(this, { uid: id, name, state });
    }

    return subTab;
  };
}

class GameTab extends Tab {
  constructor(_app) {
    super(_app);
    this._nam = "game develop";
    this._icon = "mdi-gamepad-square";
  }
}

class SubTab {
  constructor(tab, props = {}) {
    this._uid = Math.random();
    this._tab = tab;
    for (let propName in props) this["_" + propName] = props[propName];
  }

  set = (p, v) => (this["_" + p] = v);
}

window.onload = () => {
  app = new Vue({
    el: ".bodyContainer",
    updated: () => {
      repaintScrollbarVisible();
    },
    data: {
      files,
      tabs: [],
      onTab: new Tab(),
    },
    methods: {
      addTab: function () {
        let tab = new Tab(this);
        this.tabs.push(tab);
      },
      changeTab: function (tab) {
        this.onTab = tab;
      },
      changeSubTab: function (subTab) {
        editor.clear();
        this.onTab._onSubTab = subTab;
      },
      closeSubTab: function ({ _uid }) {
        editor.clear();
        this.onTab._subTabs = this.onTab._subTabs.filter(
          (sub) => sub._uid != _uid
        );
      },
    },
  });
  app.addTab();
  app.addTab();
  app.addTab();
  app.onTab._app = app;

  let aside = document.querySelector("section");
  let resizer = document.querySelector(".resizer");

  resizer.onmousedown = (e_down) => {
    aside = document.querySelector("section");
    let pos = e_down.screenX;
    let width = aside.getBoundingClientRect().width;
    window.onmousemove = (e_move) =>
      (aside.style.width = `${width - e_move.screenX + pos}px`);
    window.onmouseup = () => {
      window.onmouseup = window.onmousemove = undefined;
    };
  };
};

window.addEventListener("resize", function () {
  repaintScrollbarVisible();
});

function repaintScrollbar(scrollbar) {
  let target = document.querySelector(scrollbar.getAttribute("target"));

  if (target == undefined)
    return console.warn(`${scrollbar.getAttribute("target")} is not exist`);

  let w = target.getBoundingClientRect().width;
  let scroll_w = target.scrollWidth;
  let ratio = w / scroll_w;
  if (scroll_w - w < 2) return scrollbar.classList.add("unused");
  scrollbar.classList.remove("unused");

  let offset = target.scrollLeft / scroll_w;

  let min = 0,
    max = (scroll_w - w) * ratio;

  scrollbar.style.width = Math.floor(w * ratio) + "px";
  scrollbar.style.left = Math.floor(w * offset) + "px";

  scrollbar.onmousedown = (e_down) => {
    e_down.preventDefault();
    let pos = parseInt(scrollbar.getAttribute("pos")) || 0;
    let pos_down = e_down.screenX;
    window.onmouseup = () => {
      window.onmouseup = window.onmousemove = undefined;
    };
    window.onmousemove = (e_move) => {
      let pos_move = e_move.screenX;
      let pos_final = between(min, max, pos_move - pos_down + pos);
      target.scrollLeft = pos_final / ratio;
      scrollbar.style.left = pos_final + "px";
    };
  };
}

function repaintScrollbarVisible() {
  for (let scrollbar of document.querySelectorAll(".h-scrollbar"))
    repaintScrollbar(scrollbar);
}

function between(min, max, value) {
  return Math.max(Math.min(max, value), min);
}

let HangulMode = true;
let hangul_typing = [];
function checkKeepHangul(c = editor._caret) {
  if (
    c.previousSibling &&
    c.previousSibling.nodeType !== 3 &&
    c.previousSibling.classList.contains("hangulCaret")
  ) {
    c.previousSibling.before(c.previousSibling.lastChild);
    c.previousSibling.remove();
    hangul_typing = [];
  }
}
class Editor {
  _caret;
  _hangulCaret;
  _focused_line;

  clear = function () {
    let container = this.get();
    while (container.firstChild) container.lastChild.remove();
  };
  save = () => {
    console.log("text save imsi");
  };
  get = function () {
    return document.querySelector(".subTab__contents");
  };
  getCaret = function () {
    return (
      this._caret ||
      (() => {
        let c = (this._caret = document.createElement("span"));
        c.classList.add("caret");
        return c;
      })()
    );
  };
  getHangulCaret = function () {
    return (
      this._hangulCaret ||
      (() => {
        let c = this.getCaret();
        let hc = (this._hangulCaret = document.createElement("span"));
        hc.classList.add("hangulCaret");
        c.before(hc);
        return hc;
      })()
    );
  };
  focus = function (new_target) {
    if (new_target == undefined || !new_target.classList.contains("line"))
      return;
    this._focused_line = new_target;
    new_target.appendChild(this.getCaret());
  };
  blur = function () {
    let hc = this.getHangulCaret();
    if (hc.lastChild) {
      hc.before(hc.lastChild);
    }
    hc.remove();
    this.getCaret().remove();
    this._focused_line = undefined;
    this._hangulCaret = undefined;
    this._caret = undefined;
  };

  newLine = function (bool = this.get().childNodes.length < 2) {
    let line_number = document.createElement("div");
    line_number.classList.add("line_number");
    if (bool) this.get().append(line_number);
    else this._focused_line.after(line_number);
    let line = document.createElement("div");
    line.classList.add("line");
    line_number.after(line);
    line.onclick = line_number.onclick = () => this.focus(line);
    this.focus(line);
    return line;
  };

  onkeydown = function ({ keyCode, key, ctrlKey, shiftKey, altKey, metaKey }) {
    if (ctrlKey || shiftKey || altKey || metaKey) {
      //단축키 를 이용하는 경우
      event.preventDefault();

      if (ctrlKey) {
        switch (key.toLowerCase()) {
          case "s":
            this.save();
            break;
          case "f5":
            location.reload();
            break;
        }
      }
    } else if (key.length < 2) {
      //글자 입력인 경우
      for (let sel_span of this.get().querySelectorAll("span.sel"))
        sel_span.remove();
      let hanguel_i;
      let c = this.getCaret();
      if (!HangulMode || (hanguel_i = hangul[key]) == undefined) {
        checkKeepHangul(c);
        c.before(document.createTextNode(key));
      } else {
        if (hangul_typing[0] == undefined) {
          hangul_typing[0] = hanguel_i;
          this.getHangulCaret().innerText = hanguel_i;
        } else if (hangul_typing[1] == undefined) {
          if (isMoeum(hanguel_i)) {
            if (isMoeum(hangul_typing[0])) {
              if (
                hangul_moeum_combine[hangul_typing[0]] &&
                hangul_moeum_combine[hangul_typing[0]][hanguel_i]
              ) {
                editor
                  .getHangulCaret()
                  .replaceWith(
                    document.createTextNode(
                      hangul_moeum_combine[hangul_typing[0]][hanguel_i]
                    )
                  );
                hangul_typing = [];
              } else {
                editor
                  .getHangulCaret()
                  .before(document.createTextNode(hangul_typing[0]));
                this.getHangulCaret().innerText = hanguel_i;
                hangul_typing = [hanguel_i];
              }
            } else {
              hangul_typing[1] = hanguel_i;
              this.getHangulCaret().innerText = hangulCombine(hangul_typing);
            }
          } else if (
            hangul_jaum_combine[hangul_typing[0]] &&
            hangul_jaum_combine[hangul_typing[0]][hanguel_i]
          ) {
            editor
              .getHangulCaret()
              .replaceWith(
                document.createTextNode(
                  hangul_jaum_combine[hangul_typing[0]][hanguel_i]
                )
              );
            hangul_typing = [];
          } else {
            editor
              .getHangulCaret()
              .before(document.createTextNode(hangul_typing[0]));
            this.getHangulCaret().innerText = hanguel_i;
            hangul_typing = [hanguel_i];
          }
        } else if (hangul_typing[2] == undefined) {
          if (isMoeum(hanguel_i)) {
            if (
              hangul_moeum_combine[hangul_typing[1]] &&
              hangul_moeum_combine[hangul_typing[1]][hanguel_i]
            ) {
              hangul_typing[1] =
                hangul_moeum_combine[hangul_typing[1]][hanguel_i];
              this.getHangulCaret().innerText = hangulCombine(hangul_typing);
            } else {
              editor
                .getHangulCaret()
                .before(document.createTextNode(hangulCombine(hangul_typing)));
              this.getHangulCaret().innerText = hanguel_i;
              hangul_typing = [hanguel_i];
            }
          } else {
            hangul_typing[2] = hanguel_i;
            this.getHangulCaret().innerText = hangulCombine(hangul_typing);
          }
        } else {
          if (isMoeum(hanguel_i)) {
            let new_hangul_typing = [hangul_typing.pop(), hanguel_i];
            editor
              .getHangulCaret()
              .before(document.createTextNode(hangulCombine(hangul_typing)));
            this.getHangulCaret().innerText = hangulCombine(new_hangul_typing);
            hangul_typing = new_hangul_typing;
          } else if (
            hangul_jaum_combine[hangul_typing[2]] &&
            hangul_jaum_combine[hangul_typing[2]][hanguel_i]
          ) {
            hangul_typing[2] = hangul_jaum_combine[hangul_typing[2]][hanguel_i];
            editor
              .getHangulCaret()
              .replaceWith(
                document.createTextNode(hangulCombine(hangul_typing))
              );
            hangul_typing = [];
          } else {
            editor
              .getHangulCaret()
              .before(document.createTextNode(hangulCombine(hangul_typing)));
            this.getHangulCaret().innerText = hanguel_i;
            hangul_typing = [hanguel_i];
          }
        }
      }
    } else {
      let c = this.getCaret();
      checkKeepHangul(c);
      switch (key) {
        case "HangulMode":
          HangulMode = !HangulMode;
          break;
        case "Down":
        case "ArrowDown":
          this._focused_line.nextElementSibling &&
            this.focus(
              this._focused_line.nextElementSibling.nextElementSibling
            );
          break;
        case "Up":
        case "ArrowUp":
          this._focused_line.previousElementSibling &&
            this._focused_line.previousElementSibling.previousElementSibling &&
            this.focus(
              this._focused_line.previousElementSibling.previousElementSibling
            );
          break;
        case "Left":
        case "ArrowLeft":
          c.previousSibling && c.previousSibling.before(c);
          break;
        case "Right":
        case "ArrowRight":
          c.nextSibling && c.nextSibling.after(c);
          break;
        case "Enter":
          let ns = c.nextSibling;
          let nl = this.newLine(false);
          let temp;
          while ((temp = ns)) {
            ns = ns.nextSibling;
            nl.appendChild(temp);
          }
          break;
        case "Backspace":
          if (c.previousSibling) {
            c.previousSibling.remove();
          } else if (this.get().children.length > 2) {
            let t = this._focused_line;
            t.previousElementSibling.remove();
            let last_char = t.previousElementSibling.lastChild;
            for (let char of Array.from(t.childNodes))
              t.previousElementSibling.appendChild(char);
            this.focus(t.previousElementSibling);
            t.remove();
            if (last_char) last_char.after(this.getCaret());
          } /*
                        let el = this.get();
                        let last = el.querySelectorAll('span.sel').pop();
                        while(el.querySelector('span.sel')){
                            if (last.previousSibling) {
                                last.previousSibling.remove();
                            } else if (el.children.length > 2) {
                                let t = last.parentNode;
                                t.previousElementSibling.remove();
                                for (let char of Array.from(t.childNodes)) t.previousElementSibling.appendChild(char);
                                t.remove();
                            }
                        }
                        last.remove();*/
          for (let sel_span of this.get().querySelectorAll("span.sel"))
            sel_span.remove();
          break;
      }
    }

    repaintScrollbar(this.get());
  };
  onkeyup = function ({ keyCode }) {};
  onmouseup = function (e) {
    console.log(this);
    this.get().focus();
  };
  onmousedown = function (e_down) {
    console.log(this, "mousedown");
    e_down.preventDefault();
    if (this.get().children.length < 1) return this.newLine(true);

    this.blur();

    let anchor_first,
      anchor_last,
      focus,
      focusIsFirst,
      container = this.get();
    anchor_first = getTargetLetter(e_down, true);
    anchor_last = getTargetLetter(e_down);

    container.onmousemove = (e_move) => {
      e_move.preventDefault();
      focusIsFirst =
        Math.abs(e_down.screenY - e_move.screenY) < 22
          ? e_down.screenX > e_move.screenX
          : e_down.screenY > e_move.screenY;

      focus = getTargetLetter(e_move, focusIsFirst);

      this.deselect();
      this.select(focusIsFirst ? anchor_last : anchor_first, focus);
    };

    window.onmouseup = (e_up) => {
      e_up.preventDefault();
      let sel = Array.from(document.querySelectorAll(".sel"));
      window.onmouseup = undefined;
      container.onmousemove = undefined;
      let c = this.getCaret();
      if (sel.length < 1) {
        container.lastChild.append(c);
      } else {
        if (focusIsFirst) sel.shift().before(c);
        else sel.pop().after(c);
      }
      this.focus(c.parentNode);
    };

    function getTargetLetter(e, isFirst = false) {
      let line = e.target;
      switch (line.classList[0]) {
        case "subTab__contents":
          line =
            container.lastElementChild.lastChild || container.lastElementChild;
          break;
        case "line_number":
          line = isFirst
            ? line.nextElementSibling
            : line.previousElementSibling;
          break;
      }
      console.log(line);
      let result = getClickedTextNode(line, e) || line.lastChild || line;
      return result.nodeType != 3 && result.classList.contains("sel")
        ? result.lastChild
        : result;
    }
  };

  select = function (anchor_node, focus_node) {
    let anchor_index = getIndex(anchor_node);
    let focus_index = getIndex(focus_node);
    let temp;
    let focusFirst = false;
    if (
      anchor_index.i2 > focus_index.i2 ||
      (anchor_index.i2 == focus_index.i2 && anchor_index.i1 > focus_index.i1)
    ) {
      temp = anchor_index;
      anchor_index = focus_index;
      focus_index = temp;
      focusFirst = true;
    }
    let lines = this.get().childNodes;
    let i = anchor_index.i2;
    if (anchor_index.i2 == focus_index.i2) {
      selLine(lines[i], anchor_index.i1, focus_index.i1);
    } else {
      selLine(lines[i], anchor_index.i1);
      while (i < focus_index.i2 - 1) {
        i++;
        selLine(lines[i]);
      }
      selLine(lines[focus_index.i2], 0, focus_index.i1);
    }
    return focusFirst;
    function selLine(line, s_index = 0, e_index = line.childNodes.length - 1) {
      for (let node of Array.from(line.childNodes).slice(
        s_index,
        e_index + 1
      )) {
        let span = document.createElement("span");
        span.classList.add("sel");
        node.before(span);
        span.append(node);
      }
    }
    function getIndex(node) {
      let i1, i2;
      if (node.nodeType === 3) {
        i1 = Array.from(node.parentNode.childNodes).indexOf(node);
        i2 = Array.from(node.parentNode.parentNode.childNodes).indexOf(
          node.parentNode
        );
      } else if (node.classList.contains("caret")) {
        if (node.previousSibling) {
          node = node.previousSibling;
          i1 = Array.from(node.parentNode.childNodes).indexOf(node);
          i2 = Array.from(node.parentNode.parentNode.childNodes).indexOf(
            node.parentNode
          );
        } else {
          i1 = -1;
          i2 = Array.from(node.parentNode.parentNode.childNodes).indexOf(
            node.parentNode
          );
        }
      } else {
        i1 = -1;
        i2 = Array.from(node.parentNode.childNodes).indexOf(node);
      }
      return { i1, i2 };
    }
  };

  deselect = function () {
    console.log(this, "deselect");
    for (let sel_span of this.get().querySelectorAll("span.sel")) {
      if (sel_span.lastChild) sel_span.before(sel_span.lastChild);
      sel_span.remove();
    }
  };
}

let editor = new Editor();

function getClickedTextNode(element, event, callback = false) {
  let result;
  let range =
    getClickedTextNode.range ||
    (getClickedTextNode.range = document.createRange());
  for (let node of element.childNodes) {
    if (
      (result =
        node.nodeType === 3 ? compare(node) : getClickedTextNode(node, event))
    ) {
      if (callback !== false) callback(result);
      return result;
    }
  }

  function compare(node) {
    range.selectNodeContents(node);
    let { left, right } = range.getClientRects()[0];
    return event.pageX >= left && event.pageX <= right ? node : undefined;
  }
}
