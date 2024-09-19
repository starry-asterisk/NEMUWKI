const fs = require('fs');
const path = require('path');
const chokidar = require('chokidar');

//프로젝트 정보
const projectName = 'nemuwiki.com';
const version = '2.3.1';
const authorName = 'NEMUWIKI.com';
const timestamp = new Date().toISOString().split('T')[0];
const description = 'NEMUWIKI Wiki project, SPA style, MDI includes';

// 병합할 파일이 있는 기본 디렉토리 경로
const baseDestDir = '../js/page';
const baseFromDir = '../_src_/page';
const templateFromPath = '../_src_/template.html';
const templateDestPaths = [
    '../404.html',
    '../form.html',
    '../index.html',
    '../login.html',
    '../signup.html',
    '../profile.html',
    '../setting.html'
]

const DESCRIPTION = {
    js() {
        return `/**
 * Project: ${projectName}
 * Version: ${version}
 * Author: ${authorName}
 * Date: ${timestamp}
 * Description: ${description}
 */`;
    },
    html() {
        return `<meta property="og:title" content="네무위키">
    <meta property="og:locale" content="ko_KR">
    <meta name="description" content="personal wiki project for NEMU">
    <meta property="og:description" content="personal wiki project for NEMU">
    <meta property="og:url" content="https://${projectName}">
    <meta property="og:site_name" content="네무위키">
    <meta property="og:type" content="website">
    <meta name="twitter:card" content="summary">
    <meta property="twitter:title" content="네무위키">
    <link rel="canonical" href="https://${projectName}">
    <link rel="icon" href="/resource/favicon.png">`;
    }
}

// 디렉토리 내 파일과 하위 폴더를 탐색하여 파일 목록을 가져오는 함수
const getFilesInDirectory = (dir, isRoot = false, ext = 'js') => {
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

// 파일들을 병합하여 각각의 하위 폴더에 저장하는 함수
const mergeAndSaveFiles = (fromDir, isRoot = true, targetDir = fromDir, ext = 'js') => {
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

    Object.keys(groupedFiles).forEach(folderName => {
        const outputFile = path.join(targetDir, `${folderName}.${ext}`);
        const inputFiles = groupedFiles[folderName];
        const lastInputFile = inputFiles.pop();
        let mergedContent = DESCRIPTION[ext]() + '\n\n';

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

const DeplicateFile = (file, destPaths = []) => {
    let content = fs.readFileSync(file, 'utf8');
    content = content.replace('$${description}$$',DESCRIPTION.html()).replaceAll('$${version}$$', version);
    destPaths.forEach(path => fs.writeFileSync(path, content, 'utf8'));
    console.log("");
    console.log(`<- ${file}`);
    console.log("");
}

// 디렉토리 변경 감지 및 병합 작업 실행
const startWatcher = () => {
    console.log("########################################################");
    console.log(`#####    Watching for changes in ${baseFromDir}    #####`);
    console.log("########################################################");

    chokidar.watch([baseFromDir, templateFromPath], { persistent: true }).on('all', (event, path) => {
        switch (event) {
            case 'unlinkDir':
                return;
        }
        if(path.replaceAll('\\', '/') == templateFromPath){
            console.info(`[ WATCHER ]( ${event} ) - ${path}`);
            DeplicateFile(templateFromPath, templateDestPaths);
        } else {
            let target = path.replaceAll('\\', '/').replace(baseFromDir, '').split('/')[1];
            console.info(`[ WATCHER ]( ${event} ) - ${target || '_ROOT_'}`);
            if (target && !target.endsWith('.js')) mergeAndSaveFiles(baseFromDir + '/' + target, false, baseDestDir);
        }
    });
};

// 실행
startWatcher();