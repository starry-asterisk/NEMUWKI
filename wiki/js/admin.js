async function firebaseLoadCallback() {
    firebase.auth.check(user => {
        console.log(user);
        if(user.email == 'assume')
    }, ()=>{

    })
}