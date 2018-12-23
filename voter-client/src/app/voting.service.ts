import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { createHash } from 'crypto-browserify';
import { CryptoFactory, createContext } from "sawtooth-sdk/signing";
import * as protobuf  from "sawtooth-sdk/protobuf";
import { TextEncoder, TextDecoder} from "text-encoding/lib/encoding";
import {Buffer} from 'buffer/';
import * as Secp256k1PrivateKey from 'sawtooth-sdk/signing/secp256k1';

@Injectable({
  providedIn: 'root'
})
export class VotingService {

  private signer: any;
  public publicKey: any;
  public address: any;
  public transactionHeaderBytes: any;
  public station_name = "ATTINGAL01";
  public auth = false;
  public voId = '';
  public voName = ''; 
 
  private FAMILY_NAME = 'voting';
  private FAMILY_VERSION = '1.0';
  private REST_API_BASE_URL = 'http://localhost:4201/api';

  constructor() {
    const context = createContext('secp256k1');
    // Creating a random private key - In LIVE, we will be using our own private keys
    const privateKey = context.newRandomPrivateKey();
    this.signer = new CryptoFactory(context).newSigner(privateKey);
    this.publicKey = this.signer.getPublicKey().asHex();
    // Creating address
   }
   public createAddress(item){
     if(item == ''){
      this.address =  this.hash("voting").substr(0, 6) + this.hash(this.station_name).substr(0, 64)
      console.log("Storing at: " + this.address);
     }
     else{
      this.address =  this.hash("voting").substr(0, 6) + this.hash(item).substr(0, 64)
      console.log("Storing at: " + this.address);
     }
    
  }
  //marking that the voter is voted
  public async setVote(){
    this.createAddress(this.voId);
    await this.sendData('setVote',this.voId)
  }
  public clearLogin(): boolean {
    console.log("Cleared the login credentials");
    this.signer = null;
    this.publicKey = null;
    this.address = null;
    return true;
  }

  private hash(v) {
    return createHash('sha512').update(v).digest('hex');
  }

  public async sendData(action, value) {
    // Encode the payload

    const payload = this.getEncodedData(action, value, this.station_name);
    if(action == 'vote')
      this.createAddress(this.station_name);
    else(action == 'voterState')
      this.createAddress(value);
    const transactionsList = this.getTransactionsList(payload);
    const batchList = this.getBatchList(transactionsList);

    // Send the batch to REST API
    await this.sendToRestAPI(batchList)
      .then((resp) => {
        console.log("response here", resp);
      })
      .catch((error) => {
        console.log("error here", error);
      })
  }

  public async sendToRestAPI(batchListBytes): Promise<any> {
    if (batchListBytes == null) {
      return this.getState(this.address)
        .then((response) => {
          return response.json();
        })
        .then((responseJson) => {
          return this.getDecodedData(responseJson)
        })
        .catch((error) => {
          console.error(error);
        });
    }
    else {
      console.log("new code");
      return this.postBatchList(batchListBytes)
    }
  }

  // Get state of address from rest api
  private async getState(address): Promise<any> {
    const getStateURL = this.REST_API_BASE_URL + '/state/' + address;
    const fetchOptions = { method: 'GET' };
    return window.fetch(getStateURL, fetchOptions);
  }

  // Post batch list to rest api
  private postBatchList(batchListBytes): Promise<any> {
    const postBatchListURL = this.REST_API_BASE_URL + '/batches';
    const fetchOptions = {
      method: 'POST',
      body: batchListBytes,
      headers: {
        'Content-Type': 'application/octet-stream'
      }
    }
    return window.fetch(postBatchListURL, fetchOptions);
  }


  private getEncodedData(action,value,station_name): any {
    let data : any;
    if(action == 'vote'){
      data = action + "," + value + "," +station_name;
    }
    else{
      data = action + "," + value;
    }
    console.log("the data:",data)
    return new TextEncoder('utf8').encode(data);
  }

  private getDecodedData(responseJSON): string {
    const dataBytes = responseJSON.data;
    const decodedData = new Buffer(dataBytes, 'base64').toString();
    return decodedData;
  }

