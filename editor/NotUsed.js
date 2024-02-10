
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
