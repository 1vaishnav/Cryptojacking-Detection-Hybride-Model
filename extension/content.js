// content.js
(async () => {
  const features = {
    websocket: !!window.WebSocket,
    wasm: typeof WebAssembly !== "undefined" ? 1 : 0,
    hash_function: /crypto/.test(Object.getOwnPropertyNames(window)),
    webworkers: !!window.Worker,
    messageloop_load: Math.random(),
    postmessage_load: Math.random(),
    parallel_functions: !!window.navigator.hardwareConcurrency
  };

  chrome.runtime.sendMessage({
    type: "FEATURES_COLLECTED",
    url: window.location.href,
    features
  });
})();
