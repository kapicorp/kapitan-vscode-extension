import { exec } from "child_process";
import { readdir } from "fs";

export async function execAsync(command: string, options: object = {}): Promise<string> {
    return new Promise((resolve, reject) => {
      exec(command, options, (error, stdout, _) => {
        if (error) {
          return reject(error);
        }
        resolve(stdout.trim().toString());
      });
    });
  }
  
  export async function readdirAsync(path: string): Promise<string[]> {
    return new Promise((resolve, reject) => {
      readdir(path, (error, files) => {
        if (error) {
          return reject([]);
        }
        resolve(files);
      });
    });
  }

  export function getNonce() {
    let text = '';
    const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    for (let i = 0; i < 32; i++) {
      text += possible.charAt(Math.floor(Math.random() * possible.length));
    }
    return text;
  }