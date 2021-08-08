const app =firebase.initializeApp({ 
    apiKey: "AIzaSyDAae-f0eoxefT0nvlfnl5olzEmyfGI7xo",
    authDomain: "certificate-generator-bd93b.firebaseapp.com",
    databaseURL: "https://certificate-generator-bd93b-default-rtdb.asia-southeast1.firebasedatabase.app",
    projectId: "certificate-generator-bd93b",
    storageBucket: "certificate-generator-bd93b.appspot.com",
    messagingSenderId: "730064384142",
    appId: "1:730064384142:web:a266a04e7a5928e441d9df"
});

// Initialize Firebase
var database = firebase.database()
var storage = firebase.storage()

let user = undefined
let hostId = undefined
let events = undefined

let myp5 = undefined

function getData()
{
    return [document.getElementById("floatingInput").value,document.getElementById("floatingPassword").value];
}

const signup = () =>{
    let email, password
    [email, password]=getData();
    console.log(email,password,"signup details")           //

    firebase.auth().createUserWithEmailAndPassword(email, password)
    .then((userCredential) => {
        console.log("Signup successful")                     //
        database.ref("HostIDMap").get()
        .then((value)=>{
            let map = value.val()
            let rand = Math.floor(Math.random() * 89999) + 10000;
            while(Object.values(map).includes(rand))
                rand = Math.floor(Math.random() * 89999) + 10000;
            database.ref(`HostIDMap`).update({
                [user.uid]:rand
            })
            database.ref(`HostData`).update({
                [rand]:"empty"
            })
            window.localStorage.setItem("hostId",rand)
            window.localStorage.setItem("userEvents","empty")
            hostId = rand
            events = "empty"
            document.getElementById("main").firstElementChild.lastElementChild.innerHTML = `Your Host Id: ${hostId}`
        })   
        .catch((error)=>{
            console.log(error)
        })       
    })
    .catch((error) => {
        console.log(error.message)
        swal("error",error.message,"error")
    });
}

const login = () =>{ 
    let email, password
    [email, password]=getData();
    console.log(email,password,"login details")            //

    firebase.auth().signInWithEmailAndPassword(email, password)
    .then((userCredential) => {
        user = userCredential.user
        console.log("Login successful")                  //
        existingEvents()
        .then(()=>{
            showEvents()
        })
    })
    .catch((error) => {
        console.log(error.message)
        swal("error",error.message,"error")
    });
}

const logOut = () =>{               //logout function
    firebase.auth().signOut()
    .then(function(){
        user=undefined
        hostId = undefined
        events = undefined
        window.localStorage.setItem("userEvents",undefined)
        document.getElementById("eventContainer").innerHTML = ` <div class="row px-2 mb-2">                                              
                                                                    <div class="col-md-3">
                                                                        <button class="card p-1" id="createEventBtn" onclick="createNewEvent()">
                                                                            <h1 class="mx-auto mt-auto mb-0">&plus;</h1>
                                                                            <h6 class="mx-auto mb-auto mt-0">Create New Event</h6>
                                                                        </button>
                                                                    </div>
                                                                </div>`
        myp5 = undefined
        document.getElementById("canvasDiv").innerHTML = ""
        console.log("signed out")                     //
        swal("Success!", "Logged Out Successfully!", "success");
    })
    .catch(function(error){
        console.log(error)
        swal("error",error.message,"error")
    });
}

firebase.auth().onAuthStateChanged(function(userdetail){
    if(userdetail){
        console.log("Auth state true",userdetail.email)
        createModalCanvas()
        user = userdetail 
        hostId = window.localStorage.getItem("hostId")
        document.getElementById("main").firstElementChild.lastElementChild.innerHTML = `Your Host Id: ${hostId}`
        let temp = window.localStorage.getItem("userEvents")
        if((temp != "empty") && (temp!= "undefined")){
            events = JSON.parse(temp)
            showEvents()
        }
        document.getElementById("authForm").classList.add("d-none")
        document.getElementById("main").classList.remove("d-none")
        document.getElementById("navAuth_ul").classList.remove("d-none")
        document.getElementById("navAuth_ul").firstElementChild.firstElementChild.innerHTML=userdetail.email
        document.getElementById("navAuth_btn").classList.remove("d-none")
    }
    else{
        console.log("Auth state false")
        window.localStorage.setItem("hostId",undefined)
        window.localStorage.setItem("userEvents",undefined)
        document.getElementById("authForm").classList.remove("d-none")
        document.getElementById("main").classList.add("d-none")
        document.getElementById("navAuth_ul").classList.add("d-none")
        document.getElementById("navAuth_ul").firstElementChild.firstElementChild.innerHTML="Undefined"
        document.getElementById("navAuth_btn").classList.add("d-none")
    }
});

