import chalk from 'chalk';
import fs from 'fs';
import ncp from 'ncp';
import path from 'path';
import { promisify } from 'util';
import { fileURLToPath } from 'url';
import execa from 'execa';
import Listr from 'listr';
import { projectInstall } from 'pkg-install';
import license from 'spdx-license-list/licenses/MIT';
import gitignore from 'gitignore';

const access = promisify(fs.access);
const copy = promisify(ncp);
const writeFile = promisify(fs.writeFile);
const writeGitIgnore = promisify(gitignore.writeFile);

async function initGit(options) {
  const result = execa('git', ['init'], {
    cwd: options.targetDirectory,
  });
  if (result.failed) {
    return Promise.reject(new Error('Failed to initialize Git repository'));
  }
  return;
}

async function createGitIgnore(options) {
  const file = fs.createWriteStream(
    path.join(options.targetDirectory, '.gitignore'),
    { flags: 'a' }
  );
  return writeGitIgnore({
    type: 'Node',
    files: file,
  });
}

async function createLicense(options) {
  const targetPath = path.join(options.targetDirectory, 'LICENSE.md');
  const licenseContent = license.licenseText
    .replace('<year>', new Date().getFullYear())
    .replace('<copyright holders', `${options.name} ${options.email}`);
  return writeFile(targetPath, licenseContent, 'utf8');
}

async function copyTemplateFiles(options) {
  return copy(options.templateDirectory, options.targetDirectory, {
    clobber: false,
  });
}

export async function createProject(options) {
  options = {
    ...options,
    targetDirectory: options.targetDirectory || process.cwd(),
    email: 'beanno1116@gmail.com',
    name: 'Beanno1116',
  };

  const currentFileUrl = import.meta.url;
  console.log('currentFileUrl: ' + currentFileUrl);
  const templateDir = path.resolve(
    fileURLToPath(import.meta.url),
    '../../templates',
    options.template.toLowerCase()
  );
  console.log('templateDir', templateDir);
  options.templateDirectory = templateDir;
  try {
    await access(templateDir, fs.constants.R_OK);
  } catch (error) {
    console.error('%s invalid template name', chalk.red.bold('ERROR'));
    process.exit(1);
  }
  const tasks = new Listr([
    {
      title: 'Copy project files ',
      task: () => copyTemplateFiles(options),
    },
    {
      title: 'Create get ignore',
      task: () => createGitIgnore(options),
      enabled: () => options.git,
    },
    {
      title: 'Create license',
      task: () => createLicense(options),
    },
    {
      title: 'Initialize git',
      task: () => initGit(options),
      enabled: () => options.git,
    },
    {
      title: 'Install dependencies',
      task: () => projectInstall({ cwd: options.targetDirectory }),
      skip: () =>
        !options.runInstall
          ? 'Pass --install to automatically install dependencies'
          : undefined,
    },
  ]);
  await tasks.run();
  console.log('%s project ready', chalk.green.bold('DONE'));
}
