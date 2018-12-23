/**
 * Copyright 2018 Intel Corporation
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 * ------------------------------------------------------------------------------
 */

//works in strict mode
'use strict'

//require the handler module.
//declaring a constant variable.
const { TransactionHandler } = require('sawtooth-sdk/processor/handler')


const {
  InvalidTransaction,
  InternalError
} = require('sawtooth-sdk/processor/exceptions')
const crypto = require('crypto')
const {TextEncoder, TextDecoder} = require('text-encoding/lib/encoding')

const _hash = (x) => crypto.createHash('sha512').update(x).digest('hex').toLowerCase()
var encoder = new TextEncoder('utf8')
var decoder = new TextDecoder('utf8')
const CJ_FAMILY = 'voting'
const CJ_NAMESPACE = _hash(CJ_FAMILY).substring(0, 6)


//function to obtain the payload obtained from the client
const _decodeRequest = (payload) =>
  new Promise((resolve, reject) => {
    payload = payload.toString().split(',')
    if (payload.length === 5 && payload[0]==='voter-upload') {
      resolve({
        action: payload[0],
        name : payload[1],
        id : payload[2],
        password : payload[3],
        station : payload[4]
      })
    }
    else if (payload.length === 4 && payload[0]==='candidate-upload') {
      console.log("works up to here... payload[0]=",payload[0])
      resolve({
        action: payload[0],
        name : payload[1],
        caSign : payload[2],
	      station : payload[3]
      })
    }
    else if (payload.length === 3 && payload[0]==='vote') {
      console.log("works up to here... payload[0]=",payload[0])
      resolve({
        action: payload[0],
        CandidateIndex : payload[1],
        station:payload[2]
      })
    }
    else if (payload.length === 2 && payload[0]==='setVote') {
      console.log("works up to here... payload[0]=",payload[0])
      resolve({
        action: payload[0],
        voterId : payload[1]
      })
    }
   
    else {
      let reason = new InvalidTransaction('Invalid payload serialization')
      reject(reason)
    }
})

//function to display the errors
const _toInternalError = (err) => {
  console.log(" in error message block")
  let message = err.message ? err.message : err
  throw new InternalError(message)
}

//function to set the entries in the block using the "SetState" function
const _setEntry = (context, address, stateValue) => {
  let dataBytes = encoder.encode(stateValue)
  let entries = {
    [address]: dataBytes 
  }
  return context.setState(entries)
}

//function to bake a cookie
/*const makeBake =(context, address, quantity, userPK)  => (possibleAddressValues) => {
  let stateValueRep = possibleAddressValues[address]
  let newCount = 0
  let count
  if (stateValueRep == null || stateValueRep == ''){
    console.log("No previous cookies, creating new cookie jar ")
    newCount = quantity
  }
  else{
    count = decoder.decode(stateValueRep)
    newCount = parseInt(count) + quantity
    console.log("Cookies in the jar:"+newCount)
  }
  const actionText = "Baked " + quantity + (quantity == 1? " cookie": " cookies");
  let strNewCount = newCount.toString()
  context.addEvent(
    "cookiejar/cookiejar-action",
    [["action", "Bake"],["actionText", actionText], ["user", userPK]],
    Buffer.from("Current cookie count: " + newCount, 'utf8')
  )
  context.addReceiptData("Cookie count is " + strNewCount);
  return _setEntry(context, address, strNewCount)
}*/

//voter upload logic
const voterUpload = (context, address, values) => (possibleAddressValues) => {
  let stateValueRep = possibleAddressValues[address]

  let data = {
    name : values.name,
    id : values.id,
    password : values.password,
    station : values.station,
    voted  : false
  }
  data = JSON.stringify(data);
  console.log('the data :',data);
  return _setEntry(context, address, data)
}

//candidate upload logic
const candidateUpload = (context, address, values) => (possibleAddressValues) => {
  let stateValueRep = possibleAddressValues[address]
  let data
  if(stateValueRep == null||stateValueRep == ''){
      data = {
        totalVoted:0,
        candidates:[{name:values.name,sign:values.caSign,count:0}]
      }
  }
  else{
    let getData = decoder.decode(stateValueRep)
    let parsedData = JSON.parse(getData)
    console.log("parsed data:",parsedData)
    let entry = {name:values.name,sign:values.caSign,count:0}
    parsedData['candidates'].push(entry)
    data = parsedData
  }
  data = JSON.stringify(data);
  console.log('final data:',data)
  return _setEntry(context, address, data)
}

