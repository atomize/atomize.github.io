"use strict";
const converter = new showdown.Converter();
declare var showdown: any;

showdown.setFlavor("github");
const fetchHeaders = {
  headers: {
    Accept: "application/vnd.github.v3+json",
    Authorization: "a185f5058a1b89eede21d810611ff54860c5f9c3"
  }
};
async function findGithubRepoContents(username: string, repo: string) {
  const url = "https://api.github.com";
  const repos = `/repos/${username}/${repo}/commits`;
  let repoFetch = await fetch(`${url}${repos}`, fetchHeaders);
  let repoJSON = repoFetch.json();
  let repoTreeRecursive = repoJSON.then(tree => {
    return `${tree[0].commit.tree.url}?recursive=1`;
  });
  let repoTreeUrl = await repoTreeRecursive.then(r => {
    return r;
  });
  let fullCommitTree = await fetch(repoTreeUrl, fetchHeaders).then(res =>
    res.json()
  );
  return fullCommitTree.tree;
}

const dirFilter = (response: any, type: string) => {
  return response.filter((responseItem: any) => {
    if (responseItem.type === type) {
      return `${responseItem.path}`;
    }
  });
};

const createListElement = (linkArray: any) => {
  let listEl = document.createElement("ul");
  linkArray.map((links: string[][]) => {
    if (links[1].length == 0) {
      return (listEl.innerHTML += `<li>
                            <input type="button" id="${links[0]}">
                            <label for="${links[0]}">
                            <a href='/${links[0]}'>${links[0]}</a>
                            </label>
                            </li>`);
    } else {
      let innerLinks: [] = [],
        templateCollapse;
      Promise.all(
        links[1].map((url: string, i: number) =>
          fetch(url + "/README.md", fetchHeaders).then(resp => resp.text())
        )
      )
        .then((texts: Array) => {
          innerLinks = links[1].map((link: string, i: number) => {
            return `<li><a href="${link}">${converter.makeHtml(
              texts[i]
            )}</a></li>`;
          });
        })
        .then(() => {
          templateCollapse = `<li><input type="checkbox" id="${links[0]}">
                            <label for="${links[0]}">${links[0]}</label>
                            <ul class="${links[0]}">
                              ${innerLinks.join(" ")}
                            </ul></li>`;
          return (listEl.innerHTML += templateCollapse);
        });
    }
  });
  let domDoc = document;
  let wrapper = <Element>domDoc.querySelector(".wrapper");
  wrapper.innerHTML = "";
  domDoc.append(listEl);
};

findGithubRepoContents("atomize", "atomize.github.io")
  .then(arr => dirFilter(arr, "tree"))
  .then(paths => {
    interface fetchedPaths {
      rootPaths: {};
    }
    paths.map((path: any, fetchedPaths: fetchedPaths) => {
      if (!path.path.includes("/")) {
        fetchedPaths.rootPaths;
        fetchedPaths.rootPaths[path.path] = [];
      } else {
        let rootDir = path.path.split("/")[0];
        !fetchedPaths.rootPaths[rootDir]
          ? (fetchedPaths.rootPaths[rootDir] =
              [] &&
              fetchedPaths.rootPaths[rootDir].push(
                document.location.origin + "/" + path.path
              ))
          : fetchedPaths.rootPaths[rootDir].push(
              document.location.origin + "/" + path.path
            );
      }
    }, []);

    return Object.entries(fetchedPaths.rootPaths);
  })
  .then(createListElement);
