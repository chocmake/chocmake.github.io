// Strip `no-js` class from html
const html = document.documentElement;
html.classList.remove('no-js');

// Detect localStorage support
function storageAvailable(type) {
    try {
        var storage = window[type],
            x = '__storage_test__';
        storage.setItem(x, x);
        storage.removeItem(x);
        return true;
    }
    catch(e) {
        return false;
    }
}

if (storageAvailable('localStorage')) {
    var Session = Session || (function() {
        return {
            set: function(name, value) {
                window.localStorage.setItem(name, value);
            },

            get: function(name) {
                return window.localStorage.getItem(name);
            }
        };
    })();
} else {
    // Lightly adapted 'Cookie-less JavaScript session variables' by Craig Buckler (optimalworks.net)
    // Handles persistence of settings across page reloads, lasting only until the tab is closed
    var Session = Session || (function() {
    	var win = window.top || window; // window object
    	var store = (win.name ? JSON.parse(win.name) : {}); // session store

        function Save() {
    		win.name = JSON.stringify(store);
    	};

        window.addEventListener('beforeunload', (e) => {
            Save();
        });

    	return {
    		set: function(name, value) {
    			store[name] = value;
    		},

    		get: function(name) {
    			return (store[name] ? store[name] : undefined);
    		},

    		clear: function() { store = {}; },

    		dump: function() { return JSON.stringify(store); }
        };
    })();
}

// Read theme setting first on page load for adding root class to mitigate some FOUC
toggleThemeClass(Session.get('theme-toggle [global]') == 'true');

// Detects page state during history navigation so checkbox states don't remain stale from bfcache if the user has changed them in the meantime
window.addEventListener('pageshow',checkSettingState);
window.addEventListener('pagehide',checkSettingState);

// Obtain all user setting checkboxes
var userSettings = document.querySelectorAll(".user-setting[type='checkbox']"),
    scope;

checkSettingState();

function checkSettingState() {
    userSettings.forEach(setting => {
        let id = setting.getAttribute('id');
        setScope(setting);

        if (Session.get(id + scope) == 'true') {
            setting.checked = true;
        } else {
            setting.checked = false;
        }

        setting.addEventListener('click',checkState);
    });

}

function toggleThemeClass(state) {
    html.classList.toggle('theme-toggle-checked',state);
}

function setScope(e) {
    // Set variable naming scope (page vs site-wide)
    let id = e.getAttribute('id');
    if (id == 'version-toggle') {
        scope = ' [' + window.location.pathname + ']';
    } else {
        scope = ' ' + '[global]';
    }
}

function checkState(e) {
    let el = e.target,
        id = el.getAttribute('id');
    setScope(el);
    if (el.checked) {
        Session.set(id + scope, 'true'); // due to localStorage only supporting strings rather than booleans (while the cookie-less method handles it fine) they've been defined as strings to begin with
    } else {
        Session.set(id + scope, 'false');
    }
    toggleThemeClass(el.checked);
}