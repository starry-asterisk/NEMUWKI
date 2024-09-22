/**
* Project: nemuwiki.com
* Version: 2.3.1 | product
* Author: @NEMUWIKI
* Date: 2024-09-22
* Description: personal wiki project for NEMU
*/

class asideLogin extends asideBase{constructor(e){super(),aside.addClass("fold");let t=new URLSearchParams;t.set("field","board_name_arr"),t.set("operator","array-contains");let a=new Model(Options.get("board"),(function(e){let a=createElement("li");t.set("keyword",e.value),a.append(createElement("a").attrs({href:`./index?${t.toString()}`,class:"tag"}).props({innerHTML:e.path})),this.ul.append(a)}),(function(){emptyNode(this.ul)})),n=new Model(app.getVisited(),(function({visited_id:e,title:a,board_name:n}){let r=createElement("li");t.set("keyword",n),r.append(createElement("a").attrs({href:`./index?${t.toString()}`,class:"tag","data-board":n}).props({innerHTML:n}),createElement("a").attrs({href:`./index?post=${e}`}).props({innerHTML:a})),this.ul.append(r)}));aside.append(this.createBlock("B000",`<h1><a class="logo s_button" href="./">${TEXTS.sitename}</a></h1>`),this.createSearch("search",e),this.createBlockList("Visited",TEXTS.recent_document,n),this.createBlockList("Board",TEXTS.document_cate,a),this.createBlock("btn_upload",`<button class="s_button" onclick=" move('form')">${TEXTS.upload}</button><button class="s_button" onclick=" move('profile')">${TEXTS.mypage}</button>`)),this.components.Board.ul.addClass("type2")}createSearch(e,t){let a=createElement("div").addClass("f_block","flex-horizontal").css({marginBottom:"var(--spacing-large)"}),n=createElement("button").attrs({class:"menu_fold icon"}).props({onclick(){aside.toggleClass("fold")}}),r=this.createInput(e).addClass("icon"),i=createElement("button").attrs({class:"input_run icon"}).props({onclick(){o()}});function o(e){e&&e.preventDefault(),move(`./?keyword=${r.firstChild.value}`)}return r.firstChild.attrs({placeHolder:TEXTS.search_i}).props({onkeydown(e){13==e.keyCode&&o(e)},value:t.get("keyword")}),a.append(n,r),r.append(i),a}}class articleLogin extends articleBase{constructor(e){super(),this.contentBase=IndexContent,document.title=`${TEXTS.sitename} :: ${TEXTS.form.login}`;let t=e.get("callbackUrl");app.user?(Notify.alert(TEXTS.warn.login_already),move("./")):article.append(this.createContent("notice"),this.createContent("login",void 0,{callbackUrl:t}),footer)}destroy(){}}function loginCallback(){if(app&&app.state)return app.state=null;Notify.alert(TEXTS.warn.login_already),move("./")}const IndexContent={...ContentBase,notice:{async initialize(e,t){t.style.display="none";let a=(await firebase.notice.getNewest()).docs[0];if(!a)return;let n=a.data(),r=this.components[e].title=createElement("span").attrs({class:"notice__title icon icon-bullhorn-variant"}).props({innerHTML:n.title,onclick(){t.toggleClass("open")}}),i=this.components[e].timestamp=createElement("span").attrs({class:"notice__timestamp"}).props({innerHTML:new Date(1e3*n.timestamp.seconds).toLocaleDateString()}),o=this.components[e].content=createElement("span").attrs({class:"notice__content"}).props({innerHTML:markdown(n.content)});t.addClass("flex-vertical").append(r,i,o),t.style.removeProperty("display")}},login:{async initialize(e,t,a){let n=createElement("div").addClass("b_input").attrs({placeholder:TEXTS.form.id}),r=createElement("div").addClass("b_input").attrs({placeholder:TEXTS.form.pw}),i=createElement("div").addClass("b_input").attrs({placeholder:TEXTS.form.re});n.append(createElement("input").props({id:"input_id"}).attrs({placeholder:TEXTS.empty})),r.append(createElement("input").props({id:"input_pw",type:"password"}).attrs({placeholder:TEXTS.empty})),i.append(createElement("input").props({id:"input_pw_re",type:"password"}).attrs({placeholder:TEXTS.empty})),t.addClass("flex-vertical"),"/login"==app.now?t.append(createElement("h1").props({innerHTML:TEXTS.form.login}),n,r,createElement("button").addClass("f_button").props({innerHTML:TEXTS.form.login,onclick(){return validate(input_id,void 0,"email")?validate(input_pw,void 0,"password")?(this.disabled=!0,app.state=1,void firebase.auth.login(input_id.value,input_pw.value).then((()=>{Notify.alert(TEXTS.alert.login),a.callbackUrl?move(a.callbackUrl):move("./")})).catch(firebaseErrorHandler).finally((()=>{this.disabled=!1}))):Notify.alert(TEXTS.warn.password_short):Notify.alert(TEXTS.warn.email_pattern)}}),createElement("a").attrs({href:"signup"}).props({innerHTML:TEXTS.form.signup}),createElement("a").attrs({href:'javascript:modal("emailPrompt")'}).props({innerHTML:TEXTS.form.find})):t.append(createElement("h1").props({innerHTML:TEXTS.form.signup}),n,r,i,createElement("button").addClass("f_button").props({innerHTML:TEXTS.form.signup,onclick(){return validate(input_id,void 0,"email")?validate(input_pw,void 0,"password")?validate(input_pw,input_pw_re,"password")?(this.disabled=!0,app.state=1,void firebase.auth.signup(input_id.value,input_pw.value).then((e=>{e&&Notify.alert(TEXTS.alert.signup),a.callbackUrl?move(a.callbackUrl):move("./")})).catch(firebaseErrorHandler).finally((()=>{this.disabled=!1}))):Notify.alert(TEXTS.warn.password_mismatch):Notify.alert(TEXTS.warn.password_short):Notify.alert(TEXTS.warn.email_pattern)}}),createElement("a").attrs({href:"login"}).props({innerHTML:TEXTS.form.login}))}}};export{asideLogin as aside,articleLogin as article,loginCallback};