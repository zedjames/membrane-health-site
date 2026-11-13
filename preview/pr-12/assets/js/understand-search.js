/* Local educational-library search; no personal query is transmitted to a server. */
(function () {
  "use strict";
  var panel = document.getElementById("learn-search");
  var field = document.getElementById("learn-search-input");
  var resultHost = document.getElementById("learn-search-results");
  var status = document.getElementById("learn-search-status");
  if (!panel || !field || !resultHost || !status) return;

  var entries = [];
  var stopwords = new Set(["a", "an", "and", "are", "can", "do", "does", "for", "how", "i", "in", "is", "it", "me", "my", "of", "on", "the", "to", "what", "why", "with", "you", "your"]);
  function normalize(text) {
    return String(text || "").normalize("NFKD").toLowerCase().replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, " ").trim();
  }
  function terms(value) {
    return normalize(value).split(/\s+/).filter(function (x) { return x.length > 1 && !stopwords.has(x); });
  }
  function score(item, words, phrase) {
    var title = normalize(item.title), description = normalize(item.description),
        category = normalize(item.category), sections = normalize((item.sections || []).join(" ")),
        path = normalize(item.path);
    var total = 0;
    for (var i = 0; i < words.length; i++) {
      var word = words[i], weight = 0;
      if (title.includes(word)) weight += 6;
      if (category.includes(word)) weight += 4;
      if (description.includes(word)) weight += 3;
      if (sections.includes(word)) weight += 2;
      if (path.includes(word)) weight += 1;
      if (!weight) return -1; /* Every meaningful query term must appear. */
      total += weight;
    }
    if (phrase.length > 3 && title.includes(phrase)) total += 12;
    return total;
  }
  function add(tag, css, value, parent) {
    var node = document.createElement(tag);
    if (css) node.className = css;
    if (value != null) node.textContent = value;
    parent.appendChild(node);
    return node;
  }
  function draw() {
    var q = field.value.trim(), words = terms(q);
    resultHost.replaceChildren();
    if (q.length < 2 || !words.length) {
      resultHost.hidden = true;
      status.textContent = "Try a phrase such as HRV, sleep, or recovery.";
      return;
    }
    var phrase = normalize(q);
    var matches = entries.map(function (item) {
      return { item: item, rank: score(item, words, phrase) };
    }).filter(function (x) { return x.rank >= 0; })
      .sort(function (a, b) { return b.rank - a.rank || a.item.title.localeCompare(b.item.title); })
      .slice(0, 8);

    resultHost.hidden = false;
    status.textContent = matches.length ?
      (matches.length + (matches.length === 1 ? " explanation found." : " explanations found.") + " Search runs in your browser.") :
      "No matching explanation. Try a broader term or browse the topics below.";

    matches.forEach(function (record) {
      var item = record.item;
      var link = add("a", "learn-search-result", null, resultHost);
      link.href = item.path;
      var label = item.type === "question" ? "Everyday question" : "Scientific foundation";
      add("span", "learn-search-result__type", label + " · " + item.category, link);
      add("strong", "", item.title, link);
      add("span", "learn-search-result__description", item.description, link);
    });
  }
  fetch("search-index.json", { credentials: "same-origin", cache: "default" })
    .then(function (response) {
      if (!response.ok) throw new Error("No index available");
      return response.json();
    })
    .then(function (records) {
      if (!Array.isArray(records) || !records.length) throw new Error("Empty index");
      entries = records.filter(function (item) {
        return item && /^[-a-z0-9]+\.html$/.test(item.path) && item.title && item.description;
      });
      if (!entries.length) return;
      panel.hidden = false;
      field.addEventListener("input", draw);
      field.addEventListener("search", draw);
      if (field.value) draw();
    }).catch(function () { /* Existing browse links remain available. */ });
})();
