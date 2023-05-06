//import { ChainId, Token, TokenAmount, Pair, Trade, TradeType, Route } from '@uniswap/sdk'
import Web3 from 'web3'
import { newKitFromWeb3 } from '@celo/contractkit'
import BigNumber from "bignumber.js"
import WorkplaceAbi from '../contract/Workplace.abi.json'
import erc20Abi from "../contract/erc20.abi.json"

const ERC20_DECIMALS = 18
const APaddress = "0x5930E29c005052f1d27BefB216bc2Ce0D34a2f72"
const cUSDContractAddress = "0x874069Fa1Eb16D44d622F2e0Ca25eeA172369bC1"

let kit
let contract
let Assignments
let Submissions
let Workers



const _Assignments = []
const _Workers =[]
const _Submissions = []






const connectCeloWallet = async function () {
  if (window.celo) {
      notification("⚠️ Please approve this DApp to use it.")
    try {
      await window.celo.enable()
      notificationOff()

      const web3 = new Web3(window.celo)
      kit = newKitFromWeb3(web3)

      const accounts = await kit.web3.eth.getAccounts()
      kit.defaultAccount = accounts[0]
      contract = new kit.web3.eth.Contract(WorkplaceAbi, APaddress)

    } catch (error) {
      notification(`⚠️ ${error}.`)
    }
  } else {
    notification("⚠️ Please install the CeloExtensionWallet.")
  }
}

async function approve(_price) {
  const cUSDContract = new kit.web3.eth.Contract(erc20Abi, cUSDContractAddress)

  const result = await cUSDContract.methods
    .approve(APaddress, _price)
    .send({ from: kit.defaultAccount })
  return result
}

const getBalance = async function () {
    const totalBalance = await kit.getTotalBalance(kit.defaultAccount)
    const cUSDBalance = totalBalance.cUSD.shiftedBy(-ERC20_DECIMALS).toFixed(2)
    document.querySelector("#balance").textContent = cUSDBalance
}

const getAssignments = async function() {
  const _AssignmentSize = await contract.methods.getAssignmentsToDoSize().call()

  for(let i =0; i< _AssignmentSize; i++){
    let _data = new Promise(async (resolve,reject) =>{
      let p =await contract.methods.GetAssignment(i).call()
      resolve({
        index: i,
        Employer:p[0],
        BestSubimitter: p[1],
        name: p[2],
        image: p[3],
        Assignmentdescription: p[4],
        BestSubmission: p[5],
        price: new BigNumber(p[6]),
        SubmissionCount : p[7]
      })
    })
    _Assignments.push(_data)
  }

  Assignments = await Promise.all(_Assignments)
  renderAssignments()
}

const getSubmissions = async function(_index) {
  const _SubmissionSize = await contract.methods.getSubmissionsSize(_index).call()

  for(let i =0; i< _SubmissionSize; i++){
    let _data = new Promise(async (resolve,reject) =>{
      let p =await contract.methods.GetSubmission(_index,i).call()
      resolve({
        AssignmentIndex: _index,
        Subindex: i,
        submission: p[0],
        submitter: p[1]
      })
    })
    _Submissions.push(_data)
  }

  Submissions = await Promise.all(_Submissions)
  renderSubmissions()
}

const getWorkers = async function() {
  const _WorkersSize = await contract.methods.getworkersSize().call()

  for(let i =0; i< _WorkersSize; i++){
    let _data = new Promise(async (resolve,reject) =>{
      let p =await contract.methods.GetWorkerInfo(i).call()
      resolve({
        index: i,
        worker:p[0],
        name: p[1],
        image : p[2],
        description: p[3],
        AssignmentsDone: p[4]
      })
    })
    _Workers.push(_data)
  }

  Workers = await Promise.all(_Workers)
  renderWorkers()
}



function renderAssignments() {
    document.getElementById("Art Place").innerHTML = ""
    Assignments.forEach((_assignment) => {
      const newDiv = document.createElement("div")
      newDiv.className = "col-md-4"
      newDiv.innerHTML = AssignmentTemplate(_assignment)
      document.getElementById("Art Place").appendChild(newDiv)
    })
}   


