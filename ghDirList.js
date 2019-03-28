const converter = new showdown.Converter();
showdown.setFlavor("github");

async function findGithubRepoContents(username, repo) {
  const fetchHeaders = {
    username: "6b5199c94a1bab833ee02c312c30ae2ca0773498",
    cache: "no-cache"
  };

  const url = "https://api.github.com";
  const repos = `/repos/${username}/${repo}/commits`;
  let repoFetch = await fetch(`${url}${repos}`, fetchHeaders);
  let repoJSON = repoFetch.json();

  let repoTreeUrl = repoJSON.then(tree => {
    return `${tree[0].commit.tree.url}?recursive=1`;
  });
  repoTreeUrl = await repoTreeUrl.then(r => {
    return r;
  });
  let fullCommitTree = await fetch(repoTreeUrl, fetchHeaders).then(res =>
    res.json()
  );
  return fullCommitTree.tree;
}

const dirFilter = (response, type) => {
  return response.filter(responseItem => {
    if (responseItem.type === type) {
      return `${responseItem.path}`;
    }
  });
};
/* const fetchFile = (url) => {
    let textContent = '';
    return fetch(url).then(res => res.text()).then((text) => {
        return textContent = text;
    })
    return textContent
} */
const createListElement = linkArray => {
  let listEl = document.createElement("ul");
  linkArray.map(links => {
    if (links[1].length == 0) {
      return listEl.innerHTML += `<li><input type="button" id="${links[0]}">
                          <label for="${links[0]}">
                          <a href='/${links[0]}'>${links[0]}</a>
                          </label></li>
      `
    } else {
      let innerLinks, tempalteCollapse;
      Promise.all(links[1].map((url,i) =>
        fetch(url+"/README.md").then(resp => resp.text())
    )).then(texts => {
       innerLinks = links[1].map((link,i) => {
        return `<li><a href="${link}">${converter.makeHtml(texts[i])}</a></li>`
      })
    }).then(()=>{
      
       tempalteCollapse = `<li><input type="checkbox" id="${links[0]}">
      <label for="${links[0]}">${links[0]}</label>
      <ul class="${links[0]}">
         <li>${innerLinks.join(' ')}</li>
      </ul></li>`
      return listEl.innerHTML += tempalteCollapse
    })
      
      
      
    }
  });
  let wrapper = document.querySelector('.wrapper')
  wrapper.append(listEl)
};
var list = document.getElementById("linkList");
findGithubRepoContents("atomize", "atomize.github.io")
  .then(arr => dirFilter(arr, "tree"))
  .then(paths => {
    let fetchedPaths = {
      rootPaths: {}
    };
    paths.map(path => {
      if (!path.path.includes("/")) {
        fetchedPaths.rootPaths;
        fetchedPaths.rootPaths[path.path] = [];
      } else {
        let rootDir = path.path.split("/")[0];
        !fetchedPaths.rootPaths[rootDir] ?
          (fetchedPaths.rootPaths[rootDir] = [] &&
            fetchedPaths.rootPaths[rootDir].push(
              document.location.origin + "/" + path.path
            )) :
          fetchedPaths.rootPaths[rootDir].push(
            document.location.origin + "/" + path.path
          );
      }
    }, []);

    return Object.entries(fetchedPaths.rootPaths);
  })
  .then(createListElement);

/* const createLinkElement = (linkArray) => {
    let tmplink = ''

    linkArray.map(link => {
        fetch(link + '/README.md').then(res => {
            tmplink = link
            return res.text()
        }).then(txt => {
            list.innerHTML += `<li><a href="${tmplink}">${converter.makeHtml(txt)}</a></li>`
        })
    })
}
var exLinks = fetch('https://api.github.com/repos/atomize/atomize.github.io/contents/examples')
    .then(res => {
        return res.json()
    })
    .then(contents => {
        return contents.map(dirFilter)
    })
exLinks.then(links => createLinkElement(links)) */