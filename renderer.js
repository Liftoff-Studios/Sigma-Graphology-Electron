// You can also put expose this code to the renderer
// process with the `contextBridge` API
var neo4j = require('neo4j-driver');
let {Sigma} = require("sigma")
let Graph = require("graphology")
let {ipcRenderer} = require("electron")
let {random} = require("graphology-layout")


ipcRenderer.on('gotData', (_event, arg) => {
  let foo = new Graph();
  foo.import(JSON.parse(arg));
  random.assign(foo)
  let duh = new Sigma(foo,document.getElementById("root"));
  console.log(duh)
})




function getData(url, username, password, query){
    ipcRenderer.send('giveData', [url,username,password,query])
}

function submitForm(){
        let url = document.getElementById("db_url").value;
        let username = document.getElementById("username").value;
        let password = document.getElementById("password").value;
        let query = document.getElementById("query").value;
        getData(url,username,password,query)
}
