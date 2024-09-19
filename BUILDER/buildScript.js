const fs = require('fs');
const path = require('path');
const chokidar = require('chokidar');

// 병합할 파일이 있는 기본 디렉토리 경로
const baseDir = '../js/page';

// 디렉토리 내 파일과 하위 폴더를 탐색하여 파일 목록을 가져오는 함수
const getFilesInDirectory = (dir, isRoot = false) => {
    const files = [];
    const items = fs.readdirSync(dir);

    items.forEach(item => {
        const itemPath = path.join(dir, item);
        const stat = fs.statSync(itemPath);

        if (stat.isDirectory()) {
            // 하위 디렉토리에 대해 재귀 호출
            files.push(...getFilesInDirectory(itemPath));
        } else if (!isRoot && stat.isFile() && item.endsWith('.js')) {
            files.push(itemPath);
        }
    });

    return files.sort((a, b) => a.localeCompare(b));;
};

// 파일들을 병합하여 각각의 하위 폴더에 저장하는 함수
const mergeAndSaveFiles = (dir, isRoot = true, targetDir=dir) => {
    const files = getFilesInDirectory(dir, isRoot);
    const groupedFiles = {};

    files.forEach(file => {
        const relativePath = path.relative(targetDir, file);
        const folderName = path.dirname(relativePath).split(path.sep).pop();

        if (!groupedFiles[folderName]) {
            groupedFiles[folderName] = [];
        }
        groupedFiles[folderName].push(file);
    });

    Object.keys(groupedFiles).forEach(folderName => {
        const outputFile = path.join(targetDir, `${folderName}.js`);
        const inputFiles = groupedFiles[folderName];
        const lastInputFile = inputFiles.pop();
        let mergedContent = '';

        inputFiles.forEach(file => {
            const content = fs.readFileSync(file, 'utf8');
            mergedContent += content + '\n\n'; // 파일 내용을 읽어서 병합합니다.
        });
        mergedContent += fs.readFileSync(lastInputFile, 'utf8'); // 마지막 파일은 줄바꿈없게 처리한다.

        fs.writeFileSync(outputFile, mergedContent, 'utf8');
        console.log("");
        console.log(`-> ${folderName}.js`);
        console.log("");
    });
};

// 디렉토리 변경 감지 및 병합 작업 실행
const startWatcher = () => {
    mergeAndSaveFiles(baseDir);
    chokidar.watch(baseDir, { persistent: true }).on('all', (event, path) => {
        let target = path.replaceAll('\\','/').replace(baseDir,'').split('/')[1];
        console.info(`[ WATCHER ]( ${event} ) - ${target || '_ROOT_'}`);
        switch(event){
            case 'unlinkDir':
                return;
        }
        if(target && !target.endsWith('.js')) mergeAndSaveFiles(baseDir+'/'+target, false, baseDir);
    });
    console.log("########################################################");
    console.log(`#####      Watching for changes in ${baseDir}      #####`);
    console.log("########################################################");
};

// 실행
startWatcher();