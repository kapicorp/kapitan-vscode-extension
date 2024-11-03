import { existsSync } from 'fs'
import { join } from 'path'
import { ExtensionContext, ProgressLocation, window, workspace } from 'vscode'
import { IS_WIN, LS_VENV_NAME, LS_VENV_PATH } from './constants'
import { execAsync } from './utils'

async function checkPythonVersion(python: string): Promise<boolean> {
  try {
    const [major, minor] = await getPythonVersion(python)
    return major === 3 && minor > 10
  } catch {
    return false
  }
}

async function createVirtualEnvironment(python: string, name: string, cwd: string): Promise<string> {
  const path = join(cwd, name)
  if (!existsSync(path)) {
    if (IS_WIN && !python.startsWith('"')) {
      python = '"' + python + '"'
    }
    const createVenvCmd = `${python} -m venv ${name}`
    try {
      await execAsync(createVenvCmd, { cwd })
    } catch (error) {
      console.error(`Error while creating venv:\n${error.message}\n`);
      throw error;
    }
  }
  return path
}

export async function getPython(): Promise<string> {
  let python = workspace.getConfiguration('python').get<string>('pythonPath', getPythonCrossPlatform())
  if (await checkPythonVersion(python)) {
    return python
  }

  python = await window.showInputBox({
    ignoreFocusOut: true,
    placeHolder: 'Enter a path to a python v3.6+.',
    prompt: 'This python will be used to create a virtual environment inside the extension directory.',
    validateInput: async (value: string) => {
      if (await checkPythonVersion(value)) {
        return null
      } else {
        return 'Not a valid python 3.11+ path!'
      }
    },
  })

  // User canceled the input
  if (python === 'undefined') {
    throw new Error('Python 3.11+ is required!')
  }

  if (IS_WIN) {
    python = '"' + python + '"'
  }
  return python
}

function getPythonCrossPlatform(): string {
  return IS_WIN ? 'python.exe' : 'python3'
}

export function getPythonFromVenvPath(venvPath: string = LS_VENV_PATH): string {
  return IS_WIN ? join(venvPath, 'Scripts', 'python.exe') : join(venvPath, 'bin', 'python')
}

async function getPythonVersion(python: string): Promise<number[]> {
  if (IS_WIN && !python.startsWith('"')) {
    python = `"${python}"`
  }
  const getPythonVersionCmd = `${python} --version`
  const version = await execAsync(getPythonVersionCmd)
  return version.match(new RegExp(/\d+/g)).map((v) => Number.parseInt(v))
}

async function installRequirements(python: string, cwd: string) {
  if (existsSync(cwd)) {
    if (IS_WIN && !python.startsWith('"')) {
      python = `"${python}"`
    }
    try {
      await execAsync(`${python} -m pip install --upgrade --force-reinstall -r requirements.txt --log extension-req-install.log`, { cwd });
    } catch (error) {
      console.error(`Error during install python requirements for extension:\n${error.message}\n Also check  extension-req-install.log`);
      throw error;
    }
  }
}

export async function installLSWithProgress(context: ExtensionContext): Promise<string> {
  // Check if LS is already installed
  let venvPython = getPythonFromVenvPath()
  if (existsSync(venvPython))
  {
    return Promise.resolve(venvPython)
  }

  // Install with progress bar
  return window.withProgress({
    location: ProgressLocation.Notification,
  }, (progress): Promise<string> => {
    return new Promise<string>(async (resolve, reject) => {
      try {
        progress.report({ message: 'First-time extension initialization' })

        // Get python interpreter
        const python = await getPython()

        // Create virtual environment
        const venv = await createVirtualEnvironment(python, LS_VENV_NAME, context.extensionPath)

        // Install source from wheels
        venvPython = getPythonFromVenvPath(venv);
        const requirementsPath = join(context.extensionPath, 'out', 'server')
        await installRequirements(venvPython, requirementsPath)

        window.showInformationMessage('Extension is ready! 🎉')
        resolve(venvPython)
      } catch (err) {
        reject(err)
      }
    })
  })

}
