
String.prototype.indexOfDefault = function (search, falseValue = -1, fromIndex = 0) {
    let i = this.indexOf(search, fromIndex);
    return i > -1 ? i + search.length : falseValue;
}
String.prototype.searchDefault = function (search, falseValue = -1, fromIndex = 0) {
    let i = this.search(search, fromIndex);
    return i > -1 ? i : falseValue;
}

/*
https://googlechromelabs.github.io/text-editor/ 및 FileSystem Api MDN 문서 참조
웹 백업과 로컬 two-way 방식으로 지원하고 싶음
*/

/*

async function getFolder() {
    // Open file picker and destructure the result the first handle
    const directoryHandle = await window.showDirectoryPicker({
        id: 'some_id',
        mode: 'read' || 'readWrite',
        startIn: 'desktop' || 'documents' || 'downloads' || 'music' || 'pictures' || 'videos'
    });

    //generator function << 검색해봐
    async function* getFilesRecursively(entry) {
        yield entry;
        if (entry.kind === "file") {
            const file = await entry.getFile();
            if (file !== null) {
                //file.relativePath = getRelativePath(entry);
                yield file;
            }
        } else if (entry.kind === "directory") {
            for await (const handle of entry.values()) {
                yield* getFilesRecursively(handle);
            }
        }
    }
    for await (const fileHandle of getFilesRecursively(directoryHandle)) {
        console.log(fileHandle);
    }

}

*/
async function loadSample() {
    const response = await fetch("/editor/ui.js");
    return await response.text();
}

