/**
* Project: nemuwiki.com
* Version: 2.3.5 | product
* Author: @NEMUWIKI
* Date: 2025-03-22
* Description: personal wiki project for NEMU
*/

import{initializeApp}from"https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";import{initializeFirestore,collection,setDoc,addDoc,getDocs,getDoc,doc,Timestamp,query,orderBy,getCountFromServer,startAfter,limit,deleteDoc,updateDoc,where,onSnapshot,deleteField}from"https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";import{getStorage,ref,getDownloadURL,deleteObject,uploadBytes,uploadBytesResumable}from"https://www.gstatic.com/firebasejs/10.8.0/firebase-storage.js";import{getAuth,signInWithEmailAndPassword,signOut,onAuthStateChanged,createUserWithEmailAndPassword,sendPasswordResetEmail,sendEmailVerification}from"https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";const firebaseConfig={apiKey:"AIzaSyBm2NkGGMEo_TN0u7VRgNhZmTvflJlfOzY",authDomain:"nemuwiki-f3a72.firebaseapp.com",projectId:"nemuwiki-f3a72",storageBucket:"nemuwiki-f3a72.appspot.com",messagingSenderId:"125964020971",appId:"1:125964020971:web:63803427ae9165e43e22ae",measurementId:"G-PCFNLEDQ00"},fb_app=initializeApp(firebaseConfig),db=initializeFirestore(fb_app,{experimentalForceLongPolling:!0}),storage=getStorage(fb_app,"gs://nemuwiki-f3a72.appspot.com"),auth=getAuth(),fb={};let authListner;fb.listen=onSnapshot,fb.history={insertOne:async({crud:e,target:t,text:a=""})=>{try{return await addDoc(collection(db,"history"),{uid:auth.currentUser?.uid||"{Not-Authored}",timestamp:Timestamp.fromDate(new Date),crud:e||"INSERT",target:t||"${document}-${sample_document_uid}",text:a,agent:navigator.userAgent})}catch(e){dev.error("Error adding document: ",e)}},insertError:async({type:e,message:t,stack:a})=>{try{return await addDoc(collection(db,"history"),{uid:auth.currentUser?.uid||"{Not-Authored}",timestamp:Timestamp.fromDate(new Date),crud:"ERROR",target:e,text:a||t,agent:navigator.userAgent})}catch(e){dev.error("Error adding document: ",e)}}},fb.post={random:async()=>{let e=Math.min((await getCountFromServer(collection(db,"postList"))).data().count,100),t=await getDocs(query(collection(db,"postList"),where("hidden","==",!1),orderBy("timestamp"),limit(e)));return t.docs[Math.round(Math.random()*(t.docs.length-1))].id},insertOne:async e=>{try{e&&e.timestamp&&(e.timestamp=Timestamp.fromDate(e.timestamp));let t=await addDoc(collection(db,"postList"),{board_name:"",category:"",title:"",contents:[],hidden:!1,use:!0,timestamp:Timestamp.fromDate(new Date),...e});return fb.history.insertOne({crud:"INSERT",target:`postList-${t.id}`,text:e.title||""}),t}catch(e){dev.error("Error adding document: ",e)}},deleteOne:async(e,t)=>(fb.history.insertOne({crud:"DELETE",target:`postList-${e}`,text:t||`(삭제됨-${e})`}),await deleteDoc(doc(db,"postList",e))),deleteTemporary:async(e,t,a)=>{fb.history.insertOne({crud:"TEMPDEL",target:`postList-${e}`,text:t||`(임시삭제됨-${e})`});let r={deleted:!0,deleted_timestamp:Timestamp.fromDate(new Date)};return a&&(r.board_name="deleted-template"),await updateDoc(doc(db,"postList",e),r)},recover:async(e,t,a)=>{fb.history.insertOne({crud:"RECOVER",target:`postList-${e}`,text:t||`(복구됨-${e})`});let r={deleted:deleteField(),deleted_timestamp:deleteField()};return a&&(r.board_name="template"),await updateDoc(doc(db,"postList",e),r)},updateOne:async(e,t)=>(t&&t.timestamp&&(t.timestamp=Timestamp.fromDate(t.timestamp)),t&&t.updated_timestamp&&(t.updated_timestamp=Timestamp.fromDate(t.updated_timestamp)),fb.history.insertOne({crud:"UPDATE",target:`postList-${e}`,text:t.title||""}),await updateDoc(doc(db,"postList",e),t)),selectOne:async e=>await getDoc(doc(db,"postList",e)),list:(e={},t=!1,a="contains")=>{let r,s,i=[collection(db,"postList")],o=!1;null!==t&&i.push(where("hidden","==",t));for(let t in e){if(""==e[t]||null==e[t])continue;let r,s;switch(["boolean","string"].indexOf(typeof e[t])>-1?(r=a,s=e[t]):(r=e[t].op,s=e[t].key),r){case"contains":i.push(where(t,">=",s)),i.push(where(t,"<=",s+""));break;case"equal":i.push(where(t,"==",s));break;default:i.push(where(t,r,s))}}return{next:async(e=s?.docs)=>o?[]:(r=i.slice(),e&&0!=e?.length&&r.push(startAfter(e[e.length-1])),r.push(limit(25)),s=await getDocs(query.apply(void 0,r)),s.docs.length<25&&(o=!0),s.docs)}}},fb.board={insertOne:async e=>{try{let t=await addDoc(collection(db,"boardList"),{hidden:!1,type:0,name:"",depth:1,parent:"",use:!0,...e});return fb.history.insertOne({crud:"INSERT",target:`boardList-${t.id}`}),t}catch(e){dev.error("Error adding document: ",e)}},deleteOne:async e=>(fb.history.insertOne({crud:"DELETE",target:`boardList-${e}`}),await deleteDoc(doc(db,"boardList",e))),updateOne:async(e,t)=>(fb.history.insertOne({crud:"UPDATE",target:`boardList-${e}`}),await updateDoc(doc(db,"boardList",e),t)),query:()=>query(collection(db,"boardList")),list:async()=>await getDocs(collection(db,"boardList")),list_paginator:(e={})=>{let t,a,r=[collection(db,"boardList")],s=!1;for(let t in e)""!=e[t]&&(r.push(where(t,">=",e[t])),r.push(where(t,"<=",e[t]+"")));return{next:async(e=a?.docs)=>s?[]:(t=r.slice(),e&&0!=e?.length&&t.push(startAfter(e[e.length-1])),t.push(limit(25)),a=await getDocs(query.apply(void 0,t)),a.docs.length<25&&(s=!0),a.docs)}}},fb.notice={insertOne:async e=>{try{return await addDoc(collection(db,"notice"),{title:"",content:"",timestamp:Timestamp.fromDate(new Date),use:!0,...e})}catch(e){dev.error("Error adding document: ",e)}},updateOne:async(e,t)=>await updateDoc(doc(db,"notice",e),t),deleteOne:async e=>await deleteDoc(doc(db,"notice",e)),getNewest:async()=>await getDocs(query(collection(db,"notice"),where("use","==",!0),orderBy("timestamp"),limit(1))),list:()=>{let e,t=!1;return{next:async(a=e?.docs)=>{if(t)return[];let r=[collection(db,"notice"),orderBy("timestamp")];return a&&0!=a?.length&&r.push(startAfter(a[a.length-1])),r.push(limit(25)),e=await getDocs(query.apply(void 0,r)),e.docs.length<25&&(t=!0),e.docs}}}},fb.categories={insertOne:async e=>{try{let t=await addDoc(collection(db,"categories"),{hidden:!1,name:"",use:!0,...e});return fb.history.insertOne({crud:"INSERT",target:`categories-${t.id}`}),t}catch(e){dev.error("Error adding document: ",e)}},deleteOne:async e=>{fb.history.insertOne({crud:"DELETE",target:`categories-${ref.id}`}),await deleteDoc(doc(db,"categories",e))},updateOne:async(e,t)=>{fb.history.insertOne({crud:"UPDATE",target:`categories-${ref.id}`}),await updateDoc(doc(db,"categories",e),t)},query:()=>query(collection(db,"categories")),list:async()=>await getDocs(collection(db,"categories")),list_paginator:(e={})=>{let t,a,r=[collection(db,"categories")],s=!1;for(let t in e)""!=e[t]&&(r.push(where(t,">=",e[t])),r.push(where(t,"<=",e[t]+"")));return{next:async(e=a?.docs)=>s?[]:(t=r.slice(),e&&0!=e?.length&&t.push(startAfter(e[e.length-1])),t.push(limit(25)),a=await getDocs(query.apply(void 0,t)),a.docs.length<25&&(s=!0),a.docs)}}},fb.storage={getStaticUrl:e=>`https://storage.googleapis.com/${firebaseConfig.projectId}.appspot.com/${e}`,getUrl:async e=>await getDownloadURL(ref(storage,e)),delete:async e=>await deleteObject(ref(storage,e)),upload:async(e,t)=>await uploadBytes(ref(storage,e),t),uploadResumable:(e,t)=>uploadBytesResumable(ref(storage,e),t)},fb.resources={regist:async e=>{if(!1 in e||!1 in e)throw"data incorrect, necessary field is not presented";!1 in e&&(e.id=Math.floor(1e8*Math.random()).toString(16));const t={owner_id:auth.currentUser?.uid,uploaded_dt:1e3*e.datetime||(new Date).getTime(),deletehash:e.deletehash,link:e.link,size:e.size,mime:e.type,height:e.height,width:e.width};return await setDoc(doc(db,"resources",e.id),t),fb.history.insertOne({crud:"INSERT",target:`resources-${e.id}`}),!0},delete:async(e,t,a)=>(fb.history.insertOne({crud:"DELETE",target:`resource-${e}`,hash:t,text:a||`(삭제됨-리소스{${e}})`}),await deleteDoc(doc(db,"resources",e))),all:async()=>await getDocs(query(collection(db,"resources"),where("owner_id","==",auth.currentUser?.uid)))},fb.auth={login:async(e,t)=>await signInWithEmailAndPassword(auth,e,t),logout:async()=>await signOut(auth),check:(e,t)=>{"function"==typeof authListner&&authListner(),authListner=onAuthStateChanged(auth,(a=>{a?e(a):t()}))},checkAdmin:e=>{"function"==typeof authListner&&authListner(),authListner=onAuthStateChanged(auth,(async t=>{try{let a;return null==t||(null==(a=await getDoc(doc(db,"users",t.uid)))||0!==a.data().level)?e(!1,t):e(!0,t)}catch(e){firebaseErrorHandler(e)}}))},signup:async(e,t)=>{let a=await createUserWithEmailAndPassword(auth,e,t),r=a?.user;if(null==r)throw{code:"signup failed..."};return await setDoc(doc(db,"users",r.uid),{email:e,level:5}),r},users:(e={})=>{let t,a,r=[collection(db,"users")],s=!1;for(let t in e)""!=e[t]&&(r.push(where(t,">=",e[t])),r.push(where(t,"<=",e[t]+"")));return{next:async(e=a?.docs)=>s?[]:(t=r.slice(),e&&0!=e?.length&&t.push(startAfter(e[e.length-1])),t.push(limit(25)),a=await getDocs(query.apply(void 0,t)),a.docs.length<25&&(s=!0),a.docs)}},getUser:async(e=auth.currentUser?.uid)=>console.error(e)||await getDoc(doc(db,"users",e)),getAuth:()=>auth.currentUser,updateUser:async(e,t)=>await updateDoc(doc(db,"users",e),t),sendPasswordResetEmail:async e=>await sendPasswordResetEmail(auth,e),sendEmailVerification:async()=>await sendEmailVerification(auth.currentUser)},fb.search={set:async(e,t)=>{await setDoc(doc(db,"keyword",e),t)},unset:async e=>{const t=doc(db,"keyword",e);(await getDoc(t)).exists()&&await deleteDoc(doc(db,"keyword",e))},random:async()=>{let e=Math.min((await getCountFromServer(collection(db,"keyword"))).data().count,100),t=await getDocs(query(collection(db,"keyword"),limit(e)));return t.docs[Math.round(Math.random()*(t.docs.length-1))].id},list:(e={},t="contains",a=25,r="timestamp",s="desc")=>{let i,o,n=[collection(db,"keyword"),orderBy(r,s)],d=!1,c=!1;for(let a in e){if(""===e[a]||null==e[a])continue;let r,s;switch("string"==typeof e[a]||"boolean"==typeof e[a]?(r=t,s=e[a]):(r=e[a].op,s=e[a].key),r){case"contains":if(c)break;n.push(where(a,"array-contains",s)),c=!0;break;case"equal":n.push(where(a,"==",s));break;default:n.push(where(a,r,s))}}return{next:async(e=o?.docs)=>d?[]:(i=n.slice(),e&&0!=e?.length&&i.push(startAfter(e[e.length-1])),i.push(limit(a)),o=await getDocs(query.apply(void 0,i)),o.docs.length<a&&(d=!0),o.docs)}}},window.firebase=fb;