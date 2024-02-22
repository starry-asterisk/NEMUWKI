let firebase = {};
const ROOT_PATH = './';
function addSuggest(){}

function goHome(){location.href=ROOT_PATH}

window.addEventListener('load',function(){
    for(let li of this.document.querySelectorAll('.input_suggest > li')){
        li.onmousedown = ()=>{
            console.log(li);
            li.parentNode.previousElementSibling.value = li.getAttribute('value');
        }
    }
});