/**
* Project: nemuwiki.com
* Version: 2.4.0 | product
* Author: @NEMUWIKI
* Date: 2025-03-22
* Description: personal wiki project for NEMU
*/

class asideError extends asideBase{constructor(){super()}}class articleError extends articleBase{constructor(e){super(),this.contentBase=FormContent;let t=app.now?.split("/").pop()||"404",r=createElement("div").css({"margin-bottom":"auto"});r.append(createElement("button").addClass("s_button").props({innerHTML:"메인으로",onclick(){move("/")}}),createElement("button").addClass("s_button").props({innerHTML:"이전 페이지로",onclick(){history.back(2)}})),document.title=`오류 - ${t}`,article.append(createElement("n-error-code").attrs({"data-code":t}).props({innerHTML:t}),createElement("div").props({innerHTML:`URL - ${e.get("url")||""}`}),createElement("n-error").props({innerHTML:e.get("message")||"존재하지 않는 페이지 입니다."}),r)}destroy(){}}const FormContent={...ContentBase};export{asideError as aside,articleError as article};