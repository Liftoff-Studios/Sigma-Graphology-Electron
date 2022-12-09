const {app, BrowserWindow, ipcMain} = require('electron')
const path = require('path')
var neo4j = require('neo4j-driver');
let Graph = require("graphology")
var {cypherToGraph} = require("graphology-neo4j")

const createWindow = () => {
  const win = new BrowserWindow({
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

  console.log(graph.export())
  return JSON.stringify(graph.export());
} 

ipcMain.on('giveData', async(event, arg) => {
  let duh = await getData(arg[0],arg[1],arg[2],arg[3])
  event.reply('gotData', duh)
})