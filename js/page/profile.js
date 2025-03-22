/**
* Project: nemuwiki.com
* Version: 2.3.3 | product
* Author: @NEMUWIKI
* Date: 2025-03-22
* Description: personal wiki project for NEMU
*/

class asideProfile extends asideBase{constructor(e){super(),aside.addClass("fold");let t=new URLSearchParams;t.set("field","board_name_arr"),t.set("operator","array-contains");let o=new Model(Options.get("board"),(function(e){let o=createElement("li");t.set("keyword",e.value),o.append(createElement("a").attrs({href:`./profile?${t.toString()}`,class:"tag"}).props({innerHTML:e.path})),this.ul.append(o)}),(function(){emptyNode(this.ul)})),a=new Model(app.getVisited(),(function({visited_id:e,title:o,board_name:a}){let n=createElement("li");t.set("keyword",a),n.append(createElement("a").attrs({href:`./profile?${t.toString()}`,class:"tag","data-board":a}).props({innerHTML:a}),createElement("a").attrs({href:`./index?post=${e}`}).props({innerHTML:o})),this.ul.append(n)}));aside.append(this.createBlock("B000",`<h1><a class="logo s_button" href="./">${TEXTS.sitename}</a></h1>`),this.createSearch("search",e),this.createBlockList("Visited",TEXTS.recent_document,a),this.createBlockList("Board",TEXTS.document_cate,o),this.createBlock("btn_upload",`<button class="s_button" onclick="move('form')">${TEXTS.upload}</button><button class="s_button" onclick=" move('profile')">${TEXTS.mypage}</button>`),this.createBlock("btn_login",`<button class="s_button" onclick="move('login')">${TEXTS.form.login}</button>`)),this.components.Board.ul.addClass("type2")}createSearch(e,t){let o=createElement("div").addClass("f_block","flex-horizontal").css({marginBottom:"var(--spacing-large)"}).props({id:`${e}_wrap`}),a=createElement("button").attrs({class:"menu_fold icon"}).props({onclick(){aside.toggleClass("fold")}}),n=this.createInput(e).addClass("icon"),r=createElement("button").attrs({class:"input_run icon"}).props({onclick(){l()}});function l(e){e&&e.preventDefault();let t=new URLSearchParams(location.search);move(`./profile?keyword=${n.firstChild.value}&uid=${t.get("uid")}`)}return n.firstChild.attrs({placeHolder:TEXTS.search_i}).props({onkeydown(e){13==e.keyCode&&l(e)},value:t.get("keyword")}),o.append(a,n),n.append(r),o}}class articleProfile extends articleBase{constructor(e){super(),this.contentBase=IndexContent,this.formBase=FormContent;let t=e.get("uid");document.title=`${TEXTS.sitename} :: ${TEXTS.site_profile}`,this.load=async()=>{if(!t){if(null===app.user)return move(`400?message=${encodeURI("잘못된 요청입니다.")}&url=${location.href}`,!0);if(!1===app.user)return move(`403?message=${encodeURI("로그인하지 않은 사용자입니다. 본인 프로필로 이동을 원하시는 경우 로그인을 먼저 진행해 주세요.")}&url=${location.href}`,!0);t=app.user.uid}this.load=()=>{},loading(.3);let o=(await firebase.auth.getUser(t)).data();if(null==o)return move(`404?message=${encodeURI("존재하지 않는 페이지입니다.")}&url=${location.href}`,!0);o.banner_url,e.set("uid",t),move(`profile?${e.toString()}`,!0,!1);let a=e.get("operator")||"contains",n=e.get("field")||"title_arr",r=e.get("keyword"),l=r?{[n]:{op:a,key:r}}:{},i=app.user?.uid===t?FINAL.PERMISSION.RW:FINAL.PERMISSION.R;article.append(this.createContent("zoom"),this.createContent("profile_header",void 0,{uid:t,banner_url:o.banner_url,permission:i}),this.createContent("seperator"),this.createContent("textbox",void 0,{uid:t,permission:i,text:o.description||`<div style="text-align: center;"><span style="font-family: var(--ff-contents); color: var(--clr-font); font-size: 3.8rem;"> </span></div><div style="text-align: center;"><span style="font-weight: bold; font-size: 3.9rem; color: var(--clr-primary-base);">사용자 문서</span><span style="font-size: 3.8rem;">입니다</span></div><div style="text-align: center;">※ 이 페이지는 ${o.email}님의 사용자 문서 입니다</div><div style="text-align: center;">현실의 인물, 단체, 사건과는 관련이 없습니다</div>`}),this.createContent("seperator"),footer),loadBoardLists.bind(this)(o.board_setting,t,l,i),loading(1)},this.load()}createForm(e,t=randomId(),o,a=!1,n=!1){let r=createElement("div").attrs({class:`flex-horizontal form ${e}`,id:t,tabIndex:this.tabIndex++,"data-type":e});if(a&&(r.addClass("focusable").onfocus=r.onfocusin=r.onclick=()=>this.focusedElement=r),n){let e=createElement("div").addClass("form__move","flex-vertical"),o=createElement("button").addClass("form__move__up").props({onclick(){r.prev(".focusable")?.before(r)}}),a=createElement("button").addClass("form__move__down").props({onclick(){r.next(".focusable")?.after(r)}}),n=createElement("button").addClass("form__drag"),l=createElement("button").addClass("form__del");l.onclick=()=>{r.remove(),delete this.components[t],delete this.data[t],this.focusedElement==r&&(this.focusedElement=null)},n.ontouchstart=n.onmousedown=e=>{e.preventDefault(),r.addClass("dragging"),r.focus();let t,o=r.getBoundingClientRect(),a=e.touches?e.touches[0]:e,n=createElement("span").addClass("form__placeholder");window.ontouchmove=window.onmousemove=e=>{e.preventDefault(),t=e.touches?e.touches[0]:e,r.css({transform:`translate(${parseInt(t.pageX-a.pageX)}px, ${parseInt(t.pageY-a.pageY)}px)`});let l,i,s=o.y+.5*o.height;for(let e of Array.from(article.querySelectorAll(".focusable")).filter((e=>e!=r)))o=e.getBoundingClientRect(),l=o.y+.5*o.height,Math.abs(l-t.clientY)>Math.abs(s-t.clientY)||(s=l,i=e);i&&(s<t.clientY?i.after(n):i.before(n))},window.onmouseleave=window.onmouseup=window.ontouchend=()=>{window.onmouseleave=window.onmouseup=window.ontouchend=window.onmousemove=window.ontouchmove=null,r.style.removeProperty("transform"),r.removeClass("dragging"),t&&(n.replaceWith(r),r.focus())}},e.append(o,n,a),r.append(e,l)}return this.components[t]={wrap:r},this.data[t]=o,this.formBase[e]&&this.formBase[e].initialize.call(this,t,r,o),r}destroy(){this.timeout_timer&&clearTimeout(this.timeout_timer),this.interval_timer&&clearInterval(this.interval_timer)}}const IndexContent={...ContentBase,textbox:{initialize(e,t,o){ContentBase.textbox.initialize.call(this,e,t,o.text);let a=createElement("div").addClass("profile_header__buttons","flex-horizontal");a.append(createElement("button").props({innerHTML:TEXTS.edit,onclick:()=>{let e=new Model([],(function(e){this.wrap.append(ToolBase[e](createElement("span").addClass(e,"flex-horizontal"),app_article._focusedElement))}),(function(){emptyNode(this.wrap)})),n=app_article.createForm("toolbar","toolbar",e);e.bind(app_article.components.toolbar);let r=app_article.createForm("textbox",void 0,o.text,!0).addClass("vertical");article.prepend(n),t.after(r);let l=createElement("div").addClass("profile_header__buttons","flex-horizontal");l.append(createElement("button").props({innerHTML:TEXTS.form.apply,onclick:()=>{t.removeClass("hide"),n.remove(),r.remove(),emptyNode(t),t.innerHTML=o.text=r.getData(),t.append(a),firebase.auth.updateUser(o.uid,{description:o.text})}}).css({display:o.permission>=FINAL.PERMISSION.RW?"block":"none"}),createElement("button").props({innerHTML:TEXTS.form.cancel,onclick:()=>{t.removeClass("hide"),n.remove(),r.remove()}}).css({display:o.permission>=FINAL.PERMISSION.RW?"block":"none"})),r.append(l),t.addClass("hide"),r.focus()}}).css({display:o.permission>=FINAL.PERMISSION.RW?"block":"none"})),t.append(a)}},profile_header:{initialize(e,t,o){let a=createElement("div").addClass("profile_header__buttons","flex-horizontal");a.append(createElement("button").props({innerHTML:TEXTS.share,onclick:()=>goShare("twitter")}).css({display:o.permission>=FINAL.PERMISSION.R?"block":"none"}),createElement("button").props({innerHTML:TEXTS.edit,onclick:e=>{e.preventDefault(),e.stopPropagation(),modal("addImg",(e=>{t.css({"background-image":`url(${e})`}),firebase.auth.updateUser(o.uid,{banner_url:e})}))}}).css({display:o.permission>=FINAL.PERMISSION.RW?"block":"none"})),o.banner_url&&t.css({"background-image":`url(${o.banner_url})`}),t.append(a)}}},FormContent={toolbar:{initialize(e,t,o){t.addClass("flex-horizontal")}},textbox:{text:"텍스트박스",initialize(e,t,o){let a=createElement("div").attrs({contenteditable:!0,placeholder:"텍스트박스.\n                여기에 텍스트를 입력하세요.",class:"form__textbox"}).props({innerHTML:o||"",onpaste(e){e.preventDefault(),document.execCommand("inserttext",!1,e.clipboardData.getData("text/plain"))},ondrop(e){const t=document.createTextNode(e.dataTransfer.getData("text/plain"));if(t.textContent.startsWith("$$nemuwiki$$"))return;let o;if(e.preventDefault(),"caretRangeFromPoint"in document)o=document.caretRangeFromPoint(e.clientX,e.clientY);else{if(!("caretPositionFromPoint"in document))return;o=document.caretPositionFromPoint(e.clientX,e.clientY)}o.insertNode(t),o.setStart(t,0),o.setEnd(t,t.length);const a=window.getSelection();a.removeAllRanges(),a.addRange(o),this.oninput()},onblur(){let e=window.getSelection();lastSelection={anchorNode:e.anchorNode,anchorOffset:e.anchorOffset,focusNode:e.focusNode,focusOffset:e.focusOffset}},oninput(){this.querySelectorAll('[style^="font-size: var(--"]').forEach((e=>e.style.removeProperty("font-size"))),this.querySelectorAll('[style^="background-color: var(--"]').forEach((e=>e.style.removeProperty("background-color"))),this.toggleClass("empty",this.textContent.trim().length<1)}});a.toggleClass("empty",a.textContent.trim().length<1),t.addClass("flex-horizontal").append(a),t.getData=()=>a.innerHTML},buttons:["foreColor","backColor","bold","italic","strikeThrough","underline","fontSize","justifyLeft","justifyCenter","justifyRight","formatBlock","createLink","insertImage","unlink","removeFormat","selectAll","undo","redo"]},board_setting:{initialize(e,t,{type:o,title:a,category:n,board:r}){let l=createElement("div").addClass("form__inputs").css({"grid-template-columns":"auto 1fr"}),i=createElement("select");i.append(createElement("option").props({value:1,innerHTML:"게시판형"}),createElement("option").props({value:2,innerHTML:"앨범형"})),i.value=o;let s=createElement("label").props({innerHTML:"표시 스타일"}),c=createElement("input").attrs({type:"text",placeholder:"예시) 전체 목록 1",name:"text",value:a}),d=createElement("label").props({innerHTML:"목록명"});l.append(s,i,d,c);let p=createElement("div").addClass("form__inputs").css({"grid-template-columns":"1fr 1fr"}),u=createElement("select").props({onchange(){this.toggleClass("empty",!this.value)}}),m=e=>{emptyNode(u),u.append(createElement("option").props({innerHTML:"예시) 인물",value:""}).attrs({disabled:!0,hidden:!0})),u.append(createElement("option").props({innerHTML:"전체",value:""})),e.forEach((({value:e})=>{u.append(createElement("option").props({innerHTML:e}))})),u.value=n,u.onchange()};__CallStack__.categories.push(m),m(Options.get("categories"));let f=createElement("label").props({innerHTML:"카테고리"}),h=createElement("select").props({onchange(){this.toggleClass("empty",!this.value)}}),g=e=>{emptyNode(h),h.append(createElement("option").props({innerHTML:"예시) 분류1 > 분류2",value:""}).attrs({disabled:!0,hidden:!0})),h.append(createElement("option").props({innerHTML:"전체",value:""})),e.forEach((({value:e,path:t})=>{h.append(createElement("option").props({value:e,innerHTML:t}))})),h.value=r,h.onchange()};__CallStack__.board.push(g),g(Options.get("board"));let b=createElement("label").props({innerHTML:"분류"});p.append(u,f,h,b);let v=createElement("div").css({flex:1});v.append(l,p),t.append(v),t.getData=()=>({type:i.value,title:c.value,category:u.value,board:h.value})}},add_board:{initialize(e,t,o={}){t.append(createElement("button").props({innerHTML:"목록 생성",onclick(){app_article.createForm("board_setting",void 0)}}))}}},ToolBase={foreColor:(e,t)=>(e.attrs({title:"글씨에 형광펜 효과를 줍니다."}),e.append(createElement("button").attrs({class:"icon icon-format-color-text"}).props({onclick:()=>execModal("foreColor","colorPicker",(t=>(e.style.setProperty("--input-color",t),e.dataset.foreColor=t,t)),e.dataset.foreColor)})),e),backColor:(e,t)=>(e.attrs({title:"글씨에 형광펜 효과를 줍니다."}),e.append(createElement("button").attrs({class:"icon icon-format-color-highlight"}).props({onclick:()=>execModal("backColor","colorPicker",(t=>(e.style.setProperty("--input-color",t),e.dataset.backColor=t,t)),e.dataset.backColor)})),e),bold:(e,t)=>(e.attrs({title:"굵은 글씨 효과"}),e.append(createElement("button").attrs({class:"icon icon-format-bold"}).props({onclick:execBuildVal("bold")})),e),italic:(e,t)=>(e.attrs({title:"기울임 꼴"}),e.append(createElement("button").attrs({class:"icon icon-format-italic"}).props({onclick:execBuildVal("italic")})),e),strikeThrough:(e,t)=>(e.attrs({title:"취소선 효과"}),e.append(createElement("button").attrs({class:"icon icon-format-strikethrough"}).props({onclick:execBuildVal("strikeThrough")})),e),underline:(e,t)=>(e.attrs({title:"밑줄 효과"}),e.append(createElement("button").attrs({class:"icon icon-format-underline"}).props({onclick:execBuildVal("underline")})),e),fontSize(e,t){e.addClass("group").attrs({title:"폰트 사이즈를 지정합니다. 기본값은 17px입니다."});let o=createElement("button").attrs({class:"icon icon-plus"}).props({onclick(){a.value=Number(a.value)+1,a.dispatchEvent(new Event("change"))}}),a=createElement("input").props({value:17,onchange(e){if(null!=e&&"anchorNode"in lastSelection){let e=window.getSelection(),{anchorNode:t,anchorOffset:o,focusNode:a,focusOffset:n}=lastSelection,r=document.createRange();r.setStart(t,o),r.setEnd(a,n),e.removeAllRanges(),e.addRange(r)}document.execCommand("styleWithCSS",0,!0),document.execCommand("fontSize",!1,"7");for(let e of article.querySelectorAll('[style*="xxx-large"]'))e.style.fontSize=`${a.value}px`||"17px"}}).attrs({type:"number",min:12,step:1}),n=createElement("button").attrs({class:"icon icon-minus"}).props({onclick(){a.value=Number(a.value)-1,a.dispatchEvent(new Event("change"))}});return e.append(o,a,n),e},justifyLeft:(e,t)=>(e.attrs({title:"좌측 정렬"}),e.append(createElement("button").attrs({class:"icon icon-format-align-left"}).props({onclick:execBuildVal("justifyLeft")})),e),justifyCenter:(e,t)=>(e.attrs({title:"가운데 정렬"}),e.append(createElement("button").attrs({class:"icon icon-format-align-center"}).props({onclick:execBuildVal("justifyCenter")})),e),justifyRight:(e,t)=>(e.attrs({title:"우측 정렬"}),e.append(createElement("button").attrs({class:"icon icon-format-align-right"}).props({onclick:execBuildVal("justifyRight")})),e),formatBlock:(e,t)=>(e.attrs({title:"인용 하기"}),e.append(createElement("button").attrs({class:"icon icon-format-quote-close"}).props({onclick:execBuildVal("formatBlock","<blockquote>")})),e),createLink:(e,t)=>(e.attrs({title:"링크 생성"}),e.append(createElement("button").attrs({class:"icon icon-link-variant"}).props({onclick:execBuildPrompt("createLink","생성할 링크를 입력해 주세요.",(e=>e.startsWith("http")?e:"http://"+e))})),e),insertImage:(e,t)=>(e.attrs({title:"링크 기반 이미지 삽입"}),e.append(createElement("button").attrs({class:"icon icon-image-plus"}).props({onclick:()=>execModal("insertImage","addImg",(e=>e.startsWith("http")?e:"http://"+e))})),e),unlink:(e,t)=>(e.attrs({title:"링크 삭제"}),e.append(createElement("button").attrs({class:"icon icon-link-variant-off"}).props({onclick:execBuildVal("unlink")})),e),removeFormat:(e,t)=>(e.attrs({title:"서식 지우기"}),e.append(createElement("button").attrs({class:"icon icon-format-clear"}).props({onclick:execBuildVal("removeFormat")})),e),selectAll:(e,t)=>(e.attrs({title:"전체 선택하기"}),e.append(createElement("button").attrs({class:"icon icon-select-all"}).props({onclick:execBuildVal("selectAll")})),e),undo:(e,t)=>(e.attrs({title:"되돌리기"}),e.append(createElement("button").attrs({class:"icon icon-undo"}).props({onclick:execBuildVal("undo")})),e),redo:(e,t)=>(e.attrs({title:"다시하기"}),e.append(createElement("button").attrs({class:"icon icon-redo"}).props({onclick:execBuildVal("redo")})),e)};function loginCheckCallback(){app_article.load()}function parseBoardSetting(e="0;1;전체 문서;;,1;2;인물;인물;"){return e.split(",").map((e=>{const[t,o,a,n,r]=e.split(";");return{order:parseInt(t),style:"1"==o?"table":"galery",type:o,title:a,category:n,board:r}})).sort(((e,t)=>e.order-t.order))}function loadBoardLists(e,t,o,a){let n=[],r=[];this.data.Board=new Model(Options.get("board"),null,(function(e){for(let t of article.querySelectorAll("[data-board]")){let o=e.find((e=>e.value==t.getAttribute("data-board")));o&&(t.innerHTML=o.path)}}));for(let i of parseBoardSetting(e)){let s=randomId(),c={...o};i.category&&(c.category={key:i.category,op:"equal"}),i.board&&(c.board_name_arr={key:i.board,op:"contains"}),n.push(this.createContent("title",`title_${s}`,{text:i.title}),this.createContent("list",`list_${s}`,{style:i.style,keyword:t,field:"author",operator:"equal",searchData:c})),this.data.Board.bind(this.components[`list_${s}`]),a>=FINAL.PERMISSION.RW&&(listenCategories(),r.push(this.createForm("board_setting",`setting_${s}`,i,!0,!0)))}if(a>=FINAL.PERMISSION.RW&&n.length>0){let d=createElement("div").addClass("profile_header__buttons","flex-horizontal"),p=createElement("button").props({innerHTML:"목록 수정"}).css({flex:1}),u=createElement("button").props({innerHTML:TEXTS.form.cancel});u.onclick=function(){Notify.confirm("목록 설정을 취소하시겠습니까?")&&location.reload()};let m=createElement("div").addClass("profile_header__buttons","flex-horizontal"),f=createElement("button").props({innerHTML:"+ 메뉴 추가"});async function l(){if(!Notify.confirm("변경사항을 저장 할까요?"))return;let e=document.querySelectorAll(".form.board_setting");if(e.length>5)return Notify.alert("목록은 5개 까지 생성 가능합니다.");await firebase.auth.updateUser(t,{board_setting:Array.from(e).map(((e,t)=>{let{type:o,title:a,category:n,board:r}=e.getData();return`${t};${o};${a};${n};${r}`})).join(",")}),location.reload()}f.onclick=function(){if(document.querySelectorAll(".form.board_setting").length>4)return Notify.alert("문서 목록은 5개 까지 생성 가능합니다!");m.before(app_article.createForm("board_setting",void 0,{type:1,title:"",category:"",board:""},!0,!0))},p.onmousedown=e=>e.stopPropagation(),p.onclick=function(e){p.onclick=l,this.innerHTML=TEXTS.form.apply,u.css({flex:1}),f.css({flex:1});for(let e of n)e.remove();m.append(f),d.append(u),article.append(d);for(let e of r)article.append(e);article.append(m,footer),n=[]},d.append(p),n.unshift(d)}n.push(footer),article.append.apply(article,n),this.data.Board.proceed()}function execBuildVal(e,t){return function(){document.execCommand("styleWithCSS",0,!0),document.execCommand(e,!1,t||"")}}function execBuildPrompt(e,t,o=e=>e){return function(){var a=Notify.prompt(t)||"";document.execCommand("styleWithCSS",0,!0),document.execCommand(e,!1,o(a))}}function execModal(e,t,o=e=>e,a){return modal(t,(t=>{if("anchorNode"in lastSelection){let e=window.getSelection(),{anchorNode:t,anchorOffset:o,focusNode:a,focusOffset:n}=lastSelection,r=document.createRange();r.setStart(t,o),r.setEnd(a,n),e.removeAllRanges(),e.addRange(r)}document.execCommand("styleWithCSS",0,!0),document.execCommand(e,!1,o(t))}),a)}export{asideProfile as aside,articleProfile as article,loginCheckCallback as loginCallback,loginCheckCallback as logoutCallback};