//voting logic
const vote = (context, address, values) => (possibleAddressValues) => {
  let stateValueRep = possibleAddressValues[address]

  if (stateValueRep == null || stateValueRep == ''){
    throw new InvalidTransaction('state error')
  }
  else{
   let data = decoder.decode(stateValueRep)
    data = JSON.parse(data)
    data.totalVoted=data.totalVoted + 1
    data.candidates[values.CandidateIndex].count += 1
  let updatedData = JSON.stringify(data);
  console.log('the data :',data);
  return _setEntry(context, address, updatedData)
  }
}

//logic for set voter state
const setVote = (context, address, values) => (possibleAddressValues) => {
  let stateValueRep = possibleAddressValues[address]

  if (stateValueRep == null || stateValueRep == ''){
    throw new InvalidTransaction('state error')
  }
  else{
   let data = decoder.decode(stateValueRep)
    data = JSON.parse(data)
    data.voted = true
  let updatedData = JSON.stringify(data);
  console.log('the data :',data);
  return _setEntry(context, address, updatedData)
  }
}


class VotingHandler extends TransactionHandler{
  constructor(){
    super(CJ_FAMILY,['1.0'],[CJ_NAMESPACE])
  }
  apply(transactionProcessRequest, context){
    return _decodeRequest(transactionProcessRequest.payload)
    .catch(_toInternalError)
    .then((update) => {
    let header = transactionProcessRequest.header
    let action = update.action
    console.log("returned with action value:",action)
    let actionFn
    let Address
    if (!action) {
      throw new InvalidTransaction('Action is required')
    }
    //validation of voter-upload
    if(action === 'voter-upload'){
    let name = update.name
    if (name === null || name === undefined) {
      throw new InvalidTransaction('Value is required')
    }
    if (typeof name !== "string" ||  name.length < 1) {
      throw new InvalidTransaction(`Value must contain only characters ` + `no less than 1`)
    }
    let id = update.id;
    let idNum = parseInt(id);
    console.log("ID :",idNum,'length:',id.length)

    if( id.length != 16){
      throw new InvalidTransaction(`Id must be a numerical value ` + `must contain 16 digits`)
    }
    //calculating the address for function voter upload
    Address = CJ_NAMESPACE +_hash(update.id).substring(0,64) 
    console.log('address:',Address)
     // Select the action to be performed
    actionFn = voterUpload
    
    }
    //validation of candidate upload
    else if(action === 'candidate-upload'){
      let name = update.name
      console.log("the name of candidate:",name)
      if (name === null || name === undefined) {
        throw new InvalidTransaction('Value is required')
      }
      if (typeof name !== "string" ||  name.length < 1) {
        throw new InvalidTransaction(`Value must contain only characters ` + `no less than 1`)
      }
      let sign = update.caSign
      console.log("Sign :",sign)
  
      //calculating the address for function candidate upload
      Address = CJ_NAMESPACE +_hash(update.station).substring(0,64)
      console.log('address:',Address)
       // Select the action to be performed
      actionFn = candidateUpload

      }
      //validation of vote
      else if(action === 'vote'){
        let CandidateIndex = update.CandidateIndex
        console.log("the Index of the candidate:",CandidateIndex)
        CandidateIndex = parseInt(CandidateIndex)

        if (CandidateIndex === null || CandidateIndex === undefined) {
          throw new InvalidTransaction('Value is required')
        }
        if (typeof CandidateIndex !== "number" ||  CandidateIndex.length < 1) {
          throw new InvalidTransaction(`Value must contain only numbers` + `no less than 1`)
        }
        let station = update.station;
        if(station === null || station === undefined){
         throw new InvalidTransaction('Station is required')
        }
    
        //calculating the address for candidate state
        Address = CJ_NAMESPACE +_hash(station).substring(0,64)
        console.log('address:',Address)
         // Select the action to be performed
        actionFn = vote
  
        }
        else if(action === 'setVote'){
          let id = update.voterId;
          let idNum = parseInt(id);
          console.log("ID :",idNum,'length:',id.length)

          if( id.length != 16 ){
          throw new InvalidTransaction( `must contain 16 digits`)
          }
      
          //calculating the address for candidate state
          Address = CJ_NAMESPACE +_hash(id).substring(0,64)
          console.log('address:',Address)
           // Select the action to be performed
          actionFn = setVote
    
          }
          else{
            throw new InvalidTransaction('Unknown action!!')
          }

    

   
  
  

    // Get the current state, for the key's address
    let getPromise
    if (update.action == 'voter-upload')
      getPromise = context.getState([Address])
    else
      getPromise = context.getState([Address])
    let actionPromise = getPromise.then(
      actionFn(context,Address, update)
      )
    
    return actionPromise.then(addresses => {
      if (addresses.length === 0) {
        throw new InternalError('State Error!')
      }  
    })

   
   
  })
 }
}

module.exports = VotingHandler
