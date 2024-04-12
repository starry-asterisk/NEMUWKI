let loadBoard;
window.addEventListener("click", (e) => {
  let a_tag = e.target.closest(`a[href^="${ROOT_PATH}profile${SUFFIX}?"]`);
  if (a_tag && !e.ctrlKey) {
    e.preventDefault();
    href_move(a_tag.getAttribute("href"));
  }
});

async function search({ key }) {
  if (key.toLowerCase() != "enter") return;
  params.delete("operator");
  params.delete("field");
  params.set("keyword", search_input.value);
  href_move(`${ROOT_PATH}profile${SUFFIX}?${params.toString()}`);
}

async function href_move(href) {
  loading(0);
  history.pushState({}, "", href);
  document.querySelector("html").scrollTop = 0;
  params = new URLSearchParams(href.split("?")[1]);
  for (let el of Array.from(
    document.querySelectorAll(".content.board_list_1,.content.board_list_2,.content.title")
  ))
    el.remove();
  loading(0.15);
  await loadBoard();
  loading(1);
}

function createSelect(name, options){
  let selectTag = createElement("select", {attrs: { name }});
  for(let op of options) selectTag.append(createElement("option", {value: op.value, innerHTML: op.text}));
  return selectTag;
}

async function firebaseLoadCallback() {
  loading(0);
  const {
    createVisited,
    createCategories,
    createProfile,
    createLoginForm,
    createList1,
    createList2,
  } = await import(`../util-post.js?timestamp=${new Date().getTime()}`);
  loading(0.15);
  firebase.auth.check(
    async (user) => {
      user_area.innerHTML = "";
      createProfile(user);
      document.body.classList.remove("non-auth");
      let uid = params.get("uid") || user.uid;
      load(uid, uid == user.uid);
    },
    () => {
      user_area.innerHTML = "";
      createLoginForm();
      load(params.get("uid"));
    }
  );

  function NotFound() {
    document.body.classList.add("error");
    document.body.append(
      createElement("error", {
        attrs: {
          "state-code": 404,
        },
        innerHTML: 404,
      })
    );
    document.title = "404 NOT FOUND PAGE";
    document.body.classList.remove("loading");
  }

  function parseBoardSetting(str) {
    if (str == '' || str == undefined) str = '0;1;전체 문서;;,1;2;인물;인물;';

    return str.split(',').map(boardInfo => {
      const [
        order_str, type, title, category, board
      ] = boardInfo.split(';');
      return { order: parseInt(order_str), fn: type == '1' ? createList1 : createList2, type, title, category, board };
    });
  }
  function loadBoardLists(str, uid, search) {
    let arr = parseBoardSetting(str);

    arr = arr.sort((a, b) => a.order > b.order);
    for (let info of arr) {
      let boardheader = createElement('div', { attrs: { class: 'content title', onclick: 'fold(this)' }, innerHTML: info.title });
      main__contents.append(boardheader);

      let search_extended = { ...search };
      if (info.category) search_extended.category = { key: info.category, op: 'equal' };
      if (info.board) search_extended.board = { key: info.board, op: 'contains' };
      info.fn(uid, "author", "equal", boardheader, search_extended);
    }
  }

  async function load(uid, isOwner) {
    load = () => { };
    if (uid == undefined) {
      NotFound();
      return;
    }
    loading(0.3);

    SuggestList["board"] = (await firebase.board.list()).docs.map((doc) =>
      doc.data()
    );
    SuggestList["board2Path_1"] = board2Path(SuggestList["board"], 1);
    SuggestList["board2Path_2"] = board2Path(SuggestList["board"], 2);
    loading(0.4);

    createCategories(undefined, `${ROOT_PATH}profile${SUFFIX}`, { uid });

    createVisited();

    let user_data = await firebase.auth.getUser(uid);

    let data = user_data.data();
    if (data == undefined) return NotFound();

    if (data.banner_url)
      document
        .querySelector(".main__profile")
        .setStyles({ "background-image": `url(${data.banner_url})` });

    self_description.innerHTML = data.description || `<div style="text-align: center;"><span style="font-family: var(--ff-contents); color: var(--clr-font); font-size: 3.8rem;"> </span></div><div style="text-align: center;"><span style="font-weight: bold; font-size: 3.9rem; color: var(--clr-primary-base);">사용자 문서</span><span style="font-size: 3.8rem;">입니다</span></div><div style="text-align: center;">※ 이 페이지는 ${data.email}님의 사용자 문서 입니다</div><div style="text-align: center;">현실의 인물, 단체, 사건과는 관련이 없습니다</div>`;


    document.body.classList.remove("loading");
    loadBoard = async function () {
      params.set("uid", uid);
      history.replaceState(
        {},
        null,
        `${ROOT_PATH}profile${SUFFIX}?${params.toString()}`
      );

      let op = params.get("operator") || "contains";
      let field = params.get("field") || "title_arr";
      let key = params.get("keyword");
      let search = key ? { [field]: { op, key } } : {};

      loadBoardLists(data.board_setting, uid, search);
    };

    await loadBoard();
    loading(1);

    if (isOwner) {
      let editBannerButton = createElement("button", { innerHTML: "수정" });
      let editDescButton = createElement("button", { innerHTML: "프로필 설명 수정" });
      let editBoardButton = createElement("button", { innerHTML: "문서 목록 수정" });

      toolbox_1.append(editBannerButton);
      //toolbox_2.append(editBoardButton);
      toolbox_3.append(editDescButton);

      editBoardButton.onclick = async (e) => {
        e.preventDefault();
        e.stopPropagation();
        let board_items = document.querySelectorAll(".content.board_list_1,.content.board_list_2,.content.title");
        let container = createElement("div", {attrs: { class: "component setting" }});
        let completeButton = createElement("button", { innerHTML: "저장" });
        let cancelButton = createElement("button", { innerHTML: "취소" });

        toolbox_2.append(completeButton);
        toolbox_2.append(cancelButton);

        editBoardButton.setStyles({ display: 'none' });
        for (let el of board_items) el.setStyles({ display: 'none' });

        if (SuggestList['category'] == undefined || SuggestList['category'].length < 1) SuggestList['category'] = (await firebase.categories.list()).docs.map(doc => doc.data());
        
        main__contents.append(container);
        for (let board of parseBoardSetting(data.board_setting)) addLine(board);

        function addLine(board){

          let arr_cate = SuggestList['category'].map(obj => {return {value: obj.name, text: obj.name}});
          let arr_board = SuggestList['board2Path_1'].map(obj => {return {value: obj.name, text: obj.path}});

          arr_cate.unshift({value: '', text: '전체'});
          arr_board.unshift({value: '', text: '전체'});

          let setting__line = createElement("div", {attrs: { class: "setting__line" }});

          let select_type = createSelect('type',[{value: 1, text: '게시판형'},{value: 2, text: '앨범형'}]);
          let input_title = createElement("input", {attrs: { type: 'text'}});
          let select_category = createSelect('category',arr_cate);
          let select_board = createSelect('board',arr_board);

          let button_up = createElement("button", {attrs: {class: 'mdi mdi-arrow-up-bold-circle'}});
          let button_down = createElement("button", {attrs: {class: 'mdi mdi-arrow-down-bold-circle'}});
          let button_delete = createElement("button", {attrs: {class: 'mdi mdi-close-circle'}});

          setting__line.append(select_type);
          setting__line.append(input_title);
          setting__line.append(select_category);
          setting__line.append(select_board);
          setting__line.append(button_up);
          setting__line.append(button_down);
          setting__line.append(button_delete);

          select_type.value = board.type;
          select_category.value = board.category;
          select_board.value = board.board;
          input_title.value = board.title;

          container.append(setting__line);

          button_up.onclick = e => {
            let prev = setting__line.prev('.setting__line');
            console.log(prev);
            if(prev) prev.before(setting__line);
          }

          button_down.onclick = e => {
            let next = setting__line.next('.setting__line');
            if(next) next.after(setting__line);
          }

          button_delete.onclick = e => {
            if(!confirm('정말 삭제 하시겠습니까?')) return;
            setting__line.remove();
          }
        }

        cancelButton.onclick = e => {
          e.preventDefault();
          e.stopPropagation();
          editBoardButton.setStyles({ display: '' });
          for (let el of board_items) el.setStyles({ display: '' });
          completeButton.remove();
          cancelButton.remove();
          container.remove();
        }

        completeButton.onclick = async e => {
          e.preventDefault();
          e.stopPropagation();
          if(confirm('변경사항을 저장 할까요?')){
            let lines = Array.from(container.querySelectorAll('.setting__line'));
            if(lines.length > 5) return alert('목록은 5개 까지 생성 가능합니다.');
            let board_setting = [];
            for(let index in lines){
              let line = lines[index];
              board_setting.push(`${index};${line.querySelector('[name="type"]').value};${line.querySelector('input').value};${line.querySelector('[name="category"]').value};${line.querySelector('[name="board"]').value}`);
            }
            await firebase.auth.updateUser(uid, { board_setting: board_setting.join(',') });
          }
          location.reload();
        }
      }

      editBannerButton.onclick = (e) => {
        e.preventDefault();
        e.stopPropagation();
        modal("addImg", (banner_url) => {
          document
            .querySelector(".main__profile")
            .setStyles({ "background-image": `url(${banner_url})` });
          document
            .querySelector(".profile")
            .setStyles({
              "--background-url": `url(${imgurThumb(banner_url, "m")})`,
            });
          firebase.auth.updateUser(uid, { banner_url });
        });
      };

      let editorInitialized = false;
      let completeDescButton, cancelDescButton, container, textBoxOp, textBox;

      editDescButton.onclick = (e) => {
        e.preventDefault();
        e.stopPropagation();
        editDescButton.setStyles({ display: "none" });
        self_description.setStyles({ display: "none" });
        if (editorInitialized) {
          completeDescButton.setStyles({ display: "block" });
          cancelDescButton.setStyles({ display: "block" });
          container.setStyles({ display: "block" });
          textBox.innerHTML = self_description.innerHTML;
        } else {
          editorInitialized = true;
          completeDescButton = createElement("button", { innerHTML: "저장" });
          cancelDescButton = createElement("button", { innerHTML: "취소" });
          container = createElement("div", {
            attrs: { class: "component textbox" },
          });
          let option = { value: self_description.innerHTML };
          textBoxOp = createTextboxOpt(option);
          textBox = createTextbox(option);

          container.append(textBoxOp);
          container.append(textBox);
          self_description.after(container);
          toolbox_3.append(completeDescButton);
          toolbox_3.append(cancelDescButton);

          completeDescButton.onclick = (e) => {
            common(e);
            self_description.innerHTML = textBox.innerHTML;
            firebase.auth.updateUser(uid, {
              description: self_description.innerHTML,
            });
          };

          cancelDescButton.onclick = common;

          function common(e) {
            e.preventDefault();
            e.stopPropagation();
            editDescButton.setStyles({ display: "block" });
            self_description.setStyles({ display: "block" });
            cancelDescButton.setStyles({ display: "none" });
            completeDescButton.setStyles({ display: "none" });
            container.setStyles({ display: "none" });
          }
        }
      };
    }
  }
}

