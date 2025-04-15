/**
* Project: nemuwiki.com
* Version: 2.4.0 | product
* Author: @NEMUWIKI
* Date: 2025-04-15
* Description: personal wiki project for NEMU
*/

class asideForm extends asideBase{constructor(){super(),app.blockMode=!0,this.data.Board=new Model(Options.get("board"),(function(e){this.ul.append(createOption({...e,value:e.value,text:e.path,is_owner:e.owner==app.user?.uid},this))}),(function(){for(let e of Array.from(this.ul.children))"N-OPTION"==e.tagName&&e.remove()})),this.data.Categories=new Model(Options.get("categories"),(function(e){this.ul.append(createOption(e,this))}),(function(){for(let e of Array.from(this.ul.children))"N-OPTION"==e.tagName&&e.remove()}));let e=this.components.board=createSelect([],0,!0,"문서 분류").addClass("input","flex-horizontal"),t=this.components.cate=createSelect([],0,!0,"카테고리").addClass("input","flex-horizontal"),a=this.components.template=createSelect([],0,!0,"템플릿").addClass("input","flex-horizontal");this.data.Board.bind(e),this.data.Categories.bind(t),e.ondelete=e=>!!Notify.confirm("정말로 삭제 하시겠습니까?")&&(firebase.board.deleteOne(e).catch(firebaseErrorHandler),!0),e.ul.append(createElement("button").addClass("n-option-add").props({innerHTML:"+ 새로운 분류 추가",onmousedown(e){e.stopPropagation(),e.preventDefault(),modal("addMenu")}})),t.ondelete=e=>!!Notify.confirm("정말로 삭제 하시겠습니까?")&&(firebase.categories.deleteOne(e).catch(firebaseErrorHandler),!0),t.ul.append(createElement("button").addClass("n-option-add").props({innerHTML:"+ 새로운 카테고리 추가",onmousedown(e){e.stopPropagation(),e.preventDefault(),modal("addCategory")}})),a.ondelete=e=>!!Notify.confirm("정말로 삭제 하시겠습니까?")&&(firebase.post.deleteTemporary(e,void 0,!0).catch(firebaseErrorHandler),!0);let o=new Model(Object.keys(FormContent),(function(e){if(!FormContent[e].text)return;let t=createElement("li").css({"font-size":"var(--font-size-regular)",cursor:"pointer"}).attrs({draggable:!0}).props({ondragstart(t){t.dataTransfer.setData("text",`$$nemuwiki$$-${e}`),article.ondragover=e=>{e.preventDefault()},article.ondrop=t=>{t.preventDefault();let a,o,n,r=999;for(let e of Array.from(article.querySelectorAll(".focusable")))a=e.getBoundingClientRect(),o=a.y+.5*a.height,Math.abs(o-t.clientY)>Math.abs(r-t.clientY)||(r=o,n=e);let l=app_article.createForm(e,void 0,void 0,!0);n?r<t.clientY?n.after(l):n.before(l):article.append(l),l.scrollIntoViewIfNeeded()}},ondragend(){article.ondrop=article.ondragover=null}});t.append(createElement("span").attrs({class:"tag icon"}).addClass(FormContent[e].icon).props({onclick(){article.append(app_article.createForm(e,void 0,void 0,!0))}}),createElement("span").attrs({"data-type":e}).props({innerHTML:FormContent[e].text})),this.ul.append(t)})),n=createElement("input").attrs({type:"checkbox",class:"toggle_chk"}).props({id:"template_chk",onclick:setTemplate}),r=createElement("div").props({innerHTML:"템플릿으로 사용"}).addClass("flex-horizontal");r.append(n);let l=createElement("input").attrs({type:"checkbox",class:"toggle_chk"}).props({id:"hidden_chk"}),i=createElement("div").props({innerHTML:"숨긴 문서"}).addClass("flex-horizontal");i.append(l),aside.append(t,e,a,this.createBlockList("components","컴포넌트",o),createElement("button").props({innerHTML:"게시하기",onclick:submit}).addClass("f_button").addClass("submit_btn").css({"max-width":"23rem",width:"100%"}),r,i),listenCategories();let{next:s}=firebase.post.list({board_name:"template"},!0),c={};s().then((e=>{for(let t of e){let e=c[t.id]=t.data();a.ul.append(createOption({id:t.id,value:t.id,text:e.title,is_owner:e.author==app.user?.uid},a))}a.onselchange=e=>{let{contents:t}=c[e],a=[];for(let e of t){let t=e.value,o=app_article.createForm(e.type,void 0,t,!0);if("textbox"===e.type)for(let e of Array.from(o.querySelectorAll('[style*="font-size"]')))e.style.fontSize.endsWith("rem")&&e.css({"font-size":10*parseFloat(e.style.fontSize)+"px"});a.push(o)}article.querySelectorAll(".focusable").forEach((e=>e.remove())),article.append.apply(article,a)},loading(1)})).catch(firebaseErrorHandler),this.data.Board.proceed(),this.data.Categories.proceed()}}class articleForm extends articleBase{constructor(e){super(),this.contentBase=ContentBase,this.formBase=FormContent;let t=this;if(!1===app.user)return app.blockMode=!1,void move(`401?message=${encodeURI(TEXTS.warn.login_neccesary)}&url=${location.href}`,!0);let a=new Model([],(function(e){this.wrap.append(ToolBase[e](createElement("span").addClass(e,"flex-horizontal"),t._focusedElement))}),(function(){emptyNode(this.wrap)})),o=[this.createForm("toolbar","toolbar",a),this.createForm("bottomtoolbar"),this.createForm("main_header","main_header")];a.bind(this.components.toolbar),a.proceed();let n=e.get("post");n?(document.title=`${TEXTS.sitename} :: 문서 편집 - 로딩중`,(async()=>{"random"==n&&(n=await firebase.search.random());let e=await firebase.post.selectOne(n),t=e.data();if(this.BeforeData={id:e.id,...t},!t)return app.blockMode=!1,move(`404?message=${encodeURI("존재하지 않는 문서입니다.")}&url=${location.href}`,!0);if(t.deleted)return app.blockMode=!1,move(`404?message=${encodeURI("삭제된 문서입니다.")}&url=${location.href}`,!0);if(t.hidden&&t.author!=app.user?.uid)return app.blockMode=!1,move(`403?message=${encodeURI("타인의 숨긴 문서는 수정이 불가합니다.")}&url=${location.href}`,!0);hidden_chk&&(hidden_chk.checked=t.hidden),"template"==t.board_name&&(template_chk.checked=!0),document.title=`${TEXTS.sitename} :: 문서 편집 - ${t.title}`,app_aside&&(app_aside.components.board.set(t.board_name),app_aside.components.cate.set(t.category)),this.components.main_header.wrap.setData(t.title);for(let e of t.contents){let t=e.value,a=this.createForm(e.type,void 0,t,!0);if("textbox"===e.type)for(let e of Array.from(a.querySelectorAll('[style*="font-size"]')))e.style.fontSize.endsWith("rem")&&e.css({"font-size":10*parseFloat(e.style.fontSize)+"px"});o.push(a)}article.append.apply(article,o)})()):(document.title=`${TEXTS.sitename} :: 새로운 문서`,article.append.apply(article,o))}createForm(e,t=randomId(),a,o=!1){let n=createElement("div").attrs({class:`flex-horizontal form ${e}`,id:t,tabIndex:this.tabIndex++,"data-type":e});if(o){let e=createElement("div").addClass("form__move","flex-vertical"),a=createElement("button").addClass("form__move__up").props({onclick(){n.prev(".focusable")?.before(n)}}),o=createElement("button").addClass("form__move__down").props({onclick(){n.next(".focusable")?.after(n)}}),r=createElement("button").addClass("form__drag"),l=createElement("button").addClass("form__del");n.addClass("focusable").onfocus=n.onfocusin=n.onclick=()=>this.focusedElement=n,l.onclick=()=>{n.remove(),delete this.components[t],delete this.data[t],this.focusedElement==n&&(this.focusedElement=null)},r.ontouchstart=r.onmousedown=e=>{e.preventDefault(),n.addClass("dragging"),n.focus();let t,a=n.getBoundingClientRect(),o=e.touches?e.touches[0]:e,r=createElement("span").addClass("form__placeholder");window.ontouchmove=window.onmousemove=e=>{e.preventDefault(),t=e.touches?e.touches[0]:e,n.css({transform:`translate(${parseInt(t.pageX-o.pageX)}px, ${parseInt(t.pageY-o.pageY)}px)`});let l,i,s=a.y+.5*a.height;for(let e of Array.from(article.querySelectorAll(".focusable")).filter((e=>e!=n)))a=e.getBoundingClientRect(),l=a.y+.5*a.height,Math.abs(l-t.clientY)>Math.abs(s-t.clientY)||(s=l,i=e);i&&(s<t.clientY?i.after(r):i.before(r))},window.onmouseleave=window.onmouseup=window.ontouchend=()=>{window.onmouseleave=window.onmouseup=window.ontouchend=window.onmousemove=window.ontouchmove=null,n.style.removeProperty("transform"),n.removeClass("dragging"),t&&(r.replaceWith(n),n.focus())}},e.append(a,r,o),n.append(e,l)}return this.components[t]={wrap:n},this.data[t]=a,this.formBase[e]&&this.formBase[e].initialize.call(this,t,n,a),n}destroy(){}}const FormContent={toolbar:{initialize(e,t,a){t.addClass("flex-horizontal")}},bottomtoolbar:{__initialize(e,t,a){let o=createElement("button").attrs({class:"icon icon-plus preventable"}),n=createElement("button").props({innerHTML:"미리보기",onclick:preview}).attrs({class:"previewBtn"}),r=createElement("button").props({innerHTML:"게시",onclick:submit}).addClass("preventable").addClass("submit_btn"),l=[];for(let e in this.formBase)this.formBase[e].text&&l.push({text:this.formBase[e].text,value:e});let i=createSelect(l,0).addClass("preventable");i.submit=()=>o.onmousedown(),o.onmousedown=e=>{e&&e.preventDefault(),s(i.dataset.value)},t.addClass("flex-horizontal").append(i,o,n,r);let s=e=>{let t=this.createForm(e,void 0,void 0,!0);this.focusedElement?this.focusedElement.after(t):article.append(t),t.scrollIntoViewIfNeeded()}},initialize(e,t,a){let o=createElement("button").props({innerHTML:"미리보기",onclick:preview}).attrs({class:"previewBtn"}),n=createElement("button").props({innerHTML:"게시",onclick:submit}).addClass("preventable").addClass("submit_btn");for(let e in this.formBase){let{text:a,icon:o}=this.formBase[e];a&&t.append(createElement("button").attrs({class:`icon ${o} preventable`,title:a}).props({onclick(){r(e)}}))}t.addClass("flex-horizontal").append(o,n);let r=e=>{let t=this.createForm(e,void 0,void 0,!0);this.focusedElement?this.focusedElement.after(t):article.append(t),t.scrollIntoViewIfNeeded()}}},main_header:{initialize(e,t,a){let o=createElement("div").addClass("form__inputs").css({"grid-template-columns":"1fr"}),n=createElement("input").attrs({type:"text",placeholder:"예시 ) 캐릭터 A",name:"text",id:randomId()}).css({"font-size":"var(--font-size-large)"}),r=createElement("label").attrs({for:n.id}).props({innerHTML:"문서 제목"}).css({"font-size":"var(--font-size-xlarge)","font-weight":"bold"});o.append(r,n),t.append(o),t.getData=()=>n.value,t.setData=e=>n.value=e}},textbox:{text:"텍스트박스",icon:"icon-format-textbox",initialize(e,t,a){let o=createElement("div").attrs({contenteditable:!0,placeholder:"텍스트박스.\n                여기에 텍스트를 입력하세요.",class:"form__textbox"}).props({innerHTML:a||"",onpaste(e){e.preventDefault(),document.execCommand("inserttext",!1,e.clipboardData.getData("text/plain"))},ondrop(e){const t=document.createTextNode(e.dataTransfer.getData("text/plain"));if(t.textContent.startsWith("$$nemuwiki$$"))return;let a;if(e.preventDefault(),"caretRangeFromPoint"in document)a=document.caretRangeFromPoint(e.clientX,e.clientY);else{if(!("caretPositionFromPoint"in document))return;a=document.caretPositionFromPoint(e.clientX,e.clientY)}a.insertNode(t),a.setStart(t,0),a.setEnd(t,t.length);const o=window.getSelection();o.removeAllRanges(),o.addRange(a),this.oninput()},onblur(){let e=window.getSelection();lastSelection={anchorNode:e.anchorNode,anchorOffset:e.anchorOffset,focusNode:e.focusNode,focusOffset:e.focusOffset}},oninput(){this.querySelectorAll('[style^="font-size: var(--"]').forEach((e=>e.style.removeProperty("font-size"))),this.querySelectorAll('[style^="background-color: var(--"]').forEach((e=>e.style.removeProperty("background-color"))),this.toggleClass("empty",this.textContent.trim().length<1)}});o.toggleClass("empty",o.textContent.trim().length<1),t.append(o),t.getData=()=>o.innerHTML},buttons:["foreColor","backColor","bold","italic","strikeThrough","underline","fontSize","justifyLeft","justifyCenter","justifyRight","formatBlock","createLink","insertAnno","insertImage","unlink","removeFormat","selectAll","undo","redo"]},image:{text:"사진",icon:"icon-image",initialize(e,t,a={}){"string"==typeof a&&(a={src:a});let o=createElement("div").addClass("form__image"),n=createElement("div").addClass("form__image__wrap","flex-horizontal"),r=new Image,l=createElement("div").addClass("flex-vertical"),i=a.isThumb||!1,s=a.hidden||!1,c=a.align||"left",d=createElement("p"),p=createElement("input").attrs({type:"checkbox",label:"대표 이미지 설정"}).addClass("s_chk").props({onchange(){n.toggleClass("main",i=this.checked)}}),u=createElement("p"),m=createElement("input").attrs({type:"checkbox",label:"이미지 감추기"}).addClass("s_chk").props({onchange(){s=this.checked}}),f=createElement("input").attrs({type:"number",min:10,step:1}),h=createElement("input").attrs({type:"number",min:10,step:1}),b=createElement("p").addClass("input_l");r.onload=function(){let e=r.naturalWidth/r.naturalHeight;f.value=a.width||r.naturalWidth,h.value=parseInt(f.value/e),f.oninput=()=>{h.value=parseInt(f.value/e)},h.oninput=()=>{f.value=parseInt(h.value*e)}},b.append(document.createTextNode("W"),f,document.createTextNode("H"),h),d.append(p),u.append(m),l.append(b,d,u);let g=createElement("button").addClass("f_button").props({innerHTML:"이미지 선택"}),v="",y=e=>{v=e,r.src=e.startsWith("http")?imgurThumb(e,"m"):firebase.storage.getStaticUrl(e)};g.onclick=()=>{modal("addImg",y)},a.src&&y(a.src),i&&(p.checked=!0),s&&(m.checked=!0),a.align&&(r.dataset.align=c),n.append(r,l),o.append(g,n),t.append(o),t.getData=()=>({width:f.value||10,src:v,isThumb:i,hidden:s,align:r.dataset.align||"left"})},buttons:["imageToLeft","imageToCenter","imageToRight"]},dialog:{text:"대화",icon:"icon-forum",initialize(e,t){let a=createElement("div").addClass("form__inputs");a.innerHTML="대화",t.append(a),t.getData=()=>""}}},ToolBase={foreColor:(e,t)=>(e.attrs({title:"글씨에 형광펜 효과를 줍니다."}),e.append(createElement("button").attrs({class:"icon icon-format-color-text"}).props({onclick:()=>execModal("foreColor","colorPicker",(a=>(t.matches("n-table")&&getCells(t).forEach((e=>{if(""==e.innerHTML)e.innerHTML='<div style="color:'+a+'"> </div>';else for(let t of Array.from(e.childNodes))cellCss(e,t,{color:a})})),e.style.setProperty("--input-color",a),e.dataset.foreColor=a,a)),e.dataset.foreColor)})),e),backColor:(e,t)=>(e.attrs({title:"글씨에 형광펜 효과를 줍니다."}),e.append(createElement("button").attrs({class:"icon icon-format-color-highlight"}).props({onclick:()=>execModal("backColor","colorPicker",(a=>(t.matches("n-table")&&getCells(t).forEach((e=>{if(""==e.innerHTML)e.innerHTML='<span style="background-color:'+a+'"> </span>';else for(let t of Array.from(e.childNodes))cellCss(e,t,{"background-color":a},"span")})),e.style.setProperty("--input-color",a),e.dataset.backColor=a,a)),e.dataset.backColor)})),e),bold:(e,t)=>(e.attrs({title:"굵은 글씨 효과"}),e.append(createElement("button").attrs({class:"icon icon-format-bold"}).props({onclick:execBuildVal("bold",void 0,(()=>{t.matches("n-table")&&getCells(t).forEach((e=>{if(""==e.innerHTML)e.innerHTML="<b> </b>";else for(let t of Array.from(e.childNodes))cellCss(e,t,{},"b")}))}))})),e),italic:(e,t)=>(e.attrs({title:"기울임 꼴"}),e.append(createElement("button").attrs({class:"icon icon-format-italic"}).props({onclick:execBuildVal("italic",void 0,(()=>{t.matches("n-table")&&getCells(t).forEach((e=>{if(""==e.innerHTML)e.innerHTML="<i> </i>";else for(let t of Array.from(e.childNodes))cellCss(e,t,{},"i")}))}))})),e),strikeThrough:(e,t)=>(e.attrs({title:"취소선 효과"}),e.append(createElement("button").attrs({class:"icon icon-format-strikethrough"}).props({onclick:execBuildVal("strikeThrough",void 0,(()=>{t.matches("n-table")&&getCells(t).forEach((e=>{if(""==e.innerHTML)e.innerHTML="<s> </s>";else for(let t of Array.from(e.childNodes))cellCss(e,t,{},"s")}))}))})),e),underline:(e,t)=>(e.attrs({title:"밑줄 효과"}),e.append(createElement("button").attrs({class:"icon icon-format-underline"}).props({onclick:execBuildVal("underline",void 0,(()=>{t.matches("n-table")&&getCells(t).forEach((e=>{if(""==e.innerHTML)e.innerHTML="<u> </u>";else for(let t of Array.from(e.childNodes))cellCss(e,t,{},"u")}))}))})),e),fontSize(e,t){e.addClass("group").attrs({title:"폰트 사이즈를 지정합니다. 기본값은 17px입니다."});let a=createElement("button").attrs({class:"icon icon-plus"}).props({onclick(){o.value=Number(o.value)+1,o.dispatchEvent(new Event("change"))}}),o=createElement("input").props({value:17,onchange(e){if(t.matches("n-table"))getCells(t).forEach((e=>{if(""==e.innerHTML)e.innerHTML='<span style="font-size:'+o.value+'px;"> </span>';else for(let t of Array.from(e.childNodes))cellCss(e,t,{"font-size":`${o.value}px`},"span")}));else{if(null!=e&&"anchorNode"in lastSelection){let e=window.getSelection(),{anchorNode:t,anchorOffset:a,focusNode:o,focusOffset:n}=lastSelection,r=document.createRange();r.setStart(t,a),r.setEnd(o,n),e.removeAllRanges(),e.addRange(r)}document.execCommand("styleWithCSS",0,!0),document.execCommand("fontSize",!1,"7");for(let e of article.querySelectorAll('[style*="xxx-large"]'))e.style.fontSize=`${o.value}px`||"17px"}}}).attrs({type:"number",min:12,step:1}),n=createElement("button").attrs({class:"icon icon-minus"}).props({onclick(){o.value=Number(o.value)-1,o.dispatchEvent(new Event("change"))}});return e.append(a,o,n),e},justifyLeft:(e,t)=>(e.attrs({title:"좌측 정렬"}),e.append(createElement("button").attrs({class:"icon icon-format-align-left"}).props({onclick:execBuildVal("justifyLeft")})),e),justifyCenter:(e,t)=>(e.attrs({title:"가운데 정렬"}),e.append(createElement("button").attrs({class:"icon icon-format-align-center"}).props({onclick:execBuildVal("justifyCenter")})),e),justifyRight:(e,t)=>(e.attrs({title:"우측 정렬"}),e.append(createElement("button").attrs({class:"icon icon-format-align-right"}).props({onclick:execBuildVal("justifyRight")})),e),formatBlock:(e,t)=>(e.attrs({title:"인용 하기"}),e.append(createElement("button").attrs({class:"icon icon-format-quote-close"}).props({onclick:execBuildVal("formatBlock","<blockquote>")})),e),createLink:(e,t)=>(e.attrs({title:"링크 생성"}),e.append(createElement("button").attrs({class:"icon icon-link-variant"}).props({onclick:execBuildPrompt("createLink","생성할 링크를 입력해 주세요.",(e=>e.startsWith("http")?e:"http://"+e))})),e),insertAnno:(e,t)=>(e.attrs({title:"주석 삽입"}),e.append(createElement("button").attrs({class:"icon icon-code-brackets"}).props({onclick:()=>execModal("insertText","addAnno",((e,t)=>`[*${e||"주석"} ${t||"텍스트를 입력하세요."}]`))})),e),insertImage:(e,t)=>(e.attrs({title:"링크 기반 이미지 삽입"}),e.append(createElement("button").attrs({class:"icon icon-image-plus"}).props({onclick:()=>execModal("insertImage","addImg",(e=>e.startsWith("http")?e:"http://"+e))})),e),unlink:(e,t)=>(e.attrs({title:"링크 삭제"}),e.append(createElement("button").attrs({class:"icon icon-link-variant-off"}).props({onclick:execBuildVal("unlink")})),e),removeFormat:(e,t)=>(e.attrs({title:"서식 지우기"}),e.append(createElement("button").attrs({class:"icon icon-format-clear"}).props({onclick:execBuildVal("removeFormat",void 0,(()=>{t.matches("n-table")&&getCells(t).forEach((e=>e.innerHTML=e.innerText))}))})),e),selectAll:(e,t)=>(e.attrs({title:"전체 선택하기"}),e.append(createElement("button").attrs({class:"icon icon-select-all"}).props({onclick:execBuildVal("selectAll")})),e),undo:(e,t)=>(e.attrs({title:"되돌리기"}),e.append(createElement("button").attrs({class:"icon icon-undo"}).props({onclick:execBuildVal("undo")})),e),redo:(e,t)=>(e.attrs({title:"다시하기"}),e.append(createElement("button").attrs({class:"icon icon-redo"}).props({onclick:execBuildVal("redo")})),e),rowSize(e,t){e.addClass("group").attrs({title:"행 크기 조절"});let a=t.querySelector("n-table"),o=createElement("input").props({value:a.rowcount,oninput:()=>parseInt(o.value)&&(a.rowcount=parseInt(o.value))}).attrs({type:"number",min:1,step:1});return e.append(createElement("button").attrs({class:"icon icon-table-row-plus-after"}).props({onclick:()=>a&&a.rowcount++&&(o.value=a.rowcount)}),o,createElement("button").attrs({class:"icon icon-table-row-remove"}).props({onclick:()=>a&&a.rowcount--&&(o.value=a.rowcount)})),e},colSize(e,t){e.addClass("group").attrs({title:"열 크기 조절"});let a=t.querySelector("n-table"),o=createElement("input").props({value:a.colcount,oninput:()=>parseInt(o.value)&&(a.colcount=parseInt(o.value))}).attrs({type:"number",min:1,step:1});return e.append(createElement("button").attrs({class:"icon icon-table-column-plus-after"}).props({onclick:()=>a&&a.colcount++&&(o.value=a.colcount)}),o,createElement("button").attrs({class:"icon icon-table-column-remove"}).props({onclick:()=>a&&a.colcount--&&(o.value=a.colcount)})),e},innerLineColor(e,t){let a=t.querySelector("n-table"),o=createElement("span").addClass("color_swap").css({"background-color":a.innerLineColor});return e.addClass("group").attrs({title:"표 내부 테두리 색상"}),e.props({onclick:()=>modal("colorPicker",(e=>a&&(a.innerLineColor=o.style.backgroundColor=e)),a?.innerLineColor)}).append(createElement("button").attrs({class:"icon icon-border-inside"}),o),e},outerLineColor(e,t){let a=t.querySelector("n-table"),o=createElement("span").addClass("color_swap").css({"background-color":a.outerLineColor});return e.addClass("group").attrs({title:"표 외부 테두리 색상"}),e.props({onclick:()=>modal("colorPicker",(e=>a&&(a.outerLineColor=o.style.backgroundColor=e)),a?.outerLineColor)}).append(createElement("button").attrs({class:"icon icon-border-outside"}),o),e},outerLineWidth(e,t){e.addClass("group").attrs({title:"표 외부 테두리 굵기"});let a=t.querySelector("n-table"),o=createElement("input").props({value:a.outerLineWidth,oninput:()=>parseInt(o.value)&&(a.outerLineWidth=parseInt(o.value))}).attrs({type:"number",min:1,step:1});return e.append(createElement("button").attrs({class:"icon icon-plus"}).props({onclick:()=>a&&a.outerLineWidth++&&(o.value=a.outerLineWidth)}),o,createElement("button").attrs({class:"icon icon-minus"}).props({onclick:()=>a&&a.outerLineWidth--&&(o.value=a.outerLineWidth)})),e},cellBackgroundColor(e,t){let a=t.matches("n-table")?t:t.querySelector("n-table"),o=createElement("span").addClass("color_swap").css({"background-color":a.lastSelection?.dataset.color||"#ffffff"});return a.onSelChange=e=>o.style.backgroundColor=e.dataset.color||"#ffffff",e.addClass("group").attrs({title:"셀 체우기 색상"}),e.props({onclick:()=>modal("colorPicker",(e=>{getCells(a).forEach((t=>{t.dataset.color=e,t.style.backgroundColor=e,o.style.backgroundColor=e}))}),a?.lastSelection.dataset.color)}).append(createElement("button").attrs({class:"icon icon-format-color-fill"}),o),e},insertCellLink:(e,t)=>(e.attrs({title:"링크 생성"}),e.append(createElement("button").attrs({class:"icon icon-link-variant"}).props({onclick:execBuildPrompt("insertHTML","생성할 링크를 입력해 주세요",(e=>`[link:${e=e.startsWith("http")?e:"http://"+e}]`))})),e),insertCellImage(e,t){let a=t.querySelector("n-table");return e.attrs({title:"링크 기반 이미지 삽입"}),e.append(createElement("button").attrs({class:"icon icon-image-plus"}).props({onclick:()=>modal("addImg",(e=>{a.lastSelection&&a.lastSelection.append(document.createTextNode(`[image:${e}]`))}))})),e},fitToCell(e,t){let a=t.matches("n-table")?t:t.querySelector("n-table");return e.attrs({title:"셀 여백 사용 설정"}),e.append(createElement("button").attrs({class:"icon icon-fit-to-page-outline"}).props({onclick:()=>{let e;getCells(a).forEach((t=>{e?t.dataset.fitToCell=e:e=t.dataset.fitToCell="true"!=t.dataset.fitToCell}))}})),e},tableToLeft(e,t){let a=t.querySelector("n-table");return e.attrs({title:"좌측 정렬"}),e.append(createElement("button").attrs({class:"icon icon-format-align-left"}).props({onclick:()=>a.dataset.align="left"})),e},tableToCenter(e,t){let a=t.querySelector("n-table");return e.attrs({title:"가운데 정렬"}),e.append(createElement("button").attrs({class:"icon icon-format-align-center"}).props({onclick:()=>a.dataset.align="center"})),e},tableToRight(e,t){let a=t.querySelector("n-table");return e.attrs({title:"우측 정렬"}),e.append(createElement("button").attrs({class:"icon icon-format-align-right"}).props({onclick:()=>a.dataset.align="right"})),e},imageToLeft(e,t){let a=t.querySelector("img");return e.attrs({title:"좌측 정렬"}),e.append(createElement("button").attrs({class:"icon icon-format-align-left"}).props({onclick:()=>a.dataset.align="left"})),e},imageToCenter(e,t){let a=t.querySelector("img");return e.attrs({title:"가운데 정렬"}),e.append(createElement("button").attrs({class:"icon icon-format-align-center"}).props({onclick:()=>a.dataset.align="center"})),e},imageToRight(e,t){let a=t.querySelector("img");return e.attrs({title:"우측 정렬"}),e.append(createElement("button").attrs({class:"icon icon-format-align-right"}).props({onclick:()=>a.dataset.align="right"})),e},tableFitHoriontal(e,t){let a=t.querySelector("n-table");return e.attrs({title:"전체 넓이 초과시 가로 맞춤"}),e.append(createElement("button").attrs({class:"icon icon-arrow-expand-horizontal"}).props({onclick:()=>a.dataset.fit="true"==a.dataset.fit?"false":"true"})),e},cellAlign:(e,t)=>(e.addClass("group").attrs({title:"텍스트 정렬"}),e.append(createElement("button").attrs({class:"icon icon icon-format-align-left"}).props({onclick:()=>getCells(t).forEach((e=>{if(""==e.innerHTML)e.innerHTML='<div style="text-align:left"> </div>';else for(let t of Array.from(e.childNodes))cellCss(e,t,{"text-align":"left"})}))}),createElement("button").attrs({class:"icon icon icon-format-align-center"}).props({onclick:()=>getCells(t).forEach((e=>{if(""==e.innerHTML)e.innerHTML='<div style="text-align:center"> </div>';else for(let t of Array.from(e.childNodes))cellCss(e,t,{"text-align":"center"})}))}),createElement("button").attrs({class:"icon icon icon-format-align-right"}).props({onclick:()=>getCells(t).forEach((e=>{if(""==e.innerHTML)e.innerHTML='<div style="text-align:right"> </div>';else for(let t of Array.from(e.childNodes))cellCss(e,t,{"text-align":"right"})}))})),e)};function preview(){document.body.addClass("preview-mode");let e=[app_article.createContent("zoom")],t=[],a=0,o=1,n="",r=[];this.onclick=()=>{this.onclick=preview;for(let t of e)t.remove();article.style.removeProperty("zoom"),document.body.removeClass("preview-mode")};for(let l of article.children){if(!l.getData)continue;let i,s="main_header"==l.dataset.type?{text:l.getData()}:l.getData(),c=app_article.createContent(l.dataset.type,void 0,s);switch(l.dataset.type){case"title":if(i={content:c,title:c.innerHTML},o<s.depth)n+=`${a}.`,r.push({depth:++o,prefix:n,index_str:n+"1.",index:a=1,...i});else if(o==s.depth)r.push({depth:o,prefix:n,index:++a,index_str:n+`${a}.`,...i});else{let e=r.findLast((e=>e.depth==s.depth));r.push({depth:o=s.depth,prefix:n=e.prefix,index:a=e.index+1,index_str:n+`${a}.`,...i})}break;case"summury":t.push(c);break;case"textbox":for(let e of Array.from(c.querySelectorAll('[style*="font-size"]')))e.style.fontSize.endsWith("rem")&&e.css({"font-size":10*parseFloat(e.style.fontSize)+"px"})}e.push(c)}t.length>0&&r.forEach((e=>{e.content.prepend(createElement("a").props({innerHTML:`${e.index_str} `,id:e.index_str.split(".").join("_"),onclick(e){e.preventDefault(),history.pushState({},"","#summury"),t[0].scrollIntoViewIfNeeded()}}).attrs({href:"#summury"}))}));for(let e of t)e.append.apply(e,r.map((e=>createElement("a").attrs({href:`#_${e.index_str.split(".").join("_")}`}).props({innerHTML:`${e.index_str} <span>${e.title}</span>`,onclick(t){t.preventDefault(),history.pushState({},"",`#_${e.index_str.split(".").join("_")}`),e.content.scrollIntoViewIfNeeded()}}).css({"margin-left":1.5*e.depth+"rem"}))));if(html_annotation.length>0){let t=createElement("div").attrs({class:"content annotation"});t.innerHTML=html_annotation,html_annotation="",e.push(t)}article.append.apply(article,e)}function execBuildVal(e,t,a){return function(){document.execCommand("styleWithCSS",0,!0),document.execCommand(e,!1,t||""),a&&a()}}function execBuildPrompt(e,t,a=e=>e){return function(){var o=Notify.prompt(t)||"";document.execCommand("styleWithCSS",0,!0),document.execCommand(e,!1,a(o))}}function execModal(e,t,a=e=>e,o){return modal(t,((t,o,n)=>{if("anchorNode"in lastSelection){let e=window.getSelection(),{anchorNode:t,anchorOffset:a,focusNode:o,focusOffset:n}=lastSelection,r=document.createRange();r.setStart(t,a),r.setEnd(o,n),e.removeAllRanges(),e.addRange(r)}document.execCommand("styleWithCSS",0,!0),document.execCommand(e,!1,a(t,o,n))}),o)}function cellCss(e,t,a,o="div"){if(3==t.nodeType){let n=createElement(o).css(a);n.innerHTML=t.textContent,console.log("1",e,"2",t,"3",n),e.replaceChild(n,t)}else{let e=t.tagName.toLowerCase()==o;e&&t.css(a);for(let n of Array.from(t.childNodes))3==n.nodeType&&e||cellCss(t,n,a,o)}}function getCells(e){let t=[],{first:a,last:o}=e.selection;if(!a||!o)return;let n,r=Number(a.dataset.row),l=Number(a.dataset.col),i=Number(o.dataset.row),s=Number(o.dataset.col);i<r&&(n=i,i=r,r=n),s<l&&(n=s,s=l,l=n);for(let a of Array.from(e._tbody.children)){let e=a.dataset.row,o=a.dataset.col;r>e||e>i||l>o||o>s||t.push(a)}return t}function logoutCallback(){move(`401?message=${encodeURI(TEXTS.warn.login_neccesary)}&url=${location.href}`,!0)}async function submit(){try{if(!Notify.confirm("작성한 내용을 업로드 하시겠습니까?"))return;let{board:e,cate:t}=app_aside.components,a={board_name:e.dataset.value||"전체",board_name_arr:e.dataset.value?e.dataset.selectedtext.split(" > "):["전체"],category:t.dataset.value||"전체",title:"[이 값이 보이면 개발자한테 알려주세요]",contents:[],hidden:hidden_chk.checked};for(let e of article.children)if(e.getData)if("main_header"===e.dataset.type)a.title=e.getData();else a.contents.push({type:e.dataset.type,value:e.getData()});if(a.title.length>25)return Notify.alert("문서 명은 최대 25자 까지 가능합니다.");if(a.title.length<1)return Notify.alert("문서 명은 비워 둘 수 없습니다.");toggleSubmitMode(),app_article.BeforeData?(a.updated_timestamp=new Date,a.timestamp=new Date(1e3*app_article.BeforeData.timestamp.seconds),a.author=app_article.BeforeData.author,a.use=app_article.BeforeData.use,firebase.post.updateOne(app_article.BeforeData.id,a).then((async()=>{await makeKeyword(app_article.BeforeData.id,a),app.blockMode=!1,move(`/?post=${app_article.BeforeData.id}`)})).catch(firebaseErrorHandler).finally((()=>toggleSubmitMode(!1)))):(a.updated_timestamp=new Date,a.timestamp=a.updated_timestamp,a.author=app.user.uid,a.use=!0,firebase.post.insertOne(a).then((async e=>{if(null==e)return app.blockMode=!1,void move(`401?message=${encodeURI("권한이 없거나 자동 로그아웃 처리되었습니다.")}&url=${location.href}`,!0);await makeKeyword(e.id,a),app.blockMode=!1,move(`/?post=${e.id}`)})).catch((e=>{Notify.alert("ERROR::저장에 실패했습니다::"),dev.error(e)})).finally((()=>toggleSubmitMode(!1))))}catch(e){toggleSubmitMode(!1),Notify.alert(e)}}function toggleSubmitMode(e=!0){return document.querySelectorAll(".submit_btn").forEach((t=>t.disabled=e)),!0}async function makeKeyword(e,t){if(t.deleted)return await firebase.search.unset(e);if("template"==t.board_name)return await firebase.search.unset(e);let{title:a,board_name:o,board_name_arr:n,category:r,timestamp:l,updated_timestamp:i,author:s,contents:c,hidden:d}=t,p=t.title.replace(/\s+/g,""),u=[];for(let e=0;e<p.length;e++){let t=p.length-e;for(let a=1;a<=t;a++)u.push(p.substr(e,a))}u=[...new Set(u)];let m,f,h={title:a,title_arr:u,board_name:o,board_name_arr:n,category:r,timestamp:l,author:s,hidden:d};for(let e of c)switch(e.type){case"image":if(m&&!e.value.isThumb)break;m=e.value.src;break;case"table":if(m)break;if(e.value.cells)for(let t of e.value.cells)if(REGEX.image_for_exec.lastIndex=0,f=REGEX.image_for_exec.exec(t.value),f){m=f[1];break}break;case"textbox":if(m)break;if(REGEX.image_for_exec.lastIndex=0,f=REGEX.image_for_exec.exec(e.value),f){m=f[1];break}}m&&(h.thumbnail=m),i&&(h.updated_timestamp=i),await firebase.search.set(e,h)}const setTemplate=function(){let e;return()=>{template_chk.disabled=!0;let{board:t,template:a}=app_aside.components;template_chk.checked?(e=t.dataset.value,t.set("template"),t.addClass("disabled"),a.addClass("disabled"),hidden_chk.checked=!0,hidden_chk.setAttribute("disabled",!0)):(t.set(e||""),t.removeClass("disabled"),a.removeClass("disabled"),hidden_chk.checked=!1,hidden_chk.removeAttribute("disabled")),setTimeout((()=>{template_chk.disabled=!1}),100)}}();export{asideForm as aside,articleForm as article,logoutCallback};