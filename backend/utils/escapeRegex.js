export default function escapeRegex(text) {
  return String(text).replace(/[.*+?^${}()|[\]\\]/g, (match) => '\\' + match);
}
