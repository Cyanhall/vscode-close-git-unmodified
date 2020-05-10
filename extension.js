// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
const vscode = require('vscode');
const path = require('path');
const exec = require('child_process').execSync;
// this method is called when your extension is activated
// your extension is activated the very first time the command is executed

/**
 * @param {vscode.ExtensionContext} context
 */
function activate(context) {

	// Use the console to output diagnostic information (console.log) and errors (console.error)
	// This line of code will only be executed once when your extension is activated
	console.log('Congratulations, your extension "vscode-close-git-unmodified" is now active!');

	// The command has been defined in the package.json file
	// Now provide the implementation of the command with  registerCommand
  // The commandId parameter must match the command field in package.json
	let disposable = vscode.commands.registerCommand('vscode-close-git-unmodified.closeGitUnmodified', function () {
    // The code you place here will be executed every time your command is executed

    if (!vscode.window.activeTextEditor) {
      return false;
    }
    const allPaths = new Set();
    const keepPaths = new Set();
    let closePaths = new Set();
    let closedPaths = new Set();
    let shouldKill = false;
    let shouldStop = false;
    console.log('........Listener begin........')
    const listener = vscode.window.onDidChangeActiveTextEditor(editor => {
      if (!editor) {
        vscode.commands.executeCommand('workbench.action.nextEditor');
        return
      }
      if (shouldKill) {
        killEditor(editor);
      } else {
        checkEditor(editor);
      }
    })

    let stopListen = () => {
      if (listener) {
        console.log(`All: ${allPaths.size}, keep: ${keepPaths.size}, close: ${closePaths.size}, closed: ${closedPaths.size}`);
        console.log('........Listener closed........');
        listener.dispose();
      }
    }
    let listenTimer;
    const killEditor = editor => {
      let currentPath = editor.document.uri.path
      if (!closePaths.size) {
        if (shouldStop) {
          stopListen()
          return
        } else {
          shouldStop = true
          vscode.commands.executeCommand('workbench.action.nextEditor');
        }
      } else {
        vscode.commands.executeCommand('workbench.action.nextEditor');
        clearTimeout(listenTimer);
        listenTimer = setTimeout(() => {
          stopListen()
        }, 1000);
      }
      if (closePaths.has(currentPath)) {
        vscode.commands.executeCommand('workbench.action.closeActiveEditor').then(() => {
          closePaths.delete(currentPath);
          closedPaths.add(currentPath);
          vscode.commands.executeCommand('workbench.action.nextEditor');
        });
      }
    }
    const checkEditor = editor => {
      let currentPath = editor.document.uri.path
      if (!allPaths.has(currentPath)) {
        if (editor.document.isDirty) {
          keepPaths.add(currentPath)
        } else {
          const file = vscode.Uri.parse('file://' + currentPath);
          const filepath = file.fsPath;
          const folder = path.dirname(filepath);
          const name = path.basename(filepath);
          try
          {
            const status = exec( 'git status -z ' + name, {cwd: folder});
            if(!status || !status.toString().length)
            {
              // Git unmodified
            } else {
              // Git modified
              console.log('Keep opened: ' + currentPath);
              keepPaths.add(currentPath)
            }
          }
          catch(e) {
            console.log('Error:' + e);
            stopListen();
          };
        }
        allPaths.add(currentPath);
        vscode.commands.executeCommand('workbench.action.nextEditor').then(() => {
          setTimeout(() => {
            if (allPaths.size === 1 && !shouldKill) {
              if (!keepPaths.size) {
                vscode.commands.executeCommand('workbench.action.closeActiveEditor')
              }
              console.log('Only One File Opened');
              stopListen();
            }
          }, 1000);
        })
      } else {
        closePaths = new Set(Array.from(allPaths).filter(currentPath => !keepPaths.has(currentPath)))
        shouldKill = true
        vscode.commands.executeCommand('workbench.action.nextEditor');
      }
    }
    if (vscode.window.activeTextEditor) {
      checkEditor(vscode.window.activeTextEditor);
    } else {
      listener.dispose();
      console.log('........Listener closed........')
    }
	});

	context.subscriptions.push(disposable);
}
exports.activate = activate;

// this method is called when your extension is deactivated
function deactivate() {}

module.exports = {
	activate,
	deactivate
}
