const IndexContent = {
    ...ContentBase,
    notice: {
        async initialize(id, wrap) {
            wrap.style.display = 'none';
            let snaps = await firebase.notice.getNewest();
            let doc = snaps.docs[0];

            if (!doc) return;

            let data = doc.data();

            let n_title = this.components[id].title = createElement('span').attrs({ class: "notice__title icon icon-bullhorn-variant" }).props({ innerHTML: data.title, onclick() { wrap.toggleClass('open'); } });
            let n_timestamp = this.components[id].timestamp = createElement('span').attrs({ class: "notice__timestamp" }).props({ innerHTML: new Date(data.timestamp.seconds * 1000).toLocaleDateString() });
            let n_content = this.components[id].content = createElement('span').attrs({ class: "notice__content" }).props({ innerHTML: markdown(data.content) });

            wrap.addClass('flex-vertical').append(n_title, n_timestamp, n_content);
            wrap.style.removeProperty('display');
        }
    },
}

export { asideIndex as aside, articleIndex as article };