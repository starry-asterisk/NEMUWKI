window.addEventListener('load', async function () {
    console.log(firebase.post)
});

function addPost(data){
    let item = createElement('div',{innerHTML: `${data.board_name}/${data.title}`});
    document.querySelector('.main__contents').append(item);
    item.onlick= ()=>{

    }
}