let firebase = {};
function addSuggest(){}

window.addEventListener('load',function(){
    for(let li of this.document.querySelectorAll('.input_suggest > li')){
        li.onmousedown = ()=>{
            console.log(li);
            li.parentNode.previousElementSibling.value = li.getAttribute('value');
        }
    }
});