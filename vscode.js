// Imports and Height Override Logic
const basePath = "../../../../";

const loadJsFile = async (path, callback, isImport) => {
  const resp = await fetch(
    (path.startsWith("./") ? path : basePath + path) + ".js",
  );
  const respText = await resp.text();
  const newText = callback ? await callback(respText) : respText;
  const blob = new Blob([newText], { type: "application/javascript" });
  const url = URL.createObjectURL(blob);

  return isImport ? await import(url) : url;
};

const replaceCommandPannelHeight = (text) => {
  const commandPannelHeight = 36;
  text = text.replace(
    /(44:)22(?=})/g,
    (_, prefix) => `${prefix}${commandPannelHeight}`,
  );
  return text;
};

const replaceItemHeight = (text) => {
  const itemHeight = 30; // Set your desired height here (default is ~22)
  let replaceItemH = (_, prefix) => `${prefix}${itemHeight}`;
  text = text.replace(/(eight\([^)]*?\)\{return )22(?!\d)/g, replaceItemH);
  text = text.replace(/(ITEM_HEIGHT=)22(?!\d)/g, replaceItemH);
  text = text.replace(/(\*)22(?!\d)/g, replaceItemH);
  text = text.replace(/(:)22(?=})/g, replaceItemH);
  return text;
};

// Command Blur Logic
document.addEventListener("DOMContentLoaded", function () {
  (async function () {
    try {
      await loadJsFile(
        "./workbench",
        async (text) => {
          const mainJsPath = "vs/workbench/workbench.desktop.main";
          const mainJsUrl = await loadJsFile(mainJsPath, (text) => {
            text = replaceCommandPannelHeight(text);
            text = replaceItemHeight(text);
            return text;
          });
          return text.replace(mainJsPath, mainJsUrl + "#");
        },
        true,
      );
    } catch (e) {
      console.error("Custom JS: Failed to patch workbench height", e);
    }
  })();

  const checkElement = setInterval(() => {
    const commandDialog = document.querySelector(".quick-input-widget");
    if (commandDialog) {
      const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
          if (
            mutation.type === "attributes" &&
            mutation.attributeName === "style"
          ) {
            if (commandDialog.style.display === "none") {
              handleEscape();
            } else {
              runMyScript();
            }
          }
        });
      });

      observer.observe(commandDialog, { attributes: true });

      clearInterval(checkElement);
    } else {
      console.log("Command dialog not found yet. Retrying...");
    }
  }, 500);

  document.addEventListener(
    "keydown",
    function (event) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "p") {
        event.preventDefault();
        setTimeout(runMyScript, 50); // Adding a small delay
      } else if (event.key === "Escape" || event.key === "Esc") {
        event.preventDefault();
        handleEscape();
      }
    },
    true,
  );

  function runMyScript() {
    const targetDiv = document.querySelector(".monaco-workbench");

    const existingElement = document.getElementById("command-blur");
    if (existingElement) {
      existingElement.remove();
    }

    const newElement = document.createElement("div");
    newElement.setAttribute("id", "command-blur");

    newElement.addEventListener("click", function () {
      newElement.remove();
    });

    targetDiv.appendChild(newElement);
  }

  function handleEscape() {
    const element = document.getElementById("command-blur");
    if (element) {
      element.remove();
    }
  }
});
