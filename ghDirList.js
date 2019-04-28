"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var converter = new showdown.Converter();
showdown.setFlavor("github");
var fetchHeaders = {
    headers: {
        Accept: "application/vnd.github.v3+json",
        Authorization: "a185f5058a1b89eede21d810611ff54860c5f9c3"
    }
};
function findGithubRepoContents(username, repo) {
    return __awaiter(this, void 0, void 0, function () {
        var url, repos, repoFetch, repoJSON, repoTreeRecursive, repoTreeUrl, fullCommitTree;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    url = "https://api.github.com";
                    repos = "/repos/" + username + "/" + repo + "/commits";
                    return [4 /*yield*/, fetch("" + url + repos, fetchHeaders)];
                case 1:
                    repoFetch = _a.sent();
                    repoJSON = repoFetch.json();
                    repoTreeRecursive = repoJSON.then(function (tree) {
                        return tree[0].commit.tree.url + "?recursive=1";
                    });
                    return [4 /*yield*/, repoTreeRecursive.then(function (r) {
                            return r;
                        })];
                case 2:
                    repoTreeUrl = _a.sent();
                    return [4 /*yield*/, fetch(repoTreeUrl, fetchHeaders).then(function (res) {
                            return res.json();
                        })];
                case 3:
                    fullCommitTree = _a.sent();
                    return [2 /*return*/, fullCommitTree.tree];
            }
        });
    });
}
var dirFilter = function (response, type) {
    return response.filter(function (responseItem) {
        if (responseItem.type === type) {
            return "" + responseItem.path;
        }
    });
};
var createListElement = function (linkArray) {
    var listEl = document.createElement("ul");
    linkArray.map(function (links) {
        if (links[1].length == 0) {
            return (listEl.innerHTML += "<li>\n                            <input type=\"button\" id=\"" + links[0] + "\">\n                            <label for=\"" + links[0] + "\">\n                            <a href='/" + links[0] + "'>" + links[0] + "</a>\n                            </label>\n                            </li>");
        }
        else {
            var innerLinks = void 0, templateCollapse_1;
            Promise.all(links[1].map(function (url, i) {
                return fetch(url + "/README.md", fetchHeaders).then(function (resp) { return resp.text(); });
            }))
                .then(function (texts) {
                return links[1].map(function (link, i) {
                    return "<li><a href=\"" + link + "\">" + converter.makeHtml(texts[i]) + "</a></li>";
                });
            })
                .then(function (thing) {
                templateCollapse_1 = "<li><input type=\"checkbox\" id=\"" + links[0] + "\">\n                            <label for=\"" + links[0] + "\">" + links[0] + "</label>\n                            <ul class=\"" + links[0] + "\">\n                              " + thing.join(" ") + "\n                            </ul></li>";
                return (listEl.innerHTML += templateCollapse_1);
            });
        }
    });
    var domDoc = document;
    var wrapper = domDoc.querySelector(".wrapper");
    wrapper.innerHTML = "";
    wrapper.append(listEl);
};
findGithubRepoContents("atomize", "atomize.github.io")
    .then(function (arr) { return dirFilter(arr, "tree"); })
    .then(function (paths) {
    var fetchedPaths = {
        rootPaths: {}
    };
    paths.map(function (path) {
        if (/^\./.test(path.path)) {
            return;
        }
        if (!path.path.includes("/")) {
            /* fetchedPaths.rootPaths; */
            fetchedPaths.rootPaths[path.path] = [];
        }
        else {
            var rootDir = path.path.split("/")[0];
            console.log(fetchedPaths.rootPaths[rootDir]);
            !fetchedPaths.rootPaths[rootDir]
                ? (fetchedPaths.rootPaths[rootDir] =
                    [] &&
                        fetchedPaths.rootPaths[rootDir].push(document.location.origin + "/" + path.path))
                : fetchedPaths.rootPaths[rootDir].push(document.location.origin + "/" + path.path);
        }
    }, []);
    return Object.entries(fetchedPaths.rootPaths);
})
    .then(createListElement);
