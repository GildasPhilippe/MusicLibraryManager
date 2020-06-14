const {app, BrowserWindow, ipcMain} = require('electron')
const path = require('path')
const fs = require('fs');
const lineByLine = require('n-readlines');
const mm = require('music-metadata');
const ID3Writer = require('browser-id3-writer');

const audioFormats = [".wav", ".mp3"];
const categoriesPath = "static/categories.txt";
const categories = readCategories();


// APP SETINGS

let mainWindow;
function createWindow () {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: true
    }
  })
  mainWindow.loadFile('index.html')
}
app.whenReady().then(() => {
  createWindow()
  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
  sendCategories();
})
app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') app.quit()
})


// LOAD DATA

ipcMain.on('source:updateFolder', function(e, fold){
  songs = getAllSongs(fold);
  if(songs.length>0) getMetadata(songs);
});

function getAllSongs(folder){
  let allFiles = [];
  let files = fs.readdirSync(folder);
  files.forEach(function(fname){
    fullFname = path.join(folder, fname);
    if(fs.lstatSync(fullFname).isDirectory()){
      allFiles = allFiles.concat(getAllSongs(fullFname));
    }
    else{
      if(audioFormats.includes(fname.substr(fname.length-4, fname.length))){
        allFiles.push({
          "fname": fname,
          "path": fullFname
        });
      }
    }
  });
  return allFiles;
}

async function getMetadata(songs){
  let songsData = [];
  for (const song of songs){
    let fname = song["path"];
    const metadata = await mm.parseFile(fname);
    song["artist"] = metadata.common.artist;
    song["title"] = metadata.common.title;
    song["picture"] = metadata.common.picture;
    if(song["artist"]==undefined){
      song["artist"] = "";
    } if(song["title"]==undefined){
      song["title"] = "";
    }
    songsData.push(song);
  }
  mainWindow.webContents.send('source:load', songsData);
}


// WRITE DATA

function writeMetadata(){
  let fname_in = 'static/songs/Cee-Roo\ -\ Moses.mp3';
  let img_name_in = 'static/img/u2.jpg';
  let fname_out = 'static/songs/Me - My\ song.mp3'
  
  const songBuffer = fs.readFileSync(fname_in);
  const coverBuffer = fs.readFileSync(img_name_in);
  const writer = new ID3Writer(songBuffer);
  writer.setFrame('TIT2', 'My new song')
        .setFrame('TPE1', ['Me'])
        .setFrame('TALB', 'EP88')
        .setFrame('TYER', 2017)
        /*.setFrame('APIC', {
            type: 3,
            description: 'Super picture'
        })*/;
  writer.addTag();
  
  const taggedSongBuffer = Buffer.from(writer.arrayBuffer);
  fs.writeFileSync(fname_out, taggedSongBuffer);
}


// CATEGORIES MANAGEMENT

ipcMain.on('category:get', function(e, category){
  mainWindow.webContents.send('category:get', categories);
});

ipcMain.on('category:add', function(e, category){
  if(!categories.includes(category)){
    categories.push(category);
    let data = categories.join("\n")+"\n";
    fs.writeFile(categoriesPath, data, callback=function(){});
    sendUpdatedCategories();
  }
});

ipcMain.on('category:remove', function(e, category){
  if(categories.includes(category)){
    const index = categories.indexOf(category);
    if (index > -1) categories.splice(index, 1);
    let data = categories.join("\n")+"\n";
    fs.writeFile(categoriesPath, data, callback=function(){});
    sendUpdatedCategories();
  }
});

function sendUpdatedCategories(){
  mainWindow.webContents.send('category:update', categories);
}

function readCategories(){
  const liner = new lineByLine(categoriesPath);
  let categories = [];
  let line;
  while (line = liner.next()) categories.push(line.toString('utf8'));
  return categories;
}
