
const ipc = require('electron').ipcRenderer;
const tbody = document.querySelector("#songList tbody");
const categoriesUl = document.querySelector("#categoriesModalContent ul");
let categoriesList;
let fold = 'static/songs';

// SETTING UP

document.addEventListener('DOMContentLoaded', function() {
  var elems = document.querySelectorAll('.modal');
  var instances = M.Modal.init(elems, "options");
});
window.onload = function(){
  ipc.send('category:get', "");
}

// LOAD DATA

load.addEventListener('click', function(){
  sourceInput.click()
})
sourceInput.addEventListener('change', function(e, sour){
  let folder = getFolder(sourceInput);
  if(folder.length > 0) ipc.send('source:updateFolder', folder);
});
ipc.on('source:load', function (event) {
  tbody.innerHTML = "";
  data.forEach(song => {
    addRow(song)
  });
})

function getFolder(fileInput){
  let path = "";
  if(fileInput.files.length > 0){
    let file = fileInput.files[0]
    path = file.path.substr(0, file.path.length - file.name.length);
  }
  return path;
}

function addRow(song){
  let row = `
    <td class="iconCell"></td>
    <td>${song["fname"]}</td>
    <td>${song["artist"]}</td>
    <td>${song["title"]}</td>
    <td></td>
    <td><label><input type="checkbox" class="filled-in" checked="checked"/><span></span></label></td>
  `;
  const tr = document.createElement('tr');
  tr.innerHTML = row;
  if(song["picture"] != undefined){
    const cover = document.createElement('img');
    let picture = song["picture"][0];
    cover.setAttribute("src", `data:${picture.format};base64,${btoa(Uint8ToString(picture.data))}`);
    cover.setAttribute("class", "cover responsive-img");
    tr.querySelector(".iconCell").appendChild(cover)
  }
  tbody.appendChild(tr);
}

function Uint8ToString(u8a){
  var CHUNK_SZ = 0x8000;
  var c = [];
  for (var i=0; i < u8a.length; i+=CHUNK_SZ) {
    c.push(String.fromCharCode.apply(null, u8a.subarray(i, i+CHUNK_SZ)));
  }
  return c.join("");
}

// WRITE DATE

destination.addEventListener('click', function(){
  destinationInput.click()
})

// CATEGORIES MANAGEMENT

ipc.on('category:get', function(event, categories){
  categoriesList = categories;
  categories.forEach(category => displayCategory(category))
})
ipc.on('category:update', function(event, categories){
  categoriesList = categories;
})

newCategoryForm.addEventListener("submit", function(event){
  event.preventDefault();
  let category = newCategoryInput.value;
  newCategoryInput.value = "";
  displayCategory(category);
  ipc.send('category:add', category);
})

function displayCategory(category){
  const li = document.createElement('li');
  li.classList.add('collection-item');
  li.innerHTML = `<div>${category}<a href="#!" class="secondary-content remove-category">Remove</a></div>`;
  li.querySelector('.remove-category').addEventListener("click", function(){
    removeCategory(category, li);
  })
  categoriesUl.appendChild(li);
}

function removeCategory(category, li){
  li.remove();
  ipc.send('category:remove', category);
}

