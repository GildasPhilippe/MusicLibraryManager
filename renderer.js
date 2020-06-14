
const ipc = require('electron').ipcRenderer;
const tbody = document.querySelector('#songList tbody');
const categoriesUl = document.querySelector('#categoriesModalContent ul');
let categoriesList;
let fold = 'static/songs';

// SETTING UP

document.addEventListener('DOMContentLoaded', function() {
  var modals = document.querySelectorAll('.modal');
  var modalInstances = M.Modal.init(modals, "");
});
window.onload = function(){
  ipc.send('category:get', '');
}

// LOAD DATA

load.addEventListener('click', function(){
  sourceInput.click()
})
sourceInput.addEventListener('change', function(e, sour){
  let folder = getFolder(sourceInput);
  tbody.innerHTML = `
    <tr>
      <td colspan="6" class="progress-td">
        <div class="progress"><div class="indeterminate"></div></div>
      </td>
    </tr>
  `;
  if(folder.length > 0) ipc.send('source:updateFolder', folder);
});
ipc.on('source:load', function (event, songs) {
  tbody.innerHTML = '';
  songs.forEach(song => addRow(song));
  initializeCategorySelect();
})

function getFolder(fileInput){
  let path = '';
  if(fileInput.files.length > 0){
    let file = fileInput.files[0]
    path = file.path.substr(0, file.path.length - file.name.length);
  }
  return path;
}

function addRow(song){
  const tr = document.createElement('tr');
  const tdIcon = document.createElement('td');
  tdIcon.classList.add('iconCell')
  if(song['picture'] != undefined){
    const cover = document.createElement('img');
    let picture = song['picture'][0];
    cover.setAttribute('src', `data:${picture.format};base64,${btoa(Uint8ToString(picture.data))}`);
    cover.setAttribute('class', 'cover responsive-img');
    tdIcon.appendChild(cover);
  }
  tr.appendChild(tdIcon);
  for(const field of ['fname', 'artist', 'title']){
    const td = document.createElement('td');
    td.innerHTML = song[field];
    tr.appendChild(td);
  }
  const tdSelect = document.createElement('td');
  const divSelect = document.createElement('div');
  const select = document.createElement('select');
  select.innerHTML = '<option value="" disabled selected></option>';
  select.classList.add("category-select")
  categoriesList.forEach(category => select.appendChild(makeOption(category)));
  divSelect.classList.add('input-field');
  divSelect.appendChild(select);
  tdSelect.appendChild(divSelect);
  tr.appendChild(tdSelect);
  tr.innerHTML += '<td><label><input type="checkbox" class="filled-in" checked="checked"/><span></span></label></td>'
  tbody.appendChild(tr);
}

function Uint8ToString(u8a){
  var CHUNK_SZ = 0x8000;
  var c = [];
  for (var i=0; i < u8a.length; i+=CHUNK_SZ) {
    c.push(String.fromCharCode.apply(null, u8a.subarray(i, i+CHUNK_SZ)));
  }
  return c.join('');
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

newCategoryForm.addEventListener('submit', function(event){
  event.preventDefault();
  addCategory();
})

function addCategory(){
  let category = newCategoryInput.value;
  newCategoryInput.value = '';
  displayCategory(category);
  ipc.send('category:add', category);
  let selects = document.getElementsByClassName('category-select');
  for(const select of selects){
    select.appendChild(makeOption(category));
  }
  initializeCategorySelect();
}

function displayCategory(category){
  const li = document.createElement('li');
  li.classList.add('collection-item');
  li.innerHTML = `<div>${category}<a href="#!" class="secondary-content remove-category">Remove</a></div>`;
  li.querySelector('.remove-category').addEventListener('click', function(){
    removeCategory(category, li);
  })
  categoriesUl.appendChild(li);
}

function removeCategory(category, li){
  li.remove();
  ipc.send('category:remove', category);
  let selects = document.getElementsByClassName('category-select');
  if(selects.length > 0){
    for(const select of selects){
      if(select.children != undefined && select.children.length > 0){
        let children = select.children;
        for (var i = 0; i < children.length; i++) {
          let child = children[i];
          if(child.value == category){
            select.removeChild(child);
            select.firstChild.selected = 'selected';
          }
        }
      }
    }
  initializeCategorySelect();
  }
}

function initializeCategorySelect(){
  var selects = document.querySelectorAll('select');
  var selectInstances = M.FormSelect.init(selects, '');
}

function makeOption(category){
  const opt = document.createElement('option');
  opt.value = category;
  opt.innerHTML = category;
  return opt;
}