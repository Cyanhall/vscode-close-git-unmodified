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
    let lastEditorPath
    let currentEditorPath
    let currentEditor
    const checkEditor = () => {
      let shouldClose = true
      if (currentEditor.document.isDirty) {
        shouldClose = false
      } else {
        const file = vscode.Uri.parse('file://' + currentEditorPath);
        const filepath = file.fsPath;
        const folder = path.dirname(filepath);
        const name = path.basename(filepath);
        try {
          const status = exec( 'git status -z ' + name, {cwd: folder});
          if(!status || !status.toString().length) {
            shouldClose = true
          } else {
            shouldClose = false
          }
        } catch(e) {
          shouldClose = false
        };
      }
      if (shouldClose) {
        vscode.commands.executeCommand('workbench.action.closeActiveEditor').then(() => {
          if (currentEditorPath !== lastEditorPath) {
            vscode.commands.executeCommand('workbench.action.nextEditor').then(() => {
              currentEditor = vscode.window.activeTextEditor
              currentEditorPath = vscode.window.activeTextEditor.document.uri.path
              checkEditor()
            })
          }
        })
      } else {
        if (currentEditorPath !== lastEditorPath) {
          vscode.commands.executeCommand('workbench.action.nextEditor').then(() => {
            currentEditor = vscode.window.activeTextEditor
            currentEditorPath = vscode.window.activeTextEditor.document.uri.path
            checkEditor()
          })
        }
      }
    }
    
    vscode.commands.executeCommand('workbench.action.lastEditorInGroup').then(result => {
      if (!vscode.window.activeTextEditor) {
        return;
      }
      lastEditorPath = vscode.window.activeTextEditor.document.uri.path
      vscode.commands.executeCommand('workbench.action.firstEditorInGroup').then(result => {
        currentEditor = vscode.window.activeTextEditor
        currentEditorPath = vscode.window.activeTextEditor.document.uri.path
        checkEditor()
      })
    })
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
