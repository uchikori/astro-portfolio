let lilGUI = null;

async function init() {
  const { default: GUI } = await import("lil-gui");
  lilGUI = new GUI();
}

function add(callback) {
  //lilGUIが初期化されている場合のみcallbackを実行
  if (lilGUI) {
    callback(lilGUI);
  }
}

function close() {
  if (lilGUI) {
    lilGUI.close();
  }
}

const gui = {
  init,
  add,
  close,
};

export { gui };