async function sample() {
    let text = await loadSample();
    let result = document.createElement('code');
    let line = editor.newLine();
    let temp;
    try {

        while (text != null && text.length > 0) {
            if (text.startsWith('/*')) {
                temp = text.indexOfDefault('*/', text.length);
                String2html(text.substring(0, temp), 'c_0');
                text = text.substring(temp);
            } else if (text.startsWith('//')) {
                temp = text.indexOfDefault('\n', text.length);
                String2html(text.substring(0, temp), 'c_1');
                text = text.substring(temp);
            } else if (text[0] == "\"") {
                temp = text.searchDefault(/[^\\](\\{2})*\"/, text.length - 2) + 2;
                String2html(text.substring(0, temp), 'str_0');
                text = text.substring(temp);
            } else if (text[0] == "\'") {
                temp = text.searchDefault(/[^\\](\\{2})*\'/, text.length - 2) + 2;
                String2html(text.substring(0, temp), 'str_1');
                text = text.substring(temp);
            } else if (text[0] == "\`") {
                temp = text.searchDefault(/[^\\](\\{2})*\`/, text.length - 2) + 2;
                String2html(text.substring(0, temp), 'str_2');
                text = text.substring(temp);
            } else if (/\s/.test(text[0])) {
                temp = text.search(/\S/);//index 0 : 버림칸, 1 : 공백문자열
                if(temp < 0) temp = text.length;
                String2html(text.substring(0,temp));
                text = text.substring(temp);
            } else if (/[\[\{\(\)\}\]]/.test(text[0])) {
                String2html(text[0], 'b_0');
                text = text.substring(1);
            } else if (/[.,;:]/.test(text[0])) {
                String2html(text[0], 'e_0');
                text = text.substring(1);
            } else if (/[0-9]/.test(text[0])) {
                temp = text.search(/[^0-9]/);
                if(temp < 0) temp = text.length;
                String2html(text.substring(0,temp), 'd_0');
                text = text.substring(temp);
            } else if(/[a-zA-Z0-9ㄱ-ㅎㅏ-ㅣ가-힣_]/.test(text[0])) {
                temp = text.search(/[^a-zA-Z0-9ㄱ-ㅎㅏ-ㅣ가-힣_]/);
                if(temp < 0) temp = text.length;
                String2html(text.substring(0,temp), 't_0');
                text = text.substring(temp);
            } else {
                String2html(text[0], 'etc');
                text = text.substring(1);
            }
        }
    } catch {
        console.log(text);
    }
    function String2html(string, className = false) {
        for (let char of string) {
            switch (char) {
                case '\n':
                    line = editor.newLine();
                    break;
                case '\r':
                    break;
                default:
                    if (className === false) {
                        line.append(document.createTextNode(char));
                    } else {
                        line.append(document.createElement('span'));
                        line.lastChild.classList.add(className);
                        line.lastChild.innerText = char;
                    }
                    break;
            }
        }
    }
}


var commands = [{
    "cmd": "backColor",
    "val": "red",
    "desc": "Changes the document background color. In styleWithCss mode, it affects the background color of the containing block instead. This requires a color value string to be passed in as a value argument. (Internet Explorer uses this to set text background color.)"
},
{
    "cmd": "bold",
    "icon": "bold",
    "desc": "Toggles bold on/off for the selection or at the insertion point. (Internet Explorer uses the STRONG tag instead of B.)"
},
{
    "cmd": "contentReadOnly",
    "desc": "Makes the content document either read-only or editable. This requires a boolean true/false to be passed in as a value argument. (Not supported by Internet Explorer.)"
},
{
    "cmd": "copy",
    "icon": "clipboard",
    "desc": "Copies the current selection to the clipboard. Clipboard capability must be enabled in the user.js preference file. See"
},
{
    "cmd": "createLink",
    "val": "https://twitter.com/netsi1964",
    "icon": "link",
    "desc": "Creates an anchor link from the selection, only if there is a selection. This requires the HREF URI string to be passed in as a value argument. The URI must contain at least a single character, which may be a white space. (Internet Explorer will create a link with a null URI value.)"
},
{
    "cmd": "cut",
    "icon": "scissors",
    "desc": "Cuts the current selection and copies it to the clipboard. Clipboard capability must be enabled in the user.js preference file. See"
},
{
    "cmd": "decreaseFontSize",
    "desc": "Adds a SMALL tag around the selection or at the insertion point. (Not supported by Internet Explorer.)"
},
{
    "cmd": "delete",
    "icon": "scissors",
    "desc": "Deletes the current selection."
},
{
    "cmd": "enableInlineTableEditing",
    "desc": "Enables or disables the table row and column insertion and deletion controls. (Not supported by Internet Explorer.)"
},
{
    "cmd": "enableObjectResizing",
    "desc": "Enables or disables the resize handles on images and other resizable objects. (Not supported by Internet Explorer.)"
},
{
    "cmd": "fontName",
    "val": "'Inconsolata', monospace",
    "desc": "Changes the font name for the selection or at the insertion point. This requires a font name string (\"Arial\" for example) to be passed in as a value argument."
},
{
    "cmd": "fontSize",
    "val": "1-7",
    "icon": "text-height",
    "desc": "Changes the font size for the selection or at the insertion point. This requires an HTML font size (1-7) to be passed in as a value argument."
},
{
    "cmd": "foreColor",
    "val": "rgba(0,0,0,.5)",
    "desc": "Changes a font color for the selection or at the insertion point. This requires a color value string to be passed in as a value argument."
},
{
    "cmd": "formatBlock",
    "val": "<blockquote>",
    "desc": "Adds an HTML block-style tag around the line containing the current selection, replacing the block element containing the line if one exists (in Firefox, BLOCKQUOTE is the exception - it will wrap any containing block element). Requires a tag-name string to be passed in as a value argument. Virtually all block style tags can be used (eg. \"H1\", \"P\", \"DL\", \"BLOCKQUOTE\"). (Internet Explorer supports only heading tags H1 - H6, ADDRESS, and PRE, which must also include the tag delimiters &lt; &gt;, such as \"&lt;H1&gt;\".)"
},
{
    "cmd": "forwardDelete",
    "desc": "Deletes the character ahead of the cursor's position.  It is the same as hitting the delete key."
},
{
    "cmd": "heading",
    "val": "h3",
    "icon": "header",
    "desc": "Adds a heading tag around a selection or insertion point line. Requires the tag-name string to be passed in as a value argument (i.e. \"H1\", \"H6\"). (Not supported by Internet Explorer and Safari.)"
},
{
    "cmd": "hiliteColor",
    "val": "Orange",
    "desc": "Changes the background color for the selection or at the insertion point. Requires a color value string to be passed in as a value argument. UseCSS must be turned on for this to function. (Not supported by Internet Explorer.)"
},
{
    "cmd": "increaseFontSize",
    "desc": "Adds a BIG tag around the selection or at the insertion point. (Not supported by Internet Explorer.)"
},
{
    "cmd": "indent",
    "icon": "indent",
    "desc": "Indents the line containing the selection or insertion point. In Firefox, if the selection spans multiple lines at different levels of indentation, only the least indented lines in the selection will be indented."
},
{
    "cmd": "insertBrOnReturn",
    "desc": "Controls whether the Enter key inserts a br tag or splits the current block element into two. (Not supported by Internet Explorer.)"
},
{
    "cmd": "insertHorizontalRule",
    "desc": "Inserts a horizontal rule at the insertion point (deletes selection)."
},
{
    "cmd": "insertHTML",
    "val": "&lt;h3&gt;Life is great!&lt;/h3&gt;",
    "icon": "code",
    "desc": "Inserts an HTML string at the insertion point (deletes selection). Requires a valid HTML string to be passed in as a value argument. (Not supported by Internet Explorer.)"
},
{
    "cmd": "insertImage",
    "val": "http://dummyimage.com/160x90",
    "icon": "picture-o",
    "desc": "Inserts an image at the insertion point (deletes selection). Requires the image SRC URI string to be passed in as a value argument. The URI must contain at least a single character, which may be a white space. (Internet Explorer will create a link with a null URI value.)"
},
{
    "cmd": "insertOrderedList",
    "icon": "list-ol",
    "desc": "Creates a numbered ordered list for the selection or at the insertion point."
},
{
    "cmd": "insertUnorderedList",
    "icon": "list-ul",
    "desc": "Creates a bulleted unordered list for the selection or at the insertion point."
},
{
    "cmd": "insertParagraph",
    "icon": "paragraph",
    "desc": "Inserts a paragraph around the selection or the current line. (Internet Explorer inserts a paragraph at the insertion point and deletes the selection.)"
},
{
    "cmd": "insertText",
    "val": new Date(),
    "icon": "file-text-o",
    "desc": "Inserts the given plain text at the insertion point (deletes selection)."
},
{
    "cmd": "italic",
    "icon": "italic",
    "desc": "Toggles italics on/off for the selection or at the insertion point. (Internet Explorer uses the EM tag instead of I.)"
},
{
    "cmd": "justifyCenter",
    "icon": "align-center",
    "desc": "Centers the selection or insertion point."
},
{
    "cmd": "justifyFull",
    "icon": "align-justify",
    "desc": "Justifies the selection or insertion point."
},
{
    "cmd": "justifyLeft",
    "icon": "align-left",
    "desc": "Justifies the selection or insertion point to the left."
},
{
    "cmd": "justifyRight",
    "icon": "align-right",
    "desc": "Right-justifies the selection or the insertion point."
},
{
    "cmd": "outdent",
    "icon": "outdent",
    "desc": "Outdents the line containing the selection or insertion point."
},
{
    "cmd": "paste",
    "icon": "clipboard",
    "desc": "Pastes the clipboard contents at the insertion point (replaces current selection). Clipboard capability must be enabled in the user.js preference file. See"
},
{
    "cmd": "redo",
    "icon": "repeat",
    "desc": "Redoes the previous undo command."
},
{
    "cmd": "removeFormat",
    "desc": "Removes all formatting from the current selection."
},
{
    "cmd": "selectAll",
    "desc": "Selects all of the content of the editable region."
},
{
    "cmd": "strikeThrough",
    "icon": "strikethrough",
    "desc": "Toggles strikethrough on/off for the selection or at the insertion point."
},
{
    "cmd": "subscript",
    "icon": "subscript",
    "desc": "Toggles subscript on/off for the selection or at the insertion point."
},
{
    "cmd": "superscript",
    "icon": "superscript",
    "desc": "Toggles superscript on/off for the selection or at the insertion point."
},
{
    "cmd": "underline",
    "icon": "underline",
    "desc": "Toggles underline on/off for the selection or at the insertion point."
},
{
    "cmd": "undo",
    "icon": "undo",
    "desc": "Undoes the last executed command."
},
{
    "cmd": "unlink",
    "icon": "chain-broken",
    "desc": "Removes the anchor tag from a selected anchor link."
},
{
    "cmd": "useCSS ",
    "desc": "Toggles the use of HTML tags or CSS for the generated markup. Requires a boolean true/false as a value argument. NOTE: This argument is logically backwards (i.e. use false to use CSS, true to use HTML). (Not supported by Internet Explorer.) This has been deprecated; use the styleWithCSS command instead."
},
{
    "cmd": "styleWithCSS",
    "desc": "Replaces the useCSS command; argument works as expected, i.e. true modifies/generates style attributes in markup, false generates formatting elements."
}];