//Existing Events
function existingEvents(){
    return new Promise((resolve,reject)=>{
        database.ref(`HostIDMap/${user.uid}`).get()
        .then((value)=>{
            window.localStorage.setItem("hostId",value.val())
            hostId = value.val()
            document.getElementById("main").firstElementChild.lastElementChild.innerHTML = `Your Host Id: ${hostId}`
            database.ref(`HostData/${hostId}`).get()
            .then((value)=>{
                let temp = value.val()
                if(temp != "empty")
                    window.localStorage.setItem("userEvents",JSON.stringify(temp))
                else
                    window.localStorage.setItem("userEvents",temp)
                events = value.val()
                resolve()
            })
            .catch((error)=>{
                console.log(error)
            })
        })
        .catch((error)=>{
            console.log(error)
        })
    })
}

//Show the events
function showEvents(){
    if(events != "empty"){
        document.getElementById("eventContainer").innerHTML = ` <div class="row px-2 mb-2">                                              
                                                                    <div class="col-md-3">
                                                                        <button class="card p-1" id="createEventBtn" onclick="createNewEvent()">
                                                                            <h1 class="mx-auto mt-auto mb-0">&plus;</h1>
                                                                            <h6 class="mx-auto mb-auto mt-0">Create New Event</h6>
                                                                        </button>
                                                                    </div>
                                                                </div>  `
        let row = document.getElementById("eventContainer").lastElementChild
        Object.keys(events).forEach((element,index)=>{
            row.innerHTML+=` <div class="col-md-3">
                                <div class=" card">
                                    <div class="card-body">
                                        <h4 class="card-title">${events[element]["EventName"]}</h4>                                               
                                        <div class="d-flex cardButtons">
                                            <button class="btn btn-light rounded-pill mr-2" onclick="editEvent(${hostId},${element})">Edit</button>
                                            <button class="btn btn-dark rounded-pill" onclick="deleteEvent(${hostId},${element})">Delete</button>
                                        </div>
                                    </div>
                                </div>
                            </div>`
            if((index+2)%4 == 0){
                document.getElementById("eventContainer").innerHTML+=`<div class="row px-2 mb-2"></div>`
                row = document.getElementById("eventContainer").lastElementChild
            }
        });
    }
    else{ 
        document.getElementById("eventContainer").innerHTML = ` <div class="row px-2 mb-2">                                              
                                                                    <div class="col-md-3">
                                                                        <button class="card p-1" id="createEventBtn" onclick="createNewEvent()">
                                                                            <h1 class="mx-auto mt-auto mb-0">&plus;</h1>
                                                                            <h6 class="mx-auto mb-auto mt-0">Create New Event</h6>
                                                                        </button>
                                                                    </div>
                                                                </div>  `
    }
}

//Delete Event
function deleteEvent(hid,eid){
    console.log(hid,eid,"Delete Event")
    let temp = events[eid]["EventName"]
    swal({
        title: "Are you sure?",
        text: "Once deleted, all details and files of this event will be lost!",
        icon: "warning",
        buttons: true,
        dangerMode: true,
    })
    .then((willDelete) => {
        if (willDelete) {
            database.ref(`HostData/${hid}/`).once("value")
            .then(function(snapshot){
                if(snapshot.numChildren() == 1){
                    database.ref(`HostData/`).update({
                        [hid]:"empty"
                    })
                    .then(()=>{
                        existingEvents()
                        .then(()=>{
                            showEvents()
                        })
                    })
                    .catch((error)=>{
                        console.log(error)
                    })
                }
                else{
                    database.ref(`HostData/${hid}/${eid}`).remove()
                    .then(()=>{
                        existingEvents()
                        .then(()=>{
                            showEvents()
                        })
                    })
                    .catch((error)=>{
                        console.log(error)
                    })
                }
                storage.ref(`${hid}/${eid}/`).child("ExcelData.xlsx").delete()
                .then(()=>{
                    storage.ref(`${hid}/${eid}/`).child("Template.jpg").delete()
                    .then(()=>{
                        swal(`Successfully Deleted Event! ${temp}`, {icon: "success",});
                        console.log("Successfully removed event id", eid)
                    })
                    .catch((error)=>{
                        console.log(error)
                    })
                })
                .catch((error)=>{
                    console.log(error)
                })
            });
        
        }
    });
}

