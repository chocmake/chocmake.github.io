const html = document.documentElement,
      body = document.body,
      style = getComputedStyle(body),
      content = body.querySelector('.page > .content');
var url = {
    root: window.location.hostname,
    path: window.location.pathname, // base URL, sans root domain
    href: window.location.href, // base URL, including root domain
    frag: fragSplit(window.location.hash)
}

const addScript = async src => new Promise((resolve, reject) => {
    const el = document.createElement('script');
    el.src = src;
    el.addEventListener('load', resolve);
    el.addEventListener('error', reject);
    body.append(el);
});

// ----------------- Browser detection ----------------
// Detect Webkit (for its incomplete and variously buggy SVG support)
try {
    await addScript('/js/ua-parser.js'); // since it doesn't have vanilla JS module compatibility
    const uaRaw = window.navigator.userAgent,
          ua = new UAParser(uaRaw),
          browserEngine = ua.getEngine().name;

    if (browserEngine == 'WebKit') {
        html.classList.add('is-webkit');
    }
} catch (e) {
    console.log(e);
}


// ----------------- Links: fragment identifier handling ----------------
// Even with Javascript disabled the site handles this however the drawback is when clicking to and navigating back/forth between fragment URLs that are spoiler blocks it can produce inconsistent behavior (mostly due to how without JS checkboxes aren't actually checked for targets, just the effect toggled), so this improves the experience.

var links = content.getElementsByTagName('a');
var fragmentLinks = Array.from(links).filter(function(link) {
    if (link.hostname === url.root && link.href.includes('#')) {
        // Exclude links that only contain `#`
        if (!link.href.match(/^[^#]*#$/)) {
            return true
        }
    }
});

// Check on page load for any current fragment
// There's no consistent way I've found to pseudo modify the browser's default scroll-to behavior for fragment links on load
window.addEventListener('load', function() {
    if (url.frag) {
        let target = checkTarget(url.frag);
        if (target) {
            fragScroll(target,true,false);
        }
    }
});

// Listen for prior history state data on back/forward navigation
window.addEventListener('popstate', (e) => {
    let target;
    if (e.state == null) {
        target = checkTarget(url.frag);
        if (target) {
            fragScroll(target,true,false);
        }
    } else {
        target = checkTarget(e.state.frag);
        if (target) {
            fragScroll(target,false,false);
            historyReplace(fragObj(e.state.frag));
        }
    }
});

fragmentLinks.forEach(link => {
    link.addEventListener('click', (e) => {
        e.preventDefault(); // override default fragment link behavior
        let frag = fragSplit(e.target.href),
            target = checkTarget(frag);

        if (target) {
            historyPush(fragObj(frag));
            fragScroll(target,false,true);
        }
    });
});

function checkTarget(frag) {
    return content.querySelector('#' + frag)
}

function fragObj(frag) {
    return {frag: frag, url: url.path + '#' + frag}
}

function fragSplit(str) {
    return str.split('#')[1]
}

function fragScroll(el,instantScroll,enableOffset) {
    function scroll(delay) {
        setTimeout(function() {
            let offset,
                scrollType;
            if (enableOffset) {
                offset = parseInt(style.getPropertyValue('--target-spacing-top'));
            } else {
                offset = 0;
            }
            let pos = el.getBoundingClientRect().top + window.pageYOffset - offset;

            if (instantScroll) {
                scrollType = 'instant'
            } else {
                scrollType = 'auto' // inherits value set by `scroll-behavior` in CSS, otherwise behaves like `instant`
            }

            window.scrollTo({
                 top: pos,
                 behavior: scrollType
            });
        },delay);
    }

    let delay = 0

    // Handle toggling of section spoiler elements
    if (el.tagName.toLowerCase() == 'h2') {
        let nextSibling = el.nextElementSibling;
        if (nextSibling.classList.contains('spoiler-block')) {
            let checkbox = nextSibling.firstElementChild;
            if (checkbox && !checkbox.checked) {
                checkbox.checked = true;
                delay = 200; // to account for spoiler expansion which affects scroll position
            }
        }
    }
    scroll(delay);
}

function historyPush(item) {
    history.pushState(item, '', item.url);
}

function historyReplace(item) {
    history.replaceState(item, '', item.url);
}