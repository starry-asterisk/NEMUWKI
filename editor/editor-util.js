function getLetterRect(node, spos = 0, epos) {
    let range = getRange();
    if (epos == undefined) epos = spos + 1;
    range.setStart(node, spos);
    range.setEnd(node, epos);
    return range.getBoundingClientRect();
}

function getLetterPos(e) {
    let r_v = 0;
    let r_v2 = -1;
    let r_n = undefined;
    let r_rect = undefined;
    let isEnd = false;
    let parent = e.target.closest('.line');
    let isOut = false;
    let outDirection = 0;// 0:left, 1: right;
    let l;
    if (parent == undefined) {
        isOut = true;
        for (let line of editor.lines) {
            let p_rect = line.getBoundingClientRect();
            if (p_rect.top <= e.pageY && p_rect.bottom >= e.pageY) {
                parent = line;
                break;
            }
        }
        if (parent == undefined) {
            let c_rect = editor.containerRect;
            if (c_rect.top >= e.pageY) parent = editor.lines[0];
            else parent = editor.lines[editor.lines.length - 1];
        }
        if (parent == undefined) return false;
    }

    r_v = compare(parent);
    if (r_v2 < 0) {
        if (isOut && e.pageX <= parent.getBoundingClientRect().left) {
            r_v = r_v2 = 0;
            outDirection = -1;
            r_n = parent.firstChild;
            while (r_n.nodeType !== 3) r_n = r_n.firstChild;
        }

        if (r_n == undefined) {
            outDirection = 1;
            isOut = true;
            r_n = parent.lastChild;
            while (r_n.nodeType !== 3) r_n = r_n.lastChild;
            r_v2 = r_n.nodeValue.length - 1;
        }
        if (r_rect == undefined) {
            r_rect = getLetterRect(r_n, r_v2);
        }
    }

    return {
        absolute: {
            pos: r_v,
            node: parent,
            isOut: isOut,
            outDirection: outDirection
        },
        relative: {
            pos: r_v2,
            node: r_n,
            rect: r_rect
        }
    }

    function compare(node) {
        v = 0;
        if (isEnd) return v;
        if (node.nodeType === 3) {
            l = node.nodeValue.length;
            for (let i = 0; i < l; i++) {
                let rect = getLetterRect(node, i);
                if (e.pageX >= rect.left && e.pageX <= rect.right) {
                    isEnd = true;
                    r_n = node;
                    r_v2 = i;
                    r_rect = rect;
                    return i;
                }
            }
            return l;
        } else for (let child of node.childNodes) v += compare(child);
        return v;
    }
}

function compareRectPos(rect1, rect2) {
    if (rect1.top > rect2.top) {
        return true;
    } else if (rect1.top == rect2.top) {
        return rect1.left >= rect2.left;
    } else {
        return false;
    }
}

function getRelativeRect(parent, child) {
    return {
        x: child.x - parent.x,
        y: child.y - parent.y,
        top: child.top - parent.top,
        left: child.left - parent.left,
        bottom: child.bottom - parent.top,
        right: child.right - parent.left,
        height: child.height,
        width: child.width
    };
}

function getRange() {
    return global_range ||
        (global_range = document.createRange());
}

function inputText(key, hangulMode) {
    let c = this.caret;
    let hanguel_i;
    let node = editor.selected.startNode;
    let letters;
    if (!hangulMode || (hanguel_i = hangul[key]) == undefined) {
        //c.before(document.createTextNode(key));
        letters = {
            firedLetter: key,
            now_letter: '',
            old_letter: ''
        }
    } else {
        letters = inputHangul.call(this, hanguel_i);
    }

    let {
        startNode,
        startPos,
        endNode,
        endPos
    } = editor.selected;
    if (isLineLast(node)) {
        let target = shiftPrevLetterPos(node, 0, -1, true) || (() => {
            let textNode = document.createTextNode('');
            node.before(textNode);
            return {
                node: textNode,
                pos: 0
            };
        })();
        target.node.nodeValue = target.node.nodeValue.substring(0, target.node.nodeValue.length - letters.old_letter.length) + letters.firedLetter + letters.now_letter;
    } else {
        startNode.nodeValue = startNode.nodeValue.substring(0, startPos - letters.old_letter.length) + letters.firedLetter + letters.now_letter + startNode.nodeValue.substring(startPos);
        startPos += letters.now_letter.length - letters.old_letter.length + letters.firedLetter.length;
    }
    editor.selected = {
        startNode,
        startPos,
        endNode,
        endPos
    };
    //editor.container.focus();
}

function shiftLetterPos(node, pos, offset = 1) {
    let line = node.parentNode.closest('.line');
    let maxOffset = node.nodeValue.length;
    let overflow = pos + offset - maxOffset;

    if (offset < 0) return shiftPrevLetterPos(node, pos, offset);

    if (overflow < 0) return {
        node,
        pos: pos + offset
    }

    while (node.nextSibling == undefined && node != line) node = node.parentNode;
    if (node == line) node = line.next('.line');
    else node = node.nextSibling;
    if (node == undefined) return undefined;
    while (node.nodeType != 3) node = node.firstChild;
    return shiftLetterPos(node, 0, overflow);
}

function shiftPrevLetterPos(node, pos, offset, inline = false) {
    let line = node.parentNode.closest('.line');
    let overflow = pos + offset;

    if (overflow < 0) {
        while (node.previousSibling == undefined && node != line) node = node.parentNode;
        if (node == line) if (inline) return undefined; else node = line.prev('.line');
        else node = node.previousSibling;
        if (node == undefined) return undefined;
        while (node.nodeType != 3) node = node.lastChild;
        return shiftPrevLetterPos(node, node.nodeValue.length - 1, overflow + 1);
    } else return {
        node,
        pos: pos + offset
    }
}

function isLineLast(node) {
    return node.parentNode.closest('.line').lastChild == node;
}

function deleteText(s_node, s_pos, e_node, e_pos) {
    let text;
    let r = getRange();
    r.setStart(s_node, s_pos);
    r.setEnd(e_node, e_pos);
    text = r.toString();
    r.deleteContents();
    return text;
}

function getAbsolutePos(node, pos) {
    let p = node.parentNode.closest('.line');
    let firstNode = p.firstChild;
    while (firstNode.firstChild) firstNode = firstNode.firstChild;
    let r = getRange();
    r.setStart(firstNode, 0);
    r.setEnd(node, pos);

    return r.toString().length;
}

function getNodeByAbsPos(line, pos) {
    if (line == undefined) return undefined;
    const walker = document.createTreeWalker(line, NodeFilter.SHOW_TEXT)
    while (walker.nextNode()) {
        if (walker.currentNode.nodeValue.length > pos) return {
            node: walker.currentNode,
            pos: pos
        }
        else pos -= walker.currentNode.nodeValue.length;
    }
    return {
        node: walker.currentNode,
        pos: walker.currentNode.nodeValue.length - 1
    };
}