//Edit Event
function editEvent(hid,eid){
    console.log(hid,eid,"Edit Event")
    let localEventData 
    database.ref(`HostData/${hid}/${eid}/`).get()
    .then((value)=>{
        localEventData = value.val()
        $(".modal").modal('show');
        document.querySelector(".modal-title").innerHTML="Edit Event"
        let localDynamicsArray = Object.keys(localEventData["Dynamics"]) 
        let temp = `<div class="container pt-3">
                        <input class="form-control rounded-pill mb-3" id="eventNameInput" type="text" placeholder="Event Name" value="${localEventData.EventName}">
                        <div></div><div></div>
                        <div class="d-flex mb-3 dynamicDivs" onchange="showCanvasPreview('dynamics')">
                            <input class="form-control rounded-pill flex-grow-1" type="text" placeholder="Dynamic field" value="${localDynamicsArray[0]}">
                            <input class="form-control rounded-pill w-25" type="number" placeholder="x" value="${localEventData.Dynamics[localDynamicsArray[0]]["x"]}">
                            <input class="form-control rounded-pill w-25" type="number" placeholder="y" value="${localEventData.Dynamics[localDynamicsArray[0]]["y"]}">
                            <button class="btn btn-secondary rounded-pill" style="height: 40px; width: 40px; padding: 1px 13px 5px 13px;" onclick="addDynamics()">+</button>
                            <button class="btn btn-primary rounded-pill" style="height: 40px; width: 40px; padding: 1px 15px 5px 15px;" onclick="removeDynamics()">-</button>
                        </div>`
        for(let i=1;i<localDynamicsArray.length;i++){
            temp += `<div class="d-flex mb-3 dynamicDivs" onchange="showCanvasPreview('dynamics')">
                        <input class="form-control rounded-pill flex-grow-1" type="text" placeholder="Dynamic field" value="${localDynamicsArray[i]}">
                        <input class="form-control rounded-pill w-25" type="number" placeholder="x" value="${localEventData.Dynamics[localDynamicsArray[i]]["x"]}">
                        <input class="form-control rounded-pill w-25" type="number" placeholder="y" value="${localEventData.Dynamics[localDynamicsArray[i]]["y"]}">
                    </div>`
        }
        temp += `</div>`
        document.getElementById("formDiv").innerHTML = temp

        let tempObjArray = []
        Object.keys(localEventData.Dynamics).forEach(function (element){
            tempObjArray.push({
                "fieldName" : element,
                "x" : localEventData.Dynamics[element]["x"],
                "y" : localEventData.Dynamics[element]["y"]
            })
        });
        myp5.obj = tempObjArray

        storage.ref(`${hid}/${eid}/`).child("Template.jpg").getDownloadURL()
        .then((url)=>{
            myp5.loadImage(url,(img)=>{
                myp5.bg = img
            })
        })
        document.getElementById("saveButton").classList.add("disabled")
        document.getElementById("saveButton").setAttribute("onclick",`eventSave(${hid},${eid})`)
        document.getElementById("verifyButton").setAttribute("onclick",`eventVerification(${hid},${eid})`)
    })
}

//Create Event
function createNewEvent(){
    console.log("Create Event")
    $(".modal").modal('show');
    document.querySelector(".modal-title").innerHTML="Create New Event"
    document.getElementById("formDiv").innerHTML = `<div class="container pt-3">
                                                        <input class="form-control rounded-pill mb-3" id="eventNameInput" type="text" placeholder="Event Name">
                                                        <div class="d-flex">
                                                            <input class="form-control rounded-pill mb-3 pt-1 w-75" id="excelDataInput" type="file" name="excelData" accept=".xlsx">
                                                            <label class="ml-4" for="excelData">Choose excel file!</label>
                                                        </div>
                                                        <div class="d-flex">
                                                            <input class="form-control rounded-pill mb-3 pt-1 w-50" id="templateInput" type="file" name="template" accept=".jpg" onchange="showCanvasPreview('template')">
                                                            <label class="ml-4" for="template">Choose certificate template!</label>
                                                        </div>
                                                        <div class="d-flex mb-3 dynamicDivs" onchange="showCanvasPreview('dynamics')">
                                                            <input class="form-control rounded-pill flex-grow-1" type="text" placeholder="Dynamic field">
                                                            <input class="form-control rounded-pill w-25" type="number" placeholder="x">
                                                            <input class="form-control rounded-pill w-25" type="number" placeholder="y">
                                                            <button class="btn btn-secondary rounded-pill" style="height: 40px; width: 40px; padding: 1px 13px 5px 13px;" onclick="addDynamics()">+</button>
                                                            <button class="btn btn-primary rounded-pill" style="height: 40px; width: 40px; padding: 1px 15px 5px 15px;" onclick="removeDynamics()">-</button>
                                                        </div>
                                                    </div>`
    myp5.bg = 255
    myp5.obj = undefined
    document.getElementById("saveButton").classList.add("disabled")
}

