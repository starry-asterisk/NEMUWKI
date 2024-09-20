const fs = require('fs');
const path = require('path');
const { minify } = require('terser'); // Terser 모듈 임포트

/**
 * 파일 컨텐츠 파싱
 */
const templateRegx = /\$\$\{(.*?)\}\$\$/g;

String.prototype.parseTemplate = function(info) {
    // $$로 구분된 템플릿 문자열을 split하여 배열로 변환
    const parts = this.split(templateRegx);
    let result = '', namespace;

    // 2개씩 처리: 짝수 인덱스는 고정 텍스트, 홀수 인덱스는 변수를 처리
    for (let i = 0; i < parts.length; i += 2) {
        // 짝수 인덱스는 그대로 추가
        result += parts[i];

        // 홀수 인덱스는 변수를 data에서 찾아서 추가
        if (i + 1 < parts.length) {
            if (typeof (namespace = global[parts[i + 1].trim()]) == 'function') result += namespace(info);
            else result += String(namespace);
        }
    }

    return result;
}

/**
 * 디렉토리 내 파일과 하위 폴더를 탐색하여 파일 목록을 가져오는 함수
 * @param {*} dir 
 * @param {*} isRoot 
 * @param {*} ext 
 * @returns 
 */
function getFilesInDirectory(dir, isRoot = false, ext = 'js') {
    const files = [];
    const items = fs.readdirSync(dir);

    items.forEach(item => {
        const itemPath = path.join(dir, item);
        const stat = fs.statSync(itemPath);

        if (stat.isDirectory()) {
            // 하위 디렉토리에 대해 재귀 호출
            files.push(...getFilesInDirectory(itemPath));
        } else if (!isRoot && stat.isFile() && item.endsWith(`.${ext}`)) {
            files.push(itemPath);
        }
    });

    return files.sort((a, b) => a.localeCompare(b));;
};

/**
 * 파일들을 병합하여 각각의 하위 폴더에 저장하는 함수
 * @param {*} fromDir 
 * @param {*} isRoot 
 * @param {*} targetDir 
 * @param {*} ext 
 */
function mergeAndSaveFiles(fromDir, isRoot = true, targetDir = fromDir, ext = 'js') {
    const files = getFilesInDirectory(fromDir, isRoot, ext);
    const groupedFiles = {};

    files.forEach(file => {
        const relativePath = path.relative(targetDir, file);
        const folderName = path.dirname(relativePath).split(path.sep).pop();

        if (!groupedFiles[folderName]) {
            groupedFiles[folderName] = [];
        }
        groupedFiles[folderName].push(file);
    });

    Object.keys(groupedFiles).forEach(async folderName => {
        const outputFile = path.join(targetDir, `${folderName}.${ext}`);
        const inputFiles = groupedFiles[folderName];
        const lastInputFile = inputFiles.pop();
        let mergedContent = '';

        inputFiles.forEach(file => {
            const content = fs.readFileSync(file, 'utf8').parseTemplate();
            mergedContent += content + '\n\n'; // 파일 내용을 읽어서 병합합니다.
        });
        mergedContent += fs.readFileSync(lastInputFile, 'utf8'); // 마지막 파일은 줄바꿈없게 처리한다.

        if(global.buildMode == 'product') {
            const minifiedResult = await minify(mergedContent);
            fs.writeFileSync(outputFile, global['intro_'+ext]() + '\n\n' + minifiedResult.code, 'utf8');
        }else{
            fs.writeFileSync(outputFile, global['intro_'+ext]() + '\n\n' + mergedContent, 'utf8');
        }
        console.log("");
        console.log(`-> ${folderName}.js`);
        console.log("");
    });
};

/**
 * 하나의 파일을 여러개로 복제하여 배치하는 function
 * @param {*} file 
 * @param {*} destPaths 
 */
function DuplicateFile(file, destPaths = []) {
    let content = fs.readFileSync(file, 'utf8').parseTemplate();
    destPaths.forEach(path => fs.writeFileSync(path, content, 'utf8'));
    console.log("");
    console.log(`<- ${file}`);
    console.log("");
}

module.exports = {mergeAndSaveFiles, DuplicateFile};