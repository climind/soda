document.cookie = 'cross-site-cookie=bar; SameSite=None; Secure';

function ready(fn) {
  if (document.attachEvent ? document.readyState === 'complete' : document.readyState !== 'loading') {
    fn();
  } else {
    document.addEventListener('DOMContentLoaded', fn);
  }
}

function setCookie(name,value,days) {
  var expires = "";
  if (days) {
      var date = new Date();
      date.setTime(date.getTime() + (days*24*60*60*1000));
      expires = "; expires=" + date.toUTCString();
  }
  document.cookie = name + "=" + (value || "")  + expires + "; path=/";
}
function getCookie(name) {
  var nameEQ = name + "=";
  var ca = document.cookie.split(';');
  for(var i=0;i < ca.length;i++) {
      var c = ca[i];
      while (c.charAt(0)==' ') c = c.substring(1,c.length);
      if (c.indexOf(nameEQ) == 0) return c.substring(nameEQ.length,c.length);
  }
  return null;
}
function eraseCookie(name) {   
  document.cookie = name +'=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT;';
}

function decodeJwtResponse(token) {
  var base64Url = token.split('.')[1];
  var base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
  var jsonPayload = decodeURIComponent(window.atob(base64).split('').map(function(c) {
      return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
  }).join(''));

  return JSON.parse(jsonPayload);
}

function handleCredentialResponse(response) {
  // decodeJwtResponse() is a custom function defined by you
  // to decode the credential response.
  const responsePayload = decodeJwtResponse(response.credential);

  let cred = {id: responsePayload.sub, password: responsePayload.email};
  google.accounts.id.storeCredential(cred);

  setCookie("id",responsePayload.sub,7);
  setCookie("name",responsePayload.name,7);
  setCookie("given_name",responsePayload.given_name,7);
  setCookie("family_name",responsePayload.family_name,7);
  setCookie("image_url",responsePayload.picture,7);
  setCookie("email",responsePayload.email,7);

  document.getElementById("google-signin").innerHTML = "Welcome!";
  document.getElementById("user-name").innerHTML = getCookie("name");
  document.getElementById("google-avatar").innerHTML = "<img src='" + getCookie("image_url") +"' class='material-icons circle' alt='avatar'/>";

}

