const chokidar = require('chokidar');
const { mergeAndSaveFiles, DuplicateFile } = require('./buildUtil');

global.buildMode = 'product';

//프로젝트 정보
global.projectName = 'nemuwiki.com';
global.projectNameKR = '네무위키';
global.version = '2.3.1';
global.authorName = '@NEMUWIKI';
global.timestamp = new Date().toISOString().split('T')[0];
global.description = 'personal wiki project for NEMU';

global.intro_js = function () {
    return `/**
* Project: ${projectName}
* Version: ${version} | ${global.buildMode}
* Author: ${authorName}
* Date: ${timestamp}
* Description: ${description}
*/`;
};

global.intro_html = function () {
    return `<meta property="og:title" content="${projectNameKR}">
    <meta property="og:locale" content="ko_KR">
    <meta name="description" content="${description}">
    <meta property="og:description" content="${description}">
    <meta property="og:url" content="https://${projectName}">
    <meta property="og:site_name" content="${projectNameKR}">
    <meta property="og:type" content="website">
    <meta name="twitter:card" content="summary">
    <meta property="twitter:title" content="${projectNameKR}">
    <link rel="canonical" href="https://${projectName}">
    <link rel="icon" href="/resource/favicon.png">`;
}

// 병합할 파일이 있는 기본 디렉토리 경로
const pageDestDir = '../js/page';
const pageFromDir = '../_src_/page';
const baseDestDir = '../js';
const baseFromDir = '../_src_/base';
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

// 디렉토리 변경 감지 및 병합 작업 실행
const init = function () {
    console.log("########################################################");
    console.log(`#####    Watching for changes in ${pageFromDir}    #####`);
    console.log("########################################################");

    chokidar.watch([baseFromDir, pageFromDir, templateFromPath], { persistent: true }).on('all', (event, path) => {
        switch (event) {
            case 'unlinkDir':
                return;
        }
        path = path.replaceAll('\\', '/');
        if (path == templateFromPath) {
            console.info(`[ WATCHER ]( ${event} ) - ${path}`);
            DuplicateFile(templateFromPath, templateDestPaths);
        } else if(path.startsWith(pageFromDir)){
            let target = path.replace(pageFromDir, '').split('/')[1];
            console.info(`[ WATCHER ]( ${event} ) - ${target || '_ROOT_'}`);
            if (target && !target.endsWith('.js')) mergeAndSaveFiles(pageFromDir + '/' + target, false, pageDestDir);
        } else {
            let target = path.replace(baseFromDir, '').split('/')[1];
            console.info(`[ WATCHER ]( ${event} ) - ${target || '_ROOT_'}`);
            if (target && !target.endsWith('.js')) mergeAndSaveFiles(baseFromDir + '/' + target, false, baseDestDir);
        }
    });
};

init();