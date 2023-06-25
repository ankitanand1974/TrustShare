import React, { Component } from "react";
import {
  BrowserRouter as Router,
  Switch,
  Route,
  HashRouter,
} from "react-router-dom";

import Web3 from "web3";
import OurStorageDapp from "./abis/OurStorageDapp.json";

import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap-icons/font/bootstrap-icons.css";

import "./components/App.css";
import Navbar from "./components/Navbar";
import Main from "./components/Main";
import UploadFile from "./components/UploadFile";
import NotConnected from "./components/NotConnected";
import { ethers } from "ethers";

const _ipfsClient = require("ipfs-http-client");
const projectId = "2O90tZzocnBNd2ZdCSTHQV7m8TE";
const projectSecret = "403dc5b56b8383268dc24ae961e57771";
const auth =
  "Basic " + Buffer.from(projectId + ":" + projectSecret).toString("base64");

const ipfsClient = () => {
  const ipfs = (0, _ipfsClient.create)({
    host: "ipfs.infura.io",
    port: 5001,
    protocol: "https",
    headers: {
      authorization: auth,
    },
  });
  return ipfs;
};

class App extends Component {
  async componentWillMount() {
    await this.loadWeb3();
  }
  async loadWeb3() {
    if (window.ethereum) {
      window.web3 = new Web3(window.ethereum);

      this.loadBlockchainData();
    } else {
      this.setState({ connected: false });
    }
  }

  async loadBlockchainData() {
    const web3 = new Web3(window.ethereum);

    const accounts = await window.ethereum.request({
      method: "eth_requestAccounts",
    });
    const account = accounts[0];
    web3.eth.defaultAccount = accounts[0];
    this.setState({ account: accounts[0] });

    const networkId = await web3.eth.net.getId();
    const ourStorageData = OurStorageDapp.networks[networkId];
    console.log(ourStorageData, "HELLO THIS IS TEST")

    if (ourStorageData) {
      const ourStorageDapp = web3.eth.Contract(
        OurStorageDapp.abi,
        "0x711f2f5cAC3e0273cEA1a3D5AE597Eda3bb2D4ac"
      );
      console.log(ourStorageData, "HELLO THIS IS TEST 2")
      this.setState({ ourStorageDapp });
      await this.loadMyAllFiles();
      this.setState({ loading: false });
    } else {
      this.setState({ connected: false });
    }
  }

  async loadMyAllFiles() {
    this.setState({
      allFiles: [],
    });
    const totalFilesCount = await this.state.ourStorageDapp.methods
      .getTotalFileCount()
      
      .call();
      console.log(totalFilesCount, "HELLO THIS IS TEST 3")

    for (let i = totalFilesCount; i >= 1; i--) {
      let file = await this.state.ourStorageDapp.methods.getFileOf(i).call();
      if (file.fileName != "0deleted_") {
        this.setState({
          allFiles: [...this.state.allFiles, file],
        });
      }
    }
  }

  async deleteFile(_id) {
    this.setState({
      loading: true,
    });
    this.state.ourStorageDapp.methods
      .deleteFile(_id)
      .send({ from: this.state.account })
      .on("transactionHash", (hash) => {
        console.log("transactionHash", hash);
      })
      .on("receipt", (receipt) => {})
      .on("confirmation", async (confirmationNumber, receipt) => {
        await this.loadMyAllFiles();
        this.setState({
          loading: false,
        });
      })
      .on("error", (error, receipt) => {
        console.log("error", error);
        console.log("receipt", receipt);
      });
  }

  async captureFile(event) {
    event.preventDefault();
    const file = event.target.files[0];
    const reader = new window.FileReader();
    reader.readAsArrayBuffer(file);
    reader.onloadend = () => {
      this.setState({
        buffer: Buffer(reader.result),
        fileType: file.type,
      });
      this.setValues(file.name, this.convertBytes(file.size));
    };
  }
  async setValues(_name, _size) {
    const fileNameBox = document.getElementById("fileNameBox");
    const fileTypeBox = document.getElementById("fileTypeBox");
    const fileSizeBox = document.getElementById("fileSizeBox");

    fileNameBox.value = _name;
    fileTypeBox.value = this.state.fileType;
    fileSizeBox.value = _size;
    this.setState({ showFileDetails: true });
  }

  async uploadFile(_name, _des) {
    try {
      this.setState({ loading: true });
      const web3 = new Web3(window.ethereum);
      const {ethereum} = window
      if(ethereum){
        const networkId = await web3.eth.net.getId();
        const ourStorageData = OurStorageDapp.networks[networkId];
        const ipfs = ipfsClient();
        let result = await ipfs.add(this.state.buffer)
        const provider = new ethers.providers.Web3Provider(ethereum);
        const signer = provider.getSigner()
        const contract = new ethers.Contract("0x711f2f5cAC3e0273cEA1a3D5AE597Eda3bb2D4ac", OurStorageDapp.abi, signer);
        let txn = await contract.uploadFile(
          result.path,
          result.size,
          this.state.fileType,
          _name,
          _des
        )
        
        console.log("please wait")
        await txn.wait();
        
      }
      else{
        console.log("ethereum not found")
      }
      
    } catch(err){
      console.log(err)
    }
  }

  convertBytes(bytes) {
    var sizes = ["Bytes", "KB", "MB", "GB", "TB"];
    if (bytes === 0) return "0 Byte";
    var i = parseInt(Math.floor(Math.log(bytes) / Math.log(1024)));
    return Math.round(bytes / Math.pow(1024, i), 2) + " " + sizes[i];
  }

  constructor(props) {
    super(props);
    this.state = {
      account: "",
      ourStorageDapp: null,
      postCount: 0,
      allFiles: [],
      buffer: "",
      fileType: "",
      showFileDetails: false,
      loading: true,
      connected: true,
    };
    this.uploadFile = this.uploadFile.bind(this);
    this.captureFile = this.captureFile.bind(this);
    this.deleteFile = this.deleteFile.bind(this);
  }

  render() {
    return (
      // <Router>

      <HashRouter>
        <div className="">
          {this.state.connected ? (
            <>
              <Navbar
                account={this.state.account}
                userProfile={this.state.userProfile}
              />
              {this.state.loading ? (
                <div className="text-center m-5">
                  <div
                    className="spinner-border bg-light m-auto"
                    role="status"
                  ></div>
                </div>
              ) : (
                <Switch>
                  <Route path="/" exact>
                    <Main
                      account={this.state.account}
                      allFiles={this.state.allFiles}
                      deleteFile={this.deleteFile}
                      showDeletedFiles={this.state.showDeletedFiles}
                    />
                  </Route>

                  <Route path="/uploadfiles" exact>
                    <UploadFile
                      account={this.state.account}
                      uploadFile={this.uploadFile}
                      captureFile={this.captureFile}
                      showFileDetails={this.state.showFileDetails}
                    />
                  </Route>
                </Switch>
              )}
            </>
          ) : (
            <NotConnected />
          )}
        </div>

        {/* </Router> */}
      </HashRouter> //for github pages
    );
  }
}

export default App;
