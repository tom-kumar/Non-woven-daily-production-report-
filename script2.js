
// -----------------------------
// GLOBAL VARIABLES
// -----------------------------

const tableBody=document.getElementById("tableBody")

let nextRoll=null


// -----------------------------
// INITIALIZE
// -----------------------------

window.addEventListener("DOMContentLoaded",()=>{

document.getElementById("addRowBtn").addEventListener("click",addRow)
document.getElementById("clearBtn").addEventListener("click",clearData)

createRows(25)
loadOffline()

})


// -----------------------------
// ROW CREATION
// -----------------------------

function createRows(count){

for(let i=0;i<count;i++){
addRow()
}

}

function addRow(){

let rowNumber=tableBody.rows.length+1

let row=document.createElement("tr")

row.innerHTML=`

<td>${rowNumber}</td>
<td><input class="roll"></td>
<td><input type="number" class="length"></td>
<td><input type="number" class="width"></td>
<td><input type="number" class="gross"></td>
<td class="net"></td>
<td><input class="gsm"></td>
<td><input class="breakdown "></td>

`

tableBody.appendChild(row)

}


// -----------------------------
// INPUT LISTENER
// -----------------------------

document.addEventListener("input",(e)=>{

let row=e.target.closest("tr")
if(!row) return

if(e.target.classList.contains("gross")){
autoRollFill(row)
}

calculate()

})


// -----------------------------
// CALCULATION
// -----------------------------

function calculate(){

let tare=parseFloat(document.getElementById("tare").value)||0

let total=0

document.querySelectorAll("#tableBody tr").forEach(row=>{

let roll=parseInt(row.querySelector(".roll").value)
let gross=parseFloat(row.querySelector(".gross").value)
let length=parseFloat(row.querySelector(".length").value)||0
let width=parseFloat(row.querySelector(".width").value)||0

if(!gross || !roll) return

let net=gross-tare

if(net<=0) return

row.querySelector(".net").innerText=net.toFixed(2)

total+=net

if(length>0 && width>0){

let gsm=(net*1000)/(length*width)

row.querySelector(".gsm").value=gsm.toFixed(2)

}

})

document.getElementById("totalNet").innerText=total.toFixed(2)

saveOffline()

}


// -----------------------------
// AUTO ROLL
// -----------------------------

function autoRollFill(row){

let gross=row.querySelector(".gross").value
let rollCell=row.querySelector(".roll")

if(!gross) return

if(nextRoll===null){

let start=parseInt(document.getElementById("startRoll").value)

if(!start){
alert("Enter Starting Roll Number")
return
}

nextRoll=start

}

if(!rollCell.value){

rollCell.value=nextRoll
nextRoll++

autofillDimensions(row)

}

}


// -----------------------------
// AUTO DIMENSIONS
// -----------------------------

function autofillDimensions(row){

let defaultLength=document.getElementById("defaultLength").value
let defaultWidth=document.getElementById("width").value

let lengthCell=row.querySelector(".length")
let widthCell=row.querySelector(".width")

if(!lengthCell.value) lengthCell.value=defaultLength
if(!widthCell.value) widthCell.value=defaultWidth

}


// -----------------------------
// SAVE OFFLINE
// -----------------------------

function saveOffline(){

let header={

productCode:document.getElementById("productCode").value,
batchNo:document.getElementById("batchNo").value,
color:document.getElementById("color").value,
date:document.getElementById("date").value,
shift:document.getElementById("shift").value,
startRoll:document.getElementById("startRoll").value,
length:document.getElementById("defaultLength").value,
width:document.getElementById("width").value,
tare:document.getElementById("tare").value

}

let rows=[]

document.querySelectorAll("#tableBody tr").forEach(row=>{

let roll=row.querySelector(".roll").value

if(!roll) return

rows.push({

roll:roll,
length:row.querySelector(".length").value,
width:row.querySelector(".width").value,
gross:row.querySelector(".gross").value,
net:row.querySelector(".net").innerText,
gsm:row.querySelector(".gsm").value,
breakdown :row.querySelector(".breakdown ").value

})

})

let data={header,rows}

localStorage.setItem("productionData",JSON.stringify(data))

}


// -----------------------------
// LOAD OFFLINE DATA
// -----------------------------

function loadOffline(){

let saved=localStorage.getItem("productionData")

if(!saved) return

let data=JSON.parse(saved)

let h=data.header

document.getElementById("productCode").value=h.productCode
document.getElementById("batchNo").value=h.batchNo
document.getElementById("color").value=h.color
document.getElementById("date").value=h.date
document.getElementById("shift").value=h.shift
document.getElementById("startRoll").value=h.startRoll
document.getElementById("defaultLength").value=h.length
document.getElementById("width").value=h.width
document.getElementById("tare").value=h.tare


// ensure enough rows

while(tableBody.rows.length < data.rows.length){
addRow()
}

let lastRoll=0

data.rows.forEach((r,i)=>{

let row=tableBody.rows[i]

row.querySelector(".roll").value=r.roll
row.querySelector(".length").value=r.length
row.querySelector(".width").value=r.width
row.querySelector(".gross").value=r.gross
row.querySelector(".net").innerText=r.net
row.querySelector(".gsm").value=r.gsm
row.querySelector(".breakdown ").value=r.breakdown 

if(parseInt(r.roll)>lastRoll){
lastRoll=parseInt(r.roll)
}

})

nextRoll=lastRoll+1

calculate()

}


// -----------------------------
// CLOUD SYNC
// -----------------------------
document.getElementById("uploadBtn").addEventListener("click",uploadPDF)

async function uploadPDF(){

let btn=document.getElementById("uploadBtn")
btn.disabled=true

try{

let container=document.querySelector(".container")

let canvas=await html2canvas(container,{scale:1})

let img=canvas.toDataURL("image/png")

const { jsPDF } = window.jspdf

let pdf=new jsPDF("p","mm",[canvas.width,canvas.height])

pdf.addImage(img,"PNG",0,0,canvas.width,canvas.height)

let pdfBlob=pdf.output("blob")

let formData=new FormData()
formData.append("file",pdfBlob,"report.pdf")

let res=await fetch("https://script.google.com/macros/s/AKfycbwkipZJ9l0ss0bCoIpBhrHn0ixBDmBrOda0fZmapMO5z_vDXyN1EbrHE93N2KemB-K2/exec",{
method:"POST",
body:formData
})

if(res.ok){
alert("Upload Success")
}else{
alert("Upload Failed")
}

}catch(err){

console.error(err)
alert("Network Error")

}

btn.disabled=false

}

function clearData(){

localStorage.removeItem("productionData")

location.reload()

}

// -----------------------------
// AUTO SAVE TOP PANEL
// -----------------------------

document.querySelectorAll(".top-panel input").forEach(el=>{
el.addEventListener("input",saveOffline)
})

