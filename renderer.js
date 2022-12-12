// You can also put expose this code to the renderer
// process with the `contextBridge` API
var neo4j = require('neo4j-driver');
let {Sigma} = require("sigma")
let {Graph, MultiGraph} = require("graphology")
let {ipcRenderer} = require("electron")
let {random} = require("graphology-layout")
let ForceSuperVisor = require("graphology-layout-force/worker")

var db_url = null;
var getNodeImageProgram = require("sigma/rendering/webgl/programs/node.image")
var username = null;
var password = null;

ipcRenderer.on('gotData', (_event, arg) => {
  let foo = new MultiGraph();
  let duh = JSON.parse(arg);

  console.log(duh)
  foo.import(duh);
  random.assign(foo)

  foo.nodes().forEach((node,i)=>{
    foo.setNodeAttribute(node, "type","image")
    foo.setNodeAttribute(node, "image","./server-icon.svg")
    foo.setNodeAttribute(node, "color","rgb(0, 204, 102)")
    foo.setNodeAttribute(node, "size","15")
    let name = foo.getNodeAttribute(node,"Name")
    foo.setNodeAttribute(node, "label",name)
  })

  foo.edges().forEach((edge,i)=>{
    foo.setEdgeAttribute(edge,"type","arrow");
    foo.setEdgeAttribute(edge,"size","2");
    let te = foo.getEdgeAttribute(edge,"@type");
    if(te=="LINK"){
      foo.setEdgeAttribute(edge,"color","rgb(0,0,0)");
    }else{
      foo.setEdgeAttribute(edge,"color","rgb(255,0,0)");
    }

    foo.setEdgeAttribute(edge,"label",te);

  })
  document.getElementById("root").remove()
  let mu = document.createElement("div")
  mu.id="root"

  document.body.appendChild(mu)


  let bruh = new Sigma(foo,document.getElementById("root"),{
    nodeProgramClasses: {
      image: getNodeImageProgram.default(),
      //border: NodeProgramBorder,
    },
    renderEdgeLabels:true,
  });
  let test =new ForceSuperVisor(bruh)
  test.start()
})

ipcRenderer.on("CSVDone",(_event,arg)=>{
  alert("CSV uploaded")
})

ipcRenderer.on("exec",()=>{
  window.alert("Command Executed")
})

function getData(url, username, password, query){
    ipcRenderer.send('giveData', [url,username,password,query])
}

function submitForm(){
  var url,user1,pass;
  //console.log(db_url==null,username==null,password==null)
  if(db_url==null&&username==null&password==null){
    url = document.getElementById("db_url").value;
    user1 = document.getElementById("username").value;
    pass = document.getElementById("password").value;
    let query = document.getElementById("query").value;
    getData(url,user1,pass,query)
    return true;
  }else{
    let query = document.getElementById("query").value;
    //console.log(url,user1,pass,query)
    getData(db_url,username,password,query)
  }
  
}

function setVars(){
  db_url = document.getElementById("db_url").value;
  username = document.getElementById("username").value;
  password = document.getElementById("password").value;
  alert("Values Set")
}

function openFilePicker(){
  var url,user1,pass;
  //console.log(db_url==null,username==null,password==null)
  if(db_url==null&&username==null&password==null){
    url = document.getElementById("db_url").value;
    user1 = document.getElementById("username").value;
    pass = document.getElementById("password").value;
    let query = document.getElementById("query").value;
    ipcRenderer.send("openTheGates",[url,user1,pass])
    return true;
  }else{
    let query = document.getElementById("query").value;
    //console.log(url,user1,pass,query)
    getData(db_url,username,password,query)
    ipcRenderer.send("openTheGates",[db_url,username,password])
  }
}