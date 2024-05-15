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