ready(function() {
  // google sign-in
  google.accounts.id.initialize({
    client_id: "38145112040-qbse9289c99gn1epmog1q3glc33sgnq9.apps.googleusercontent.com",
    callback: handleCredentialResponse, 
    auto_select: true
  });

  if (getCookie("id")){
    document.getElementById("google-signin").innerHTML = "Welcome!";
    document.getElementById("user-name").innerHTML = getCookie("name");
    document.getElementById("google-avatar").innerHTML = "<img src='" + getCookie("image_url") +"' class='material-icons circle' alt='avatar'/>";
  }
  else{
    google.accounts.id.renderButton(
      document.getElementById("google-signin"),
      { theme: "outline", size: "medium" }  // customization attributes
    );
  }

  // google.accounts.id.prompt(); // also display the One Tap dialog

  // Helper definitions
  const scrollAnchor = document.querySelector('.nav-search');
  const isMobile = window.matchMedia('only screen and (max-width: 992px)');

  // INITIALIZE MATERIALIZE COMPONENTS
  // =================================
  // Note: if the element is created dynamically via Instantsearch widget,
  // the plugin needs to be initialized in the normal Instantsearch workflow
  // using the render method (e.g. search.on('render'...)
  const elemsPA = document.querySelectorAll('.parallax');
  M.Parallax.init(elemsPA);

  const elemsNavMore = document.getElementById('primary-navbar-dropdown-trigger');
  const optionsNavMore = {
    'container': 'primary-navbar',
    'constrainWidth': false,
  };
  M.Dropdown.init(elemsNavMore, optionsNavMore);

  const elemsSN = document.querySelectorAll('.sidenav');
  M.Sidenav.init(elemsSN);

  const elemsMO = document.querySelectorAll('.modal');
  M.Modal.init(elemsMO);

  const elSearchBoxDropdown = document.querySelectorAll('.dropdown-trigger')[1]; // HACK Hard coding using bracket notation is precarious
  const optionsSearchBoxDropdown = {
    'alignment': 'right',
    'constrainWidth': false,
    'coverTrigger': false,
    'closeOnClick': false,
    'onOpenEnd': function() {
      gaEventsSearchBoxNarrow();
    },
  };
  M.Dropdown.init(elSearchBoxDropdown, optionsSearchBoxDropdown);

  if (!isMobile.matches) { // Use pushpin on desktop only
    const elemPP = document.querySelector('.nav-search nav');
    const optionsPP = {
      'top': elemPP.offsetTop,
    };
    M.Pushpin.init(elemPP, optionsPP);
  }

  // ALGOLIA
  // ==============
  const searchClient = algoliasearch('8G5L7EK4L9', 'a411a62a81314cb6985e0a071b893f54');
  const algoliaIndex = '58_data_entry_cn_en';
  // const facets = [
  //   {
  //     'facet': 'carbon_registry',
  //     'label': 'Carbon Registry',
  //   },
  //   {
  //     'facet': 'nature_based_solution',
  //     'label': 'Nature-based Solution',
  //   },
  //   {
  //     'facet': 'physical_risk',
  //     'label': 'Physical Risk',
  //   },
  //   {
  //     'facet': 'carbon_emission',
  //     'label': 'Carbon Emission',
  //   },
  //   {
  //     'facet': 'climate_policy',
  //     'label': 'Climate Policy',
  //   },
  // ];
  const facets = [
     {
       'facet': 'first_level',
       'label': 'First Level',
     },
     {
       'facet': 'second_level',
       'label': 'Second Level',
     },
  ]

  // Define toggle helpers
  const toggleParent = document.getElementById('search-toggle');
  const toggle = toggleParent.querySelector('select');

  // Ensure initial toggle state set to grants search
  toggle.value = 'database';

  // Toggle search type
  toggle.onchange = function() {
    window.location.href = '/search';
  };

  // Toogle Advanced Search tools
  // Advanced search features are hidden by default via css
  // Could handle initial show/hide directly in Instantsearch via cssClasses, but too many side effects
  // Even listener set in search.once InstantSearch event
  const toggleAdvancedElem = document.querySelector('.search-toggle-advanced input[type="checkbox"]');

  const search = instantsearch({
    'indexName': algoliaIndex,
    searchClient,
    'numberLocale': 'en-US',
    'routing': {
      'stateMapping': {
        stateToRoute(uiState) {
          /**
           * State to Route updates the url from whatever is happening in Instantsearch
           * We use the character ~ as it is one that is rarely present in data and renders well in URLs
           */
          const indexUiState = uiState[algoliaIndex];
          return {
            'query': indexUiState.query,
            'menu_name':
              indexUiState.refinementList &&
              indexUiState.refinementList.menu_name &&
              indexUiState.refinementList.menu_name.join('~'),
            'data_source':
              indexUiState.refinementList &&
              indexUiState.refinementList.data_source &&
              indexUiState.refinementList.data_source.join('~'),
            'first_level':
              indexUiState.refinementList &&
              indexUiState.refinementList.first_level &&
              indexUiState.refinementList.first_level.join('~'),
            'second_level':
              indexUiState.refinementList &&
              indexUiState.refinementList.second_level &&
              indexUiState.refinementList.second_level.join('~'),
            'status':
              indexUiState.refinementList &&
              indexUiState.refinementList.status &&
              indexUiState.refinementList.status.join('~'),
            'institute':
              indexUiState.refinementList &&
              indexUiState.refinementList.institute &&
              indexUiState.refinementList.institute.join('~'),
            'intro_en':
              indexUiState.refinementList &&
              indexUiState.refinementList.intro_en &&
              indexUiState.refinementList.intro_en.join('~'),
            'page': indexUiState.page,
          };
        },
        routeToState(routeState) {
          /**
           * Route to State takes the url and parses it
           * The object it creates is sent to the widgets
           */
          return {
            [algoliaIndex]: {
              'query': routeState.query,
              'refinementList': {
                'menu_name': routeState.menu_name && routeState.menu_name.split('~'),
                'data_source': routeState.data_source && routeState.data_source.split('~'),
                'first_level': routeState.first_level && routeState.first_level.split('~'),
                'second_level': routeState.second_level && routeState.second_level.split('~'),
                'status': routeState.status && routeState.status.split('~'),
                'institute': routeState.institute && routeState.institute.split('~'),
                'intro_en': routeState.intro_en && routeState.intro_en.split('~'),
              },
              'page': routeState.page,
            },
          };
        },
      },
    },
  });

  // Define default search parameters
  const defaultSearchableAttributes = [
    'menu_name',
    'data_source',
    'first_level',
    'second_level',
    'status',
    'institute',
    'intro_en',
  ];

  /* ---------------------------- */
  /* Connector - Configure Widget */
  /* ---------------------------- */
  const renderConfigure = (renderOptions, isFirstRender) => {
    const { refine, widgetParams } = renderOptions;
    const arr = widgetParams.searchParameters.restrictSearchableAttributes;

    if (isFirstRender) {
      const searchDropdownItems = document.getElementById('dropdown-body');
      const searchDropDownOnlyButtons = document.querySelectorAll('.checkbox-only');

      // Create event listener for "Only" link clicks
      searchDropDownOnlyButtons.forEach(element => {
        element.addEventListener('click', e => {
          e.preventDefault(); // Prevent Materialize Dropdown from taking over
          const attribute = e.target.dataset.attribute;

          // Mimic default Materialize Dropdown functionality
          searchDropdownItems.querySelectorAll('input').forEach((el) => {
            if (el.id === attribute) {
              el.checked = true;
            } else {
              el.checked = false;
            }

            // Hide Materialize after selection
            // Materialize default for dropdowns requires clicking off dropdown wrapper
            const instance = M.Dropdown.getInstance(elSearchBoxDropdown);
            instance.close();
            readyToSearchScrollPosition();
          });
          
          // Refine Algolia parameters
          // TODO Add logic to handle city + state
          // Currently assumes state will always remain in searchable attributes
          refine({
            'restrictSearchableAttributes': [attribute, 'menu_name'],
          });
        });
      });

      // Create event listener for "Select All" link clicks
      document.getElementById('select-all').addEventListener('click', e => {
        e.preventDefault(); // Prevent Materialize Dropdown from taking over

        // Mimic default Materialize Dropdown functionality
        searchDropdownItems.querySelectorAll('input').forEach((el) => {
          el.checked = true;

          // Hide Materialize after selection
          // Materialize default for dropdowns requires clicking off dropdown wrapper
          const instance = M.Dropdown.getInstance(elSearchBoxDropdown);
          instance.close();
          readyToSearchScrollPosition();
        });
        refine({
          'restrictSearchableAttributes': defaultSearchableAttributes,
        });
      });

      // Create event listener for individual checkbox selections
      searchDropdownItems.addEventListener('change', (e) => {
        const attribute = e.target.id;
        const isChecked = e.target.checked; // Note: this is the status AFTER the change
        // Note: grantee_state will always remain in searchable attributes
        // thus array.length should at least be 2, not 1
        if (widgetParams.searchParameters.restrictSearchableAttributes.length === 2 && isChecked === false) {
          e.target.checked = !isChecked;
          M.Toast.dismissAll();
          M.toast({'html': 'At least one item needs to be searchable'});
          return;
        }
        // TODO Add logic to handle city + state
        // Currently assumes state will always remain in searchable attributes
        refine({
          'restrictSearchableAttributes': addOrRemoveSearchableAttributes(arr, attribute),
        });
      });
    }

    // Adjust UI based on selections
    // Add or remove visual cue implying a customization was made
    // Change input placeholder text => default is somewhat redundant as also declared in searchBox widget
    const inputEl = document.querySelector('input[class="ais-SearchBox-input"]');
    const triggerEl = document.getElementById('search-box-dropdown-trigger').querySelector('.search-box-dropdown-trigger-wrapper');
    if (widgetParams.searchParameters.restrictSearchableAttributes.length === 5) {
      triggerEl.classList.remove('adjusted');
      inputEl.placeholder = 'Search by keywords, locations, or project names';
    } else {
      triggerEl.classList.add('adjusted');
      inputEl.placeholder = 'Search by custom fields selected';
    }
  };

  // Create the custom widget
  const customConfigure = instantsearch.connectors.connectConfigure(
    renderConfigure,
    () => {},
  );

  /* ---------------------------- */
  /* Create all refinements panel */
  /* ---------------------------- */
  facets.forEach((refinement) => {
    const refinementListWithPanel = instantsearch.widgets.panel({
      'templates': {
        'header': refinement.label,
      },
      hidden(options) {
        return options.results.nbHits === 0;
      },
      'cssClasses': {
        'root': 'card',
        'header': [
          'card-header',
          // 'grey',
          // 'lighten-4',
        ],
        'body': 'card-content',
      },
    })(instantsearch.widgets.refinementList);

    // TODO DRY it up
    // Hiding on mobile as grants search refinements not useful on mobile
    /*
    const mobileRefinementListWithPanel = instantsearch.widgets.panel({
      'templates': {
        'header': refinement.label,
      },
      hidden(options) {
        return options.results.nbHits === 0;
      },
      'cssClasses': {
        'root': 'card',
        'header': [
          'card-header',
          'blue-grey',
          'lighten-4',
        ],
        'body': 'card-content',
      },
    })(instantsearch.widgets.refinementList);
    */
    
    /* Create desktop refinements */
    search.addWidget(
      refinementListWithPanel({
        'container': `#ais-widget-refinement-list--${refinement.facet}`,
        'attribute': refinement.facet,
        'limit': 8,
        'showMore': true,
        'showMoreLimit': 20,
        'cssClasses': {
          'checkbox': 'filled-in',
          'labelText': 'small',
          'count': ['right', 'small'],
          'showMore': 'btn-flat blue-grey-text small',
          'disabledShowMore': 'hidden',
        },
      }),
    );

    /* Create mobile refinements */
    /* Hiding on mobile as grants search refinements not useful on mobile
    search.addWidget(
      mobileRefinementListWithPanel({
        'container': `#ais-widget-mobile-refinement-list--${refinement.facet}`,
        'attribute': refinement.facet,
        'limit': 8,
        'showMore': false,
        'cssClasses': {
          'checkbox': 'filled-in',
          'count': ['right', 'small'],
          'selectedItem': ['grantmakers-text'],
        },
      })
    );
    */
  });

  /* ------------------------------- */
  /* Connector - Current Refinements */
  /* ------------------------------- */
  const createDataAttribtues = refinement =>
    Object.keys(refinement)
      .map(key => `data-${key}="${refinement[key]}"`)
      .join(' ');

  const renderListItem = item => `
    ${item.refinements.map(refinement => `
      <li>
        <button class="waves-effect btn blue-grey lighten-3 grey-text text-darken-3 truncate" ${createDataAttribtues(refinement)}><i class="material-icons right">remove_circle</i><small>${getLabel(item.label)}</small> ${formatIfRangeLabel(refinement)} </button>
      </li>
    `).join('')}
  `;

  const renderCurrentRefinements = (renderOptions) => {
    const { items, refine, widgetParams } = renderOptions;
    widgetParams.container.innerHTML = `<ul class="list list-inline">${items.map(renderListItem).join('')}</ul>`;

    [...widgetParams.container.querySelectorAll('button')].forEach(element => {
      element.addEventListener('click', event => {
        const item = Object.keys(event.currentTarget.dataset).reduce(
          (acc, key) => ({
            ...acc,
            [key]: event.currentTarget.dataset[key],
          }),
          {},
        );

        refine(item);
      });
    });
  };

  const customCurrentRefinements = instantsearch.connectors.connectCurrentRefinements(
    renderCurrentRefinements,
  );

  /* ---------------------------- */
  /* Instantiate all Widgets
  /* ---------------------------- */
  search.addWidgets([
    instantsearch.widgets.searchBox({
      'container': '#ais-widget-search-box',
      'placeholder': 'Search by keywords, location, or grantee name',
      'showSubmit': true,
      'showReset': true,
      'showLoadingIndicator': false,
      'queryHook': function(query, searchInstance) {
        const queryCleaned = checkForEIN(query);
        readyToSearchScrollPosition();
        searchInstance(queryCleaned);
        initTooltips();
      },
    }),

    customConfigure({
      'container': document.querySelector('#search-box-dropdown'),
      'searchParameters': {
        'hitsPerPage': 8,
        'restrictSearchableAttributes': [
          'menu_name',
          'data_source',
          'first_level',
          'second_level',
          'intro_en',
        ],
      },
    }),

    instantsearch.widgets.poweredBy({
      'container': '#powered-by',
    }),

    instantsearch.widgets.hits({
      'container': '#ais-widget-hits',
      'templates': {
        item(data){
          // return `
          //   <div class="card col s12 m6">
          //     <div class="card-body">
          //       <h5 class="card-title">${data.institute}</h5>
          //       <h6 class="card-subtitle mb-2 text-muted">${data.menu_name}</h6>
          //       <p class="card-text">${data.intro_cn}</p>
          //       <p class="card-text">${data.intro_en}</p>
          //       <a href="#" class="card-link">Card link</a>
          //       <a href="#" class="card-link">Another link</a>
          //     </div>
          //   </div>
          // `;
          return `
          <div class="row row-grant-names">
              <div class="col s12 m10">
                <span class="text-bold"><a href="${data.data_source}">${data.menu_name}</a></span> 
              </div>
              <div class="col s12 m2 hide-on-small-only">
                <div class="actions-wrapper center-align">
                  <a href="#" class="dropdown-trigger dropdown-trigger-hits blue-grey-text" data-target="${data.objectID}"><i class="material-icons md-18">more_vert</i></a>
                  <ul id="${data.objectID}" class='dropdown-content'>
                    <li><a href="${data.data_source}"><i class="material-icons md-18 left">list_alt</i>View source</a></li>
                  </ul>
                </div>
              </div>
            </div>

            <div class="row"> 
              <div class="col s12 m10">
                <a class="text-muted-max small" href="${data.data_source}" title="institute">${data.institute}</a>
                <span class="text-muted small"><em>${data.first_level}:${data.second_level}</em></span>
              </div>
            </div>
            <div class="row"> 
              <div class="col s12 m10">
                <span class="small text-light">
                  ${data.intro_en}
                </span>
              </div>            
            </div>
          `;
        },
      },
      'cssClasses': {
        'root': '',
        'list': 'striped row',
        'item': ['col', 's12', 'li-grants-search'],
      },
    }),

    instantsearch.widgets.stats({
      'container': '#ais-widget-stats',
      'cssClasses': {
        'text': 'text-muted',
      },
    }),

    customCurrentRefinements({
      'container': document.querySelector('#ais-widget-current-refined-values'),
    }),

    instantsearch.widgets.clearRefinements({
      'container': '#ais-widget-clear-all',
      'cssClasses': {
        'button': ['btn blue-grey white-text waves-effect waves-light'],
      },
      'templates': {
        'resetLabel': 'Clear filters',
      },
    }),

    instantsearch.widgets.pagination({
      'container': '#ais-widget-pagination',
      'maxPages': 20,
      'scrollTo': '.nav-search',
      'cssClasses': {
        'root': 'pagination',
        'page': 'waves-effect',
        'selectedItem': 'active',
        'disabledItem': 'disabled',
      },
    }),
  ]);

  /* ---------------------------- */
  /* Render Widgets
  /* ---------------------------- */
  search.once('render', function() {
    // Initialize static Materialize JS components created by Instantsearch widgets
    initSelect();
    // Show range input if initial URL contains an amount refinement
    setInitialAdvancedSearchToggleState();
  });

  search.on('render', function() {
    // Initialize dynamic Materialize JS components created by Instantsearch widgets
    initTooltips();
    initModals();
    initHitsDropdowns();
    // Google Analytics events
    document.querySelectorAll('#no-results-ctas a')
      .forEach(e => e.addEventListener('click', gaEventsNoResults));
  });

  search.on('error', function(e) {
    if (e.statusCode === 429) {
      renderRateLimit();
      console.log('Rate limit reached');
    }
    if (e.statusCode === 403) {
      renderForbidden();
      console.log('Origin forbidden');
    }
    // console.log(e);
  });

  /* ---------------------------- */
  /* Start Search
  /* ---------------------------- */
  search.start();

  // Materialize init helpers
  function initTooltips() {
    const elems = document.querySelectorAll('.tooltipped');
    const options = {
      'position': 'top',
      'exitDelay': 0, // Default is 0
      'enterDelay': 100, // Default is 200
      'inDuration': 300, // Default is 300
      'outDuration': 250, // Default is 250
    };
    M.Tooltip.init(elems, options);
  }

  function initHitsDropdowns() {
    const elems = document.querySelectorAll('.dropdown-trigger-hits');
    const options = {
      'constrainWidth': false,
    };
    M.Dropdown.init(elems, options);
  }

  function initModals() {
    const elems = document.querySelectorAll('.modal');
    M.Modal.init(elems);
  }

  function initSelect() {
    const elem = document.querySelectorAll('select');
    const options = {
      'classes': 'btn blue-grey white-text',
    };
    M.FormSelect.init(elem, options);
  }

  function setInitialAdvancedSearchToggleState() {
    // If any numeric refinements, automatically show ALL advanced tools, not just range input
    const obj = search.helper.state.numericRefinements;
    const check = Object.keys(obj).length;
    if (check > 0) {
      // Show advanced search elements
      document.getElementById('algolia-hits-wrapper').classList.remove('js-hide-advanced-tools');
      // Flip switch to on position
      toggleAdvancedElem.checked = true;
    }
  }

  function toggleAdvancedListener(e) {
    if (e.target.checked) {
      showAdvancedSearchTools();
      gaEventsToggledAdvanced('on');
    } else {
      hideAdvancedSearchTools();
      gaEventsToggledAdvanced('off');
    }
  }

  function showAdvancedSearchTools() {
    document.getElementById('algolia-hits-wrapper').classList.remove('js-hide-advanced-tools');
  }

  function hideAdvancedSearchTools() {
    document.getElementById('algolia-hits-wrapper').classList.add('js-hide-advanced-tools');
  }

  // GOOGLE ANALYTICS EVENTS
  // =======================
  let gaCheck = window[window['GoogleAnalyticsObject'] || 'ga']; // eslint-disable-line dot-notation
  function gaEventsToggledAdvanced(outcome) {
    let gaCount = 0;

    if (typeof gaCheck === 'function' && gaCount === 0) {
      ga('send', 'event', {
        'eventCategory': 'Grants Search Events',
        'eventAction': 'Clicked Toggle Advanced Tools',
        'eventLabel': 'Advanced Tools Toggled ' + outcome,
      });
    }

    gaCount++;
  }

  function gaEventsSearchBoxNarrow() {
    let gaCount = 0;

    if (typeof gaCheck === 'function' && gaCount === 0) {
      ga('send', 'event', {
        'eventCategory': 'Grants Search Events',
        'eventAction': 'Clicked SearchBox Dropdown Trigger',
        'eventLabel': 'SearchBox Dropdown Opened',
      });
    }

    gaCount++;
  }

  function gaEventsNoResults() {
    if (typeof gaCheck === 'function') {
      ga('send', 'event', {
        'eventCategory': 'Grants Search Events',
        'eventAction': 'Grants Search No Results CTA Click',
        'eventLabel': this.dataset.ga,
      });
    }
  }
  
  // QUERY HOOKS
  // ==============
  // Handle EINs entered in searchbox with a hyphen
  function checkForEIN(query) {
    // Base Regex: /^[0-9]{2}\-\d{7}$/g;
    // Assume query is an EIN as soon as 2 digits entered after hyphen
    const regexEIN = /^[0-9]{2}\-\d{2}/g;
    const isEIN = regexEIN.test(query);
    if (query.includes('-') && isEIN) {
      // TODO Will remove hyphen if query ALSO includes prohibit string (e.g. -foo 12-3456789)
      // TODO Add toast - will assist with any confusion caused by routing:true setting...
      // ...which autoupdates the url withOUT the hyphen
      return query.replace('-', '');
    } else {
      return query;
    }
  }

  // Scroll to top of results upon input change
  function readyToSearchScrollPosition() {
    window.scrollTo({
      'top': scrollAnchor.offsetTop,
      'left': 0,
      'behavior': 'auto',
    });
  }

  function renderRateLimit() {
    const message = document.getElementById('rate-limit-message');
    message.classList.remove('hidden');

    const results = document.getElementById('algolia-hits-wrapper');
    results.classList.add('hidden');
  }

  function renderForbidden() {
    const message = document.getElementById('forbidden-message');
    message.classList.remove('hidden');

    const results = document.getElementById('algolia-hits-wrapper');
    results.classList.add('hidden');
  }
  // MISC HELPER FUNCTIONS
  // ==============
  function addOrRemoveSearchableAttributes(array, value) {
    const tmpArr = array;
    let index = array.indexOf(value);

    if (index === -1) {
      array.push(value);
    } else {
      array.splice(index, 1);
    }
    // Ensure at least one item is checked
    if (array.length < 2) { // grantee_state will always be there
      return tmpArr;
    } else {
      return array;
    }
  }

  function getLabel(item) {
    const obj = facets.filter(each => each.facet === item);
    return obj[0].label;
  }

  function formatIfRangeLabel(refinement) {
    if (refinement.attribute !== 'grant_amount') {
      return refinement.label;
    } else {
      return `${refinement.operator} $${numberHuman(refinement.value)}`;
    }
  }

  function numberHuman(num, decimals) {
    if (num === null) { return null; } // terminate early
    if (num === 0) { return '0'; } // terminate early
    if (isNaN(num)) { return num; } // terminate early if already a string - handles edge case likely caused by cacheing
    const fixed = !decimals || decimals < 0 ? 0 : decimals; // number of decimal places to show
    const b = num.toPrecision(2).split('e'); // get power
    const k = b.length === 1 ? 0 : Math.floor(Math.min(b[1].slice(1), 14) / 3); // floor at decimals, ceiling at trillions
    const c = k < 1 ? num.toFixed(0 + fixed) : (num / Math.pow(10, k * 3) ).toFixed(1 + fixed); // divide by power
    const d = c < 0 ? c : Math.abs(c); // enforce -0 is 0
    const e = d + ['', 'K', 'M', 'B', 'T'][k]; // append power
    return e;
  }

  // Lazy Load Iubenda script
  // =======================================================
  function createIubendaObserver() {
    let observer;
    let anchor = document.querySelector('footer');
    let config = {
      'rootMargin': '0px 0px',
      'threshold': 0.01,
    };
    // Initiate observer using Footer as anchor
    observer = new IntersectionObserver(enableIubenda, config);
    observer.observe(anchor);
  }

  function enableIubenda(entries, observer) {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        iubenda();
        observer.unobserve(entry.target);
      }
    });
  }

  function iubenda() {
    const script = document.createElement('script');
    script.type = 'text/javascript';
    script.src = 'https://cdn.iubenda.com/iubenda.js';
    document.body.appendChild(script);
  }

  if ('IntersectionObserver' in window) {
    createIubendaObserver();
  }

});
