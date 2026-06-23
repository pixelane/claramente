const assert = require("node:assert/strict");
const { getShellRedirect } = require("../../shell-router.js");

function run() {
  assert.equal(getShellRedirect({
    pathname: "/index.html",
    search: "",
    hash: "",
    width: 390
  }), "claramente.html");

  assert.equal(getShellRedirect({
    pathname: "/claramente.html",
    search: "",
    hash: "",
    width: 768
  }), "index.html");

  assert.equal(getShellRedirect({
    pathname: "/index.html",
    search: "?shell=clara",
    hash: "",
    width: 390
  }), "");

  assert.equal(getShellRedirect({
    pathname: "/index.html",
    search: "",
    hash: "#shared-account",
    width: 390
  }), "");

  assert.equal(getShellRedirect({
    pathname: "/claramente.html",
    search: "?shell=claramente",
    hash: "",
    width: 1024
  }), "");
}

run();