//Verification for New Event & Edit Event
function eventVerification(hid,eid){
    let flag1 = true
    let dynamicsArray = []
    Array.from(document.getElementsByClassName("dynamicDivs")).forEach(function (element){
        dynamicsArray.push({
            "fieldName" : (element.children[0].value =="")?(undefined):(element.children[0].value),
            "x" : (element.children[1].value =="")?(undefined):(element.children[1].value),
            "y" : (element.children[2].value =="")?(undefined):(element.children[2].value)
        })
    });
    let newEventName = document.getElementById("eventNameInput").value
    let newEventExcelData,newEventTemplate

    if(document.querySelector(".modal-title").innerHTML == "Create New Event"){
        newEventExcelData = document.getElementById("excelDataInput").value
        newEventTemplate = document.getElementById("templateInput").value
    }
    else{
        newEventExcelData = 1
        newEventTemplate = 1
    }

    if((newEventName == "") || (newEventExcelData == "") || (newEventTemplate == ""))
        flag1 = false
    dynamicsArray.forEach((element)=>{
        if(Object.values(element).includes(undefined))
            flag1 = false
    })
    if(!flag1)
        swal("error","Please fill up all empty fields!","error")
    else{
        let flag2 = true
        if(document.querySelector(".modal-title").innerHTML == "Create New Event"){
            let file = document.getElementById("excelDataInput").files[0]
            let f = new FileReader()
            f.readAsBinaryString(file)
            f.onload=()=>{
                let workbook = XLSX.read(f.result, {
                    type: 'binary'
                });
                let XL_row_object = XLSX.utils.sheet_to_row_object_array(workbook.Sheets[workbook.SheetNames[0]]);
                let tempArray = Object.keys(XL_row_object[0])
                if(!tempArray.includes("Participation ID"))
                    flag2 = false
                dynamicsArray.forEach((element)=>{
                    if(!tempArray.includes(element["fieldName"]))
                        flag2 = false
                })
                if(flag2 == true){
                    swal("success","Verification Successful","success")
                    document.getElementById("saveButton").classList.remove("disabled")
                }
                else
                    swal("error","Excel file does not contain necessary columns!","error")
            }
        }
        else{
            storage.ref(`${hid}/${eid}/`).child("ExcelData.xlsx").getDownloadURL()
            .then((url)=>{
                let xhr = new XMLHttpRequest()
                xhr.responseType = "arraybuffer"
                xhr.open("GET",url)
                xhr.send()
                xhr.onload = () =>{
                    let result = xhr.response
                    let workbook = XLSX.read(result, {
                        type: 'array'
                    });
                    let XL_row_object = XLSX.utils.sheet_to_row_object_array(workbook.Sheets[workbook.SheetNames[0]]);
                    let tempArray = Object.keys(XL_row_object[0])
                    dynamicsArray.forEach((element)=>{
                        if(!tempArray.includes(element["fieldName"]))
                            flag2 = false
                    })
                    if(flag2 == true){
                        swal("success","Verification Successful","success")
                        document.getElementById("saveButton").classList.remove("disabled")
                    }
                    else
                        swal("error","Excel file for this event does'nt contain all given fields!","error")
                }
            })
        }
    }
}

