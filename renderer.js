
const ipc = require('electron').ipcRenderer;
const tbody = document.querySelector('#songList tbody');
const categoriesUl = document.querySelector('#categoriesModalContent ul');
let categoriesList;
let fold = 'static/songs';
let modalInstances;
let tabsInstance;

// SETTING UP

document.addEventListener('DOMContentLoaded', function() {
  var modals = document.querySelectorAll('.modal');
  modalInstances = M.Modal.init(modals, "");
  tabsInstance = M.Tabs.init(tabs, "");
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
  if(folder.length > 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="6" class="progress-td">
          <div class="progress"><div class="indeterminate"></div></div>
        </td>
      </tr>
    `;
    ipc.send('source:load', folder);
  }
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
    let dataPicture = btoa(Uint8ToString(picture.data));
    cover.setAttribute('src', `data:${picture.format};base64,${dataPicture}`);
    cover.setAttribute('class', 'cover responsive-img');
    cover.setAttribute('data-picture', dataPicture)
    tdIcon.appendChild(cover);
  }
  tr.appendChild(tdIcon);

  const tdFname = document.createElement('td');
  let ext = song['fname'].split('.');
  ext = ext[ext.length-1];
  let fname;
  if(song['artist'].length>0 && song['title'].length>0) fname = `${song['artist']} - ${song['title']}.${ext}`;
  else fname = song['fname'];
  tdFname.innerHTML = fname;
  tdFname.classList.add(`data-fname`);
  tdFname.setAttribute('data-ext', ext)
  tr.appendChild(tdFname)

  for(const field of ['artist', 'title']){
    const td = document.createElement('td');
    td.innerHTML = `<input value="${song[field]}" class="data-${field}" type="text">`;
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
  tr.innerHTML += '<td><label><input type="checkbox" class="filled-in process-checkbox" checked="checked"/><span></span></label></td>'
  
  tr.classList.add('song-row')
  tr.setAttribute("data-source", song["path"])
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
  if(category.length > 0){
    newCategoryInput.value = '';
    displayCategory(category);
    ipc.send('category:add', category);
    let selects = document.getElementsByClassName('category-select');
    for(const select of selects){
      select.appendChild(makeOption(category));
    }
    initializeCategorySelect();
  }
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
            if(select.value == category) select.firstChild.selected = 'selected';
            select.removeChild(child);
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
  document.querySelectorAll(".data-artist").forEach(input => setUpdateFnameListener(input));
  document.querySelectorAll(".data-title").forEach(input => setUpdateFnameListener(input));
}

function makeOption(category){
  const opt = document.createElement('option');
  opt.value = category;
  opt.innerHTML = category;
  return opt;
}

// METADATA MANAGEMENT

function setUpdateFnameListener(input){
  input.addEventListener("input", function(){
    if(input.value.length > 0){
      let parent = input.parentNode.parentNode;
      let artist = parent.getElementsByClassName('data-artist')[0].value;
      let title = parent.getElementsByClassName('data-title')[0].value;
      let fname = parent.getElementsByClassName('data-fname')[0];
      if(artist.length > 0 && title.length > 0)
        fname.innerHTML = `${artist} - ${title}.${fname.getAttribute('data-ext')}`;
    }
  })
}

// WRITE DATE

compute.addEventListener('click', function(){
  destinationInput.click();
});

destinationInput.addEventListener('change', function(){
  let folder = getFolder(destinationInput);
  let rows = document.getElementsByClassName('song-row');
  if(folder.length > 0 && rows.length > 0){
    let songsData = getSongsData(rows);
    ipc.send('compute:run', {destination: folder, songsData: songsData});
  }
});

ipc.on('compute:start', function(event, data){
  footer.style.display = "block";
});

ipc.on('compute:run', function(event, percentage){
  computingProgress.style.width = `${percentage}%`;
  computingProgressPercentage.innerHTML = `${percentage}%`;
});

ipc.on('compute:end', function(event, data){
  modalInstances[1].open();
  footer.style.display = 'none';
  failureTab.innerHTML = data["failure"].join("<br>");
  successTab.innerHTML = data["success"].join("<br>");
  tabsInstance.select('failureTab');
});

function getSongsData(rows){
  data = [];
  for (const row of rows){
    if(row.querySelector(".process-checkbox").checked){
      let source = row.getAttribute("data-source");
      let fname = row.querySelector(".data-fname").innerHTML;
      let artist = row.querySelector(".data-artist").value;
      let title = row.querySelector(".data-title").value;
      let category = row.querySelector(".category-select").value
      let picture;
      if(row.firstElementChild.firstElementChild) 
        picture = row.querySelector(".cover").getAttribute("data-picture");
      else picture = "";
      data.push({
        source: source,
        fname: fname,
        artist: artist,
        title: title,
        category: category,
        picture: picture
      });
    }
  }
  return data;
}