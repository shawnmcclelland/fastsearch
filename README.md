# Fast, client side search and navigation for Hugo

This is a fork, of a fork building upon Craig Mod's [fast search](https://gist.github.com/cmod/5410eae147e4318164258742dd053993) and the original work from [Eddie Webb's search](https://gist.github.com/eddiewebb/735feb48f50f0ddd65ae5606a1cb41ae) and [Matthew Daly's search explorations](https://matthewdaly.co.uk/blog/2019/02/20/searching-content-with-fuse-dot-js/)

Inspired by the work of Paco Coursey and Rauno Frieberg with their [CmdK](https://cmdk.paco.me) for React, I wanted to design and build a hybrid of both systems. This version is built for the Hugo static site generator but you could probably adapt it to any Fuse-based fuzzy search library.

Core dependencies are TailwindCSS and FuseJS. TailwindCSS purely because that's what I use on my personal site and FuseJS because it was the easiest and simplest for me to integrate.

To see it in action, go to [shawnmcclelland.com](https://www.shawnmcclelland.com) and click on the `⌘` icon or press `CMD+K`/`CTRL+K` and start typing.

The design file can also be found as part of my Hej design system in [Figma](https://www.figma.com/design/3zAVI0i6aRZqqWS3ptDvuj/Fast-Search?node-id=1%3A196&t=pIyrirnniY3SNrL7-1)

# Why?

Well, quite simply, I wanted a side project to mess around with. I was redesigning my site anyways and knew I would have a lot of content that should be searchable. At the same time, I love the design of apps like Linear, Raycast, and Vercel that have simplified complex command structures into a simple command palette interface.

The core principles of this project were:
- Just enough design and keep the architecture as simple as possible. Minimal dependencies.
- Deliver a fast and delightful user experience. No additional page bloat. Load and delivery on-demand only.
- Quick and easy access from the keyboard. Load, search, navigate all at your fingertips.

## User Experience

To test it out, head to [shawnmcclelland.com](https://www.shawnmcclelland.com) and try the following:

- Press `CMD+K` if you're on a Mac or `CTRL+K` if you're on Windows/Linux. If you're on mobile or just want to use a mouse, click the `⌘` icon.
- Start typing in your search query.
- Use the `up`/`down` arrows to pick-walk and select a result.
- Press `enter` to navigate

## Setup

1. Create an `index.json` file to your `layouts/default` folder.
2. Formatting of the index can be done with the following in `index.json`:
3. Add JSON as an additional output format in `config.toml` or `config.yaml`
4. Add `fastsearch.js` and `fuse.js` (download from [fusejs.io](https://fusejs.io/) to `assets/js/`)
5. Add `fastsearch.html` to `layouts/partials/`.
6. Add the `{{- partial "fastsearch.html" . -}}` to `layouts/_default/baseof.html`
7. Add `fastsearch.css` to `assets/css/`

# Files

## layouts/_default/baseof.html

Add the fastsearch partial to your `baseof.html`, before your footer.

```html
{{ if ne .Page.Kind "404" }}
    {{- partial "fastsearch.html" . -}}
    {{- partial "footer.html" . -}}
{{ end }}
```

## assets/js/fastsearch.js

Builds the search engine based on the `index.json` file and handles keyboard input.

```javascript
var fuse; // holds our search engine
var searchVisible = false; 
var firstRun = true; // allow us to delay loading json data unless search activated
var list = document.getElementById('search-results'); // targets the <ul>
var first = list.firstChild; // first child of search list
var last = list.lastChild; // last child of search list
var maininput = document.getElementById('search-input'); // input box for search
var dialog = document.getElementById('search-dialog');
var kbar = document.getElementById("kbar")
var resultsAvailable = false; // Did we get any search results?
document.getElementById("results-header").style.display = "none"; //hide results header by default

function toggleSearch() {
  if(firstRun) {
    loadSearch();
    firstRun = false;
  }
  // Toggle visibility of search box
  if (!searchVisible) {
    document.getElementById("fast-search").style.visibility = "visible"; // show search box
    document.getElementById("search-input").focus(); // put focus in input box so you can just start typing
    searchVisible = true; // search visible
  }
  else {
    document.getElementById("fast-search").style.visibility = "hidden"; // hide search box
    searchVisible = false; // search not visible
  }
}

document.addEventListener('keydown', function(event) {

  // If search is not visible, allow the global hotkeys for navigation.
  if (!searchVisible) {
    // Contact via Email
    if ((window.event.ctrlKey || event.metaKey) && event.which === 67) {
      return;
    }
    if (event.which === 67) {
      window.location.href = "mailto:hi@shawnmcclelland.com";
    }

    // Go to Home
    if (event.which == 72) {
      window.location = "/";
    }

    // Go to Twitter
    if (event.which == 84) {
      window.open('https://twitter.com/gimballocked', '_blank').focus();
    }

    // Go to Github
    if (event.which == 71) {
      window.open('https://github.com/shawnmcclelland', '_blank').focus();
    }
  }

  // CMD-/ to show / hide Search
  if ((window.event.ctrlKey || event.metaKey) && event.which === 75) {
    toggleSearch();
  }

  if (event.keyCode == 27) {
    if (searchVisible) {
      toggleSearch();
    }
  }

  // DOWN (40) arrow
  if (event.keyCode == 40) {
    if (searchVisible && resultsAvailable) {
      event.preventDefault(); // stop window from scrolling
      if ( document.activeElement == maininput) { first.focus(); } // if the currently focused element is the main input --> focus the first <li>
      else if ( document.activeElement == last ) { last.focus(); } // if we're at the bottom, stay there
      else { document.activeElement.parentElement.nextSibling.firstElementChild.focus(); } // otherwise select the next search result
    }
  }

  // UP (38) arrow
  if (event.keyCode == 38) {
    if (searchVisible && resultsAvailable) {
      event.preventDefault(); // stop window from scrolling
      if ( document.activeElement == maininput) { maininput.focus(); } // If we're in the input box, do nothing
      else if ( document.activeElement == first) { maininput.focus(); } // If we're at the first item, go to input box
      else { document.activeElement.parentElement.previousSibling.firstElementChild.focus(); } // Otherwise, select the search result above the current active one
    }
  }
});


// ==========================================
// execute search as each character is typed
//
document.getElementById("search-input").onkeyup = function(e) { 
  executeSearch(this.value);
}


// ==========================================
// fetch some json without jquery
//
function fetchJSONFile(path, callback) {
  var httpRequest = new XMLHttpRequest();
  httpRequest.onreadystatechange = function() {
    if (httpRequest.readyState === 4) {
      if (httpRequest.status === 200) {
        var data = JSON.parse(httpRequest.responseText);
          if (callback) callback(data);
      }
    }
  };
  httpRequest.open('GET', path);
  httpRequest.send(); 
}


// ==========================================
// load our search index, only executed once
// on first call of search box (CMD-/)
//
function loadSearch() { 
  fetchJSONFile('/index.json', function(data){

    var options = { // fuse.js options; check fuse.js website for details
      shouldSort: true,
      location: 0,
      distance: 100,
      threshold: 0.4,
      minMatchCharLength: 2,
      keys: [
        'title',
        'permalink',
        'description'
        ]
    };
    fuse = new Fuse(data, options); // build the index from the json file
  });
}


// ==========================================
// using the index we loaded on CMD-/, run 
// a search query (for "term") every time a letter is typed
// in the search box
//
function executeSearch(term) {
  let results = fuse.search(term); // the actual query being run using fuse.js
  let searchitems = ''; // our results bucket

  if (results.length === 0) { // no results based on what was typed into the input box
    resultsAvailable = false;
    searchitems = '';
    document.getElementById("kbar-list").style.display = "inherit";
    document.getElementById("results-header").style.display = "none";
  } else { // build our html
    document.getElementById("kbar-list").style.display = "none";
    document.getElementById("results-header").style.display = "inherit";
    for (let item in results.slice(0,5)) { // only show first 5 results
      searchitems = searchitems + 
        '<li><a href="' + results[item].permalink + '" tabindex="0">' + 
        '<div class="flex items-center justify-between"><p class="text-base text-left font-semibold">' + results[item].title + '</p>' +
        '<p id="section" class="text-sm font-sans py-2 flex align-center w-max">'+ results[item].section + '</p></div></a></li>';
    }
    resultsAvailable = true;
  }

  document.getElementById("search-results").innerHTML = searchitems;
  if (results.length > 0) {
    first = list.firstChild.firstElementChild; // first result container — used for checking against keyboard up/down location
    last = list.lastChild.firstElementChild; // last result container — used for checking against keyboard up/down location
  }
}
```

## assets/css/fastsearch.css

Additional CSS styling is applied outside Tailwind... because `¯\_(ツ)_/¯`

```css
#fast-search { 
  visibility: hidden;
}

#search-dialog {
  position: fixed;
  margin: 10vh auto;
  top: 0;
  left: 50%;
  transform: translateX(-50%);
  z-index: 999;
  max-width: 90vw;
  width: 640px;
  overflow: auto;
}

#search-results li { 
  list-style: none; 
  background-color: var(--color-bg);
}

#search-results a { 
  text-decoration: none;
  max-width: 90vw;
  width: 100%;
  display: inline-block;
  padding: 10px;
}

#search-results #section {
  text-transform: capitalize;
}

#search-results a:hover, 
#search-results a:focus {   
  outline: 0;   
  background-color: var(--color-highlight);  
  color: var(--color-body);  
  border-radius: 6px;  
}

#list a { 
  text-decoration: none;
  max-width: 90vw;
  width: 100%;
  display: inline-block;
}

#list li > a:hover, li > a:focus { 
  outline: 0; 
  background-color: var(--color-highlight);
  color: var(--color-body);
  border-radius: 6px;
}
```

## layouts/_default/index.json

Get the pages we want and information from each page we want to store in `/index.json` at build time.

```
{{- $.Scratch.Add "index" slice -}}
{{- range where .Site.RegularPages "Type" "not in"  (slice "page" "json") -}}
    {{- $.Scratch.Add "index" (dict "title" .Title "date" (dateFormat "2006-01-02" .Date) "tags" .Params.tags "permalink" .Permalink "description" .Description "section" .Section) -}}
{{- end -}}
{{- $.Scratch.Get "index" | jsonify -}}
```

## layouts/partials/fastsearch.html

The main interface for it all. This requires TailwindCSS but I'm looking to build another versions sans-Tailwind. Additionally, I implemented icons for the initial menu items. The social ones are embedded SVG's but the menu items are pulled from the `config.yaml`.

```html
{{ with resources.Get "js/fastsearch.js" | fingerprint }}
<script async type="text/javascript" src="{{ .Permalink | relURL }}" integrity="{{ .Data.Integrity }}" crossorigin="anonymous"></script>
{{ end }}

{{ with resources.Get "js/fuse.js" | fingerprint }}
<script async type="text/javascript" src="{{ .Permalink | relURL }}" integrity="{{ .Data.Integrity }}" crossorigin="anonymous"></script>
{{ end }}

<div id="fast-search">
  <div id="search-dialog" class="shadow-2xl max-w-[640px] p-2 border border-grey-light rounded-md bg-bg">
    <div class="flex flex-row items-center border-solid border-grey-light border-b block box-border mb-2">
      <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M0 4.89545C0 5.56768 0.128241 6.20013 0.384723 6.79281C0.64119 7.38551 0.996109 7.90635 1.44948 8.35535C1.90285 8.80436 2.42746 9.15459 3.02332 9.40604C3.61917 9.65747 4.25907 9.78319 4.94301 9.78319C5.46632 9.78319 5.96632 9.70622 6.44301 9.55228C6.91969 9.39833 7.35751 9.1828 7.75647 8.9057L10.6477 11.7768C10.7306 11.8538 10.8212 11.9102 10.9197 11.9461C11.0181 11.982 11.1192 12 11.2228 12C11.4508 12 11.6373 11.9256 11.7824 11.7768C11.9275 11.628 12 11.4407 12 11.2149C12 11.1071 11.9806 11.0058 11.9417 10.9108C11.9029 10.8159 11.8497 10.7325 11.7824 10.6607L8.90674 7.805C9.21244 7.39962 9.45078 6.94933 9.62176 6.45414C9.79274 5.95895 9.87824 5.43939 9.87824 4.89545C9.87824 4.21809 9.75 3.58435 9.49352 2.99422C9.23704 2.4041 8.88342 1.88454 8.43264 1.43553C7.98186 0.986529 7.45725 0.635025 6.85881 0.381015C6.26036 0.127005 5.62176 0 4.94301 0C4.25907 0 3.61917 0.127005 3.02332 0.381015C2.42746 0.635025 1.90285 0.986529 1.44948 1.43553C0.996109 1.88454 0.64119 2.4041 0.384723 2.99422C0.128241 3.58435 0 4.21809 0 4.89545ZM1.19689 4.89545C1.19689 4.3823 1.29275 3.90122 1.48445 3.45221C1.67617 3.0032 1.9443 2.60936 2.28885 2.27069C2.63342 1.932 3.03238 1.66645 3.48575 1.47402C3.93912 1.28159 4.42487 1.18537 4.94301 1.18537C5.46115 1.18537 5.9456 1.28159 6.39637 1.47402C6.84715 1.66645 7.24482 1.932 7.58937 2.27069C7.93394 2.60936 8.20337 3.0032 8.39768 3.45221C8.59197 3.90122 8.68912 4.3823 8.68912 4.89545C8.68912 5.4086 8.59197 5.88839 8.39768 6.33482C8.20337 6.78127 7.93394 7.17511 7.58937 7.51635C7.24482 7.8576 6.84715 8.12444 6.39637 8.31687C5.9456 8.5093 5.46115 8.60551 4.94301 8.60551C4.42487 8.60551 3.93912 8.5093 3.48575 8.31687C3.03238 8.12444 2.63342 7.8576 2.28885 7.51635C1.9443 7.17511 1.67617 6.78127 1.48445 6.33482C1.29275 5.88839 1.19689 5.4086 1.19689 4.89545Z" fill="#333333" style="fill:#333333;fill:color(display-p3 0.2000 0.2000 0.2000);fill-opacity:1;"/>
      </svg>
    <input aria-label="Search" placeholder="Search..." id="search-input" tabindex="0" autocomplete="off" autocapitalize="off" class="py-3.5 px-2 text-base w-full font-sans placeholder-primary bg-bg focus:outline-none caret-love">
  </div>
    <div id="kbar-list">
      <div class="py-1 text-xs font-sans">Navigation</div>
      <ul id="list" class="w-full">
        {{ range .Site.Menus.main.ByWeight }}
          <li>
            <a href="{{ .URL }}">
              <div class="flex items-center justify-between items-center p-2">
                <div class="flex flex-row items-center">
                  {{ if fileExists (printf "layouts/partials/icons/%s.html" .Pre) }}
                  <div class="">{{ partial (printf "icons/%s.html" .Pre) }}</div>
                  {{ end }}
                  <p class="p-2 font-sans text-base text-left">{{ .Name }}</p>
                </div>
              </div>
            </a>
          </li>
        {{ end }}
      </ul>
      <div class="py-1 text-xs font-sans">Connect</div>
      <ul id="list" class="w-full py-1">
        <li>
          <a href="mailto:hi@shawnmcclelland.com?subject=Hej!" tabindex="0">
            <div class="flex items-center justify-between items-center p-2">
              <div class="flex flex-row items-center">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M14 3H2C1.86739 3 1.74021 3.05268 1.64645 3.14645C1.55268 3.24021 1.5 3.36739 1.5 3.5V12C1.5 12.2652 1.60536 12.5196 1.79289 12.7071C1.98043 12.8946 2.23478 13 2.5 13H13.5C13.7652 13 14.0196 12.8946 14.2071 12.7071C14.3946 12.5196 14.5 12.2652 14.5 12V3.5C14.5 3.36739 14.4473 3.24021 14.3536 3.14645C14.2598 3.05268 14.1326 3 14 3ZM12.7144 4L8 8.32187L3.28562 4H12.7144ZM13.5 12H2.5V4.63688L7.66187 9.36875C7.75412 9.45343 7.87478 9.50041 8 9.50041C8.12522 9.50041 8.24588 9.45343 8.33813 9.36875L13.5 4.63688V12Z" fill="black" style="fill:black;fill-opacity:1;"/>
                </svg>
                <p class="text-base font-sans text-left px-2">Email</p>
              </div>
              <kbd class="py-1 px-2 font-mono text-xs bg-bg rounded-sm border border-border">E</kbd>
            </div>
          </a>
        </li>
        <li>
          <a href="https://github.com/shawnmcclelland" target="_blank" tabindex="0">
            <div class="flex items-center justify-between items-center p-2">
              <div class="flex flex-row items-center">
                <svg width="17" height="18" viewBox="0 0 17 18" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M16.2742 4.91251C16.4653 4.29626 16.5265 3.64711 16.4542 3.00599C16.3819 2.36487 16.1775 1.7457 15.8539 1.18751C15.799 1.09248 15.7201 1.01357 15.6251 0.958709C15.53 0.903853 15.4222 0.874986 15.3125 0.87501C14.5845 0.873486 13.8663 1.04225 13.2151 1.36781C12.564 1.69337 11.9981 2.16671 11.5625 2.75001H9.6875C9.25193 2.16671 8.68598 1.69337 8.03485 1.36781C7.38372 1.04225 6.66548 0.873486 5.9375 0.87501C5.82777 0.874986 5.71996 0.903853 5.62492 0.958709C5.52988 1.01357 5.45096 1.09248 5.39609 1.18751C5.07254 1.7457 4.86815 2.36487 4.7958 3.00599C4.72346 3.64711 4.78474 4.29626 4.97578 4.91251C4.58963 5.58651 4.38278 6.34827 4.375 7.12501V7.75001C4.37632 8.80751 4.76021 9.82883 5.4558 10.6254C6.15139 11.4219 7.11169 11.9399 8.15938 12.0836C7.73173 12.6308 7.4996 13.3055 7.5 14V14.625H5.625C5.12772 14.625 4.65081 14.4275 4.29917 14.0758C3.94754 13.7242 3.75 13.2473 3.75 12.75C3.75 12.3396 3.66917 11.9333 3.51212 11.5541C3.35508 11.175 3.12489 10.8305 2.83471 10.5403C2.54453 10.2501 2.20003 10.0199 1.82089 9.86289C1.44174 9.70584 1.03538 9.62501 0.625 9.62501C0.45924 9.62501 0.300269 9.69086 0.183058 9.80807C0.065848 9.92528 0 10.0842 0 10.25C0 10.4158 0.065848 10.5747 0.183058 10.692C0.300269 10.8092 0.45924 10.875 0.625 10.875C1.12228 10.875 1.59919 11.0726 1.95083 11.4242C2.30246 11.7758 2.5 12.2527 2.5 12.75C2.5 13.5788 2.82924 14.3737 3.41529 14.9597C4.00134 15.5458 4.7962 15.875 5.625 15.875H7.5V17.125C7.5 17.2908 7.56585 17.4497 7.68306 17.567C7.80027 17.6842 7.95924 17.75 8.125 17.75C8.29076 17.75 8.44973 17.6842 8.56694 17.567C8.68415 17.4497 8.75 17.2908 8.75 17.125V14C8.75 13.5027 8.94754 13.0258 9.29917 12.6742C9.65081 12.3226 10.1277 12.125 10.625 12.125C11.1223 12.125 11.5992 12.3226 11.9508 12.6742C12.3025 13.0258 12.5 13.5027 12.5 14V17.125C12.5 17.2908 12.5658 17.4497 12.6831 17.567C12.8003 17.6842 12.9592 17.75 13.125 17.75C13.2908 17.75 13.4497 17.6842 13.5669 17.567C13.6842 17.4497 13.75 17.2908 13.75 17.125V14C13.7504 13.3055 13.5183 12.6308 13.0906 12.0836C14.1383 11.9399 15.0986 11.4219 15.7942 10.6254C16.4898 9.82883 16.8737 8.80751 16.875 7.75001V7.12501C16.8672 6.34827 16.6604 5.58651 16.2742 4.91251ZM15.625 7.75001C15.625 8.57881 15.2958 9.37367 14.7097 9.95972C14.1237 10.5458 13.3288 10.875 12.5 10.875H8.75C7.9212 10.875 7.12634 10.5458 6.54029 9.95972C5.95424 9.37367 5.625 8.57881 5.625 7.75001V7.12501C5.63266 6.50003 5.81978 5.89042 6.16406 5.36876C6.22824 5.28417 6.26981 5.18462 6.28485 5.0795C6.29988 4.97439 6.28789 4.86717 6.25 4.76798C6.0872 4.34813 6.00886 3.90029 6.01945 3.45011C6.03004 2.99993 6.12936 2.55627 6.31172 2.14454C6.82322 2.19957 7.31577 2.36901 7.75287 2.6403C8.18997 2.91159 8.56041 3.27779 8.83672 3.71173C8.89303 3.79978 8.97051 3.8723 9.06209 3.92267C9.15368 3.97303 9.25642 3.99962 9.36094 4.00001H11.8883C11.9932 4.00001 12.0964 3.97361 12.1884 3.92323C12.2805 3.87285 12.3583 3.80011 12.4148 3.71173C12.6911 3.27775 13.0615 2.91153 13.4986 2.64023C13.9358 2.36893 14.4283 2.19951 14.9398 2.14454C15.122 2.55637 15.221 3.00009 15.2313 3.45027C15.2417 3.90044 15.163 4.34824 15 4.76798C14.9622 4.86623 14.9496 4.97235 14.9632 5.07672C14.9769 5.18109 15.0164 5.2804 15.0781 5.36564C15.4258 5.8873 15.6157 6.49816 15.625 7.12501V7.75001Z" fill="black" style="fill:black;fill-opacity:1;"/>
                </svg>
                <p class="text-base font-sans text-left px-2">Github</p>
              </div>
              <kbd class="py-1 px-2 font-mono text-xs bg-bg rounded-sm border border-border">G</kbd>
            </div>
          </a>
        </li>
        <li>
          <a href="https://www.instagram.com/mcclels" target="_blank" tabindex="0">
            <div class="flex items-center justify-between items-center p-2">
              <div class="flex flex-row items-center">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M8 5C7.40666 5 6.82664 5.17595 6.33329 5.50559C5.83994 5.83524 5.45542 6.30377 5.22836 6.85195C5.0013 7.40013 4.94189 8.00333 5.05764 8.58527C5.1734 9.16721 5.45912 9.70176 5.87868 10.1213C6.29824 10.5409 6.83279 10.8266 7.41473 10.9424C7.99667 11.0581 8.59987 10.9987 9.14805 10.7716C9.69623 10.5446 10.1648 10.1601 10.4944 9.66671C10.8241 9.17336 11 8.59334 11 8C10.9992 7.2046 10.6828 6.44202 10.1204 5.87959C9.55798 5.31716 8.7954 5.00083 8 5ZM8 10C7.60444 10 7.21776 9.8827 6.88886 9.66294C6.55996 9.44318 6.30362 9.13082 6.15224 8.76537C6.00087 8.39991 5.96126 7.99778 6.03843 7.60982C6.1156 7.22186 6.30608 6.86549 6.58579 6.58579C6.86549 6.30608 7.22186 6.1156 7.60982 6.03843C7.99778 5.96126 8.39991 6.00087 8.76537 6.15224C9.13082 6.30362 9.44318 6.55996 9.66294 6.88886C9.8827 7.21776 10 7.60444 10 8C10 8.53043 9.78929 9.03914 9.41421 9.41421C9.03914 9.78929 8.53043 10 8 10ZM11 1.5H5C4.07205 1.50099 3.18238 1.87006 2.52622 2.52622C1.87006 3.18238 1.50099 4.07205 1.5 5V11C1.50099 11.928 1.87006 12.8176 2.52622 13.4738C3.18238 14.1299 4.07205 14.499 5 14.5H11C11.928 14.499 12.8176 14.1299 13.4738 13.4738C14.1299 12.8176 14.499 11.928 14.5 11V5C14.499 4.07205 14.1299 3.18238 13.4738 2.52622C12.8176 1.87006 11.928 1.50099 11 1.5ZM13.5 11C13.5 11.663 13.2366 12.2989 12.7678 12.7678C12.2989 13.2366 11.663 13.5 11 13.5H5C4.33696 13.5 3.70107 13.2366 3.23223 12.7678C2.76339 12.2989 2.5 11.663 2.5 11V5C2.5 4.33696 2.76339 3.70107 3.23223 3.23223C3.70107 2.76339 4.33696 2.5 5 2.5H11C11.663 2.5 12.2989 2.76339 12.7678 3.23223C13.2366 3.70107 13.5 4.33696 13.5 5V11ZM12 4.75C12 4.89834 11.956 5.04334 11.8736 5.16668C11.7912 5.29001 11.6741 5.38614 11.537 5.44291C11.4 5.49968 11.2492 5.51453 11.1037 5.48559C10.9582 5.45665 10.8246 5.38522 10.7197 5.28033C10.6148 5.17544 10.5433 5.0418 10.5144 4.89632C10.4855 4.75083 10.5003 4.60003 10.5571 4.46299C10.6139 4.32594 10.71 4.20881 10.8333 4.1264C10.9567 4.04399 11.1017 4 11.25 4C11.4489 4 11.6397 4.07902 11.7803 4.21967C11.921 4.36032 12 4.55109 12 4.75Z" fill="black" style="fill:black;fill-opacity:1;"/>
                </svg>
                <p class="text-base font-sans text-left px-2">Instagram</p>
              </div>
              <kbd class="py-1 px-2 font-mono text-xs bg-bg rounded-sm border border-border">I</kbd>
            </div>
          </a>
        </li>
        <li>
          <a href="https://www.threads.net/mcclels" target="_blank" tabindex="0">
            <div class="flex items-center justify-between items-center p-2">
              <div class="flex flex-row items-center">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M11.6512 7.72813C11.4343 7.56481 11.2012 7.42408 10.9556 7.30813C10.7056 5.44 9.45563 4.85125 8.88688 4.67875C7.65063 4.30375 6.23 4.75312 5.58375 5.7225C5.54731 5.77716 5.52199 5.83847 5.50924 5.90292C5.49649 5.96736 5.49656 6.03369 5.50944 6.09811C5.53547 6.22821 5.6121 6.34265 5.7225 6.41625C5.8329 6.48985 5.96801 6.51658 6.09811 6.49056C6.16253 6.47767 6.22378 6.45222 6.27837 6.41567C6.33296 6.37911 6.37981 6.33216 6.41625 6.2775C6.81438 5.68 7.79125 5.3925 8.59688 5.63562C9.21875 5.82312 9.64812 6.27937 9.85625 6.94812C9.54125 6.88815 9.22128 6.85823 8.90063 6.85875C8.03063 6.85875 7.21625 7.08312 6.60875 7.49C5.89375 7.97312 5.5 8.6875 5.5 9.5C5.5 10.7862 6.49125 11.72 7.85687 11.72C8.25846 11.7173 8.65541 11.6339 9.02419 11.4749C9.39297 11.3159 9.72607 11.0845 10.0037 10.7944C10.4062 10.3756 10.8787 9.64688 10.9794 8.47563C11.0031 8.49188 11.0256 8.50875 11.0481 8.52563C11.68 9.00313 12 9.6675 12 10.5C12 11.71 10.7287 13.5 8 13.5C6.32938 13.5 5.1575 12.9594 4.41625 11.8475C3.80813 10.9375 3.5 9.64125 3.5 8C3.5 6.35875 3.80813 5.0625 4.41625 4.1525C5.1575 3.04063 6.32938 2.5 8 2.5C10.0581 2.5 11.375 3.32812 12.0331 5.0325C12.0562 5.09448 12.0913 5.15127 12.1365 5.19958C12.1817 5.24788 12.236 5.28675 12.2963 5.31392C12.3566 5.3411 12.4217 5.35604 12.4878 5.35788C12.5539 5.35973 12.6197 5.34844 12.6814 5.32467C12.7431 5.3009 12.7995 5.26512 12.8473 5.21941C12.8951 5.1737 12.9334 5.11896 12.9598 5.05836C12.9863 4.99776 13.0005 4.93251 13.0016 4.86638C13.0027 4.80026 12.9907 4.73457 12.9663 4.67312C12.1675 2.5975 10.45 1.5 8 1.5C6 1.5 4.51188 2.20563 3.58375 3.5975C2.86437 4.67688 2.5 6.1575 2.5 8C2.5 9.8425 2.86437 11.3231 3.58375 12.4025C4.51188 13.7944 6 14.5 8 14.5C9.87937 14.5 11.0562 13.7825 11.7125 13.1812C12.5187 12.4425 13 11.4375 13 10.5C13 9.35375 12.5337 8.395 11.6512 7.72813ZM9.28312 10.1031C9.09886 10.2964 8.87769 10.4508 8.63271 10.5571C8.38773 10.6633 8.12391 10.7194 7.85687 10.7219C7.18125 10.7219 6.5 10.3469 6.5 9.50187C6.5 8.7125 7.25 7.86375 8.90063 7.86375C9.27234 7.86274 9.64237 7.91365 10 8.015C10 8.895 9.75 9.61625 9.28312 10.1012V10.1031Z" fill="black" style="fill:black;fill-opacity:1;"/>
                </svg>
                <p class="text-base font-sans text-left px-2">Threads</p>
              </div>
              <kbd class="py-1 px-2 font-mono text-xs bg-bg rounded-sm border border-border">T</kbd>
            </div>
          </a>
        </li>
      </ul>
    </div>
    <div id="results-header" class="py-1 text-xs font-sans">Search Results</div>
    <ul id="search-results" class="w-full"></ul>
  </div>
  <div id="modal" class="z-0 fixed inset-0 backdrop-opacity-10 invert bg-white/30 h-full w-full" onclick="toggleSearch()"></div>
</div>
```

## Config.yaml

A few things needed to be added to the `config.yaml` file for this to all work properly.

First, we need to define what outputs we want Hugo to create the index with:

```yaml
outputs:
  home:
    - html
    - rss
    - json
  page:
    - html
```

I've also defined the menu structure in the `config.yaml` file as I find it easier to manage and change menus than other methods.

```yaml
menus:
  main:
  - identifier: writing
    name: Writing
    url: /writing/
    pre: "writing"
    weight: 1
  - identifier: projects
    name: Projects
    url: /projects/
    pre: "projects"
    weight: 1
```

The icons are stored in `layouts/partials/icons/` and named according to the menu item so `writing.html` and `projects.html`. Inside is SVG code for each icon.