  /*---Signing & Addressing-------------------------*/
  private setCurrentTransactor(pkInput): boolean {
    try {
      const context = createContext('secp256k1');
      const secp256k1pk = this.getSecp256k1pk(pkInput);

      this.signer = this.getSignerInstanceForPrivateKey(context, secp256k1pk);
      this.publicKey = this.getPublicKeyAsHex(this.signer);
      this.address = this.getAddressOfCurrentUser(this.FAMILY_NAME, this.publicKey);
    }
    catch (e) {
      console.log("Error in reading the key details", e);
      return false;
    }
    return true;
  }

  private getSecp256k1pk(pkInput: String): Secp256k1PrivateKey {
    let secp256k1pk;
    if(typeof(pkInput) == typeof(ArrayBuffer)) {
      secp256k1pk = new Secp256k1PrivateKey(Buffer.from(pkInput, 0, 32));
    } else if(typeof(pkInput) == typeof(String)) {
      secp256k1pk = new Secp256k1PrivateKey().fromHex(pkInput);
    }
    return secp256k1pk;
  }

  private getSignerInstanceForPrivateKey(context, secp256k1pk): any {
    return new CryptoFactory(context).newSigner(secp256k1pk);
  }

  private getPublicKeyAsHex(signer): any {
    return signer.getPublicKey().asHex();
  }

  private getAddressOfCurrentUser(familyName, publicKey): any {
    let nameSpace = this.hash(familyName).substr(0, 6);
    let publicKeySpace = this.hash(publicKey).substr(0, 64);
    return (nameSpace + publicKeySpace);
  }

  /*------------------------------------*/

  /*-------------Creating transactions & batches--------------------*/
  private getTransactionsList(payload): any {
    // Create transaction header
    const transactionHeader = this.getTransactionHeaderBytes([this.address], [this.address], payload);
    // Create transaction
    const transaction = this.getTransaction(transactionHeader, payload);
    // Transaction list
    const transactionsList = [transaction];

    return transactionsList
  }

  private getBatchList(transactionsList): any {
    // List of transaction signatures
    const transactionSignatureList = transactionsList.map((tx) => tx.headerSignature);

    // Create batch header
    const batchHeader = this.getBatchHeaderBytes(transactionSignatureList);
    // Create the batch
    const batch = this.getBatch(batchHeader, transactionsList);
    // Batch List
    const batchList = this.getBatchListBytes([batch]);

    return batchList;
  }

  private getTransactionHeaderBytes(inputAddressList, outputAddressList, payload): any {
    const transactionHeaderBytes = protobuf.TransactionHeader.encode({
      familyName: this.FAMILY_NAME,
      familyVersion: this.FAMILY_VERSION,
      inputs: inputAddressList,
      outputs: outputAddressList,
      signerPublicKey: this.publicKey,
      batcherPublicKey: this.publicKey,
      dependencies: [],
      payloadSha512: this.hash(payload),
      nonce: (Math.random() * 1000).toString()
    }).finish();

    return transactionHeaderBytes;
  }

  private getTransaction(transactionHeaderBytes, payloadBytes): any {
    const transaction = protobuf.Transaction.create({
      header: transactionHeaderBytes,
      headerSignature: this.signer.sign(transactionHeaderBytes),
      payload: payloadBytes
    });

    return transaction;
  }

  private getBatchHeaderBytes(transactionSignaturesList): any {
    const batchHeader = protobuf.BatchHeader.encode({
      signerPublicKey: this.publicKey,
      transactionIds: transactionSignaturesList
    }).finish();

    return batchHeader;
  }

  private getBatch(batchHeaderBytes, transactionsList): any {
    const batch = protobuf.Batch.create({
      header: batchHeaderBytes,
      headerSignature: this.signer.sign(batchHeaderBytes),
      transactions: transactionsList
    });

    return batch;
  }

  private getBatchListBytes(batchesList): any {
    const batchListBytes = protobuf.BatchList.encode({
      batches: batchesList
    }).finish();

    return batchListBytes;
  }
  public test(){
    console.log("test works!!!");
  }

  
}