const commands = [
  {
    cmd: "backColor",
    icon: "format-color-highlight",
    val: "#00ffff",
    input: "color",
    desc: "글씨에 형광펜 효과를 줍니다.",
  },
  {},
  {
    cmd: "bold",
    icon: "format-bold",
    desc: "굵은 글씨 효과",
  },
  {
    cmd: "italic",
    icon: "format-italic",
    desc: "기울임 꼴",
  },
  {
    cmd: "strikeThrough",
    icon: "format-strikethrough",
    desc: "취소선 효과",
  },
  {
    cmd: "underline",
    icon: "format-underline",
    desc: "밑줄 효과",
  },
  {},
  {
    cmd: "fontSize",
    val: "20",
    input: "number",
    desc: "폰트 사이즈를 지정합니다. 기본값은 20px입니다.",
  },
  {},
  {
    cmd: "justifyLeft",
    icon: "format-align-left",
    desc: "좌측 정렬",
  },
  {
    cmd: "justifyCenter",
    icon: "format-align-center",
    desc: "가운데 정렬",
  },
  {
    cmd: "justifyRight",
    icon: "format-align-right",
    desc: "우측 정렬",
  },
  {},
  {
    cmd: "formatBlock",
    icon: "format-quote-close",
    val: "<blockquote>",
    desc: "인용 하기",
  },
  {
    cmd: "createLink",
    icon: "link-variant",
    desc: "링크 생성",
    prompt: "생성할 링크를 입력해 주세요.",
    conv_fn: (val) => (val.startsWith("http") ? val : "http://" + val),
  },
  {
    cmd: "insertImage",
    icon: "image-plus",
    modal: "addImg",
    desc: "링크 기반 이미지 삽입",
    conv_fn: (val) => (val.startsWith("http") ? val : "http://" + val),
  },
  {
    cmd: "unlink",
    icon: "link-variant-off",
    desc: "링크 삭제",
  },
  {
    cmd: "removeFormat",
    icon: "format-clear",
    desc: "서식 지우기",
  },
  {
    cmd: "selectAll",
    icon: "select-all",
    desc: "전체 선택하기",
  },
  {
    cmd: "undo",
    icon: "undo",
    desc: "되돌리기",
  },
  {
    cmd: "redo",
    icon: "redo",
    desc: "다시하기",
  },
];