function renderSubmissions() {
    document.getElementById("Art Place").innerHTML = ""
    Submissions.forEach((_Submission) => {
      const newDiv = document.createElement("div")
      newDiv.className = "col-md-4"
      newDiv.innerHTML = SubmissionTemplate(_Submission)
      document.getElementById("Art Place").appendChild(newDiv)
    })
}


function renderWorkers() {
    document.getElementById("Art Place").innerHTML = ""
    Workers.forEach((_Worker) => {
      const newDiv = document.createElement("div")
      newDiv.className = "col-md-4"
      newDiv.innerHTML = WorkerTemplate(_Worker)
      document.getElementById("Art Place").appendChild(newDiv)
    })
}



  function AssignmentTemplate(_assignment) {
    return `
      <div class="card mb-4">
        <img class="card-img-top" src="${_assignment.image}" alt="...">
        </div>
        <div class="card-body text-left p-4 position-relative">
        <div class="translate-middle-y position-absolute top-0">
        ${identiconTemplate(_assignment.Employer)}
        </div>
        <h2 class="card-title fs-4 fw-bold mt-2">${_assignment.name}</h2>
        <p class="card-text mb-4" style="min-height: 82px">
          ${_assignment.Assignmentdescription}             
        </p>
        <p class="card-text mt-4">
          <i class="bi bi-geo-alt-fill"></i>
          <span>${_assignment.name}</span>
        </p>
        <p class="card-text mt-4">
          <i class="bi bi-geo-alt-fill"></i>
          <span>${_assignment.BestSubmission}</span>
        </p>
        <p class="card-text mt-4">
          <i class="bi bi-geo-alt-fill"></i>
          <span>${_assignment.BestSubmitter}</span>
        </p>
        <p class="card-text mt-4">
          <i class="bi bi-geo-alt-fill"></i>
          <span> Total Submissions ${_assignment.SubmissionCount}</span>
        </p>
        <div class="d-grid gap-2">
          <a class="btn btn-lg btn-outline-dark fs-6 p-3" id=${
            _assignment.index}
          data-bs-toggle="modal"
          data-bs-target="#addModal1"
          >
            Add submission and earn ${_assignment.price.shiftedBy(-ERC20_DECIMALS).toFixed(2)} cUSD
          </a>
        </div><div class="d-grid gap-2">
        <a class="btn btn-lg btn-outline-dark viewsubmissions fs-6 p-3" id=${
          _assignment.index}
        >
          View Submissions 
        </a>
      </div>

      </div>
    </div>
  `
}

function  WorkerTemplate(_Worker) {
  return `
    <div class="card mb-4">
      <img class="card-img-top" src="${_Worker.image}" alt="...">
      </div>
      <div class="card-body text-left p-4 position-relative">
      <div class="translate-middle-y position-absolute top-0">
      ${identiconTemplate(_Worker.Worker)}
      </div>
      <h2 class="card-title fs-4 fw-bold mt-2">${_Worker.name}</h2>
      <p class="card-text mb-4" style="min-height: 82px">
        ${_Worker.description}             
      </p>
      <p class="card-text mt-4">
        <i class="bi bi-geo-alt-fill"></i>
        <span> Total Assignments ${_Worker.AssignmentsDone}</span>
      </p>
    </div>
  </div>
`
}  

function SubmissionTemplate(_Submission) {
  return `
    <div class="card-body text-left p-4 position-relative">
      <div class="translate-middle-y position-absolute top-0">
      ${identiconTemplate(_Submission.submitter)}
      </div>
      <p class="card-text mb-4" style="min-height: 82px">
        ${_Submission.submission}             
      </p> 
    </div>
    <div class="d-grid gap-2">
      <a class="btn btn-lg btn-outline-dark AwardSubmitBtn fs-6 p-3" id=${
        _Submission.AssignmentIndex, _Submission.Subindex}
      >
      Award Submission ${_assignment.price.shiftedBy(-ERC20_DECIMALS).toFixed(2)} cUSD
      </a>
    </div>
  </div>
`
}



