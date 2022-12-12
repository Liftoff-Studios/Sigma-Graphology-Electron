const {app, BrowserWindow, ipcMain, dialog} = require('electron')
const path = require('path')
var neo4j = require('neo4j-driver');
let Graph = require("graphology")
var {cypherToGraph} = require("graphology-neo4j")
var unzipper = require("unzipper")
let fs = require("fs")

var win;
const createWindow = () => {
   win = new BrowserWindow({
    webPreferences: {
      nodeIntegration:true,
      contextIsolation: false,
    }
  })

  win.loadFile('index.html')
}

app.whenReady().then(() => {
  ipcMain.handle('getThoseData', getData)
  createWindow()
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})

async function getData(url,username,password,query){
  //let graph = { nodes:[], edges:[]} ;
  let writeKeyWords = ["create","delete","load"]
  if(query.toLowerCase().includes(writeKeyWords[0])||query.toLowerCase().includes(writeKeyWords[1])||query.toLowerCase().includes(writeKeyWords[2])){
    let guh = await execWrite(url,username,password,query);
    return "Command executed"
  }

  var driver = await neo4j.driver(
    url,
    neo4j.auth.basic(username,password)
  )
  let graph = await cypherToGraph({driver},query);
  /*
  var session = driver.session()

  let duh = await session.run(query);

  session.close();
  console.log(duh.records)
  // Close the driver when application exits.
  // This closes all used network connections.
  await driver.close()
*/

  console.log(JSON.stringify(graph.export()))
  return JSON.stringify(graph.export());
} 

async function execWrite(url,username,password,query){
  var driver = await neo4j.driver(
    url,
    neo4j.auth.basic(username,password)
    )

  var session = driver.session({ defaultAccessMode: neo4j.session.WRITE })
  let duh = await session.run(query);
  session.close()
  await driver.close();
}


ipcMain.on('giveData', async(event, arg) => {
  let duh = await getData(arg[0],arg[1],arg[2],arg[3])
  if(duh=="Command executed"){
    event.reply("exec")
  }
  event.reply('gotData', duh)
})

ipcMain.on("openTheGates", async(event,arg)=>{
  let foo = uploadCSV(arg[0],arg[1],arg[2],(d)=>{
    if(d=="successful"){
    console.log("Replied")
    event.reply("CSVDone")
  }
  });
  
})

async function uploadCSV(url,username,password,g){
  dialog.showOpenDialog(win, {
  title:"Select the Zip files",
  filters: [
    {name: '.ZIP Files', extensions: ['zip']},
    {name: 'All Files', extensions: ['*']}
  ]
  }).then(async(result) => {
    if(result.canceled || result==undefined){

      return;
    }
    

    let ghd = await unzipFiles(result.filePaths[0] ,url,username,password,(sr)=>{
      if(sr="successful"){
        g("successful")
      }
    });
    
    //console.log(result.filePaths)
  })
}

async function unzipFiles(path,url,username,password,test){
  let onetwo = false;
  fs.createReadStream(path).pipe(unzipper.Extract({path:path.replace(".zip","")})).on("close",()=>{
    fs.readFile(path.replace(".zip","")+"\\nodes.txt", async(err,data)=>{
    if(err){
      console.log(err,"er")
      return;
    }

    //console.log(data)
    let array = data.toString().split("\n")
    var driver = await neo4j.driver(
    url,
    neo4j.auth.basic(username,password)
    )

    var session = driver.session({ defaultAccessMode: neo4j.session.WRITE })
    for(let i=0;i<array.length;i++){
      let bruh = array[i].split(",");
      await session.run(`CREATE (:Server {ServerId: toInteger("${bruh[0]}"), Name:"${bruh[1]}", Version:"${bruh[2]}"});`)
      console.log("uploading1")
    }

    



    fs.readFile(path.replace(".zip","")+"\\links.txt", async(err,data)=>{
    if(err){
      console.log(err,"er")
      return;
    }

    //console.log(data)
    let array = data.toString().split("\n")
    

    
    for(let i=0;i<array.length;i++){
      let bruh = array[i].split(",");
      await session.run(`
MATCH (p1:Server {ServerId: toInteger("${bruh[0]}")}), (p2:Server {ServerId: toInteger("${bruh[1]}")})
WHERE toInteger("${bruh[3]}")=0
CREATE (p1)-[:LINK {User: "${bruh[2]}", Sysadmin: "${bruh[3]}"}]->(p2);`)
      console.log("uploading2")
    }

    for(let i=0;i<array.length;i++){
      let bruh = array[i].split(",");
      await session.run(`
MATCH (p1:Server {ServerId: toInteger("${bruh[0]}")}), (p2:Server {ServerId: toInteger("${bruh[1]}")})
WHERE toInteger("${bruh[3]}")=1
CREATE (p1)-[:LINKADMIN {User: "${bruh[2]}", Sysadmin: "${bruh[3]}"}]->(p2);`)
      console.log("uploading3")
    }
    console.log("fee")

    session.close()
    await driver.close();

    test("successful")
    
  })

  })
  });
  
  
}