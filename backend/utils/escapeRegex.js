// escape user input before it goes into a RegExp
export default function escapeRegex(text) {
  return String(text).replace(/[.*+?^${}()|[\]\\]/g, (match) => '\\' + match);
}