function identiconTemplate(_address) {
  const icon = blockies
    .create({
      seed: _address,
      size: 8,
      scale: 16,
    })
    .toDataURL()

  return `
  <div class="rounded-circle overflow-hidden d-inline-block border border-white border-2 shadow-sm m-0">
    <a href="https://alfajores-blockscout.celo-testnet.org/address/${_address}/transactions"
        target="_blank">
        <img src="${icon}" width="48" alt="${_address}">
    </a>
  </div>
  `
}

function notification(_text) {
  document.querySelector(".alert").style.display = "block"
  document.querySelector("#notification").textContent = _text
}

function notificationOff() {
  document.querySelector(".alert").style.display = "none"
}

window.addEventListener("load", async () => {
  notification("⌛ Loading...")
  await connectCeloWallet()
  getBalance()
  getAssignments()
  notificationOff()
})


document
  .querySelector("#newAssignmentBtn")
  .addEventListener("click", async () => {
    const params = [
      document.getElementById("newAssignmentName").value,
      document.getElementById("newImgUrl").value,
      document.getElementById("newAssignmentDescription").value,
      new BigNumber(document.getElementById("newPrice").value)
      .shiftedBy(ERC20_DECIMALS)
      .toString()
    ]
    notification(`⌛ Adding "${params[0]}"...`)
    notification("⌛ Waiting for payment approval...")
    try {
      await approve(new BigNumber(document.getElementById("newPrice").value)
      .shiftedBy(ERC20_DECIMALS)
      .toString())
      const result1 = await contract.methods
        .Addassignment(...params)
        .send({ from: kit.defaultAccount })
      } catch (error) {
        notification(`⚠️ ${error}.`)
      }
      //notification(`⌛ Awaiting payment of prize for "${Assignments[index].name}"...`)
      notification(`🎉 You successfully added "${params[0]}".`)
      getAssignments()
  })

  document
  .querySelector("#newSubmissionBtn")
  .addEventListener("click", async () => {
    const index = e.target.id
    const params = [
      document.getElementById("newPieceName").value,
      document.getElementById("newSubmission").value,
    ]
    
    try {
      const result = await contract.methods
        .SubmitWork(index,...params)
        .send({ from: kit.defaultAccount })
    } catch (error) {
      notification(`⚠️ ${error}.`)
    }
    notification(`🎉 You successfully added "${params[0]}".`)
    getSubmissions()
  })

  document
  .querySelector("#newWorkerBtn")
  .addEventListener("click", async () => {
    const params = [
      document.getElementById("newWorkerName").value,
      document.getElementById("newWorkerImgUrl").value,
      document.getElementById("newWorkerDescription").value,
    ]
    
    try {
      const result = await contract.methods
        .AddtoWorkforce(...params)
        .send({ from: kit.defaultAccount })
    } catch (error) {
      notification(`⚠️ ${error}.`)
    }
    notification(`🎉 You successfully added "${params[0]}".`)
    getWorkers()
  })

  document
  .querySelector("#AssignmentRender")
  .addEventListener("click", async () => {
    getAssignments()
  })

  document.querySelector("#WorkerRender")
  .addEventListener("click", async () => {
    getWorkers()
  })

  document.querySelector("#Art Place").addEventListener("click", async (e) => {
    if(e.target.className.includes("AwardSubmitBtn")) {
      const index = e.target.id
      if (_Assignments[index[0]].Assignmentdescription != ""){
        try {
        const result = await contract.methods
          .SetBestSubmission(index[0],index[1])
          .send({ from: kit.defaultAccount })
          await approve(new BigNumber(_Assignments[index[0]].price)
          .shiftedBy(ERC20_DECIMALS)
          .toString())
          await contract.methods.award(index[0])
          notification(`🎉 You successfully awarded "${_Assignments[index[0]].Best.BestSubimitter}".`)
          getSubmissions()
          getBalance()
          } catch (error) {
            notification(`⚠️ ${error}.`)
          }
      }
      
    }

    document.querySelector("#Art Place").addEventListener("click", async (e) => {
      if(e.target.className.includes("viewsubmissions")) {
        const index = e.target.id
        if (_Assignments[index].Assignmentdescription != ""){
          getSubmissions(index)
        }
      }
    })
  })
