export function installSignatureTimingCollector(propertyName) {
  window[propertyName] = [];
  document.addEventListener("animationend", (event) => {
    if (!event.animationName.startsWith("signature-")) {
      return;
    }
    window[propertyName].push({
      name: event.animationName,
      elapsedMilliseconds: event.elapsedTime * 1000,
    });
  });
}
