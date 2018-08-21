import { convertFromHTML, ContentState } from 'draft-js'

function serverDOMBuilder (html) {
  const jsdom = require('jsdom')
  const { JSDOM } = jsdom

  const { document: jsdomDocument, HTMLElement, HTMLAnchorElement } = (new JSDOM(`<!DOCTYPE html>`)).window
  // HTMLElement and HTMLAnchorElement needed on global for convertFromHTML to work
  global.HTMLElement = HTMLElement
  global.HTMLAnchorElement = HTMLAnchorElement

  const doc = jsdomDocument.implementation.createHTMLDocument('foo')
  doc.documentElement.innerHTML = html
  const body = doc.getElementsByTagName('body')[0]
  return body
}

export default function stateFromHTML (html) {
  // if DOMBuilder is undefined convertFromHTML will use the browser dom,
  //  hence we set DOMBuilder to undefined when document exist
  let DOMBuilder = typeof document === 'undefined' ? serverDOMBuilder : undefined
  const blocksFromHTML = convertFromHTML(html, DOMBuilder)
  return ContentState.createFromBlockArray(
     blocksFromHTML.contentBlocks,
     blocksFromHTML.entityMap,
   )
}