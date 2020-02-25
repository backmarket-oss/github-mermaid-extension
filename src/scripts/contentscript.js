import '@babel/polyfill'
import ext from "./utils/ext"
import mermaidAPI from 'mermaid'

var extractTags = () => {
  var url = document.location.href;
  if(!url || !url.match(/^http/)) return;

  var data = {
    title: "",
    description: "",
    url: document.location.href
  }

  var ogTitle = document.querySelector("meta[property='og:title']");
  if(ogTitle) {
    data.title = ogTitle.getAttribute("content")
  } else {
    data.title = document.title
  }

  var descriptionTag = document.querySelector("meta[property='og:description']") || document.querySelector("meta[name='description']")
  if(descriptionTag) {
    data.description = descriptionTag.getAttribute("content")
  }

  return data;
}

function onRequest(request, sender, sendResponse) {
  if (request.action === 'process-page') {
    sendResponse(extractTags())
  }
}

ext.runtime.onMessage.addListener(onRequest);

// ---

/**
 * Unique IDs generator.
 *
 * @generator
 * @function idGenerator
 * @yields {string} A unique id.
 */
function *idGenerator() {
  for (let i = 0; true; i++) {
    yield `github-mermaid-extension-${i}`
  }
}

/**
 * Render a Mermaid diagram.
 * @param {string} code Diagram source code, in Mermaid language.
 * @param {HTMLDivElement} target Element to insert <svg> into.
 * @param {string} id A unique element id.
 */
function render(code, target, id) {
  mermaidAPI.render(id, code, (svgCode) => {
    target.innerHTML = svgCode
  }, target)
}

/**
 * Render a Mermaid error.
 * @param {string} message Mermaid error message.
 * @param {HTMLDivElement} target Element to insert error message into.
 */
function renderError(message, target) {
  target.style.color = 'red'
  target.innerHTML = `
    <h4>Mermaid syntax error</h4>
    <pre>${message}</pre>
  `
}

/**
 * Generate a Mermaid diagram into a new <div>
 * @param {HTMLPreElement} source Element containing the diagram source code, in Mermaid language.
 * @param {string} id A unique element id.
 * @returns {HTMLDivElement} The new <div> element.
 */
function processElement(source, id) {
  const target = document.createElement('div')
  source.after(target) // Note: must happen before render
  try {
    let code;
    if ([...source.classList].includes('rich-diff-level-one')) {
      // When code block is a diff, we need to remove all `<del>` elements.
      // Note: we leave the block visible in this case, as the graph doesn't
      // display all the information
      const sourceClone = source.cloneNode(true)
      sourceClone.querySelectorAll('del').forEach(del => del.parentElement.removeChild(del))
      code = sourceClone.textContent
    } else {
      code = source.textContent
      source.style.display = 'none'
    }

    render(code, target, id)
  } catch (error) {
    renderError(error.message, target)
    throw error
  }
  return target
}

/**
 * Process all `pre[lang="mermaid"]` elements that don't have
 * `[data-processed="true"]`.
 * @param {Iterator<string>} idIterator Id iterator
 */
function processUnprocessedElements(idIterator) {
  const selector = 'pre[lang="mermaid"]:not([data-processed])';
  [...document.querySelectorAll(selector)].forEach(source => {
    source.setAttribute('data-processed', 'true')
    const target = processElement(source, idIterator.next().value)
  })
}

// Mermaid setup
// Read more: https://mermaidjs.github.io/mermaidAPI.html#configuration
mermaidAPI.initialize({
  startOnLoad: false
})

const globalIdIterator = idGenerator()

// Observe nodeList and attribute changes on the page, and
// process all unprocessed elements on the page.
new MutationObserver(
  () => processUnprocessedElements(globalIdIterator)
).observe(
  document.body,
  { childList: true, subtree: true }
)

// Initial pass
processUnprocessedElements(globalIdIterator)
