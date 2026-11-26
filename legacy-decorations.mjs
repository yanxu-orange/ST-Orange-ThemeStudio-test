const decorations = Object.freeze({
  flower:
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120"><g fill="#e5b3b1"><ellipse cx="60" cy="35" rx="15" ry="27"/><ellipse cx="60" cy="35" rx="15" ry="27" transform="rotate(72 60 60)"/><ellipse cx="60" cy="35" rx="15" ry="27" transform="rotate(144 60 60)"/><ellipse cx="60" cy="35" rx="15" ry="27" transform="rotate(216 60 60)"/><ellipse cx="60" cy="35" rx="15" ry="27" transform="rotate(288 60 60)"/></g><circle cx="60" cy="60" r="13" fill="#e9ca81"/></svg>',
  star: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120"><path d="m60 8 14 34 37 3-28 24 9 36-32-19-32 19 9-36L9 45l37-3z" fill="#e6c480" stroke="#b89355" stroke-width="2"/><path d="m22 8 3 9 9 3-9 3-3 9-3-9-9-3 9-3z" fill="#acb8a0"/></svg>',
  tape: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 180 48"><path d="m5 3 8 4 6-4 9 4 7-4h126l-3 8 7 8-5 9 5 9-8 8H15l4-7-8-7 6-10-8-7z" fill="#d6c1a1" fill-opacity=".85"/><path d="M20 16h130M20 30h130" stroke="#fff" stroke-opacity=".3" stroke-width="2" stroke-dasharray="3 6"/></svg>',
  leaf: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 180"><path d="M43 172Q22 100 69 10" fill="none" stroke="#718d70" stroke-width="2"/><g fill="#8fa284"><ellipse cx="42" cy="131" rx="11" ry="27" transform="rotate(-40 42 131)"/><ellipse cx="56" cy="104" rx="11" ry="26" transform="rotate(40 56 104)"/><ellipse cx="40" cy="79" rx="10" ry="25" transform="rotate(-35 40 79)"/><ellipse cx="64" cy="52" rx="9" ry="24" transform="rotate(35 64 52)"/><ellipse cx="65" cy="22" rx="8" ry="19" transform="rotate(15 65 22)"/></g></svg>',
});

export function legacyDecorationSvg(kind) {
  return Object.hasOwn(decorations, kind) ? decorations[kind] : '';
}

export function legacyDecorationUrl(kind) {
  const svg = legacyDecorationSvg(kind);
  return svg ? 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg) : '';
}