function createTextbox(option) {
  return createElement("div", {
    attrs: { contenteditable: true, placeholder: "여기에 텍스트를 입력하세요" },
    on: {
      ondragstart: (e) => {
        e.preventDefault();
        e.stopPropagation();
      },
      blur: () => {
        let s = window.getSelection();
        option.lastSelection = {
          anchorNode: s.anchorNode,
          anchorOffset: s.anchorOffset,
          focusNode: s.focusNode,
          focusOffset: s.focusOffset,
        };
      },
      paste: (e) => {
        e.preventDefault();
        document.execCommand(
          "inserttext",
          false,
          e.clipboardData.getData("text/plain")
        );
      },
    },
    innerHTML: option.value || "",
  });
}

function createTextboxOpt(option) {
  let frag = createElement("div", { attrs: { class: "component__execList" } });

  for (let command of commands) {
    let input;
    if (typeof command.cmd == "undefined")
      frag.append(createElement("span", { attrs: { class: "separator" } }));
    if (!document.queryCommandSupported(command.cmd)) continue;
    if (typeof command.input !== "undefined") {
      switch (command.input) {
        case "number":
          input = createElement("input", {
            attrs: {
              title: command.desc,
              type: "number",
              min: 12,
              step: 1,
            },
            on: {
              change: (e) => {
                if (e != undefined) {
                  let selection = window.getSelection();
                  let { anchorNode, anchorOffset, focusNode, focusOffset } =
                    option.lastSelection;
                  let range = document.createRange();
                  range.setStart(anchorNode, anchorOffset);
                  range.setEnd(focusNode, focusOffset);
                  selection.removeAllRanges();
                  selection.addRange(range);
                }
                document.execCommand("styleWithCSS", 0, true);
                document.execCommand(command.cmd, false, "7");
                for (let font of document.querySelectorAll(
                  '[style*="xxx-large"]'
                )) {
                  font.style.fontSize = `${input.value / 10}rem` || "2rem";
                }
              },
            },
            value: 20,
          });
          let plusButton = createElement("button", {
            attrs: {
              title: command.desc,
              class: `mdi mdi-plus-thick`,
            },
            on: {
              click: () => {
                input.value = parseInt(input.value) + 1;
                input.onchange();
              },
            },
          });
          let minusButton = createElement("button", {
            attrs: {
              title: command.desc,
              class: `mdi mdi-minus-thick`,
            },
            on: {
              click: () => {
                input.value = parseInt(input.value) - 1;
                input.dispatchEvent(new Event("change"));
              },
            },
          });
          frag.append(plusButton);
          frag.append(input);
          frag.append(minusButton);
          break;
        case "color":
          let label = createElement("label", {
            attrs: { class: "mdi mdi-format-color-highlight input_color" },
          });
          input = createElement("input", {
            attrs: {
              title: command.desc,
              type: "color",
            },
            on: {
              input: () => {
                document.execCommand("styleWithCSS", 0, true);
                document.execCommand(
                  command.cmd,
                  false,
                  input.value || command.val
                );
              },
              focus: () => {
                document.execCommand("styleWithCSS", 0, true);
                document.execCommand(
                  command.cmd,
                  false,
                  input.value || command.val
                );
              },
            },
            value: command.val,
          });
          label.append(input);
          frag.append(label);
          break;
      }
    } else {
      frag.append(
        createElement("button", {
          attrs: {
            title: command.desc,
            class: `mdi mdi-${command.icon}`,
          },
          on: {
            click: () => {
              val = command.val || "";
              if (command.modal) {
                return modal(command.modal, (src) => {
                  val = command.conv_fn(src);
                  document.execCommand("styleWithCSS", 0, true);
                  document.execCommand(command.cmd, false, val || "");
                });
              }
              if (command.prompt) val = command.conv_fn(prompt(command.prompt));
              document.execCommand("styleWithCSS", 0, true);
              document.execCommand(command.cmd, false, val || "");
            },
          },
        })
      );
    }
  }

  return frag;
}