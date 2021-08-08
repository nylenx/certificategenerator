// Your web app's Firebase configuration
var firebaseConfig = {
    apiKey: "AIzaSyDAae-f0eoxefT0nvlfnl5olzEmyfGI7xo",
    authDomain: "certificate-generator-bd93b.firebaseapp.com",
    databaseURL: "https://certificate-generator-bd93b-default-rtdb.asia-southeast1.firebasedatabase.app",
    projectId: "certificate-generator-bd93b",
    storageBucket: "certificate-generator-bd93b.appspot.com",
    messagingSenderId: "730064384142",
    appId: "1:730064384142:web:a266a04e7a5928e441d9df"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig)
var database = firebase.database()
var storage = firebase.storage()

let flag1 = true
let flag2 = true
let HostIdGlobal = undefined
let EventIdGlobal = undefined
let ParticipantIdGlobal = undefined
let ParticipantDetails = undefined

let dynamicsData = undefined
let doc = undefined

//Getting form input data
async function GetData(callback) {
    let Event = document.getElementById("event").value
    let ParticipantId = document.getElementById("pId").value;

    console.log(Event,ParticipantId)           //
    await InputValidation(Event,ParticipantId)
    if(flag1 && flag2){
        generatePdf()
        .then(()=>{
            callback()
        })
    }
}

//Form Input Validation
async function InputValidation(Event,ParticipantId){
    if(Event=="Select your event")
        flag1 = false
    else if(HostIdGlobal==undefined)
        flag1 = false
    else{
        flag1 = true
        EventIdGlobal = parseInt(Event)    
    }

    if(flag1==false)
        swal("Error","Please Enter a correct HostID & select a event!","error")
    else{
        if(! await CheckParticipantId(ParticipantId)){
            flag2 = false
        }            
    }
}

//Check HostID
function CheckHostId(){
    let HostId = parseInt(document.getElementById("HostId").value)
    let select = document.getElementById("event")
    database.ref("HostIDMap").get()
    .then((value)=>{
        let HostArray = Object.values(value.val())
        if(HostArray.includes(HostId))
        {
            HostIdGlobal = HostId
            document.getElementById("HostError").classList.add("d-none")
            database.ref(`HostData/${HostId}`).get()
            .then((value)=>{
                let data = value.val()
                select.innerHTML = `<option>Select your event</option>`
                Object.keys(data).forEach((element)=>{
                    select.innerHTML+=`<option value="${data[element]["EventID"]}">${data[element]["EventName"]}</option>`
                })
            })
            .catch((error)=>{
                console.log(error)
            })
        }
        else
        {
            HostIdGlobal = undefined
            EventIdGlobal = undefined
            ParticipantIdGlobal = undefined
            ParticipantDetails = undefined
            dynamicsData = undefined
            doc = undefined
            select.innerHTML = `<option>Select your event</option>`
            document.getElementById("HostError").classList.remove("d-none")
            document.getElementById("HostError").innerHTML = "Please enter a valid HostId!"
        }
    })
    .catch((error)=>{
        console.log(error)
    })

}

//Check ParticipantID
async function CheckParticipantId(ParticipantId){
    return new Promise((resolve,reject)=>{
        if(ParticipantId==""){
            swal("Error","Please enter a Participation ID!","error")
            return resolve(false)
        }
        else{
                storage.ref(`${HostIdGlobal}/${EventIdGlobal}`).child("ExcelData.xlsx").getDownloadURL()
                .then((url) => {
                    let xhr = new XMLHttpRequest();
                    xhr.responseType = 'arraybuffer';

                    xhr.onload = (event) => {
                        let result = xhr.response;
                        let workbook = XLSX.read(result, {
                            type: 'array'
                        });
                        let XL_row_object = XLSX.utils.sheet_to_row_object_array(workbook.Sheets[workbook.SheetNames[0]]);
                        let tempFlag=false
                        XL_row_object.forEach((element,index)=>{
                            if(element["Participation ID"]==parseInt(ParticipantId)){
                                tempFlag = index
                            }
                        })
                        if(tempFlag!==false){
                            ParticipantDetails = XL_row_object[tempFlag]
                            resolve(true)
                        }
                        else{
                            swal("Error","Please enter CORRECT Participation ID!","error")
                            resolve(false)
                        }
                    };
                    xhr.open('GET', url);
                    xhr.send();
            
                })
                .catch((error) => {
                    console.log(error)
                })
            }
    }) 
}

//Pdf Generate
async function generatePdf(){
    return new Promise((response,reject)=>{
        database.ref(`HostData/${HostIdGlobal}/${EventIdGlobal}/Dynamics`).get()
        .then((value)=>{
            dynamicsData = value.val()
        })
        .catch((error) => {
            console.log(error)
        });

        doc = new jsPDF("p", "px", [407,575])
        doc.setFontSize(23)
        let width = doc.internal.pageSize.width;
        let height = doc.internal.pageSize.height;

        storage.ref(`${HostIdGlobal}/${EventIdGlobal}`).child("Template.jpg").getDownloadURL()
        .then((url) => {
            let xhr = new XMLHttpRequest();
            xhr.responseType = 'arraybuffer';

            xhr.onload = (event) => {
                let result = xhr.response;
                let data = doc.arrayBufferToBinaryString(result)
                doc.addImage(data,"jpeg",0,0,width,height)
                Object.keys(dynamicsData).forEach((element)=>{
                    console.log(ParticipantDetails[element].toString(),dynamicsData[element]["x"], dynamicsData[element]["y"])
                    doc.text(ParticipantDetails[element].toString(),dynamicsData[element]["x"], dynamicsData[element]["y"]+14)
                })
                response()
            };
            xhr.open('GET', url);
            xhr.send();
        })
        .catch((error) => {
            console.log(error)
        })   
    })
}

// Download function
function downloadFunction(){
    console.log("Download function")        //
    doc.save("Certificate.pdf")
}

// Preview function
function previewFunction(){
    console.log("Preview function")         //
    window.open(doc.output('bloburl'))
}

//Loading function
function loadingFunction(){
    var preloader = document.getElementById("loading")
    preloader.style.display = 'none'
}



