// user input goes into RegExp in a few places; without this a search for
// something like "(a+)+$" can hang the event loop
export default function escapeRegex(text) {
  return String(text).replace(/[.*+?^${}()|[\]\\]/g, (match) => '\\' + match);
}