//New Event Save
function eventSave(hid,eid){
    let dynamicsArray = []
    Array.from(document.getElementsByClassName("dynamicDivs")).forEach(function (element){
        dynamicsArray.push({
            "fieldName" : (element.children[0].value =="")?(undefined):(element.children[0].value),
            "x" : (element.children[1].value =="")?(undefined):(element.children[1].value),
            "y" : (element.children[2].value =="")?(undefined):(element.children[2].value)
        })
    });
    let newEventName = document.getElementById("eventNameInput").value
    let newEventId,newEventExcelData,newEventTemplate

    if(document.querySelector(".modal-title").innerHTML == "Create New Event"){
        newEventExcelData = document.getElementById("excelDataInput").files[0]
        newEventTemplate = document.getElementById("templateInput").files[0]
        
        newEventId = Math.floor(Math.random() * 89999) + 10000;
        if((events != "empty") && (events != undefined)){
            let temp = Object.keys(events)
            while(temp.includes(newEventId))
                newEventId = Math.floor(Math.random() * 89999) + 10000;
        }
    }
    else{
        newEventId = eid
    }

    let tempObj = {
        [newEventId] : {
        "EventID" : newEventId,
        "EventName" : newEventName,
        "Dynamics" : undefined
        }
    }
    let tempObj2 = {}
    dynamicsArray.forEach((element)=>{
        tempObj2[element["fieldName"]] = {
                "x" : parseInt(element["x"]),
                "y" : parseInt(element["y"])
        }
    })
    tempObj[newEventId]["Dynamics"] = tempObj2

    if(document.querySelector(".modal-title").innerHTML == "Create New Event"){
        new Promise((resolve,reject)=>{
            database.ref(`HostData/${hostId}`).update(tempObj)
            .then(()=>{
                storage.ref(`${hostId}/${newEventId}/`).child("ExcelData.xlsx").put(newEventExcelData)
                .then(()=>{
                    storage.ref(`${hostId}/${newEventId}/`).child("Template.jpg").put(newEventTemplate)
                    .then(()=>{
                        resolve()                
                    })           
                })
            })
        })
        .then(()=>{
            console.log("Event Saved Successfully")
            existingEvents()
            .then(()=>{
                showEvents()
            })
        })
    }
    else{
        new Promise((resolve,reject)=>{
            database.ref(`HostData/${hostId}`).update(tempObj)
            .then(()=>{
                resolve()
            })
        })
        .then(()=>{
            console.log("Event updated Successfully")
            existingEvents()
            .then(()=>{
                showEvents()
            })
        })
    }

    $(".modal").modal('hide');
}

//Show Canvas Preview
function showCanvasPreview(field){
    if(field == "template"){
        if(document.getElementById("templateInput").value != ""){
            let temp = document.getElementById("templateInput").files[0]
            let f = new FileReader()
            f.readAsDataURL(temp)
            f.onload=()=>{
                myp5.loadImage(f.result,(img)=>{
                    myp5.bg = img
                });
            }
        }
        else{
            myp5.bg = 255  
        }
    } 
    let dynamicsArray = []
    Array.from(document.getElementsByClassName("dynamicDivs")).forEach(function (element){
        dynamicsArray.push({
            "fieldName" : (element.children[0].value =="")?(undefined):(element.children[0].value),
            "x" : (element.children[1].value =="")?(undefined):(element.children[1].value),
            "y" : (element.children[2].value =="")?(undefined):(element.children[2].value)
        })
    });
    myp5.obj = dynamicsArray
}

//Create Modal Canvas
function createModalCanvas(){
    let sketch  = function(p){
        p.bg = 255
        p.obj = undefined
        p.setup = function(){
            p.createCanvas(407,575)
            p.textSize(20)
            p.textAlign(p.LEFT, p.TOP)
        }
        p.draw = function(){
            p.background(p.bg)
            if(p.obj != undefined){
                p.obj.forEach((element,index)=>{
                    if(!Object.values(element).includes(undefined)){
                        p.text(element["fieldName"], element["x"], element["y"])
                    }
                })
            }
        }
    };
    myp5 = new p5(sketch, 'canvasDiv');
}

//Add and Remove Dynamics Fields
function addDynamics(){
    saveButtonState()
    if(document.getElementById("formDiv").firstElementChild.childElementCount < 8){
        let temp = document.createElement("div")
        temp.setAttribute("class","d-flex mb-3 dynamicDivs")
        temp.setAttribute("onchange","showCanvasPreview('dynamics')")
        temp.innerHTML=`<input class="form-control rounded-pill flex-grow-1" type="text" placeholder="Dynamic field">
                        <input class="form-control rounded-pill w-25" type="number" placeholder="x">
                        <input class="form-control rounded-pill w-25" type="number" placeholder="y">`
        document.getElementById("formDiv").firstElementChild.appendChild(temp)
    }
    else
        swal("warning","Only five dynamic fields are allowed per event!","warning")
}
function removeDynamics(){
    saveButtonState()
    if(document.getElementById("formDiv").firstElementChild.childElementCount > 4){
        document.getElementById("formDiv").firstElementChild.lastElementChild.remove()
        showCanvasPreview()
    }
    else
        swal("warning","Minimum of one dynamic field is required per event!","warning")
}

//State of the save button
function saveButtonState(){
    document.getElementById("saveButton").classList.add("disabled")
}
