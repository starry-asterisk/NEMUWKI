const chokidar = require('chokidar');
const { mergeAndSaveFiles, DuplicateFile } = require('./buildUtil');

global.buildMode = 'product'; // 또는 'development'

// 프로젝트 정보
global.projectName = 'nemuwiki.com';
global.projectNameKR = '네무위키';
global.version = '2.3.2';
global.authorName = '@NEMUWIKI';
global.timestamp = new Date().toISOString().split('T')[0];
global.description = 'personal wiki project for NEMU';

global.intro_js = function () {
    return `/**
* Project: ${global.projectName}
* Version: ${global.version} | ${global.buildMode}
* Author: ${global.authorName}
* Date: ${global.timestamp}
* Description: ${global.description}
*/`;
};

global.intro_html = function () {
    return `<meta property="og:title" content="${global.projectNameKR}">
    <meta property="og:locale" content="ko_KR">
    <meta name="description" content="${global.description}">
    <meta property="og:description" content="${global.description}">
    <meta property="og:url" content="https://${global.projectName}">
    <meta property="og:site_name" content="${global.projectNameKR}">
    <meta property="og:type" content="website">
    <meta name="twitter:card" content="summary">
    <meta property="twitter:title" content="${global.projectNameKR}">
    <link rel="canonical" href="https://${global.projectName}">
    <link rel="icon" href="/resource/favicon.png">`;
};

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
];

// 디렉토리 변경 감지 및 병합 작업 실행
const init = function () {
    console.log("########################################################");
    console.log(`#####    Watching for changes in ${pageFromDir} and ${baseFromDir}    #####`);
    console.log("########################################################");

    const watcher = chokidar.watch([baseFromDir, pageFromDir, templateFromPath], { persistent: true });

    watcher.on('all', (event, path) => {
        try {
            handleFileChange(event, path);
        } catch (error) {
            console.error(`[ ERROR ] - ${error.message}`);
        }
    });
};

const handleFileChange = (event, path) => {
    path = path.replaceAll('\\', '/');
    switch (event) {
        case 'unlinkDir':
            console.info(`[ WATCHER ]( ${event} ) - Directory deleted: ${path}`);
            return;

        case 'add':
        case 'change':
            if (path === templateFromPath) {
                console.info(`[ WATCHER ]( ${event} ) - Template file changed: ${path}`);
                DuplicateFile(templateFromPath, templateDestPaths);
            } else if (path.startsWith(pageFromDir)) {
                handleMergedFileChange(path, pageFromDir, pageDestDir);
            } else {
                handleMergedFileChange(path, baseFromDir, baseDestDir);
            }
            break;

        default:
            console.info(`[ WATCHER ]( ${event} ) - ${path}`);
            break;
    }
};

const handleMergedFileChange = (path, from, dest) => {
    const target = path.replace(from, '').split('/')[1];
    if (target && !target.endsWith('.js')) {
        console.info(`[ WATCHER ]( Base ) - Merging files in: ${target || '_ROOT_'}`);
        mergeAndSaveFiles(from + '/' + target, false, dest);
    }

}

init();